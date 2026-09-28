#!/usr/bin/env node
/* Serve the Studio from its own folder.
 *
 * This ships inside domoview-studio.zip so the Studio runs on a PC without
 * checking the repository out. It serves the directory it sits in and nothing
 * above it.
 *
 * Why a server at all, rather than just opening index.html? The Studio is an
 * ES module, and browsers refuse to load modules over file:// for security
 * reasons. A local origin also gives the page a secure context, which some
 * browser APIs require.
 *
 * Usage:  node serve.mjs [port]
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = import.meta.dirname;
const port = Number(process.argv[2]) || 8099;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  const resolved = path.resolve(root, relative);

  // Refuse anything that escapes this folder.
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    response.writeHead(403, { 'content-type': 'text/plain' }).end('Forbidden');
    return;
  }

  let target = resolved;
  try {
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
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

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Try: node serve.mjs ${port + 1}`);
    process.exit(1);
  }
  throw error;
});

// Bound to the loopback interface on purpose: this is a local tool, and the
// Studio handles floor plans and photographs of real homes.
server.listen(port, '127.0.0.1', () => {
  console.log(`\n  DomoView Studio running at  http://127.0.0.1:${port}/\n`);
  console.log('  Open that in your browser. Nothing is uploaded anywhere.');
  console.log('  Press Ctrl+C to stop.\n');
});
