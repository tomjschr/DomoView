import { createHash } from 'node:crypto';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}

export function contextCacheKey(namespace, value) {
  const digest = createHash('sha256')
    .update(JSON.stringify(stable(value)))
    .digest('hex')
    .slice(0, 24);
  return `${namespace}:${digest}`;
}

export function cachedRequest(namespace, stableContext, request) {
  return {
    ...request,
    cache: {
      key: contextCacheKey(namespace, stableContext),
      stableSystem: true,
    },
  };
}

