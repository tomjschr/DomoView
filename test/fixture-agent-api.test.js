import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createLocalStudioServer } from '../studio/server/index.js';

function parseEvents(text) {
  return text.trim().split(/\r?\n\r?\n/).map(block => {
    const lines = block.split(/\r?\n/);
    return {
      event: lines.find(line => line.startsWith('event:'))?.slice(6).trim(),
      data: JSON.parse(lines.find(line => line.startsWith('data:'))?.slice(5).trim()),
    };
  });
}

describe('fixture agent API', () => {
  let root;
  let app;
  let baseUrl;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'domoview-fixture-agent-'));
    app = await createLocalStudioServer({
      workspace: root,
      port: 0,
      aiConfig: {
        providers: {},
        roles: {},
        publicStatus: () => ({ providers: [], roles: {} }),
      },
      providerFactory: () => ({
        async *stream() {
          yield { type: 'text_delta', text: 'Adjusted.' };
          yield { type: 'tool_start', name: 'propose_fixture_update' };
          yield {
            type: 'complete',
            response: {
              provider: 'anthropic',
              model: 'test-model',
              text: 'Adjusted.',
              toolCalls: [{
                id: 'tool_1',
                name: 'propose_fixture_update',
                input: { changes: { shadow: true, color: '#ffdca8' } },
              }],
              usage: {
                inputTokens: 90,
                outputTokens: 12,
                cacheReadTokens: 50,
                cacheWriteTokens: 0,
              },
            },
          };
        },
      }),
    });
    const address = await app.listen();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });

  test('streams progress and creates a reviewable proposal', async () => {
    const project = JSON.parse(await readFile(
      new URL('../examples/demo-apartment/project.domoview.json', import.meta.url),
      'utf8',
    ));
    const createdResponse = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'agent-project', project }),
    });
    const created = await createdResponse.json();
    const response = await fetch(
      `${baseUrl}/api/v1/projects/agent-project/agents/fixture-edit`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          revision: created.revision,
          fixtureId: 'fx_1',
          message: 'Make the ceiling light warmer and enable shadows.',
        }),
      },
    );
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/event-stream/);
    const events = parseEvents(await response.text());
    assert.deepEqual(events.map(event => event.event), [
      'status', 'text_delta', 'status', 'proposal',
    ]);
    const result = events.at(-1).data;
    assert.match(result.sessionId, /^[a-f0-9-]{36}$/);
    assert.equal(result.usage.cacheReadTokens, 50);
    assert.equal(result.proposal.status, 'pending');
    assert.deepEqual(result.proposal.operations, [{
      type: 'fixture.update',
      id: 'fx_1',
      changes: { shadow: true, color: '#ffdca8' },
    }]);
    const stored = await fetch(
      `${baseUrl}/api/v1/projects/agent-project/proposals/${result.proposal.id}`,
    ).then(item => item.json());
    assert.equal(stored.draft.fixtures.find(fixture => fixture.id === 'fx_1').shadow, true);
    const resumed = await fetch(
      `${baseUrl}/api/v1/projects/agent-project/agents/fixture-edit?fixtureId=fx_1`,
    ).then(item => item.json());
    assert.equal(resumed.session.id, result.sessionId);
    assert.deepEqual(
      resumed.session.messages.map(message => message.role),
      ['user', 'assistant'],
    );

    const applied = await fetch(
      `${baseUrl}/api/v1/projects/agent-project/proposals/${result.proposal.id}/apply`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ indexes: [0] }),
      },
    ).then(item => item.json());
    const accepted = await fetch(
      `${baseUrl}/api/v1/projects/agent-project/agents/fixture-edit?fixtureId=fx_1`,
    ).then(item => item.json());
    assert.equal(accepted.session.contextRevision, applied.project.revision);
    assert.match(accepted.session.summary, /Fixture "fx_1": update/);
  });
});
