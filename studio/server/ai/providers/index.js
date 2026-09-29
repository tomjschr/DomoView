import { ProviderError } from '../provider.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenAiProvider } from './openai.js';

export function createProvider(config, options = {}) {
  if (!config?.configured) {
    throw new ProviderError(
      config?.id || 'unknown',
      'not_configured',
      `Provider "${config?.id || 'unknown'}" is not configured.`,
    );
  }
  if (config.id === 'anthropic') return new AnthropicProvider(config, options);
  if (config.id === 'openai') return new OpenAiProvider(config, options);
  throw new ProviderError(
    config.id,
    'unsupported_provider',
    `Provider "${config.id}" does not have an adapter yet.`,
  );
}

export function createRoleProvider(aiConfig, role, options = {}) {
  const assignment = aiConfig.roles?.[role];
  if (!assignment) {
    throw new ProviderError('internal', 'unknown_role', `Unknown AI role "${role}".`);
  }
  const config = aiConfig.providers?.[assignment.provider];
  return createProvider({ ...config, model: assignment.model || config?.model }, options);
}

