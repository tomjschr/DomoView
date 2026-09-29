import { estimateCost, ProviderError } from './provider.js';

const UPDATE_KEYS = new Set([
  'name', 'room', 'emitters', 'lumens', 'color', 'range', 'shadow', 'bulb', 'variant',
]);

export class FixtureAgentError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FixtureAgentError';
    this.code = code;
  }
}

function toolDefinitions(roomIds) {
  return [
    {
      name: 'propose_fixture_update',
      description: 'Propose property changes for the selected light fixture.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['changes'],
        properties: {
          changes: {
            type: 'object',
            minProperties: 1,
            additionalProperties: false,
            properties: {
              name: { type: 'string' },
              room: { type: 'string', enum: roomIds },
              emitters: { type: 'array', items: { type: 'object' } },
              lumens: { type: 'number', minimum: 0 },
              color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
              range: { type: 'number', minimum: 0 },
              shadow: { type: 'boolean' },
              bulb: { type: 'string' },
              variant: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
    {
      name: 'propose_fixture_move',
      description: 'Move every emitter of the selected fixture. X/Y are plan pixels; Z is metres.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['delta'],
        properties: {
          delta: {
            type: 'array',
            minItems: 2,
            maxItems: 3,
            items: { type: 'number' },
          },
        },
      },
    },
  ];
}

function fixtureContext(project, fixtureId) {
  const fixture = project.fixtures.find(entry => entry.id === fixtureId);
  if (!fixture || fixture.kind !== 'light') {
    throw new FixtureAgentError('fixture_not_found', 'Selected light fixture does not exist.');
  }
  const room = project.rooms.find(entry => entry.id === fixture.room) || null;
  const nearbyLights = project.fixtures
    .filter(entry => entry.kind === 'light' && entry.room === fixture.room && entry.id !== fixture.id)
    .map(entry => ({
      id: entry.id,
      name: entry.name,
      lumens: entry.lumens,
      color: entry.color,
      range: entry.range,
      shadow: entry.shadow,
    }));
  return {
    fixture,
    room: room ? {
      id: room.id,
      name: room.name,
      polygon: room.polygon,
      outdoor: room.outdoor,
    } : null,
    nearbyLights,
  };
}

function operationsFor(toolCalls, fixtureId) {
  const operations = [];
  for (const call of toolCalls) {
    if (call.name === 'propose_fixture_update') {
      const changes = call.input?.changes;
      if (!changes || typeof changes !== 'object' || Array.isArray(changes) ||
          !Object.keys(changes).length ||
          Object.keys(changes).some(key => !UPDATE_KEYS.has(key))) {
        throw new FixtureAgentError(
          'invalid_tool_call',
          'Provider returned unsupported fixture changes.',
        );
      }
      operations.push({ type: 'fixture.update', id: fixtureId, changes });
    } else if (call.name === 'propose_fixture_move') {
      operations.push({ type: 'fixture.move', id: fixtureId, delta: call.input?.delta });
    } else {
      throw new FixtureAgentError('invalid_tool_call', `Provider called unknown tool "${call.name}".`);
    }
  }
  if (!operations.length) {
    throw new FixtureAgentError('no_operations', 'The assistant did not propose a fixture change.');
  }
  return operations;
}

export async function runFixtureAgent(input) {
  const context = fixtureContext(input.project, input.fixtureId);
  const history = (input.history || []).filter(message =>
    ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string');
  const request = {
    system: [
      'You edit one selected DomoView light fixture.',
      'Use only the supplied tools. Never invent fixture IDs or return free-form JSON.',
      'Keep changes minimal and preserve values the user did not ask to change.',
      'Plan X/Y coordinates are pixels. Emitter height and move Z are metres.',
      'A proposal is reviewed visually before it can be applied.',
      input.summary ? `Accepted-session summary:\n${input.summary}` : '',
      `Current context:\n${JSON.stringify(context)}`,
    ].filter(Boolean).join('\n\n'),
    messages: [...history, { role: 'user', content: input.message }],
    tools: toolDefinitions(input.project.rooms.map(room => room.id)),
    maxTokens: 1200,
    signal: input.signal,
  };
  let finalResponse;
  for await (const event of input.provider.stream(request)) {
    if (event.type === 'text_delta') {
      input.onEvent?.({ type: 'text_delta', text: event.text });
    } else if (event.type === 'tool_start') {
      input.onEvent?.({ type: 'status', stage: 'building_proposal', tool: event.name });
    } else if (event.type === 'complete') {
      finalResponse = event.response;
    }
  }
  if (!finalResponse) {
    throw new ProviderError('internal', 'incomplete_response', 'Provider stream ended without a result.');
  }
  return {
    assistantText: finalResponse.text,
    operations: operationsFor(finalResponse.toolCalls, input.fixtureId),
    usage: finalResponse.usage,
    costUsd: estimateCost(finalResponse.usage, input.provider.config?.pricing),
    provider: finalResponse.provider,
    model: finalResponse.model,
  };
}
