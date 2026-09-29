export class ProviderError extends Error {
  constructor(provider, code, message, options = {}) {
    super(message);
    this.name = 'ProviderError';
    this.provider = provider;
    this.code = code;
    this.status = options.status || null;
    this.retryable = options.retryable ?? false;
  }
}

export function validateProviderRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new ProviderError('internal', 'invalid_request', 'Provider request must be an object.');
  }
  if (!Array.isArray(request.messages) || !request.messages.length) {
    throw new ProviderError('internal', 'invalid_request', 'At least one message is required.');
  }
  for (const message of request.messages) {
    if (!['user', 'assistant'].includes(message?.role) || typeof message.content !== 'string') {
      throw new ProviderError(
        'internal',
        'invalid_request',
        'Messages require a user or assistant role and string content.',
      );
    }
  }
  for (const tool of request.tools || []) {
    if (!tool?.name || typeof tool.name !== 'string' ||
        !tool.inputSchema || typeof tool.inputSchema !== 'object') {
      throw new ProviderError('internal', 'invalid_request', 'Tools require name and inputSchema.');
    }
  }
  return request;
}

export function parseToolInput(value, provider) {
  if (value && typeof value === 'object') return value;
  try {
    return JSON.parse(value || '{}');
  } catch {
    throw new ProviderError(provider, 'invalid_tool_input', 'Provider returned invalid tool JSON.');
  }
}

export function usage(input = {}) {
  return {
    inputTokens: Number(input.inputTokens) || 0,
    outputTokens: Number(input.outputTokens) || 0,
    cacheReadTokens: Number(input.cacheReadTokens) || 0,
    cacheWriteTokens: Number(input.cacheWriteTokens) || 0,
  };
}

export function estimateCost(tokenUsage, pricing) {
  if (!pricing || pricing.inputPerMillion == null || pricing.outputPerMillion == null) {
    return null;
  }
  const tokens = usage(tokenUsage);
  const total = (
    tokens.inputTokens * pricing.inputPerMillion +
    tokens.outputTokens * pricing.outputPerMillion +
    tokens.cacheReadTokens * (pricing.cacheReadPerMillion ?? pricing.inputPerMillion) +
    tokens.cacheWriteTokens * (pricing.cacheWritePerMillion ?? pricing.inputPerMillion)
  ) / 1_000_000;
  return Math.round(total * 1_000_000) / 1_000_000;
}

export async function providerResponse(response, provider) {
  if (response.ok) return response;
  let detail = '';
  try {
    const body = await response.json();
    detail = body?.error?.message || body?.message || '';
  } catch {
    detail = await response.text().catch(() => '');
  }
  const status = response.status;
  const code = status === 401 || status === 403 ? 'authentication'
    : status === 429 ? 'rate_limit'
    : status >= 500 ? 'provider_unavailable'
    : status === 408 ? 'timeout'
    : 'provider_request';
  throw new ProviderError(
    provider,
    code,
    detail || `${provider} request failed with HTTP ${status}.`,
    { status, retryable: status === 408 || status === 429 || status >= 500 },
  );
}

export async function providerFetch(fetchImpl, url, init, provider, options = {}) {
  const timeoutMs = options.timeoutMs || 60_000;
  const timeout = globalThis.AbortSignal.timeout(timeoutMs);
  const signal = options.signal
    ? globalThis.AbortSignal.any([options.signal, timeout])
    : timeout;
  let response;
  try {
    response = await fetchImpl(url, { ...init, signal });
  } catch (error) {
    if (signal.aborted || error?.name === 'AbortError') {
      throw new ProviderError(provider, 'timeout', `${provider} request was cancelled or timed out.`, {
        retryable: !options.signal?.aborted,
      });
    }
    throw new ProviderError(provider, 'network', `${provider} request could not reach the provider.`, {
      retryable: true,
    });
  }
  return providerResponse(response, provider);
}
