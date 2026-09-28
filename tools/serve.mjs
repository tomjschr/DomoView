#!/usr/bin/env node
/* Static file server for local development.
 *
 * Serves the repository so you can open the Studio and the card demo without
 * a Home Assistant instance. Deliberately tiny and dependency-free; it is a
 * development convenience, not something to expose to a network.
 *
 * Usage: node tools/serve.mjs [port]
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.argv[2]) || 8099;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);
  let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (relative === '') relative = 'examples/demo.html';

  const resolved = path.resolve(root, relative);
  // Refuse anything that escapes the repository.
  if (!resolved.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  let target = resolved;
  try {
    const info = await stat(target);
    if (info.isDirectory()) target = path.join(target, 'index.html');
    await stat(target);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain' }).end(`Not found: /${relative}`);
    return;
  }

  response.writeHead(200, {
    'content-type': TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`DomoView dev server on http://127.0.0.1:${port}`);
  console.log(`  card demo  http://127.0.0.1:${port}/examples/demo.html`);
  console.log(`  studio     http://127.0.0.1:${port}/dist/studio/index.html`);
});
