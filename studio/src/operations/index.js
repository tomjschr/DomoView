const COLLECTIONS = {
  wall: 'walls',
  opening: 'openings',
  fixture: 'fixtures',
};

const PUBLIC_ACTIONS = new Set(['add', 'update', 'remove', 'move']);

export class OperationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'OperationError';
    this.code = code;
  }
}

function assertKeys(operation, expected) {
  const actual = Object.keys(operation).sort();
  const allowed = [...expected].sort();
  if (actual.length !== allowed.length || actual.some((key, index) => key !== allowed[index])) {
    throw new OperationError(
      'invalid_operation',
      `Operation ${operation.type || ''} must contain only: ${allowed.join(', ')}.`,
    );
  }
}

function operationParts(operation) {
  if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
    throw new OperationError('invalid_operation', 'Operation must be an object.');
  }
  if (operation.type === 'project.restore') {
    assertKeys(operation, ['type', 'project']);
    return { domain: 'project', action: 'restore' };
  }
  const [domain, action, extra] = String(operation.type || '').split('.');
  if (extra || !COLLECTIONS[domain] || !PUBLIC_ACTIONS.has(action)) {
    throw new OperationError('unknown_operation', `Unknown operation "${operation.type || ''}".`);
  }
  if (action === 'move' && !['wall', 'fixture'].includes(domain)) {
    throw new OperationError('unknown_operation', `${domain}.move is not supported.`);
  }
  const keys = action === 'add' ? ['type', 'value']
    : action === 'update' ? ['type', 'id', 'changes']
    : action === 'remove' ? ['type', 'id']
    : ['type', 'id', 'delta'];
  assertKeys(operation, keys);
  return { domain, action, collection: COLLECTIONS[domain] };
}

function entryById(project, collection, id) {
  if (typeof id !== 'string' || !id) {
    throw new OperationError('invalid_target', 'Operation target id is required.');
  }
  const index = project[collection].findIndex(entry => entry.id === id);
  if (index < 0) throw new OperationError('target_not_found', `${collection} "${id}" does not exist.`);
  return { entry: project[collection][index], index };
}

function add(project, collection, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !value.id) {
    throw new OperationError('invalid_value', 'Added value must be an object with an id.');
  }
  if (project[collection].some(entry => entry.id === value.id)) {
    throw new OperationError('duplicate_id', `${collection} "${value.id}" already exists.`);
  }
  project[collection].push(structuredClone(value));
}

function update(project, collection, id, changes) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes) || !Object.keys(changes).length) {
    throw new OperationError('invalid_changes', 'Update changes must be a non-empty object.');
  }
  if ('id' in changes && changes.id !== id) {
    throw new OperationError('immutable_id', 'An operation cannot change an element id.');
  }
  const { entry } = entryById(project, collection, id);
  Object.assign(entry, structuredClone(changes), { id });
}

function remove(project, domain, collection, id) {
  const { index } = entryById(project, collection, id);
  project[collection].splice(index, 1);
  if (domain === 'wall') {
    project.openings = project.openings.filter(opening => opening.wall !== id);
  }
}

function delta(operation) {
  if (!Array.isArray(operation.delta) ||
      operation.delta.length < 2 || operation.delta.length > 3 ||
      operation.delta.some(value => !Number.isFinite(value))) {
    throw new OperationError('invalid_delta', 'Move delta must contain two or three finite numbers.');
  }
  return operation.delta;
}

function move(project, domain, collection, operation) {
  const { entry } = entryById(project, collection, operation.id);
  const [x, y, z = 0] = delta(operation);
  if (domain === 'wall') {
    entry.a = [entry.a[0] + x, entry.a[1] + y];
    entry.b = [entry.b[0] + x, entry.b[1] + y];
    return;
  }
  for (const emitter of entry.emitters || []) {
    emitter.point = [emitter.point[0] + x, emitter.point[1] + y];
    emitter.height += z;
  }
}

function describe(domain, action, operation) {
  const label = domain[0].toUpperCase() + domain.slice(1);
  if (action === 'add') return `Add ${domain} "${operation.value.id}"`;
  if (action === 'move') return `Move ${domain} "${operation.id}" by ${operation.delta.join(', ')}`;
  return `${label} "${operation.id}": ${action}`;
}

export function applyProjectOperation(source, operation, options = {}) {
  const before = structuredClone(source);
  const project = structuredClone(source);
  const { domain, action, collection } = operationParts(operation);

  if (action === 'restore') {
    if (!operation.project || typeof operation.project !== 'object') {
      throw new OperationError('invalid_restore', 'Restore operation needs a project snapshot.');
    }
    return {
      project: structuredClone(operation.project),
      inverse: { type: 'project.restore', project: before },
      summary: 'Restore project snapshot',
      affected: ['project'],
    };
  }

  if (action === 'add') add(project, collection, operation.value);
  else if (action === 'update') update(project, collection, operation.id, operation.changes);
  else if (action === 'remove') remove(project, domain, collection, operation.id);
  else if (action === 'move') move(project, domain, collection, operation);

  const errors = options.validate?.(project) || [];
  if (errors.length) {
    const first = errors[0];
    throw new OperationError('invalid_result', `Result ${first.path || '/'} ${first.message || 'is invalid'}.`);
  }

  return {
    project,
    inverse: { type: 'project.restore', project: before },
    summary: describe(domain, action, operation),
    affected: domain === 'wall' && action === 'remove'
      ? [`walls:${operation.id}`, 'openings']
      : [`${collection}:${operation.id || operation.value.id}`],
  };
}

export function applyProjectOperations(source, operations, options = {}) {
  if (!Array.isArray(operations) || !operations.length) {
    throw new OperationError('invalid_operations', 'At least one operation is required.');
  }
  const before = structuredClone(source);
  let project = before;
  const summaries = [];
  const affected = new Set();
  for (const operation of operations) {
    const result = applyProjectOperation(project, operation, options);
    project = result.project;
    summaries.push(result.summary);
    result.affected.forEach(value => affected.add(value));
  }
  return {
    project,
    inverse: { type: 'project.restore', project: before },
    summaries,
    affected: [...affected],
  };
}
