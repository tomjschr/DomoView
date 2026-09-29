import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { loadAIConfig, redactSecrets } from '../studio/server/ai/config.js';

describe('AI provider configuration', () => {
  let root;
  let file;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'domoview-ai-config-'));
    file = path.join(root, 'config', 'ai.json');
    await mkdir(path.dirname(file), { recursive: true });
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  test('loads server-side file settings and environment overrides', async () => {
    await writeFile(file, JSON.stringify({
      providers: {
        anthropic: { apiKey: 'file-secret', model: 'file-model' },
        opencode: { baseUrl: 'http://127.0.0.1:4096', model: 'local-model' },
      },
      roles: {
        executor: { provider: 'opencode', model: 'executor-model' },
      },
    }));
    const config = await loadAIConfig({
      file,
      env: {
        ANTHROPIC_API_KEY: 'env-secret',
        DOMOVIEW_ANTHROPIC_MODEL: 'env-model',
      },
    });
    assert.equal(config.providers.anthropic.apiKey, 'env-secret');
    assert.equal(config.providers.anthropic.model, 'env-model');
    assert.equal(config.providers.opencode.configured, true);
    assert.equal(config.roles.executor.provider, 'opencode');
    assert.equal(config.roles.executor.model, 'executor-model');
  });

  test('public status never exposes credentials or endpoint details', async () => {
    const secret = 'this-must-never-reach-the-browser';
    const config = await loadAIConfig({
      file,
      env: { OPENAI_API_KEY: secret, DOMOVIEW_OPENAI_MODEL: 'model-name' },
    });
    const status = config.publicStatus();
    assert.equal(status.providers.find(provider => provider.id === 'openai').configured, true);
    assert.equal(status.providers.find(provider => provider.id === 'openai').model, 'model-name');
    assert.equal(JSON.stringify(status).includes(secret), false);
    assert.equal(JSON.stringify(status).includes('api.openai.com'), false);
  });

  test('redacts nested secret-shaped fields without changing safe metadata', () => {
    assert.deepEqual(redactSecrets({
      apiKey: 'secret',
      nested: { authorization: 'Bearer x', model: 'safe' },
      values: [{ access_token: 'hidden', count: 2 }],
    }), {
      apiKey: '[redacted]',
      nested: { authorization: '[redacted]', model: 'safe' },
      values: [{ access_token: '[redacted]', count: 2 }],
    });
  });

  test('rejects unknown providers in role configuration', async () => {
    await writeFile(file, JSON.stringify({
      roles: { orchestrator: { provider: 'mystery' } },
    }));
    await assert.rejects(loadAIConfig({ file, env: {} }), /Unknown provider/);
  });
});

