import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  ProjectStore, ProjectStoreError, projectId,
} from '../studio/server/projects/store.js';
import { emptyProject } from '../studio/src/project.js';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';

describe('project store', () => {
  let root;
  let store;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'domoview-projects-'));
    store = await new ProjectStore(root).init();
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  test('creates, lists and reads a project', async () => {
    const project = emptyProject();
    project.meta = { ...project.meta, id: 'my-home', name: 'My Home' };
    assert.deepEqual(await store.create(project), { id: 'my-home', revision: 1, project });
    assert.deepEqual(await store.list(), [{ id: 'my-home', revision: 1, name: 'My Home' }]);
    assert.deepEqual(await store.get('my-home'), { id: 'my-home', revision: 1, project });
  });

  test('updates atomically and rejects a stale revision', async () => {
    const initial = emptyProject();
    initial.meta = { ...initial.meta, id: 'flat', name: 'Flat' };
    await store.create(initial);
    const project = structuredClone(initial);
    project.meta.name = 'Updated Flat';
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
    const project = emptyProject();
    project.meta.id = 'home';
    await store.create(project);
    await assert.rejects(
      store.create(project),
      error => error instanceof ProjectStoreError && error.code === 'exists',
    );
  });

  test('stores images as assets but hydrates them for the browser', async () => {
    const project = emptyProject();
    project.meta.id = 'photos';
    project.plan.image = PNG;
    project.photos = [{
      id: 'room', name: 'Room', dataUrl: PNG, width: 1, height: 1,
      room: null, include: false, note: '',
    }];
    const created = await store.create(project);
    assert.match(created.project.plan.image, /^asset:/);
    assert.equal(created.project.photos[0].dataUrl, created.project.plan.image);
    assert.deepEqual((await store.getHydrated('photos')).project, project);
  });

  test('rejects invalid documents before writing them', async () => {
    const project = emptyProject();
    project.meta.id = 'invalid';
    project.camera.zoom = 0;
    await assert.rejects(
      store.create(project),
      error => error instanceof ProjectStoreError && error.code === 'invalid_project',
    );
    assert.deepEqual(await store.list(), []);
  });
});
