import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { buildEntityCatalog, proposeEntityBindings } from '../src/core/entity-matcher.js';

const fixtures = [
  {
    id: 'we3_kueche_led_oben',
    name: 'LED oben',
    room: 'kueche',
    roomName: 'Küche',
    domains: ['light', 'switch'],
  },
  {
    id: 'we3_wohnen_sideboard_tischlampe',
    name: 'Sideboard Tischlampe',
    room: 'wohnen_essen',
    roomName: 'Wohnen Essen',
    domains: ['light', 'switch'],
  },
  {
    id: 'we3_bad_duftlampe',
    name: 'Duftlampe',
    room: 'bad',
    roomName: 'Bad',
    domains: ['light', 'switch'],
  },
];

describe('entity matcher', () => {
  test('uses entity names and inherited device areas without leaking state values', () => {
    const catalog = buildEntityCatalog({
      'light.oberschrank': { state: 'on', attributes: { friendly_name: 'LED Oberschrank' } },
    }, {
      entities: [{ entity_id: 'light.oberschrank', device_id: 'device-1', original_name: 'Light' }],
      devices: [{ id: 'device-1', area_id: 'kitchen' }],
      areas: [{ area_id: 'kitchen', name: 'Küche' }],
    });
    assert.deepEqual(catalog, [{
      entityId: 'light.oberschrank',
      friendlyName: 'LED Oberschrank',
      registryName: '',
      originalName: 'Light',
      areaId: 'kitchen',
      areaName: 'Küche',
    }]);
    assert.equal('state' in catalog[0], false);
  });

  test('matches distinct WE3-style fixtures and respects compatible domains', () => {
    const catalog = buildEntityCatalog({
      'light.oberschrank': { attributes: { friendly_name: 'Küche LED oben Oberschrank' } },
      'light.wohnzimmer_sideboard': { attributes: { friendly_name: 'Wohnzimmer Sideboard Tischlampe' } },
      'light.duftlampe_badezimmer': { attributes: { friendly_name: 'Duftlampe Badezimmer' } },
      'sensor.oberschrank_power': { attributes: { friendly_name: 'Küche LED oben Leistung' } },
    });
    const suggestions = proposeEntityBindings(fixtures, catalog);
    assert.deepEqual(
      Object.fromEntries(suggestions.filter(item => item.confidence === 'high')
        .map(item => [item.fixtureId, item.entityId])),
      {
        we3_bad_duftlampe: 'light.duftlampe_badezimmer',
        we3_kueche_led_oben: 'light.oberschrank',
        we3_wohnen_sideboard_tischlampe: 'light.wohnzimmer_sideboard',
      },
    );
  });

  test('does not overwrite bindings or assign one entity twice', () => {
    const duplicateFixtures = [
      fixtures[0],
      { ...fixtures[0], id: 'we3_kueche_led_oben_zwei' },
    ];
    const catalog = buildEntityCatalog({
      'light.oberschrank': { attributes: { friendly_name: 'Küche LED oben' } },
    });
    const suggestions = proposeEntityBindings(duplicateFixtures, catalog, {
      we3_kueche_led_oben: 'light.existing',
    });
    assert.equal(suggestions.some(item => item.fixtureId === 'we3_kueche_led_oben'), false);
    assert.equal(suggestions.filter(item => item.entityId === 'light.oberschrank' &&
      item.confidence === 'high').length, 1);
  });

  test('keeps ambiguous matches below automatic confidence', () => {
    const catalog = buildEntityCatalog({
      'light.flur_links': { attributes: { friendly_name: 'Flur Deckenlicht links' } },
      'light.flur_rechts': { attributes: { friendly_name: 'Flur Deckenlicht rechts' } },
    });
    const suggestions = proposeEntityBindings([{
      id: 'we3_flur_deckenlicht',
      name: 'Deckenlicht',
      room: 'flur',
      roomName: 'Flur',
      domains: ['light'],
    }], catalog);
    assert.equal(suggestions.length, 1);
    assert.notEqual(suggestions[0].confidence, 'high');
  });
});
