import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { createSpecialistAgent } from '../studio/server/ai/agents/specialist.js';
import {
  executeTaskGraph, OrchestrationError,
} from '../studio/server/ai/orchestration/graph.js';
import { applyProjectOperations } from '../studio/src/operations/index.js';
import { emptyProject } from '../studio/src/project.js';
import { validateProject } from '../studio/server/projects/validate.js';

function provider(operations, inspect = () => {}) {
  return {
    async complete(request) {
      inspect(request);
      return {
        provider: 'test',
        model: 'test',
        usage: { inputTokens: 10, outputTokens: 4 },
        toolCalls: [{ name: 'propose_operations', input: { operations } }],
      };
    },
  };
}

describe('geometry and appearance specialists', () => {
  test('merge non-conflicting geometry and appearance operations', async () => {
    const project = emptyProject();
    project.walls.push({
      id: 'wall_1', a: [0, 0], b: [10, 0], thickness: 0.2,
      height: 2.5, exterior: true, flip: false,
    });
    const geometry = createSpecialistAgent('geometry', provider([
      { type: 'wall.move', id: 'wall_1', delta: [2, 0] },
    ], request => {
      assert.match(request.system, /wall_1/);
      assert.doesNotMatch(request.system, /fixtures/);
    }));
    const appearance = createSpecialistAgent('appearance', provider([
      { type: 'materials.update', changes: { wall: '#ddeeff' } },
      { type: 'camera.update', changes: { zoom: 1.2 } },
    ]));
    const result = await executeTaskGraph({
      version: 1,
      tasks: [
        {
          id: 'geometry', agent: 'geometry', instruction: 'Move the wall.',
          dependsOn: [], reads: ['walls:wall_1'], writes: ['walls:wall_1'],
        },
        {
          id: 'appearance', agent: 'appearance', instruction: 'Change wall color.',
          dependsOn: [], reads: ['materials'], writes: ['materials'],
        },
      ],
    }, { geometry, appearance }, { project });
    const draft = applyProjectOperations(project, result.operations, { validate: validateProject });
    assert.deepEqual(draft.project.walls[0].a, [2, 0]);
    assert.equal(draft.project.materials.wall, '#ddeeff');
    assert.equal(draft.project.camera.zoom, 1.2);
  });

  test('rejects operations outside a specialist allowlist', async () => {
    const geometry = createSpecialistAgent('geometry', provider([
      { type: 'fixture.remove', id: 'light_1' },
    ]));
    await assert.rejects(
      geometry({
        task: {
          instruction: 'Delete light', reads: [], writes: [],
        },
        context: { project: emptyProject() },
      }),
      error => error instanceof OrchestrationError && error.code === 'tool_not_allowed',
    );
  });
});

