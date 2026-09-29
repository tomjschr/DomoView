import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { AssetStore, AssetStoreError } from '../studio/server/projects/assets.js';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';

describe('asset store', () => {
  let root;
  let store;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'domoview-assets-'));
    store = await new AssetStore(root).init();
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  test('deduplicates image data by content hash', async () => {
    const first = await store.putDataUrl(PNG);
    const second = await store.putDataUrl(PNG);
    assert.equal(first, second);
    assert.match(first, /^asset:[a-f0-9]{64}\.png$/);
    assert.equal((await readdir(path.join(root, 'assets'))).length, 1);
    assert.equal((await store.get(first)).type, 'image/png');
  });

  test('externalizes plan and photo images without mutating input', async () => {
    const project = {
      plan: { image: PNG },
      photos: [{ id: 'one', dataUrl: PNG }],
    };
    const external = await store.externalizeProject(project);
    assert.equal(project.plan.image, PNG);
    assert.match(external.plan.image, /^asset:/);
    assert.equal(external.photos[0].dataUrl, external.plan.image);
    assert.deepEqual(await store.hydrateProject(external), project);
  });

  test('rejects unsupported and malformed data URLs', async () => {
    await assert.rejects(
      store.putDataUrl('data:text/plain;base64,aGVsbG8='),
      error => error instanceof AssetStoreError && error.code === 'invalid_asset',
    );
    await assert.rejects(
      store.get('asset:../../secret.png'),
      error => error instanceof AssetStoreError && error.code === 'invalid_asset_ref',
    );
  });
});
