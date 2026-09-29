import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PROVIDERS = ['anthropic', 'openai', 'opencode'];
const ROLES = ['orchestrator', 'executor', 'vision'];

function text(value) {
  const result = String(value || '').trim();
  return result || null;
}

function price(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function providerConfig(id, file = {}, env = process.env) {
  const prefix = id.toUpperCase();
  const standardKeyName = id === 'anthropic'
    ? 'ANTHROPIC_API_KEY'
    : id === 'openai'
      ? 'OPENAI_API_KEY'
      : null;
  const environmentApiKey = text(env[`DOMOVIEW_${prefix}_API_KEY`]) ||
    text(standardKeyName ? env[standardKeyName] : null);
  const environmentBaseUrl = text(env[`DOMOVIEW_${prefix}_BASE_URL`]);
  const environmentModel = text(env[`DOMOVIEW_${prefix}_MODEL`]);
  const apiKey = environmentApiKey ||
    text(file.apiKey);
  const baseUrl = environmentBaseUrl ||
    text(file.baseUrl) ||
    (id === 'anthropic' ? 'https://api.anthropic.com'
      : id === 'openai' ? 'https://api.openai.com'
      : null);
  const model = environmentModel || text(file.model);
  return {
    id,
    apiKey,
    baseUrl,
    model,
    pricing: {
      inputPerMillion: price(file.pricing?.inputPerMillion),
      outputPerMillion: price(file.pricing?.outputPerMillion),
      cacheReadPerMillion: price(file.pricing?.cacheReadPerMillion),
      cacheWritePerMillion: price(file.pricing?.cacheWritePerMillion),
    },
    configured: id === 'opencode' ? !!baseUrl : !!apiKey,
    source: environmentApiKey || environmentBaseUrl || environmentModel ? 'environment' : 'file',
  };
}

async function readConfigFile(file) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('AI config root must be an object.');
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw new Error(`Cannot read AI config ${file}: ${error.message}`);
  }
}

export async function loadAIConfig(options = {}) {
  const env = options.env || process.env;
  const file = path.resolve(
    options.file ||
    env.DOMOVIEW_AI_CONFIG ||
    path.join(options.workspace || process.cwd(), 'config', 'ai.json'),
  );
  const raw = await readConfigFile(file);
  const providers = Object.fromEntries(PROVIDERS.map(id =>
    [id, providerConfig(id, raw.providers?.[id], env)]));
  const roles = {};
  for (const role of ROLES) {
    const provider = text(env[`DOMOVIEW_${role.toUpperCase()}_PROVIDER`]) ||
      text(raw.roles?.[role]?.provider) ||
      (role === 'vision' ? 'openai' : 'anthropic');
    if (!PROVIDERS.includes(provider)) {
      throw new Error(`Unknown provider "${provider}" configured for role "${role}".`);
    }
    roles[role] = {
      provider,
      model: text(env[`DOMOVIEW_${role.toUpperCase()}_MODEL`]) ||
        text(raw.roles?.[role]?.model) ||
        providers[provider].model,
    };
  }

  return {
    file,
    providers,
    roles,
    publicStatus() {
      return {
        providers: PROVIDERS.map(id => ({
          id,
          configured: providers[id].configured,
          model: providers[id].model,
        })),
        roles: structuredClone(roles),
      };
    },
  };
}

const SECRET_KEY = /(api[-_]?key|authorization|password|secret|token)/i;

export function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key,
    SECRET_KEY.test(key) ? '[redacted]' : redactSecrets(entry),
  ]));
}
