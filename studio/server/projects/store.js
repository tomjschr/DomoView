import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { AssetStore } from './assets.js';

const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,79}$/;

export class ProjectStoreError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ProjectStoreError';
    this.code = code;
  }
}

export function projectId(value) {
  const id = String(value || '').toLowerCase()
    .replace(/[äàáâã]/g, 'a').replace(/[öòóô]/g, 'o').replace(/[üùúû]/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 80);
  if (!ID_PATTERN.test(id)) throw new ProjectStoreError('invalid_id', 'Project id is empty or invalid.');
  return id;
}

function projectFile(root, id) {
  if (!ID_PATTERN.test(id)) throw new ProjectStoreError('invalid_id', 'Invalid project id.');
  return path.join(root, id, 'project.domoview.json');
}

function requireProjectId(value) {
  const id = String(value || '');
  if (!ID_PATTERN.test(id)) throw new ProjectStoreError('invalid_id', 'Invalid project id.');
  return id;
}

function parseRecord(text, id) {
  try {
    const record = JSON.parse(text);
    if (!Number.isInteger(record.revision) || record.revision < 1 ||
        !record.project || typeof record.project !== 'object' || Array.isArray(record.project)) {
      throw new Error('invalid record');
    }
    return { id, revision: record.revision, project: record.project };
  } catch {
    throw new ProjectStoreError('corrupt_project', `Project "${id}" is not a valid stored project.`);
  }
}

export class ProjectStore {
  constructor(workspace) {
    this.root = path.join(path.resolve(workspace), 'projects');
    this.assets = new AssetStore(workspace);
  }

  async init() {
    await Promise.all([
      mkdir(this.root, { recursive: true }),
      this.assets.init(),
    ]);
    return this;
  }

  async list() {
    await this.init();
    const entries = await readdir(this.root, { withFileTypes: true });
    const projects = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !ID_PATTERN.test(entry.name)) continue;
      try {
        const record = await this.get(entry.name);
        projects.push({
          id: record.id,
          revision: record.revision,
          name: String(record.project.meta?.name || record.project.meta?.id || record.id),
        });
      } catch (error) {
        if (error.code !== 'not_found') throw error;
      }
    }
    return projects.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  }

  async get(id) {
    const safeId = requireProjectId(id);
    try {
      return parseRecord(await readFile(projectFile(this.root, safeId), 'utf8'), safeId);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new ProjectStoreError('not_found', `Project "${safeId}" does not exist.`);
      }

      if (error instanceof ProjectStoreError) throw error;
      throw error;
    }
  }

  async getHydrated(id) {
    const record = await this.get(id);
    return {
      ...record,
      project: await this.assets.hydrateProject(record.project),
    };
  }

  async create(project, requestedId) {
    if (!project || typeof project !== 'object' || Array.isArray(project)) {
      throw new ProjectStoreError('invalid_project', 'Project must be a JSON object.');
    }
    const id = projectId(requestedId || project.meta?.id || project.meta?.name || 'project');
    const folder = path.join(this.root, id);
    await mkdir(folder, { recursive: false }).catch(error => {
      if (error.code === 'EEXIST') {
        throw new ProjectStoreError('exists', `Project "${id}" already exists.`);
      }
      throw error;
    });
    const record = { revision: 1, project: await this.assets.externalizeProject(project) };
    await this.write(id, record);
    return { id, ...record };
  }

  async update(id, revision, project) {
    if (!Number.isInteger(revision) || revision < 1) {
      throw new ProjectStoreError('invalid_revision', 'A positive integer revision is required.');
    }
    if (!project || typeof project !== 'object' || Array.isArray(project)) {
      throw new ProjectStoreError('invalid_project', 'Project must be a JSON object.');
    }
    const current = await this.get(id);
    if (current.revision !== revision) {
      throw new ProjectStoreError(
        'revision_conflict',
        `Project is at revision ${current.revision}, not ${revision}.`,
      );
    }
    const record = {
      revision: revision + 1,
      project: await this.assets.externalizeProject(project),
    };
    await this.write(current.id, record);
    return { id: current.id, ...record };
  }

  async write(id, record) {
    const target = projectFile(this.root, id);
    const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporary, target);
  }

  async getAsset(id, reference) {
    const record = await this.get(id);
    const referenced = record.project.plan?.image === reference ||
      (record.project.photos || []).some(photo => photo.dataUrl === reference);
    if (!referenced) {
      throw new ProjectStoreError('not_found', 'Asset is not referenced by this project.');
    }
    return this.assets.get(reference);
  }
}
