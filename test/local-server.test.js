import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { request } from 'node:http';
import os from 'node:os';
import path from 'node:path';

import { createLocalStudioServer } from '../studio/server/index.js';
import { emptyProject } from '../studio/src/project.js';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';

describe('localhost Studio server', () => {
  let app;
  let base;
  let workspace;

  before(async () => {
    workspace = await mkdtemp(path.join(os.tmpdir(), 'domoview-server-'));
    app = await createLocalStudioServer({ port: 0, workspace });
    const address = await app.listen();
    base = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await app.close();
    await rm(workspace, { recursive: true, force: true });
  });

  test('reports health without exposing the workspace path', async () => {
    const response = await fetch(`${base}/api/v1/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.mode, 'localhost');
    assert.deepEqual(body.workspace, { configured: true });
    assert.equal(JSON.stringify(body).includes(workspace), false);
  });

  test('reports only implemented capabilities', async () => {
    const response = await fetch(`${base}/api/v1/capabilities`);
    assert.deepEqual(await response.json(), {
      localServer: true,
      projectStorage: true,
      ai: false,
      homeAssistant: false,
    });
  });

  test('creates, lists, reads and updates projects with revision checks', async () => {
    const project = emptyProject();
    project.meta = { ...project.meta, id: 'api-home', name: 'API Home' };
    const created = await fetch(`${base}/api/v1/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ project }),
    });

    assert.equal(created.status, 201);
    assert.equal((await created.json()).revision, 1);

    const list = await (await fetch(`${base}/api/v1/projects`)).json();
    assert.deepEqual(list.projects, [{ id: 'api-home', revision: 1, name: 'API Home' }]);

    const loaded = await (await fetch(`${base}/api/v1/projects/api-home`)).json();
    assert.deepEqual(loaded.project, project);

    project.meta.name = 'Changed';
    const updated = await fetch(`${base}/api/v1/projects/api-home`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ revision: 1, project }),
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).revision, 2);

    const conflict = await fetch(`${base}/api/v1/projects/api-home`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ revision: 1, project }),
    });
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).error, 'revision_conflict');
  });

  test('stores project images once and hydrates them when reopening', async () => {
    const project = emptyProject();
    project.meta = { ...project.meta, id: 'image-home', name: 'Image Home' };
    project.plan.image = PNG;
    project.photos = [{
      id: 'room', name: 'Room', dataUrl: PNG, width: 1, height: 1,
      room: null, include: false, note: '',
    }];
    const createdResponse = await fetch(`${base}/api/v1/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ project }),
    });
    const created = await createdResponse.json();
    assert.match(created.project.plan.image, /^asset:/);
    assert.equal(created.project.photos[0].dataUrl, created.project.plan.image);

    const name = created.project.plan.image.slice('asset:'.length);
    const asset = await fetch(`${base}/api/v1/projects/image-home/assets/${name}`);
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('content-type'), 'image/png');

    const reopened = await (await fetch(`${base}/api/v1/projects/image-home`)).json();
    assert.equal(reopened.project.plan.image, PNG);
    assert.equal(reopened.project.photos[0].dataUrl, PNG);
  });

  test('serves the built Studio shell', async () => {
    const response = await fetch(`${base}/`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /DomoView Studio/);
    assert.match(response.headers.get('content-type'), /^text\/html/);
  });

  test('rejects unknown APIs and unsupported methods', async () => {
    assert.equal((await fetch(`${base}/api/v1/missing`)).status, 404);
    const response = await fetch(`${base}/api/v1/health`, { method: 'POST' });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET');
  });

  test('rejects unexpected Host headers', async () => {
    const address = app.server.address();
    const status = await new Promise((resolve, reject) => {
      const probe = request({
        hostname: '127.0.0.1',
        port: address.port,
        path: '/api/v1/health',
        headers: { host: 'example.test' },
      }, response => {
        response.resume();
        resolve(response.statusCode);
      });
      probe.on('error', reject);
      probe.end();
    });
    assert.equal(status, 403);
  });
});
