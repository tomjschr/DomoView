import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  PROJECT_VERSION, Project, emptyProject, migrateProjectData,
} from '../studio/src/project.js';
import { validateProject } from '../studio/server/projects/validate.js';

describe('Studio project schema', () => {
  test('accepts a new empty project and the shipped demo project', async () => {
    assert.deepEqual(validateProject(emptyProject()), []);
    const demo = JSON.parse(await readFile(
      new URL('../examples/demo-apartment/project.domoview.json', import.meta.url),
      'utf8',
    ));
    assert.deepEqual(validateProject(demo), []);
  });

  test('rejects malformed project geometry and unknown fields', () => {
    const project = emptyProject();
    project.extra = true;
    project.walls.push({
      id: 'wall_1', a: [0], b: [1, 1], thickness: -1,
      height: 2.5, exterior: false, flip: false,
    });
    const errors = validateProject(project);
    assert.ok(errors.some(error => error.path === '/'));
    assert.ok(errors.some(error => error.path.includes('/walls/0/a')));
    assert.ok(errors.some(error => error.path.includes('/walls/0/thickness')));
  });

  test('migrates a legacy document missing its version through an explicit path', () => {
    const legacy = emptyProject();
    delete legacy.version;
    delete legacy.camera.clipAbove;
    const migrated = migrateProjectData(legacy);
    assert.equal(migrated.version, PROJECT_VERSION);
    assert.equal(migrated.camera.clipAbove, 0);
    assert.deepEqual(validateProject(migrated), []);
    assert.equal(Project.fromJSON(JSON.stringify(legacy)).data.version, PROJECT_VERSION);
  });

  test('rejects future project versions', () => {
    assert.throws(
      () => migrateProjectData({ ...emptyProject(), version: PROJECT_VERSION + 1 }),
      /cannot be opened/,
    );
  });
});

