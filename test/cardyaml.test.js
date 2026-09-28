/* The generated card YAML has to be valid YAML that the card actually
 * accepts, not just plausible-looking text. It is parsed back with a
 * spec-compliant parser — Home Assistant uses one too, so a hand-rolled
 * reader here would only prove that this file agrees with itself.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

import { buildCardYaml, cardYamlSummary } from '../studio/src/export/cardyaml.js';
import { normalisePack } from '../src/core/pack.js';
import { HomeState } from '../src/core/hass.js';

const packDir = path.join(import.meta.dirname, '../examples/demo-apartment');
const { version: VERSION } = JSON.parse(
  await readFile(path.join(import.meta.dirname, '../package.json'), 'utf8'));

/** Parse strictly, and fail on anything the parser is unhappy about. */
function parseYaml(text) {
  const doc = YAML.parseDocument(text);
  const complaints = [...doc.errors, ...doc.warnings].map(entry => entry.message);
  assert.deepEqual(complaints, [], `YAML is not clean:\n${complaints.join('\n')}`);
  return doc.toJS();
}

let manifest;
let yaml;
let config;

before(async () => {
  manifest = JSON.parse(await readFile(path.join(packDir, 'home.json'), 'utf8'));
  yaml = buildCardYaml(manifest, { version: VERSION });
  config = parseYaml(yaml);
});

describe('card YAML', () => {
  test('parses, and is the card type with the pack path', () => {
    assert.equal(config.type, 'custom:domoview-card');
    assert.equal(config.home, '/local/domoview/homes/demo-apartment');
  });

  test('lists every bindable fixture, and only those', () => {
    const expected = manifest.fixtures
      .filter(fixture => fixture.kind !== 'marker')
      .map(fixture => fixture.id)
      .sort();
    assert.deepEqual(Object.keys(config.entities).sort(), expected);
    assert.ok(expected.length >= 14, `expected at least 14 fixtures, got ${expected.length}`);
  });

  test('every placeholder is empty, so nothing is bound by accident', () => {
    for (const [id, value] of Object.entries(config.entities)) {
      assert.equal(value, '', `${id} should start unbound`);
    }
  });

  test('lists blinds only for windows that have one', () => {
    const expected = manifest.openings
      .filter(opening => opening.cover)
      .map(opening => opening.id)
      .sort();
    assert.deepEqual(Object.keys(config.covers).sort(), expected);
    // The demo has a bathroom window with no blind; it must not appear.
    assert.ok(!Object.keys(config.covers).includes('bathroom_east'));
  });

  test('lists window contacts for windows but not for doors', () => {
    const keys = Object.keys(config.window_sensors);
    const doors = manifest.openings.filter(opening => opening.type === 'door').map(o => o.id);
    for (const door of doors) {
      assert.ok(!keys.includes(door), `${door} is a door and should have no contact`);
    }
    assert.ok(keys.includes('bedroom_east'));
  });

  test('lists every room with both climate keys', () => {
    const expected = manifest.rooms.map(room => room.id).sort();
    assert.deepEqual(Object.keys(config.rooms).sort(), expected);
    for (const [id, entry] of Object.entries(config.rooms)) {
      assert.deepEqual(Object.keys(entry).sort(), ['humidity', 'temperature'], `room ${id}`);
    }
  });

  test('the card accepts it, and renders nothing bound', () => {
    // The real consumer: normalisePack plus HomeState, as the card does it.
    const pack = normalisePack(structuredClone(manifest), packDir);
    const state = new HomeState(pack, config);
    state.setHass({ states: {}, config: { latitude: 51, longitude: 7 } });

    for (const fixture of pack.fixtures) {
      assert.equal(state.entityFor(fixture.id), null,
        `${fixture.id} should be unbound with an empty placeholder`);
    }
    const snapshot = state.snapshot();
    assert.equal(snapshot.emitters.length, 0);
    assert.deepEqual([...snapshot.openWindows], []);
    assert.equal(snapshot.climate.size, 0);
    // Covers with an empty entity must not be treated as closed.
    assert.deepEqual(snapshot.covers, {});
    for (const room of pack.rooms) {
      assert.equal(snapshot.roomDaylight.get(room.id), 1,
        `${room.id} must not be dimmed by an unmapped cover`);
    }
  });

  test('filling a placeholder in binds that fixture', () => {
    const pack = normalisePack(structuredClone(manifest), packDir);
    const filled = {
      ...config,
      entities: { ...config.entities, dining_pendant: 'light.dining' },
    };
    const state = new HomeState(pack, filled);
    state.setHass({
      states: { 'light.dining': { entity_id: 'light.dining', state: 'on', attributes: { brightness: 255 } } },
      config: { latitude: 51, longitude: 7 },
    });
    assert.equal(state.entityFor('dining_pendant'), 'light.dining');
    const snapshot = state.snapshot();
    assert.deepEqual(snapshot.emitters.map(item => item.id), ['dining_pendant']);
    assert.equal(snapshot.emitters[0].level, 1);
  });

  test('a name with a quote or a newline cannot break the file', () => {
    const awkward = structuredClone(manifest);
    awkward.pack.name = "Tom's \"place\"\nsecond line";
    awkward.rooms[0].name = "Kitchen # not a comment";
    awkward.fixtures[0].name = "Lamp: with a colon";
    const text = buildCardYaml(awkward, { version: VERSION });
    const parsed = parseYaml(text);
    assert.equal(parsed.type, 'custom:domoview-card');
    assert.ok(Object.keys(parsed.entities).length > 0);
    // A newline in a name must not spill out of its comment line.
    assert.ok(!/^\s*second line/m.test(text), 'a newline leaked into the document');
  });

  test('summary counts match the manifest', () => {
    const counts = cardYamlSummary(manifest);
    assert.equal(counts.rooms, manifest.rooms.length);
    assert.equal(counts.fixtures, Object.keys(config.entities).length);
    assert.equal(counts.covers, Object.keys(config.covers).length);
    assert.equal(counts.windows, Object.keys(config.window_sensors).length);
  });

  test('a pack with no fixtures or blinds still emits valid YAML', () => {
    const bare = {
      pack: { schema: 1, id: 'bare', name: 'Bare' },
      model: { url: 'model.glb' },
    };
    const parsed = parseYaml(buildCardYaml(bare, { version: VERSION }));
    assert.equal(parsed.home, '/local/domoview/homes/bare');
    assert.deepEqual(parsed.entities, {});
    assert.deepEqual(parsed.covers, {});
    assert.deepEqual(parsed.rooms, {});
  });
});
