import { OrchestrationError } from '../orchestration/graph.js';
import { cachedRequest } from '../context-cache.js';

function contextSlice(project, agent, task) {
  if (agent === 'geometry') {
    const ids = new Set([...task.reads, ...task.writes]
      .map(resource => resource.split(':')[1])
      .filter(id => id && id !== '*'));
    return {
      level: project.level,
      plan: { scale: project.plan.scale },
      walls: project.walls.filter(item => !ids.size || ids.has(item.id)),
      openings: project.openings.filter(item =>
        !ids.size || ids.has(item.id) || ids.has(item.wall)),
    };
  }
  return {
    materials: project.materials,
    camera: project.camera,
  };
}

const ALLOWED = {
  geometry: new Set([
    'wall.add', 'wall.update', 'wall.remove', 'wall.move',
    'opening.add', 'opening.update', 'opening.remove',
  ]),
  appearance: new Set(['materials.update', 'camera.update']),
};

function tool(agent) {
  return {
    name: 'propose_operations',
    description: `Propose only ${agent} operations for this bounded task.`,
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['operations'],
      properties: {
        operations: { type: 'array', minItems: 1, items: { type: 'object' } },
      },
    },
  };
}

export function createSpecialistAgent(agent, provider) {
  if (!ALLOWED[agent]) throw new Error(`Unknown specialist "${agent}".`);
  return async ({ task, context }) => {
    context.budget?.beforeCall();
    const slice = contextSlice(context.project, agent, task);
    const response = await provider.complete(cachedRequest(`specialist:${agent}`, slice, {
      system: [
        `You are the DomoView ${agent} specialist.`,
        'Use propose_operations exactly once and do not modify another domain.',
        `Allowed operation types: ${[...ALLOWED[agent]].join(', ')}.`,
        `Project slice: ${JSON.stringify(slice)}`,
      ].join('\n'),
      messages: [{ role: 'user', content: task.instruction }],
      tools: [tool(agent)],
      maxTokens: 1200,
      signal: context.signal,
    }));
    context.budget?.record(response.usage, provider.config?.pricing);
    const call = response.toolCalls.find(item => item.name === 'propose_operations');
    const operations = call?.input?.operations;
    if (!Array.isArray(operations) || !operations.length) {
      throw new OrchestrationError('invalid_specialist_response', `${agent} returned no operations.`);
    }
    const forbidden = operations.find(operation => !ALLOWED[agent].has(operation.type));
    if (forbidden) {
      throw new OrchestrationError(
        'tool_not_allowed',
        `${agent} cannot call "${forbidden.type}".`,
        { agent, operation: forbidden.type },
      );
    }
    return {
      operations,
      usage: response.usage,
      provider: response.provider,
      model: response.model,
    };
  };
}
