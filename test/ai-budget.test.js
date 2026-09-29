import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { BudgetError, TurnBudget } from '../studio/server/ai/budget.js';
import {
  cachedRequest, contextCacheKey,
} from '../studio/server/ai/context-cache.js';
import { AnthropicProvider } from '../studio/server/ai/providers/anthropic.js';
import { OpenAiProvider } from '../studio/server/ai/providers/openai.js';

describe('AI turn budgets and prompt caching', () => {
  test('blocks preflight and mid-run overruns until explicitly approved', () => {
    const calls = new TurnBudget({ maxCalls: 1, maxInputTokens: 10, maxCostUsd: 0.001 });
    calls.beforeCall();
    assert.throws(
      () => calls.beforeCall(),
      error => error instanceof BudgetError && error.code === 'budget_preflight',
    );
    const tokens = new TurnBudget({ maxInputTokens: 5 });
    tokens.beforeCall();
    assert.throws(
      () => tokens.record({ inputTokens: 6 }, { inputPerMillion: 1, outputPerMillion: 1 }),
      error => error instanceof BudgetError && error.code === 'budget_exceeded',
    );
    tokens.approve();
    assert.doesNotThrow(() => tokens.beforeCall());
  });

  test('accounts cached tokens with provider-specific rates', () => {
    const budget = new TurnBudget({ maxCostUsd: 1 });
    budget.beforeCall();
    const snapshot = budget.record({
      inputTokens: 100,
      outputTokens: 20,
      cacheReadTokens: 80,
    }, {
      inputPerMillion: 4,
      outputPerMillion: 20,
      cacheReadPerMillion: 0.4,
    });
    assert.equal(snapshot.costUsd, 0.000832);
    assert.equal(snapshot.usage.cacheReadTokens, 80);
  });

  test('stable contexts produce stable keys and provider cache hints', async () => {
    assert.equal(
      contextCacheKey('test', { b: 2, a: 1 }),
      contextCacheKey('test', { a: 1, b: 2 }),
    );
    const request = cachedRequest('test', { schema: 1 }, {
      system: 'Stable prompt',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    let anthropicBody;
    await new AnthropicProvider({
      apiKey: 'key', baseUrl: 'https://test', model: 'model',
    }, {
      fetch: async (_url, options) => {
        anthropicBody = JSON.parse(options.body);
        return Response.json({ content: [], usage: {} });
      },
    }).complete(request);
    assert.equal(anthropicBody.system[0].cache_control.type, 'ephemeral');

    let openAiBody;
    await new OpenAiProvider({
      apiKey: 'key', baseUrl: 'https://test', model: 'model',
    }, {
      fetch: async (_url, options) => {
        openAiBody = JSON.parse(options.body);
        return Response.json({ output: [], usage: {} });
      },
    }).complete(request);
    assert.equal(openAiBody.prompt_cache_key, request.cache.key);
  });
});

