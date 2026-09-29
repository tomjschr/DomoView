import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readEventStream } from '../studio/src/project-client.js';

test('browser client parses streamed fixture proposals and reports errors', async () => {
  const seen = [];
  const proposal = { proposal: { id: 'proposal-1' }, usage: { inputTokens: 10 } };
  const result = await readEventStream(new Response([
    'event: status\ndata: {\"stage\":\"thinking\"}\n\n',
    `event: proposal\ndata: ${JSON.stringify(proposal)}\n\n`,
  ].join('')), (event, data) => seen.push([event, data]));
  assert.deepEqual(result, proposal);
  assert.deepEqual(seen.map(([event]) => event), ['status', 'proposal']);

  await assert.rejects(
    readEventStream(new Response(
      'event: error\ndata: {\"code\":\"rate_limit\",\"message\":\"Try later\",\"retryable\":true}\n\n',
    )),
    error => error.code === 'rate_limit' && error.retryable === true,
  );
});

