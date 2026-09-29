import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { OpenCodeProvider } from '../studio/server/ai/providers/opencode.js';
import { ProviderError } from '../studio/server/ai/provider.js';

describe('OpenCode CLI provider', () => {
  test('reports exact capabilities and normalizes JSON-line output', async () => {
    let input;
    const provider = new OpenCodeProvider({
      command: 'opencode', model: 'local/model',
    }, {
      runner: async options => {
        input = options;
        return {
          stdout: [
            JSON.stringify({ type: 'text', text: 'Hello ' }),
            JSON.stringify({ type: 'text', text: 'world' }),
          ].join('\n'),
        };
      },
    });
    assert.deepEqual(provider.capabilities(), {
      tools: false,
      vision: false,
      streaming: true,
      promptCaching: false,
      structuredOutput: false,
      transport: 'cli',
    });
    const result = await provider.complete({
      system: 'Be concise.',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    assert.match(input.prompt, /Be concise/);
    assert.equal(result.text, 'Hello world');
    assert.equal(result.model, 'local/model');
  });

  test('rejects unsupported tools and forwards cancellation to its owned runner', async () => {
    const provider = new OpenCodeProvider({ command: 'opencode' }, {
      runner: async options => {
        assert.equal(options.signal.aborted, true);
        throw new ProviderError('opencode', 'timeout', 'cancelled');
      },
    });
    await assert.rejects(provider.complete({
      messages: [{ role: 'user', content: 'Use a tool' }],
      tools: [{ name: 'edit', inputSchema: { type: 'object' } }],
    }), error => error.code === 'unsupported_capability');
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(provider.complete({
      messages: [{ role: 'user', content: 'Stop' }],
      signal: controller.signal,
    }), error => error.code === 'timeout');
  });
});

