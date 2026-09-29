export class HomeAssistantError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'HomeAssistantError';
    this.code = code;
    this.status = options.status || null;
  }
}

function wsUrl(baseUrl) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/api/websocket`;
  return url.toString();
}

async function websocketTransport(baseUrl, token, types) {
  if (!globalThis.WebSocket) {
    throw new HomeAssistantError('unavailable', 'WebSocket support is unavailable.');
  }
  const socket = new globalThis.WebSocket(wsUrl(baseUrl));
  const queue = [];
  const waiters = [];
  const push = value => waiters.shift()?.(value) || queue.push(value);
  socket.addEventListener('message', event => push(JSON.parse(event.data)));
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(
      new HomeAssistantError('unavailable', 'Cannot connect to Home Assistant.'),
    ), { once: true });
  });
  const next = () => queue.length
    ? Promise.resolve(queue.shift())
    : new Promise(resolve => waiters.push(resolve));
  try {
    const required = await next();
    if (required.type !== 'auth_required') {
      throw new HomeAssistantError('protocol', 'Unexpected Home Assistant handshake.');
    }
    socket.send(JSON.stringify({ type: 'auth', access_token: token }));
    const auth = await next();
    if (auth.type === 'auth_invalid') throw new HomeAssistantError('authentication', auth.message);
    if (auth.type !== 'auth_ok') throw new HomeAssistantError('protocol', 'Authentication failed.');
    const pending = new Map();
    types.forEach((type, index) => {
      const id = index + 1;
      pending.set(id, type);
      socket.send(JSON.stringify({ id, type }));
    });
    const results = {};
    while (pending.size) {
      const message = await next();
      if (!pending.has(message.id)) continue;
      const type = pending.get(message.id);
      pending.delete(message.id);
      if (!message.success) {
        throw new HomeAssistantError('permission', message.error?.message || `${type} failed.`);
      }
      results[type] = message.result;
    }
    return results;
  } finally {
    socket.close();
  }
}

export class HomeAssistantClient {
  constructor(config, options = {}) {
    this.config = config;
    this.transport = options.transport || websocketTransport;
  }

  configured() {
    return !!(this.config.url && this.config.token);
  }

  async catalog() {
    if (!this.configured()) {
      throw new HomeAssistantError('not_configured', 'Home Assistant is not configured.');
    }
    const result = await this.transport(this.config.url, this.config.token, [
      'get_states',
      'config/area_registry/list',
      'config/device_registry/list',
      'config/entity_registry/list',
    ]);
    const states = result.get_states || [];
    return {
      entities: (result['config/entity_registry/list'] || []).map(entity => {
        const state = states.find(item => item.entity_id === entity.entity_id);
        return {
          entityId: entity.entity_id,
          deviceId: entity.device_id || null,
          areaId: entity.area_id || null,
          name: entity.name || state?.attributes?.friendly_name || entity.entity_id,
          disabled: !!entity.disabled_by,
        };
      }),
      devices: (result['config/device_registry/list'] || []).map(device => ({
        id: device.id,
        areaId: device.area_id || null,
        name: device.name_by_user || device.name || device.id,
      })),
      areas: (result['config/area_registry/list'] || []).map(area => ({
        id: area.area_id,
        name: area.name,
      })),
    };
  }
}

