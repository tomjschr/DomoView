import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  HomeAssistantInstaller, InstallError,
} from '../studio/server/ha/install.js';

describe('reviewed Home Assistant pack install', () => {
  let root;
  let installer;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'domoview-install-'));
    installer = new HomeAssistantInstaller(root);
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  test('plans new files and installs only within the configured target', async () => {
    const files = [
      { path: 'www/domoview/packs/home/home.json', content: '{"schema":1}' },
      { path: 'lovelace/domoview-home.yaml', content: 'type: custom:domoview-card' },
    ];
    const plan = await installer.plan(files);
    assert.deepEqual(plan.files.map(file => file.action), ['create', 'create']);
    await installer.apply(files);
    assert.equal(
      await readFile(path.join(root, 'www', 'domoview', 'packs', 'home', 'home.json'), 'utf8'),
      '{"schema":1}',
    );
    await assert.rejects(
      installer.plan([{ path: '../secrets.yaml', content: 'bad' }]),
      error => error instanceof InstallError && error.code === 'invalid_path',
    );
  });

  test('requires overwrite approval and creates a backup', async () => {
    const directory = path.join(root, 'www', 'domoview', 'packs', 'home');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'home.json'), 'old');
    const files = [{ path: 'www/domoview/packs/home/home.json', content: 'new' }];
    assert.equal((await installer.plan(files)).requiresOverwrite, true);
    await assert.rejects(
      installer.apply(files),
      error => error instanceof InstallError && error.code === 'overwrite_required',
    );
    const result = await installer.apply(files, { overwrite: true });
    assert.equal(result.backups, 1);
    assert.equal(await readFile(path.join(directory, 'home.json'), 'utf8'), 'new');
  });
});

