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
}

