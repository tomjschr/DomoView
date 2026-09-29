import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { runFixtureAgent, FixtureAgentError } from '../studio/server/ai/fixture-agent.js';

const project = {
  rooms: [
    { id: 'living', name: 'Living room', polygon: [[0, 0], [10, 0], [10, 10]], outdoor: false },
  ],
  fixtures: [
    {
      id: 'ceiling',
      name: 'Ceiling light',
      kind: 'light',
      room: 'living',
      emitters: [{ point: [5, 5], height: 2.5, type: 'point', intensity: 1 }],
      lumens: 800,
      color: '#ffffff',
      range: 5,
      shadow: false,
      bulb: 'glow',
      variant: null,
    },
    {
      id: 'floor',
      name: 'Floor lamp',
      kind: 'light',
      room: 'living',
      emitters: [{ point: [2, 2], height: 1.2, type: 'point', intensity: 1 }],
      lumens: 400,
      color: '#ffeecc',
      range: 3,
      shadow: true,
      bulb: 'glow',
      variant: null,
    },
  ],
};

function provider(response) {
  return {
    async *stream(request) {
      yield { type: 'text_delta', text: 'I will adjust it.' };
      yield { type: 'tool_start', name: response.toolCalls[0].name };
      yield { type: 'complete', response: {
        provider: 'anthropic',
        model: 'test-model',
        text: 'I will adjust it.',
        usage: { inputTokens: 100, outputTokens: 20 },
        ...response,
      } };
      assert.equal(request.messages[0].content, 'Make it warmer and cast shadows.');
      assert.match(request.system, /Ceiling light/);
      assert.match(request.system, /Floor lamp/);
      assert.doesNotMatch(request.system, /apiKey/);
    },
  };
}

describe('fixture edit agent', () => {
  test('maps bounded tool calls to typed operations', async () => {
    const events = [];
    const result = await runFixtureAgent({
      project,
      fixtureId: 'ceiling',
      message: 'Make it warmer and cast shadows.',
      provider: provider({
        toolCalls: [{
          id: 'call_1',
          name: 'propose_fixture_update',
          input: { changes: { color: '#ffdca8', shadow: true } },
        }],
      }),
      onEvent: event => events.push(event),
    });
    assert.deepEqual(result.operations, [{
      type: 'fixture.update',
      id: 'ceiling',
      changes: { color: '#ffdca8', shadow: true },
    }]);
    assert.deepEqual(events.map(event => event.type), ['text_delta', 'status']);
  });

  test('rejects unknown tools and unsupported mutation keys', async () => {
    await assert.rejects(runFixtureAgent({
      project,
      fixtureId: 'ceiling',
      message: 'Make it warmer and cast shadows.',
      provider: provider({
        toolCalls: [{
          name: 'propose_fixture_update',
          input: { changes: { id: 'other' } },
        }],
      }),
    }), error => error instanceof FixtureAgentError && error.code === 'invalid_tool_call');
  });
});

