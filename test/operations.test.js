import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { emptyProject } from '../studio/src/project.js';
import {
  applyProjectOperation, applyProjectOperations, OperationError,
} from '../studio/src/operations/index.js';
import { validateOperation, validateProject } from '../studio/server/projects/validate.js';

function projectWithElements() {
  const project = emptyProject();
  project.walls.push({
    id: 'wall_1', a: [0, 0], b: [4, 0], thickness: 0.12,
    height: 2.55, exterior: true, flip: false,
  });
  project.openings.push({
    id: 'window_1', type: 'window', name: 'Window', wall: 'wall_1',
    offset: 2, width: 1, sill: 0.9, head: 2.2, rooms: [],
    mullion: null, cover: true, coverProfile: 'linear', coverInFront: false,
  });
  project.fixtures.push({
    id: 'light_1', name: 'Light', kind: 'light', room: null,
    emitters: [{ point: [1, 1], height: 2.4, type: 'point', intensity: 1 }],
    lumens: 600, color: '#ffdda4', range: 6, shadow: false,
    bulb: 'glow', variant: null,
  });
  return project;
}

const options = { validate: validateProject };

describe('project operations', () => {
  test('moves a wall without mutating the source and restores exactly', () => {
    const source = projectWithElements();
    const result = applyProjectOperation(source, {
      type: 'wall.move', id: 'wall_1', delta: [-0.2, 0],
    }, options);
    assert.deepEqual(source.walls[0].a, [0, 0]);
    assert.deepEqual(result.project.walls[0].a, [-0.2, 0]);
    assert.match(result.summary, /Move wall/);
    const restored = applyProjectOperation(result.project, result.inverse, options);
    assert.deepEqual(restored.project, source);
  });

  test('removing a wall also removes dependent openings and is reversible', () => {
    const source = projectWithElements();
    const result = applyProjectOperation(source, {
      type: 'wall.remove', id: 'wall_1',
    }, options);
    assert.equal(result.project.walls.length, 0);
    assert.equal(result.project.openings.length, 0);
    assert.deepEqual(
      applyProjectOperation(result.project, result.inverse, options).project,
      source,
    );
  });

  test('updates and moves fixtures through validated drafts', () => {
    const source = projectWithElements();
    const result = applyProjectOperations(source, [
      { type: 'fixture.update', id: 'light_1', changes: { color: '#ffaa00', shadow: true } },
      { type: 'fixture.move', id: 'light_1', delta: [1, -0.5, -0.2] },
    ], options);
    const fixture = result.project.fixtures[0];
    assert.equal(fixture.color, '#ffaa00');
    assert.equal(fixture.shadow, true);
    assert.deepEqual(fixture.emitters[0].point, [2, 0.5]);
    assert.ok(Math.abs(fixture.emitters[0].height - 2.2) < 1e-9);
    assert.deepEqual(validateProject(result.project), []);
  });

  test('adds an opening and rejects duplicates or invalid results', () => {
    const source = projectWithElements();
    const opening = {
      ...source.openings[0],
      id: 'window_2',
      offset: 3,
    };
    const added = applyProjectOperation(source, { type: 'opening.add', value: opening }, options);
    assert.equal(added.project.openings.length, 2);
    assert.throws(
      () => applyProjectOperation(added.project, { type: 'opening.add', value: opening }, options),
      error => error instanceof OperationError && error.code === 'duplicate_id',
    );
    assert.throws(
      () => applyProjectOperation(source, {
        type: 'fixture.update', id: 'light_1', changes: { range: -1 },
      }, options),
      error => error instanceof OperationError && error.code === 'invalid_result',
    );
  });

  test('rejects missing targets, id changes and unsupported operations', () => {
    const source = projectWithElements();
    assert.throws(
      () => applyProjectOperation(source, { type: 'fixture.remove', id: 'missing' }, options),
      /does not exist/,
    );
    assert.throws(
      () => applyProjectOperation(source, {
        type: 'fixture.update', id: 'light_1', changes: { id: 'renamed' },
      }, options),
      error => error instanceof OperationError && error.code === 'immutable_id',
    );
    assert.throws(
      () => applyProjectOperation(source, { type: 'opening.move', id: 'window_1', delta: [1, 0] }, options),
      error => error instanceof OperationError && error.code === 'unknown_operation',
    );
    assert.throws(
      () => applyProjectOperation(source, {
        type: 'wall.remove', id: 'wall_1', unexpected: true,
      }, options),
      error => error instanceof OperationError && error.code === 'invalid_operation',
    );
  });

  test('public operations conform to the versioned operation schema', () => {
    assert.deepEqual(validateOperation({
      type: 'fixture.move', id: 'light_1', delta: [0.5, 0, -0.1],
    }), []);
    assert.ok(validateOperation({
      type: 'fixture.move', id: 'light_1', delta: ['far', 0],
    }).length > 0);
  });
});
