import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { applyProjectOperations, OperationError } from '../../src/operations/index.js';
import { validateOperation, validateProject } from './validate.js';

const ID_PATTERN = /^[a-f0-9-]{36}$/;

export class ProposalError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ProposalError';
    this.code = code;
  }
}

export class ProposalStore {
  constructor(workspace, projects) {
    this.root = path.join(path.resolve(workspace), 'proposals');
    this.projects = projects;
  }

  async init() {
    await mkdir(this.root, { recursive: true });
    return this;
  }

  file(id) {
    if (!ID_PATTERN.test(String(id || ''))) {
      throw new ProposalError('invalid_proposal_id', 'Invalid proposal id.');
    }
    return path.join(this.root, `${id}.json`);
  }

  async create(projectId, revision, operations) {
    if (!Number.isInteger(revision) || revision < 1) {
      throw new ProposalError('invalid_revision', 'A positive project revision is required.');
    }
    if (!Array.isArray(operations) || !operations.length) {
      throw new ProposalError('invalid_operations', 'At least one operation is required.');
    }
    for (const operation of operations) {
      const errors = validateOperation(operation);
      if (errors.length) {
        throw new ProposalError(
          'invalid_operation',
          `Operation ${errors[0].path} ${errors[0].message}.`,
        );
      }
    }

    const current = await this.projects.get(projectId);
    if (current.revision !== revision) {
      throw new ProposalError(
        'revision_conflict',
        `Project is at revision ${current.revision}, not ${revision}.`,
      );
    }

    let result;
    try {
      result = applyProjectOperations(current.project, operations, { validate: validateProject });
    } catch (error) {
      if (error instanceof OperationError) {
        throw new ProposalError(error.code, error.message);
      }
      throw error;
    }

    const record = {
      id: randomUUID(),
      projectId: current.id,
      baseRevision: current.revision,
      status: 'pending',
      createdAt: new Date().toISOString(),
      operations,
      summaries: result.summaries,
      affected: result.affected,
      draft: result.project,
    };
    await this.write(record);
    return this.present(record);
  }

  async get(id) {
    try {
      const record = JSON.parse(await readFile(this.file(id), 'utf8'));
      if (!record?.id || !record.projectId || !Array.isArray(record.operations)) {
        throw new Error('invalid proposal');
      }
      return record;
    } catch (error) {
      if (error instanceof ProposalError) throw error;
      if (error.code === 'ENOENT') throw new ProposalError('proposal_not_found', 'Proposal does not exist.');
      throw new ProposalError('corrupt_proposal', 'Stored proposal is invalid.');
    }
  }

  async apply(id, indexes) {
    const record = await this.get(id);
    if (record.status !== 'pending') {
      throw new ProposalError('proposal_closed', `Proposal is already ${record.status}.`);
    }
    const current = await this.projects.get(record.projectId);
    if (current.revision !== record.baseRevision) {
      throw new ProposalError(
        'revision_conflict',
        `Project is at revision ${current.revision}; proposal targets ${record.baseRevision}.`,
      );
    }
    const selected = indexes == null
      ? record.operations.map((_, index) => index)
      : [...new Set(indexes)];
    if (!selected.length || selected.some(index =>
      !Number.isInteger(index) || index < 0 || index >= record.operations.length)) {
      throw new ProposalError('invalid_selection', 'Selected operation indexes are invalid.');
    }
    const operations = selected.map(index => record.operations[index]);
    const result = applyProjectOperations(current.project, operations, { validate: validateProject });
    const updated = await this.projects.update(record.projectId, record.baseRevision, result.project);
    Object.assign(record, {
      status: 'applied',
      appliedAt: new Date().toISOString(),
      appliedRevision: updated.revision,
      selected,
    });
    await this.write(record);
    return {
      proposal: await this.present(record),
      project: await this.projects.getHydrated(record.projectId),
    };
  }

  async reject(id) {
    const record = await this.get(id);
    if (record.status !== 'pending') {
      throw new ProposalError('proposal_closed', `Proposal is already ${record.status}.`);
    }
    record.status = 'rejected';
    record.rejectedAt = new Date().toISOString();
    await this.write(record);
    return this.present(record);
  }

  async present(record) {
    return {
      ...record,
      draft: await this.projects.assets.hydrateProject(record.draft),
    };
  }

  async write(record) {
    const target = this.file(record.id);
    const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporary, target);
  }
}

