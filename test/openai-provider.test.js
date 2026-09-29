import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { OpenAiProvider } from '../studio/server/ai/providers/openai.js';
import { ProviderError } from '../studio/server/ai/provider.js';

const config = {
  apiKey: 'secret',
  baseUrl: 'https://openai.test',
  model: 'test-model',
};

const request = () => ({
  messages: [{ role: 'user', content: 'Move the light.' }],
  tools: [{
    name: 'fixture_move',
    inputSchema: { type: 'object', properties: { x: { type: 'number' } } },
  }],
});

describe('OpenAI provider', () => {
  test('normalizes Responses API text, tool calls and usage', async () => {
    let sent;
    const provider = new OpenAiProvider(config, {
      fetch: async (url, options) => {
        sent = { url, options };
        return Response.json({
          id: 'resp_1',
          model: 'test-model',
          status: 'completed',
          output: [
            { type: 'message', content: [{ type: 'output_text', text: 'Moving it.' }] },
            { type: 'function_call', call_id: 'call_1', name: 'fixture_move', arguments: '{\"x\":2.5}' },
          ],
          usage: {
            input_tokens: 50,
            output_tokens: 12,
            input_tokens_details: { cached_tokens: 20 },
          },
        });
      },
    });
    const result = await provider.complete(request());
    assert.equal(sent.url, 'https://openai.test/v1/responses');
    assert.equal(sent.options.headers.authorization, 'Bearer secret');
    assert.equal(JSON.parse(sent.options.body).tools[0].name, 'fixture_move');
    assert.equal(result.text, 'Moving it.');
    assert.deepEqual(result.toolCalls[0], {
      id: 'call_1',
      name: 'fixture_move',
      input: { x: 2.5 },
    });
    assert.equal(result.usage.cacheReadTokens, 20);
  });

  test('normalizes streamed text and function calls', async () => {
    const events = [
      ['response.created', { response: { id: 'resp_2', model: 'test-model', output: [] } }],
      ['response.output_item.added', { output_index: 0, item: { type: 'message', content: [] } }],
      ['response.output_text.delta', { output_index: 0, content_index: 0, delta: 'Moved.' }],
      ['response.output_item.added', { output_index: 1, item: { type: 'function_call', call_id: 'call_2', name: 'fixture_move', arguments: '' } }],
      ['response.function_call_arguments.delta', { output_index: 1, delta: '{\"x\":4}' }],
      ['response.output_item.done', { output_index: 1, item: { type: 'function_call', call_id: 'call_2', name: 'fixture_move', arguments: '{\"x\":4}' } }],
      ['response.completed', { response: { status: 'completed', usage: { input_tokens: 9, output_tokens: 4 } } }],
    ].map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('');
    const provider = new OpenAiProvider(config, {
      fetch: async () => new Response(events, {
        headers: { 'content-type': 'text/event-stream' },
      }),
    });
    const received = [];
    for await (const event of provider.stream(request())) received.push(event);
    assert.equal(received.find(event => event.type === 'text_delta').text, 'Moved.');
    assert.deepEqual(received.find(event => event.type === 'tool_call').input, { x: 4 });
    assert.equal(received.at(-1).response.text, 'Moved.');
    assert.equal(received.at(-1).response.usage.outputTokens, 4);
  });

  test('supports cancellation and returns normalized errors', async () => {
    const provider = new OpenAiProvider(config, {
      fetch: async (_url, options) => {
        await new Promise((resolve, reject) => {
          if (options.signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      },
    });
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      provider.complete({ ...request(), signal: controller.signal }),
      error => error instanceof ProviderError &&
        error.code === 'timeout' &&
        error.retryable === false,
    );
  });
});
