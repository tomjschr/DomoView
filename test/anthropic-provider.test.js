import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { AnthropicProvider } from '../studio/server/ai/providers/anthropic.js';
import { ProviderError } from '../studio/server/ai/provider.js';

const config = {
  apiKey: 'secret',
  baseUrl: 'https://anthropic.test',
  model: 'test-model',
};

function request() {
  return {
    system: 'Use tools.',
    messages: [{ role: 'user', content: 'Make the light warmer.' }],
    tools: [{
      name: 'fixture_update',
      description: 'Update a fixture',
      inputSchema: { type: 'object', properties: { color: { type: 'string' } } },
    }],
  };
}

describe('Anthropic provider', () => {
  test('normalizes text, tool calls, usage and request shape', async () => {
    let sent;
    const provider = new AnthropicProvider(config, {
      fetch: async (url, options) => {
        sent = { url, options };
        return Response.json({
          id: 'msg_1',
          model: 'test-model',
          content: [
            { type: 'text', text: 'I will update it.' },
            { type: 'tool_use', id: 'tool_1', name: 'fixture_update', input: { color: '#ffaa00' } },
          ],
          stop_reason: 'tool_use',
          usage: {
            input_tokens: 120,
            output_tokens: 30,
            cache_read_input_tokens: 80,
          },
        });
      },
    });
    const result = await provider.complete(request());
    assert.equal(sent.url, 'https://anthropic.test/v1/messages');
    assert.equal(sent.options.headers['x-api-key'], 'secret');
    assert.equal(JSON.parse(sent.options.body).stream, false);
    assert.equal(result.text, 'I will update it.');
    assert.deepEqual(result.toolCalls[0], {
      id: 'tool_1',
      name: 'fixture_update',
      input: { color: '#ffaa00' },
    });
    assert.deepEqual(result.usage, {
      inputTokens: 120,
      outputTokens: 30,
      cacheReadTokens: 80,
      cacheWriteTokens: 0,
    });
  });

  test('normalizes streamed text and incremental tool JSON', async () => {
    const events = [
      ['message_start', { message: { id: 'msg_2', model: 'test-model', content: [], usage: { input_tokens: 10 } } }],
      ['content_block_start', { index: 0, content_block: { type: 'text', text: '' } }],
      ['content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'Done. ' } }],
      ['content_block_start', { index: 1, content_block: { type: 'tool_use', id: 'tool_2', name: 'fixture_update', input: {} } }],
      ['content_block_delta', { index: 1, delta: { type: 'input_json_delta', partial_json: '{\"shadow\":' } }],
      ['content_block_delta', { index: 1, delta: { type: 'input_json_delta', partial_json: 'true}' } }],
      ['content_block_stop', { index: 1 }],
      ['message_delta', { delta: { stop_reason: 'tool_use' }, usage: { output_tokens: 8 } }],
    ].map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('');
    const provider = new AnthropicProvider(config, {
      fetch: async () => new Response(events, {
        headers: { 'content-type': 'text/event-stream' },
      }),
    });
    const received = [];
    for await (const event of provider.stream(request())) received.push(event);
    assert.deepEqual(received.find(event => event.type === 'tool_call').input, { shadow: true });
    const complete = received.at(-1).response;
    assert.equal(complete.text, 'Done. ');
    assert.equal(complete.usage.inputTokens, 10);
    assert.equal(complete.usage.outputTokens, 8);
  });

  test('classifies provider failures without leaking request details', async () => {
    const provider = new AnthropicProvider(config, {
      fetch: async () => Response.json(
        { error: { message: 'Too many requests' } },
        { status: 429 },
      ),
    });
    await assert.rejects(
      provider.complete(request()),
      error => error instanceof ProviderError &&
        error.code === 'rate_limit' &&
        error.retryable === true,
    );
  });
});

