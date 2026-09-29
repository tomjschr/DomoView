import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  SessionStore, SessionStoreError,
} from '../studio/server/ai/sessions.js';

describe('AI session store', () => {
  let root;
  let store;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'domoview-ai-session-'));
    store = await new SessionStore(root).init();
  });

  afterEach(async () => {
    store.close();
    await rm(root, { recursive: true, force: true });
  });

  test('persists messages, calls, tools and accepted revision summaries', () => {
    const session = store.getOrCreate('project', 'fixture', 3);
    store.addMessage(session.id, 'user', 'Make it warmer.');
    const callId = store.beginCall(session.id);
    const result = {
      provider: 'anthropic',
      model: 'test-model',
      usage: { inputTokens: 10, outputTokens: 3 },
      operations: [{
        type: 'fixture.update',
        id: 'fixture',
        changes: { color: '#ffdca8' },
      }],
    };
    store.completeCall(callId, result);
    store.addMessage(session.id, 'assistant', 'Prepared a warmer color.');
    store.linkProposal(session.id, callId, {
      id: 'proposal',
      baseRevision: 3,
    });
    store.markProposal('proposal', 'applied', 4, ['Fixture "fixture": update']);

    const restored = store.publicSession(session.id);
    assert.deepEqual(restored.messages.map(message => message.role), ['user', 'assistant']);
    assert.equal(restored.contextRevision, 4);
    assert.match(restored.summary, /Fixture "fixture": update/);
    assert.equal(store.context(session.id, 4).summary, restored.summary);
    assert.equal(store.context(session.id, 5).summary, '');
  });

  test('resumes the latest target session and rejects cross-target reuse', () => {
    const session = store.getOrCreate('project', 'fixture', 1);
    assert.equal(store.getOrCreate('project', 'fixture', 1).id, session.id);
    assert.throws(
      () => store.getOrCreate('other-project', 'fixture', 1, session.id),
      error => error instanceof SessionStoreError &&
        error.code === 'session_target_mismatch',
    );
  });
});

