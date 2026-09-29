import {
  parseToolInput, providerFetch, ProviderError, usage, validateProviderRequest,
} from '../provider.js';
import { parseSse } from '../sse.js';

function bodyFor(request, config, stream) {
  validateProviderRequest(request);
  return {
    model: request.model || config.model,
    instructions: request.system || undefined,
    input: request.messages,
    tools: request.tools?.map(tool => ({
      type: 'function',
      name: tool.name,
      description: tool.description || '',
      parameters: tool.inputSchema,
    })),
    max_output_tokens: request.maxTokens,
    temperature: request.temperature,
    prompt_cache_key: request.cache?.key,
    stream,
  };
}

function normalized(response) {
  const output = response.output || [];
  const text = output
    .filter(item => item.type === 'message')
    .flatMap(item => item.content || [])
    .filter(content => content.type === 'output_text')
    .map(content => content.text)
    .join('');
  const toolCalls = output
    .filter(item => item.type === 'function_call')
    .map(item => ({
      id: item.call_id || item.id,
      name: item.name,
      input: parseToolInput(item.arguments, 'openai'),
    }));
  return {
    provider: 'openai',
    id: response.id || null,
    model: response.model || null,
    text,
    toolCalls,
    stopReason: response.incomplete_details?.reason || response.status || null,
    usage: usage({
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
      cacheReadTokens: response.usage?.input_tokens_details?.cached_tokens,
    }),
  };
}

export class OpenAiProvider {
  constructor(config, options = {}) {
    this.config = config;
    this.fetch = options.fetch || globalThis.fetch;
  }

  capabilities() {
    return {
      tools: true,
      vision: true,
      streaming: true,
      promptCaching: true,
      structuredOutput: true,
    };
  }

  async complete(request) {
    const response = await this.request(bodyFor(request, this.config, false), request.signal);
    return normalized(await response.json());
  }

  async *stream(request) {
    const response = await this.request(bodyFor(request, this.config, true), request.signal);
    const draft = { output: [] };
    for await (const event of parseSse(response.body)) {
      if (event.data === '[DONE]') continue;
      const data = JSON.parse(event.data);
      if (event.event === 'response.created') {
        Object.assign(draft, data.response);
      } else if (event.event === 'response.output_item.added') {
        draft.output[data.output_index] = data.item;
        if (data.item?.type === 'function_call') {
          yield {
            type: 'tool_start',
            id: data.item.call_id || data.item.id,
            name: data.item.name,
          };
        }
      } else if (event.event === 'response.output_text.delta') {
        const item = draft.output[data.output_index] ||= { type: 'message', content: [] };
        const content = item.content[data.content_index] ||= { type: 'output_text', text: '' };
        content.text += data.delta;
        yield { type: 'text_delta', text: data.delta };
      } else if (event.event === 'response.function_call_arguments.delta') {
        const item = draft.output[data.output_index];
        item.arguments = (item.arguments || '') + data.delta;
      } else if (event.event === 'response.output_item.done') {
        draft.output[data.output_index] = data.item;
        if (data.item?.type === 'function_call') {
          yield {
            type: 'tool_call',
            id: data.item.call_id || data.item.id,
            name: data.item.name,
            input: parseToolInput(data.item.arguments, 'openai'),
          };
        }
      } else if (event.event === 'response.completed') {
        Object.assign(draft, data.response);
      } else if (event.event === 'response.failed') {
        throw new ProviderError('openai', 'provider_request',
          data.response?.error?.message || 'OpenAI response failed.');
      }
    }
    yield { type: 'complete', response: normalized(draft) };
  }

  request(body, signal) {
    return providerFetch(this.fetch, `${this.config.baseUrl}/v1/responses`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    }, 'openai', { signal, timeoutMs: this.config.timeoutMs });
  }
}
