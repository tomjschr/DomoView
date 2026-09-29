#!/usr/bin/env node

import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { projectApi } from './api/projects.js';
import { providerApi } from './api/providers.js';
import { fixtureAgentApi } from './api/fixture-agent.js';
import { loadAIConfig } from './ai/config.js';
import { SessionStore } from './ai/sessions.js';
import { ProposalStore } from './projects/proposals.js';
import { ProjectStore } from './projects/store.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const STUDIO_ROOT = path.join(ROOT, 'dist', 'studio');
const VERSION = JSON.parse(
  await import('node:fs/promises').then(({ readFile }) =>
    readFile(path.join(ROOT, 'package.json'), 'utf8')),
).version;

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function json(response, status, body, headers = {}) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  response.end(body == null ? '' : JSON.stringify(body));
}

function allowedHost(host) {
  const raw = String(host || '');
  const name = raw.startsWith('[')
    ? raw.slice(1, raw.indexOf(']'))
    : raw.split(':')[0];
  return name === '127.0.0.1' || name === 'localhost' || name === '::1';
}

async function serveStatic(request, response, pathname, studioRoot) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { allow: 'GET, HEAD' }).end();
    return;
  }
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
  const resolved = path.resolve(studioRoot, relative);
  if (resolved !== studioRoot && !resolved.startsWith(studioRoot + path.sep)) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }).end('Forbidden');
    return;
  }

  let target = resolved;
  try {
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    await stat(target);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }

  response.writeHead(200, {
    'content-type': TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(target).pipe(response);
}

export async function createLocalStudioServer(options = {}) {
  const host = options.host || '127.0.0.1';
  const port = Number(options.port ?? 8099);
  const studioRoot = path.resolve(options.studioRoot || STUDIO_ROOT);
  const workspace = path.resolve(options.workspace ||
    process.env.DOMOVIEW_WORKSPACE ||
    path.join(process.cwd(), '.domoview-workspace'));
  await mkdir(workspace, { recursive: true });
  const aiConfig = options.aiConfig || await loadAIConfig({
    workspace,
    env: options.env || process.env,
  });
  const projects = await new ProjectStore(workspace).init();
  const proposals = await new ProposalStore(workspace, projects).init();
  const sessions = await new SessionStore(workspace).init();

  const server = createServer(async (request, response) => {
    try {
      if (!allowedHost(request.headers.host)) {
        json(response, 403, { error: 'host_not_allowed' });
        return;
      }

      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname === '/api/v1/health') {
        if (request.method !== 'GET') {
          response.writeHead(405, { allow: 'GET' }).end();
          return;
        }
        json(response, 200, {
          ok: true,
          version: VERSION,
          mode: 'localhost',
          workspace: { configured: true },
        });
        return;
      }
      if (url.pathname === '/api/v1/capabilities') {
        if (request.method !== 'GET') {
          response.writeHead(405, { allow: 'GET' }).end();
          return;
        }
        json(response, 200, {
          localServer: true,
          projectStorage: true,
          ai: Object.values(aiConfig.providers).some(provider => provider.configured),
          homeAssistant: false,
        });
        return;
      }
      if (await fixtureAgentApi(request, url, response, {
        aiConfig,
        projects,
        proposals,
        sessions,
        providerFactory: options.providerFactory,
      })) return;
        const providerResult = providerApi(request, url, aiConfig);
        if (providerResult) {
          json(response, providerResult.status, providerResult.body, providerResult.headers);
          return;
        }
        const projectResult = await projectApi(request, url, projects, proposals, sessions);
      if (projectResult) {
        if (projectResult.binary) {
          response.writeHead(projectResult.status, {
            'content-type': projectResult.type,
            'cache-control': 'private, max-age=31536000, immutable',
            'x-content-type-options': 'nosniff',
          });
          response.end(projectResult.binary);
        } else {
          json(response, projectResult.status, projectResult.body, projectResult.headers);
        }
        return;
      }
      if (url.pathname.startsWith('/api/')) {
        json(response, 404, { error: 'api_not_found' });
        return;
      }
      await serveStatic(request, response, url.pathname, studioRoot);
    } catch (error) {
      console.error('DomoView local server request failed:', error);
      if (!response.headersSent) json(response, 500, { error: 'internal_error' });
      else response.destroy();
    }
  });

  return {
    host,
    port,
    workspace,
    server,
    listen() {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.off('error', reject);
          resolve(server.address());
        });
      });
    },
    close() {
      return new Promise((resolve, reject) =>
        server.close(error => {
          sessions.close();
          if (error) reject(error);
          else resolve();
        }));
    },
  };
}

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const app = await createLocalStudioServer({ port: process.argv[2] });
  app.server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${app.port} is already in use.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  });
  await app.listen();
  console.log(`\nDomoView Studio running at http://${app.host}:${app.port}/`);
  console.log(`Workspace: ${app.workspace}`);
  console.log('Press Ctrl+C to stop.\n');
}
