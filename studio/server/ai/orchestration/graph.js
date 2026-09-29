import { readFile } from 'node:fs/promises';
import path from 'node:path';

import Ajv from 'ajv';

const schema = JSON.parse(await readFile(
  path.resolve(import.meta.dirname, '../../../../schemas/ai-task-graph-1.schema.json'),
  'utf8',
));
const validateSchema = new Ajv({ allErrors: true, strict: false }).compile(schema);

export class OrchestrationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'OrchestrationError';
    this.code = code;
    this.details = details;
  }
}

function overlaps(left, right) {
  const [leftDomain, leftId] = left.split(':');
  const [rightDomain, rightId] = right.split(':');
  return leftDomain === rightDomain &&
    (!leftId || !rightId || leftId === '*' || rightId === '*' || leftId === rightId);
}

function ancestors(tasks, id, result = new Set()) {
  const task = tasks.get(id);
  for (const dependency of task.dependsOn) {
    if (!result.has(dependency)) {
      result.add(dependency);
      ancestors(tasks, dependency, result);
    }
  }
  return result;
}

export function validateTaskGraph(graph) {
  if (!validateSchema(graph)) {
    const issue = validateSchema.errors?.[0];
    throw new OrchestrationError(
      'invalid_graph',
      `Task graph ${issue?.instancePath || '/'} ${issue?.message || 'is invalid'}.`,
    );
  }
  const tasks = new Map();
  for (const task of graph.tasks) {
    if (tasks.has(task.id)) {
      throw new OrchestrationError('duplicate_task', `Task "${task.id}" is duplicated.`);
    }
    tasks.set(task.id, task);
  }
  for (const task of tasks.values()) {
    for (const dependency of task.dependsOn) {
      if (!tasks.has(dependency)) {
        throw new OrchestrationError(
          'unknown_dependency',
          `Task "${task.id}" depends on unknown task "${dependency}".`,
        );
      }
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) throw new OrchestrationError('cyclic_graph', 'Task graph contains a cycle.');
    if (visited.has(id)) return;
    visiting.add(id);
    tasks.get(id).dependsOn.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  }
  tasks.forEach((_task, id) => visit(id));

  const entries = [...tasks.values()];
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      const a = entries[left];
      const b = entries[right];
      const ordered = ancestors(tasks, a.id).has(b.id) || ancestors(tasks, b.id).has(a.id);
      if (!ordered && a.writes.some(resource =>
        b.writes.some(other => overlaps(resource, other)))) {
        throw new OrchestrationError(
          'write_conflict',
          `Tasks "${a.id}" and "${b.id}" have overlapping writes.`,
          { tasks: [a.id, b.id] },
        );
      }
    }
  }
  return graph;
}

export async function executeTaskGraph(graph, agents, context = {}) {
  validateTaskGraph(graph);
  for (const task of graph.tasks) {
    if (typeof agents[task.agent] !== 'function') {
      throw new OrchestrationError(
        'unknown_agent',
        `Agent "${task.agent}" is not available.`,
        { task: task.id },
      );
    }
  }
  const pending = new Map(graph.tasks.map(task => [task.id, task]));
  const completed = new Map();
  const waves = [];
  while (pending.size) {
    const ready = [...pending.values()].filter(task =>
      task.dependsOn.every(id => completed.has(id)));
    if (!ready.length) throw new OrchestrationError('cyclic_graph', 'Task graph cannot progress.');
    waves.push(ready.map(task => task.id));
    const results = await Promise.all(ready.map(async task => {
      try {
        const result = await agents[task.agent]({
          task,
          context,
          dependencies: Object.fromEntries(task.dependsOn.map(id => [id, completed.get(id)])),
        });
        return [task.id, result];
      } catch (error) {
        throw new OrchestrationError(
          'task_failed',
          `Task "${task.id}" failed: ${error.message}`,
          { task: task.id, cause: error.code || error.name },
        );
      }
    }));
    for (const [id, result] of results) {
      completed.set(id, result);
      pending.delete(id);
    }
  }
  return {
    results: Object.fromEntries(completed),
    operations: [...completed.values()].flatMap(result => result?.operations || []),
    usage: [...completed.values()].reduce((total, result) => ({
      inputTokens: total.inputTokens + (result?.usage?.inputTokens || 0),
      outputTokens: total.outputTokens + (result?.usage?.outputTokens || 0),
    }), { inputTokens: 0, outputTokens: 0 }),
    waves,
  };
}

