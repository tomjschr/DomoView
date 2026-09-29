import { Buffer } from 'node:buffer';

import { AssetStoreError } from '../projects/assets.js';
import { ProposalError } from '../projects/proposals.js';
import { ProjectStoreError } from '../projects/store.js';

const MAX_PROJECT_BYTES = 25 * 1024 * 1024;

async function readJson(request) {
  const type = String(request.headers['content-type'] || '').split(';')[0];
  if (type !== 'application/json') {
    throw new ProjectStoreError('invalid_content_type', 'Content-Type must be application/json.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_PROJECT_BYTES) {
      throw new ProjectStoreError('too_large', 'Project request exceeds 25 MB.');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ProjectStoreError('invalid_json', 'Request body is not valid JSON.');
  }
}

function errorStatus(code) {
  if (code === 'not_found') return 404;
  if (code === 'exists' || code === 'revision_conflict') return 409;
  if (code === 'corrupt_project') return 500;
  return 400;
}

export async function projectApi(request, url, store, proposals) {
  const proposalCollection = /^\/api\/v1\/projects\/([^/]+)\/proposals$/.exec(url.pathname);
  const proposalAction =
    /^\/api\/v1\/projects\/([^/]+)\/proposals\/([^/]+)\/(apply|reject)$/.exec(url.pathname);
  const proposalItem = /^\/api\/v1\/projects\/([^/]+)\/proposals\/([^/]+)$/.exec(url.pathname);
  const assetMatch = /^\/api\/v1\/projects\/([^/]+)\/assets\/([a-f0-9]{64}\.(?:jpg|png|webp))$/
    .exec(url.pathname);
  const collection = url.pathname === '/api/v1/projects';
  const match = /^\/api\/v1\/projects\/([^/]+)$/.exec(url.pathname);
  if (!collection && !match && !assetMatch &&
      !proposalCollection && !proposalAction && !proposalItem) return null;

  try {
    if (proposalCollection && request.method === 'POST') {
      const input = await readJson(request);
      return {
        status: 201,
        body: await proposals.create(
          decodeURIComponent(proposalCollection[1]),
          input.revision,
          input.operations,
        ),
      };
    }
    if (proposalCollection) {
      return { status: 405, headers: { allow: 'POST' }, body: null };
    }
    if (proposalItem && request.method === 'GET') {
      const record = await proposals.get(decodeURIComponent(proposalItem[2]));
      if (record.projectId !== decodeURIComponent(proposalItem[1])) {
        throw new ProposalError('proposal_not_found', 'Proposal does not exist.');
      }
      return { status: 200, body: await proposals.present(record) };
    }
    if (proposalItem) return { status: 405, headers: { allow: 'GET' }, body: null };
    if (proposalAction && request.method === 'POST') {
      const projectId = decodeURIComponent(proposalAction[1]);
      const proposalId = decodeURIComponent(proposalAction[2]);
      const record = await proposals.get(proposalId);
      if (record.projectId !== projectId) {
        throw new ProposalError('proposal_not_found', 'Proposal does not exist.');
      }
      if (proposalAction[3] === 'reject') {
        return { status: 200, body: await proposals.reject(proposalId) };
      }
      const input = await readJson(request);
      return { status: 200, body: await proposals.apply(proposalId, input.indexes) };
    }
    if (proposalAction) return { status: 405, headers: { allow: 'POST' }, body: null };
    if (assetMatch && request.method === 'GET') {
      const asset = await store.getAsset(
        decodeURIComponent(assetMatch[1]),
        `asset:${assetMatch[2]}`,
      );
      return { status: 200, binary: asset.data, type: asset.type };
    }
    if (assetMatch) return { status: 405, headers: { allow: 'GET' }, body: null };
    if (collection && request.method === 'GET') {
      return { status: 200, body: { projects: await store.list() } };
    }
    if (collection && request.method === 'POST') {
      const input = await readJson(request);
      return {
        status: 201,
        body: await store.create(input.project, input.id),
      };
    }
    if (match && request.method === 'GET') {
      return { status: 200, body: await store.getHydrated(decodeURIComponent(match[1])) };
    }
    if (match && request.method === 'PUT') {
      const input = await readJson(request);
      return {
        status: 200,
        body: await store.update(decodeURIComponent(match[1]), input.revision, input.project),
      };
    }
    return { status: 405, headers: { allow: collection ? 'GET, POST' : 'GET, PUT' }, body: null };
  } catch (error) {
    if (!(error instanceof ProjectStoreError) &&
        !(error instanceof AssetStoreError) &&
        !(error instanceof ProposalError)) throw error;
    return {
      status: ['asset_not_found', 'proposal_not_found'].includes(error.code)
        ? 404
        : errorStatus(error.code),
      body: { error: error.code, message: error.message },
    };
  }
}
