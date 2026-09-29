async function apiJson(path, options) {
  const response = await fetch(path, options);
  const body = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : null;
  if (!response.ok) {
    const error = new Error(body?.message || `Local Studio request failed (HTTP ${response.status}).`);
    error.code = body?.error || 'request_failed';
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function readEventStream(response, onEvent = () => {}) {
  if (!response.ok) {
    throw new Error(`Local Studio request failed (HTTP ${response.status}).`);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Streaming response has no body.');
  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, boundary).replace(/\r/g, '');
      buffer = buffer.slice(boundary + 2);
      const event = block.split('\n')
        .find(line => line.startsWith('event:'))?.slice(6).trim() || 'message';
      const data = JSON.parse(block.split('\n')
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim())
        .join('\n'));
      onEvent(event, data);
      if (event === 'error') {
        const error = new Error(data.message || 'Fixture agent failed.');
        Object.assign(error, data);
        throw error;
      }
      if (event === 'proposal') result = data;
    }
    if (done) break;
  }
  if (!result) throw new Error('Fixture agent ended without a proposal.');
  return result;
}

export class LocalProjectClient {
  constructor(base = '') {
    this.base = base.replace(/\/+$/, '');
  }

  async available() {
    try {
      const capabilities = await apiJson(`${this.base}/api/v1/capabilities`);
      return capabilities?.projectStorage === true;
    } catch {
      return false;
    }
  }

  providers() {
    return apiJson(`${this.base}/api/v1/providers`);
  }

  capabilities() {
    return apiJson(`${this.base}/api/v1/capabilities`);
  }

  homeAssistantCatalog() {
    return apiJson(`${this.base}/api/v1/ha/catalog`);
  }

  visionSuggestions(id, imageIds, instruction) {
    return apiJson(
      `${this.base}/api/v1/projects/${encodeURIComponent(id)}/vision-suggestions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageIds,
          instruction,
          confirmTransmission: true,
        }),
      },
    );
  }

  list() {
    return apiJson(`${this.base}/api/v1/projects`).then(result => result.projects);
  }

  get(id) {
    return apiJson(`${this.base}/api/v1/projects/${encodeURIComponent(id)}`);
  }

  create(project, id) {
    return apiJson(`${this.base}/api/v1/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, project }),
    });
  }

  update(id, revision, project) {
    return apiJson(`${this.base}/api/v1/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ revision, project }),
    });
  }

  propose(id, revision, operations) {
    return apiJson(`${this.base}/api/v1/projects/${encodeURIComponent(id)}/proposals`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ revision, operations }),
    });
  }

  applyProposal(projectId, proposalId, indexes) {
    return apiJson(
      `${this.base}/api/v1/projects/${encodeURIComponent(projectId)}/proposals/${encodeURIComponent(proposalId)}/apply`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ indexes }),
      },
    );
  }

  rejectProposal(projectId, proposalId) {
    return apiJson(
      `${this.base}/api/v1/projects/${encodeURIComponent(projectId)}/proposals/${encodeURIComponent(proposalId)}/reject`,
      { method: 'POST' },
    );
  }

  undoProposal(projectId, proposalId) {
    return apiJson(
      `${this.base}/api/v1/projects/${encodeURIComponent(projectId)}/proposals/${encodeURIComponent(proposalId)}/undo`,
      { method: 'POST' },
    );
  }

  fixtureSession(id, fixtureId) {
    return apiJson(
      `${this.base}/api/v1/projects/${encodeURIComponent(id)}/agents/fixture-edit` +
      `?fixtureId=${encodeURIComponent(fixtureId)}`,
    ).then(result => result.session);
  }

  async fixtureEdit(id, revision, fixtureId, message, sessionId, onEvent) {
    const response = await fetch(
      `${this.base}/api/v1/projects/${encodeURIComponent(id)}/agents/fixture-edit`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ revision, fixtureId, message, sessionId }),
      },
    );
    return readEventStream(response, onEvent);
  }
}
