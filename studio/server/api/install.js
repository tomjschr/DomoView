import { Buffer } from 'node:buffer';
import { InstallError } from '../ha/install.js';

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function installApi(request, url, installer) {
  const match = /^\/api\/v1\/install\/(plan|apply)$/.exec(url.pathname);
  if (!match) return null;
  if (request.method !== 'POST') return { status: 405, headers: { allow: 'POST' }, body: null };
  try {
    const input = await readJson(request);
    const body = match[1] === 'plan'
      ? await installer.plan(input.files)
      : await installer.apply(input.files, { overwrite: input.overwrite === true });
    return { status: 200, body };
  } catch (error) {
    if (!(error instanceof InstallError) && !(error instanceof SyntaxError)) throw error;
    return {
      status: error.code === 'overwrite_required' ? 409 : 400,
      body: { error: error.code || 'invalid_json', message: error.message },
    };
  }
}

