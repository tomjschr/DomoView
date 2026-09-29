import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createLocalStudioServer } from '../studio/server/index.js';
import { emptyProject } from '../studio/src/project.js';

let root;
let app;
let baseUrl;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'domoview-vision-api-'));
  app = await createLocalStudioServer({
    workspace: root,
    port: 0,
    aiConfig: { providers: {}, roles: {}, publicStatus: () => ({ providers: [], roles: {} }) },
    providerFactory: () => ({
      config: { id: 'openai' },
      capabilities: () => ({ vision: true }),
      async complete(request) {
        assert.equal(request.attachments.length, 1);
        return {
          provider: 'openai', model: 'vision', usage: {},
          toolCalls: [{
            name: 'propose_vision_annotations',
            input: { annotations: [{
              type: 'room_label', label: 'Kitchen', points: [[10, 20]],
              confidence: 0.9,
            }] },
          }],
        };
      },
    }),
  });
  const address = await app.listen();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  await app.close();
  await rm(root, { recursive: true, force: true });
});

test('vision API sends only explicitly selected project images', async () => {
  const project = emptyProject();
  project.plan.image = 'data:image/png;base64,iVBORw0KGgo=';
  project.plan.imageWidth = 100;
  project.plan.imageHeight = 100;
  await fetch(`${baseUrl}/api/v1/projects`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 'vision', project }),
  });
  const denied = await fetch(`${baseUrl}/api/v1/projects/vision/vision-suggestions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageIds: ['plan'], confirmTransmission: false }),
  });
  assert.equal(denied.status, 403);
  const result = await fetch(`${baseUrl}/api/v1/projects/vision/vision-suggestions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageIds: ['plan'], confirmTransmission: true }),
  }).then(response => response.json());
  assert.equal(result.annotations[0].label, 'Kitchen');
  assert.deepEqual(result.transmitted.map(image => image.id), ['plan']);
});

