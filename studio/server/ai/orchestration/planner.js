import { OrchestrationError, validateTaskGraph } from './graph.js';

const TASK_GRAPH_TOOL = {
  name: 'submit_task_graph',
  description: 'Submit a bounded specialist task graph for the user request.',
  inputSchema: {
    type: 'object',
    required: ['version', 'tasks'],
    properties: {
      version: { const: 1 },
      tasks: { type: 'array' },
    },
  },
};

export async function planTaskGraph(input) {
  const response = await input.provider.complete({
    system: [
      'Decompose only multi-domain DomoView edits into bounded specialist tasks.',
      'Use submit_task_graph exactly once. Every task declares dependencies, reads and writes.',
      'Available agents: fixture, geometry, appearance, binding.',
      `Selection: ${JSON.stringify(input.selection || null)}`,
      `Project summary: ${JSON.stringify(input.projectSummary || {})}`,
    ].join('\n'),
    messages: [{ role: 'user', content: input.message }],
    tools: [TASK_GRAPH_TOOL],
    maxTokens: 1600,
    signal: input.signal,
  });
  const calls = response.toolCalls.filter(call => call.name === 'submit_task_graph');
  if (calls.length !== 1) {
    throw new OrchestrationError(
      'invalid_plan_response',
      'Orchestrator must submit exactly one task graph.',
    );
  }
  return {
    graph: validateTaskGraph(calls[0].input),
    usage: response.usage,
    provider: response.provider,
    model: response.model,
  };
}

