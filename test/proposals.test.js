import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { emptyProject } from '../studio/src/project.js';
import { ProjectStore } from '../studio/server/projects/store.js';
import { ProposalError, ProposalStore } from '../studio/server/projects/proposals.js';

describe('project proposals', () => {
  let root;
  let projects;
  let proposals;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'domoview-proposals-'));
    projects = await new ProjectStore(root).init();
    proposals = await new ProposalStore(root, projects).init();
    const project = emptyProject();
    project.meta.id = 'home';
    project.fixtures.push({
      id: 'light_1', name: 'Light', kind: 'light', room: null,
      emitters: [{ point: [1, 1], height: 2.4, type: 'point', intensity: 1 }],
      lumens: 600, color: '#ffdda4', range: 6, shadow: false,
      bulb: 'glow', variant: null,
    });
    await projects.create(project);
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  test('creates a draft without changing the active project', async () => {
    const proposal = await proposals.create('home', 1, [{
      type: 'fixture.update', id: 'light_1', changes: { color: '#112233' },
    }]);
    assert.equal(proposal.status, 'pending');
    assert.equal(proposal.draft.fixtures[0].color, '#112233');
    assert.equal((await projects.get('home')).project.fixtures[0].color, '#ffdda4');
  });

  test('applies all or selected operations as one revision', async () => {
    const proposal = await proposals.create('home', 1, [
      { type: 'fixture.update', id: 'light_1', changes: { color: '#112233' } },
      { type: 'fixture.update', id: 'light_1', changes: { shadow: true } },
    ]);
    const applied = await proposals.apply(proposal.id, [1]);
    assert.equal(applied.proposal.status, 'applied');
    assert.equal(applied.project.revision, 2);
    assert.equal(applied.project.project.fixtures[0].color, '#ffdda4');
    assert.equal(applied.project.project.fixtures[0].shadow, true);
  });

  test('rejects proposals without changing the project', async () => {
    const proposal = await proposals.create('home', 1, [{
      type: 'fixture.remove', id: 'light_1',
    }]);
    assert.equal((await proposals.reject(proposal.id)).status, 'rejected');
    assert.equal((await projects.get('home')).project.fixtures.length, 1);
    await assert.rejects(
      proposals.apply(proposal.id),
      error => error instanceof ProposalError && error.code === 'proposal_closed',
    );
  });

  test('blocks stale proposals', async () => {
    const proposal = await proposals.create('home', 1, [{
      type: 'fixture.update', id: 'light_1', changes: { shadow: true },
    }]);
    const current = await projects.getHydrated('home');
    current.project.meta.name = 'Changed elsewhere';
    await projects.update('home', 1, current.project);
    await assert.rejects(
      proposals.apply(proposal.id),
      error => error instanceof ProposalError && error.code === 'revision_conflict',
    );
  });
});

