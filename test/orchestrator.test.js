import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  executeTaskGraph, OrchestrationError, validateTaskGraph,
} from '../studio/server/ai/orchestration/graph.js';
import { planTaskGraph } from '../studio/server/ai/orchestration/planner.js';

const task = (id, agent, options = {}) => ({
  id,
  agent,
  instruction: options.instruction || `Run ${id}`,
  dependsOn: options.dependsOn || [],
  reads: options.reads || [],
  writes: options.writes || [],
});

describe('structured task graph orchestration', () => {
  test('executes independent tasks in parallel and dependencies sequentially', async () => {
    const active = new Set();
    let overlapped = false;
    const agent = async ({ task: current, dependencies }) => {
      if (active.size) overlapped = true;
      active.add(current.id);
      await new Promise(resolve => setTimeout(resolve, 5));
      active.delete(current.id);
      return {
        operations: [{ type: `${current.agent}.result`, dependencies: Object.keys(dependencies) }],
        usage: { inputTokens: 10, outputTokens: 2 },
      };
    };
    const graph = {
      version: 1,
      tasks: [
        task('light', 'fixture', { writes: ['fixtures:light_1'] }),
        task('wall', 'geometry', { writes: ['walls:wall_1'] }),
        task('finish', 'appearance', {
          dependsOn: ['light', 'wall'],
          writes: ['materials:floor'],
        }),
      ],
    };
    const result = await executeTaskGraph(graph, {
      fixture: agent, geometry: agent, appearance: agent,
    });
    assert.equal(overlapped, true);
    assert.deepEqual(result.waves, [['light', 'wall'], ['finish']]);
    assert.equal(result.operations.length, 3);
    assert.deepEqual(result.usage, { inputTokens: 30, outputTokens: 6 });
  });

  test('rejects cycles, unknown agents and unordered write conflicts', async () => {
    assert.throws(() => validateTaskGraph({
      version: 1,
      tasks: [
        task('one', 'fixture', { dependsOn: ['two'] }),
        task('two', 'fixture', { dependsOn: ['one'] }),
      ],
    }), error => error instanceof OrchestrationError && error.code === 'cyclic_graph');
    assert.throws(() => validateTaskGraph({
      version: 1,
      tasks: [
        task('one', 'fixture', { writes: ['fixtures:*'] }),
        task('two', 'fixture', { writes: ['fixtures:light_1'] }),
      ],
    }), error => error instanceof OrchestrationError && error.code === 'write_conflict');
    await assert.rejects(executeTaskGraph({
      version: 1,
      tasks: [task('one', 'fixture')],
    }, {}), error => error instanceof OrchestrationError && error.code === 'unknown_agent');
  });

  test('planner accepts only one schema-valid graph tool call', async () => {
    const graph = {
      version: 1,
      tasks: [task('light', 'fixture', { writes: ['fixtures:light_1'] })],
    };
    const planned = await planTaskGraph({
      message: 'Change the light and wall.',
      provider: {
        async complete(request) {
          assert.equal(request.tools[0].name, 'submit_task_graph');
          return {
            provider: 'anthropic',
            model: 'planner',
            usage: { inputTokens: 20, outputTokens: 8 },
            toolCalls: [{ name: 'submit_task_graph', input: graph }],
          };
        },
      },
    });
    assert.deepEqual(planned.graph, graph);
  });
});

