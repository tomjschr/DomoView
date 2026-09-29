import { Buffer } from 'node:buffer';

import { AssetStoreError } from '../projects/assets.js';
import { ProjectStoreError } from '../projects/store.js';

const MAX_PROJECT_BYTES = 25 * 1024 * 1024;

async function readJson(request) {
  const type = String(request.headers['content-type'] || '').split(';')[0];
  if (type !== 'application/json') {
    throw new ProjectStoreError('invalid_content_type', 'Content-Type must be application/json.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_PROJECT_BYTES) {
      throw new ProjectStoreError('too_large', 'Project request exceeds 25 MB.');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ProjectStoreError('invalid_json', 'Request body is not valid JSON.');
  }
}

function errorStatus(code) {
  if (code === 'not_found') return 404;
  if (code === 'exists' || code === 'revision_conflict') return 409;
  if (code === 'corrupt_project') return 500;
  return 400;
}

export async function projectApi(request, url, store) {
  const assetMatch = /^\/api\/v1\/projects\/([^/]+)\/assets\/([a-f0-9]{64}\.(?:jpg|png|webp))$/
    .exec(url.pathname);
  const collection = url.pathname === '/api/v1/projects';
  const match = /^\/api\/v1\/projects\/([^/]+)$/.exec(url.pathname);
  if (!collection && !match && !assetMatch) return null;

  try {
    if (assetMatch && request.method === 'GET') {
      const asset = await store.getAsset(
        decodeURIComponent(assetMatch[1]),
        `asset:${assetMatch[2]}`,
      );
      return { status: 200, binary: asset.data, type: asset.type };
    }
    if (assetMatch) return { status: 405, headers: { allow: 'GET' }, body: null };
    if (collection && request.method === 'GET') {
      return { status: 200, body: { projects: await store.list() } };
    }
    if (collection && request.method === 'POST') {
      const input = await readJson(request);
      return {
        status: 201,
        body: await store.create(input.project, input.id),
      };
    }
    if (match && request.method === 'GET') {
      return { status: 200, body: await store.getHydrated(decodeURIComponent(match[1])) };
    }
    if (match && request.method === 'PUT') {
      const input = await readJson(request);
      return {
        status: 200,
        body: await store.update(decodeURIComponent(match[1]), input.revision, input.project),
      };
    }
    return { status: 405, headers: { allow: collection ? 'GET, POST' : 'GET, PUT' }, body: null };
  } catch (error) {
    if (!(error instanceof ProjectStoreError) && !(error instanceof AssetStoreError)) throw error;
    return {
      status: error.code === 'asset_not_found' ? 404 : errorStatus(error.code),
      body: { error: error.code, message: error.message },
    };
  }
}
