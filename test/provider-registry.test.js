import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createProvider, createRoleProvider,
} from '../studio/server/ai/providers/index.js';
import { AnthropicProvider } from '../studio/server/ai/providers/anthropic.js';
import { OpenAiProvider } from '../studio/server/ai/providers/openai.js';
import { ProviderError } from '../studio/server/ai/provider.js';

describe('provider registry', () => {
  test('creates configured adapters and applies role model overrides', () => {
    const aiConfig = {
      providers: {
        anthropic: {
          id: 'anthropic',
          configured: true,
          apiKey: 'secret',
          baseUrl: 'https://anthropic.test',
          model: 'provider-model',
        },
      },
      roles: {
        executor: { provider: 'anthropic', model: 'role-model' },
      },
    };
    const provider = createRoleProvider(aiConfig, 'executor');
    assert.ok(provider instanceof AnthropicProvider);
    assert.equal(provider.config.model, 'role-model');
    assert.ok(createProvider({
      id: 'openai',
      configured: true,
      apiKey: 'secret',
      baseUrl: 'https://openai.test',
    }) instanceof OpenAiProvider);
  });

  test('fails clearly for unavailable and unsupported providers', () => {
    assert.throws(
      () => createProvider({ id: 'anthropic', configured: false }),
      error => error instanceof ProviderError && error.code === 'not_configured',
    );
    assert.equal(createProvider({
      id: 'opencode', configured: true, command: 'opencode',
    }).capabilities().tools, false);
  });
});
