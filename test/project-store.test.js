import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  ProjectStore, ProjectStoreError, projectId,
} from '../studio/server/projects/store.js';

describe('project store', () => {
  let root;
  let store;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'domoview-projects-'));
    store = await new ProjectStore(root).init();
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  test('creates, lists and reads a project', async () => {
    const project = { version: 1, meta: { id: 'my-home', name: 'My Home' } };
    assert.deepEqual(await store.create(project), { id: 'my-home', revision: 1, project });
    assert.deepEqual(await store.list(), [{ id: 'my-home', revision: 1, name: 'My Home' }]);
    assert.deepEqual(await store.get('my-home'), { id: 'my-home', revision: 1, project });
  });

  test('updates atomically and rejects a stale revision', async () => {
    await store.create({ version: 1, meta: { id: 'flat', name: 'Flat' } });
    const project = { version: 1, meta: { id: 'flat', name: 'Updated Flat' } };
    assert.equal((await store.update('flat', 1, project)).revision, 2);
    await assert.rejects(
      store.update('flat', 1, project),
      error => error instanceof ProjectStoreError && error.code === 'revision_conflict',
    );
    assert.equal((await store.get('flat')).project.meta.name, 'Updated Flat');
  });

  test('never treats ids as filesystem paths', async () => {
    assert.equal(projectId('Müller Home'), 'muller-home');
    assert.throws(() => projectId('../../'), /invalid/i);
    await assert.rejects(
      store.get('../secret'),
      error => error instanceof ProjectStoreError && error.code === 'invalid_id',
    );
  });

  test('does not overwrite an existing project on create', async () => {
    const project = { version: 1, meta: { id: 'home' } };
    await store.create(project);
    await assert.rejects(
      store.create(project),
      error => error instanceof ProjectStoreError && error.code === 'exists',
    );
  });
});
