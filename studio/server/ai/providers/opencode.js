import { spawn } from 'node:child_process';

import {
  ProviderError, usage, validateProviderRequest,
} from '../provider.js';

function promptFor(request) {
  return [
    request.system ? `System:\n${request.system}` : '',
    ...request.messages.map(message => `${message.role}:\n${message.content}`),
  ].filter(Boolean).join('\n\n');
}

async function defaultRunner(options) {
  return new Promise((resolve, reject) => {
    const args = ['run', '--format', 'json'];
    if (options.model) args.push('--model', options.model);
    args.push(options.prompt);
    const child = spawn(options.command || 'opencode', args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const abort = () => child.kill();
    options.signal?.addEventListener('abort', abort, { once: true });
    child.stdout.on('data', chunk => {
      stdout += chunk;
      options.onChunk?.(String(chunk));
    });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => reject(new ProviderError(
      'opencode', 'unavailable', `Cannot start OpenCode: ${error.message}`,
    )));
    child.on('close', code => {
      options.signal?.removeEventListener('abort', abort);
      if (options.signal?.aborted) {
        reject(new ProviderError('opencode', 'timeout', 'OpenCode request was cancelled.'));
      } else if (code !== 0) {
        reject(new ProviderError('opencode', 'provider_request',
          stderr.trim() || `OpenCode exited with code ${code}.`));
      } else {
        resolve({ stdout });
      }
    });
  });
}

function parseOutput(stdout) {
  const events = String(stdout).split(/\r?\n/).filter(Boolean).flatMap(line => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
  const text = events
    .map(event => event.text || event.content || event.part?.text || '')
    .join('');
  return { text: text || String(stdout).trim(), events };
}

export class OpenCodeProvider {
  constructor(config, options = {}) {
    this.config = config;
    this.runner = options.runner || defaultRunner;
  }

  capabilities() {
    return {
      tools: false,
      vision: false,
      streaming: true,
      promptCaching: false,
      structuredOutput: false,
      transport: 'cli',
    };
  }

  async complete(request) {
    validateProviderRequest(request);
    if (request.tools?.length) {
      throw new ProviderError('opencode', 'unsupported_capability',
        'OpenCode CLI bridge does not support DomoView tool calls.');
    }
    const result = await this.runner({
      command: this.config.command,
      model: request.model || this.config.model,
      prompt: promptFor(request),
      signal: request.signal,
    });
    const parsed = parseOutput(result.stdout);
    return {
      provider: 'opencode',
      id: null,
      model: request.model || this.config.model || null,
      text: parsed.text,
      toolCalls: [],
      stopReason: 'completed',
      usage: usage(result.usage),
    };
  }

  async *stream(request) {
    const response = await this.complete(request);
    if (response.text) yield { type: 'text_delta', text: response.text };
    yield { type: 'complete', response };
  }
}
