import { Buffer } from 'node:buffer';

import { FixtureAgentError, runFixtureAgent } from '../ai/fixture-agent.js';
import { ProviderError } from '../ai/provider.js';
import { createRoleProvider } from '../ai/providers/index.js';
import { ProposalError } from '../projects/proposals.js';
import { ProjectStoreError } from '../projects/store.js';

const MAX_REQUEST_BYTES = 64 * 1024;

async function readJson(request) {
  if (String(request.headers['content-type'] || '').split(';')[0] !== 'application/json') {
    throw new FixtureAgentError('invalid_content_type', 'Content-Type must be application/json.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) {
      throw new FixtureAgentError('too_large', 'Agent request exceeds 64 KB.');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new FixtureAgentError('invalid_json', 'Request body is not valid JSON.');
  }
}

function writeEvent(response, event, data) {
  response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function publicError(error) {
  if (error instanceof ProviderError) {
    return { code: error.code, message: error.message, retryable: error.retryable };
  }
  if (error instanceof FixtureAgentError ||
      error instanceof ProposalError ||
      error instanceof ProjectStoreError) {
    return { code: error.code, message: error.message, retryable: false };
  }
  return { code: 'internal_error', message: 'Fixture agent failed.', retryable: false };
}

export async function fixtureAgentApi(request, url, response, dependencies) {
  const match = /^\/api\/v1\/projects\/([^/]+)\/agents\/fixture-edit$/.exec(url.pathname);
  if (!match) return false;
  const projectId = decodeURIComponent(match[1]);
  if (request.method === 'GET') {
    const fixtureId = url.searchParams.get('fixtureId');
    if (!fixtureId) {
      response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'invalid_fixture', message: 'A fixture id is required.' }));
      return true;
    }
    const session = dependencies.sessions.latest(projectId, fixtureId);
    response.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(JSON.stringify({ session }));
    return true;
  }
  if (request.method !== 'POST') {
    response.writeHead(405, { allow: 'GET, POST' }).end();
    return true;
  }
  response.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-store',
    connection: 'keep-alive',
    'x-content-type-options': 'nosniff',
  });
  let callId;
  try {
    const input = await readJson(request);
    if (!Number.isInteger(input.revision) || input.revision < 1) {
      throw new FixtureAgentError('invalid_revision', 'A positive project revision is required.');
    }
    if (typeof input.fixtureId !== 'string' || !input.fixtureId) {
      throw new FixtureAgentError('invalid_fixture', 'A fixture id is required.');
    }
    if (typeof input.message !== 'string' || !input.message.trim() || input.message.length > 4000) {
      throw new FixtureAgentError(
        'invalid_message',
        'Message must contain between 1 and 4000 characters.',
      );
    }
    const current = await dependencies.projects.get(projectId);
    if (current.revision !== input.revision) {
      throw new FixtureAgentError(
        'revision_conflict',
        `Project is at revision ${current.revision}, not ${input.revision}.`,
      );
    }
    const provider = dependencies.providerFactory
      ? dependencies.providerFactory('executor')
      : createRoleProvider(dependencies.aiConfig, 'executor');
    const session = dependencies.sessions.getOrCreate(
      projectId,
      input.fixtureId,
      current.revision,
      input.sessionId,
    );
    const context = dependencies.sessions.context(session.id, current.revision);
    dependencies.sessions.addMessage(session.id, 'user', input.message.trim());
    callId = dependencies.sessions.beginCall(session.id);
    writeEvent(response, 'status', { stage: 'thinking' });
    const result = await runFixtureAgent({
      project: current.project,
      fixtureId: input.fixtureId,
      message: input.message.trim(),
      history: context.messages,
      summary: context.summary,
      provider,
      signal: globalThis.AbortSignal.timeout(90_000),
      onEvent(event) {
        writeEvent(response, event.type, event);
      },
    });
    dependencies.sessions.completeCall(callId, result);
    dependencies.sessions.addMessage(
      session.id,
      'assistant',
      result.assistantText || 'Prepared a fixture proposal.',
    );
    const proposal = await dependencies.proposals.create(
      projectId,
      current.revision,
      result.operations,
    );
    dependencies.sessions.linkProposal(session.id, callId, proposal);
    writeEvent(response, 'proposal', {
      sessionId: session.id,
      assistantText: result.assistantText,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
      costUsd: result.costUsd,
      proposal,
    });
  } catch (error) {
    if (callId) dependencies.sessions.failCall(callId, error);
    if (!(error instanceof FixtureAgentError) &&
        !(error instanceof ProviderError) &&
        !(error instanceof ProposalError) &&
        !(error instanceof ProjectStoreError)) {
      console.error('DomoView fixture agent failed:', error);
    }
    writeEvent(response, 'error', publicError(error));
  } finally {
    response.end();
  }
  return true;
}
