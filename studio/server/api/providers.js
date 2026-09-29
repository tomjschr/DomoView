export function providerApi(request, url, aiConfig) {
  if (url.pathname !== '/api/v1/providers') return null;
  if (request.method !== 'GET') {
    return { status: 405, headers: { allow: 'GET' }, body: null };
  }
  return { status: 200, body: aiConfig.publicStatus() };
}

