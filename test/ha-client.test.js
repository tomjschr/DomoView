import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  HomeAssistantClient, HomeAssistantError,
} from '../studio/server/ha/client.js';

describe('Home Assistant client', () => {
  test('returns a sanitized entity, device and area catalog', async () => {
    let observedToken;
    const client = new HomeAssistantClient({
      url: 'http://homeassistant.local:8123',
      token: 'secret-token',
    }, {
      transport: async (_url, token) => {
        observedToken = token;
        return {
          get_states: [{
            entity_id: 'light.kitchen',
            state: 'on',
            attributes: { friendly_name: 'Kitchen light', brightness: 200 },
          }],
          'config/entity_registry/list': [{
            entity_id: 'light.kitchen', device_id: 'device-1', area_id: null,
          }],
          'config/device_registry/list': [{
            id: 'device-1', area_id: 'kitchen', name: 'Kitchen device',
          }],
          'config/area_registry/list': [{ area_id: 'kitchen', name: 'Kitchen' }],
        };
      },
    });
    const catalog = await client.catalog();
    assert.equal(observedToken, 'secret-token');
    assert.deepEqual(catalog.entities[0], {
      entityId: 'light.kitchen',
      deviceId: 'device-1',
      areaId: null,
      name: 'Kitchen light',
      disabled: false,
    });
    assert.equal(JSON.stringify(catalog).includes('secret-token'), false);
    assert.equal(JSON.stringify(catalog).includes('brightness'), false);
  });

  test('reports missing configuration and transport auth failures explicitly', async () => {
    await assert.rejects(
      new HomeAssistantClient({}).catalog(),
      error => error instanceof HomeAssistantError && error.code === 'not_configured',
    );
    const client = new HomeAssistantClient({ url: 'http://ha', token: 'bad' }, {
      transport: async () => {
        throw new HomeAssistantError('authentication', 'Invalid token.');
      },
    });
    await assert.rejects(
      client.catalog(),
      error => error instanceof HomeAssistantError && error.code === 'authentication',
    );
  });
});

