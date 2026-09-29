import {
  parseToolInput, providerResponse, usage, validateProviderRequest,
} from '../provider.js';
import { parseSse } from '../sse.js';

function bodyFor(request, config, stream) {
  validateProviderRequest(request);
  return {
    model: request.model || config.model,
    max_tokens: request.maxTokens || 2048,
    system: request.system || undefined,
    messages: request.messages,
    tools: request.tools?.map(tool => ({
      name: tool.name,
      description: tool.description || '',
      input_schema: tool.inputSchema,
    })),
    temperature: request.temperature,
    stream,
  };
}

function normalized(message) {
  const text = (message.content || [])
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');
  const toolCalls = (message.content || [])
    .filter(block => block.type === 'tool_use')
    .map(block => ({
      id: block.id,
      name: block.name,
      input: parseToolInput(block.input, 'anthropic'),
    }));
  return {
    provider: 'anthropic',
    id: message.id || null,
    model: message.model || null,
    text,
    toolCalls,
    stopReason: message.stop_reason || null,
    usage: usage({
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
      cacheReadTokens: message.usage?.cache_read_input_tokens,
      cacheWriteTokens: message.usage?.cache_creation_input_tokens,
    }),
  };
}

export class AnthropicProvider {
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
      structuredOutput: false,
    };
  }

  async complete(request) {
    const response = await this.request(bodyFor(request, this.config, false));
    return normalized(await response.json());
  }

  async *stream(request) {
    const response = await this.request(bodyFor(request, this.config, true));
    const message = { content: [], usage: {} };
    const tools = new Map();
    for await (const event of parseSse(response.body)) {
      if (event.data === '[DONE]') continue;
      const data = JSON.parse(event.data);
      if (event.event === 'message_start') {
        Object.assign(message, data.message);
      } else if (event.event === 'content_block_start' && data.content_block?.type === 'tool_use') {
        const tool = { ...data.content_block, json: '' };
        tools.set(data.index, tool);
        message.content[data.index] = tool;
        yield { type: 'tool_start', id: tool.id, name: tool.name };
      } else if (event.event === 'content_block_delta' && data.delta?.type === 'text_delta') {
        message.content[data.index] ||= { type: 'text', text: '' };
        message.content[data.index].text += data.delta.text;
        yield { type: 'text_delta', text: data.delta.text };
      } else if (event.event === 'content_block_delta' && data.delta?.type === 'input_json_delta') {
        tools.get(data.index).json += data.delta.partial_json;
      } else if (event.event === 'content_block_stop' && tools.has(data.index)) {
        const tool = tools.get(data.index);
        tool.input = parseToolInput(tool.json, 'anthropic');
        delete tool.json;
        yield { type: 'tool_call', id: tool.id, name: tool.name, input: tool.input };
      } else if (event.event === 'message_delta') {
        message.stop_reason = data.delta?.stop_reason || message.stop_reason;
        message.usage = { ...message.usage, ...data.usage };
      }
    }
    yield { type: 'complete', response: normalized(message) };
  }

  async request(body) {
    const response = await this.fetch(`${this.config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': this.config.apiKey,
      },
      body: JSON.stringify(body),
    });
    return providerResponse(response, 'anthropic');
  }
}

