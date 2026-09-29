import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { routeRequest } from '../studio/server/ai/orchestration/router.js';

const corpus = [
  {
    message: 'Make the selected ceiling light warmer and enable shadows.',
    selection: { domain: 'fixture', id: 'light_1' },
    route: 'specialist',
    specialist: 'fixture',
    reason: 'single_fixture_domain',
    calls: 1,
    context: 'selectedFixture',
  },
  {
    message: 'Verschiebe die Küchenwand 20 cm nach links.',
    selection: { domain: 'geometry', id: 'wall_1' },
    route: 'specialist',
    specialist: 'geometry',
    reason: 'single_geometry_domain',
    calls: 1,
    context: 'connectedGeometry',
  },
  {
    message: 'Ordne diese Leuchte einer Home Assistant Entität zu.',
    selection: { domain: 'binding', id: 'light_1' },
    route: 'specialist',
    specialist: 'binding',
    reason: 'single_binding_domain',
    calls: 1,
  },
  {
    message: 'Make it better.',
    selection: null,
    route: 'orchestrator',
    reason: 'ambiguous_intent',
    calls: 2,
  },
  {
    message: 'A little brighter please.',
    selection: { domain: 'fixture', id: 'light_1' },
    route: 'specialist',
    specialist: 'fixture',
    reason: 'single_fixture_domain',
    calls: 1,
  },
];

describe('deterministic AI request router', () => {
  for (const entry of corpus) {
    test(entry.message, () => {
      const result = routeRequest(entry);
      assert.equal(result.route, entry.route);
      assert.equal(result.reason, entry.reason);
      assert.equal(result.expectedModelCalls, entry.calls);
      if (entry.specialist) assert.equal(result.specialist, entry.specialist);
      if (entry.context) assert.ok(result.context.includes(entry.context));
    });
  }

  test('rejects empty requests without a model call', () => {
    assert.deepEqual(routeRequest({ message: '  ' }), {
      route: 'reject',
      reason: 'empty_request',
      domains: [],
      context: [],
      expectedModelCalls: 0,
    });
  });
});
