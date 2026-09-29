import { HomeAssistantError } from '../ha/client.js';

export async function homeAssistantApi(request, url, client) {
  if (url.pathname !== '/api/v1/ha/catalog') return null;
  if (request.method !== 'GET') return { status: 405, headers: { allow: 'GET' }, body: null };
  try {
    return { status: 200, body: await client.catalog() };
  } catch (error) {
    if (!(error instanceof HomeAssistantError)) throw error;
    return {
      status: error.code === 'authentication' || error.code === 'permission' ? 403 : 503,
      body: { error: error.code, message: error.message },
    };
  }
}

