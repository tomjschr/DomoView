import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  insidePolygon, polygonCentroid, polygonArea, ensureCounterClockwise,
  wallFrame, boxBlocks, interpolateStops, skyDirection, railBlocks,
} from '../src/core/geometry.js';
import { sunPosition, moonPosition, moonIllumination } from '../src/core/astro.js';
import { clearHeight, slatAperture, transmitsAt, roomDaylightFactors, AMBIENT_FLOOR } from '../src/core/covers.js';
import { normalisePack, inspectPack, PackError } from '../src/core/pack.js';

const SQUARE = [[0, 0], [4, 0], [4, 4], [0, 4]];

describe('geometry', () => {
  test('point in polygon', () => {
    assert.equal(insidePolygon(2, 2, SQUARE), true);
    assert.equal(insidePolygon(5, 2, SQUARE), false);
    assert.equal(insidePolygon(-0.1, 2, SQUARE), false);
  });

  test('centroid and area of a square', () => {
    assert.deepEqual(polygonCentroid(SQUARE).map(v => Math.round(v * 1e6) / 1e6), [2, 2]);
    assert.equal(polygonArea(SQUARE), 16);
  });

  test('degenerate polygon still yields an anchor', () => {
    const line = [[0, 0], [1, 1], [2, 2]];
    const centroid = polygonCentroid(line);
    assert.ok(Number.isFinite(centroid[0]) && Number.isFinite(centroid[1]));
    assert.deepEqual(centroid, [1, 1]);
  });

  test('winding is normalised to counter-clockwise', () => {
    const clockwise = [...SQUARE].reverse();
    assert.deepEqual(ensureCounterClockwise(clockwise), SQUARE);
    assert.deepEqual(ensureCounterClockwise(SQUARE), SQUARE);
  });

  test('wall frame normal is perpendicular and unit length', () => {
    const { tangent, normal, length } = wallFrame([0, 0], [3, 4]);
    assert.equal(length, 5);
    assert.equal(Math.round(Math.hypot(...normal) * 1e9) / 1e9, 1);
    assert.equal(Math.round((tangent[0] * normal[0] + tangent[1] * normal[1]) * 1e9) / 1e9, 0);
  });

  test('flipping a wall inverts its normal', () => {
    const plain = wallFrame([0, 0], [1, 0]).normal;
    const flipped = wallFrame([0, 0], [1, 0], true).normal;
    // Compared arithmetically: a zero component legitimately carries a sign,
    // and -0 is equivalent to 0 everywhere these normals are used.
    assert.equal(plain[0] + flipped[0], 0);
    assert.equal(plain[1] + flipped[1], 0);
    assert.equal(Math.abs(plain[1]), 1);
  });

  test('box blocks a ray it straddles but not one that misses', () => {
    const box = { min: [-1, -1, 0], max: [1, 1, 2] };
    assert.equal(boxBlocks([0, -5, 1], [0, 1, 0], 10, box), true);
    assert.equal(boxBlocks([0, -5, 9], [0, 1, 0], 10, box), false);
    // A point already inside the box is not shaded by it.
    assert.equal(boxBlocks([0, 0, 1], [0, 1, 0], 10, box), false);
  });

  test('box does not block beyond the ray limit', () => {
    const box = { min: [-1, 4, 0], max: [1, 6, 2] };
    assert.equal(boxBlocks([0, 0, 1], [0, 1, 0], 10, box), true);
    assert.equal(boxBlocks([0, 0, 1], [0, 1, 0], 2, box), false);
  });

  test('rail casts a shadow on its own line', () => {
    const caster = { a: [-2, 2], b: [2, 2], heights: [1], topHeight: 1.1, postSpacing: 0.6, postRadius: 0.02 };
    // The rail runs 2 m away at height 1, so the ray that grazes it rises
    // 1 m over 2 m of ground: elevation atan(0.5).
    const onto = [0, 2 / Math.sqrt(5), 1 / Math.sqrt(5)];
    assert.equal(railBlocks(0, 0, 0, onto, 0, caster), true);
    // A steeper ray crosses the rail's plane well above the bar.
    assert.equal(railBlocks(0, 0, 0, [0, 0.7071, 0.7071], 0, caster), false);
    // And a ray pointing away from the rail is never blocked by it.
    assert.equal(railBlocks(0, 0, 0, [0, -onto[1], onto[2]], 0, caster), false);
  });

  test('stop tables interpolate and clamp at both ends', () => {
    const stops = [[0, 0], [50, 0.25], [100, 1]];
    assert.equal(interpolateStops(stops, -10), 0);
    assert.equal(interpolateStops(stops, 25), 0.125);
    assert.equal(interpolateStops(stops, 75), 0.625);
    assert.equal(interpolateStops(stops, 180), 1);
  });

  test('sky direction respects the pack north offset', () => {
    const [x, y, z] = skyDirection(0, 0, 0);
    assert.equal(Math.round(x * 1e9) / 1e9, 0);
    assert.equal(Math.round(y * 1e9) / 1e9, 1);
    assert.equal(Math.round(z * 1e9) / 1e9, 0);
    // With north at pack azimuth -90, the pack's +Y points east, so a body
    // due north sits on the pack's +X axis.
    const rotated = skyDirection(0, 0, -90);
    assert.equal(Math.round(rotated[0] * 1e6) / 1e6, 1);
    assert.equal(Math.round(rotated[1] * 1e6) / 1e6, 0);
  });
});

describe('astronomy', () => {
  test('northern summer noon puts the sun high and roughly south', () => {
    const { azimuth, elevation } = sunPosition(new Date('2025-06-21T11:00:00Z'), 51, 7);
    assert.ok(elevation > 55 && elevation < 65, `elevation was ${elevation}`);
    assert.ok(azimuth > 150 && azimuth < 210, `azimuth was ${azimuth}`);
  });

  test('winter midnight puts the sun well below the horizon', () => {
    const { elevation } = sunPosition(new Date('2025-12-21T23:00:00Z'), 51, 7);
    assert.ok(elevation < -40, `elevation was ${elevation}`);
  });

  test('polar summer keeps the sun up at local midnight', () => {
    const { elevation } = sunPosition(new Date('2025-06-21T23:00:00Z'), 70, 20);
    assert.ok(elevation > 0, `elevation was ${elevation}`);
  });

  test('moon position stays on the celestial sphere', () => {
    const { azimuth, elevation } = moonPosition(new Date('2025-03-14T06:00:00Z'), 51, 7);
    assert.ok(azimuth >= 0 && azimuth <= 360);
    assert.ok(elevation >= -90 && elevation <= 90);
  });

  test('phase entity overrides the synodic estimate', () => {
    assert.equal(moonIllumination(new Date(), 'full_moon'), 1);
    assert.equal(moonIllumination(new Date(), 'new_moon'), 0);
    const estimated = moonIllumination(new Date('2025-03-14T06:00:00Z'), 'not_a_phase');
    assert.ok(estimated >= 0 && estimated <= 1);
  });
});

/** A window 0.9 m to 2.4 m above the floor with a venetian profile. */
function testOpening(profileKey = 'venetian') {
  const profiles = {
    venetian: {
      stops: [[0, 0], [50, 0.5], [100, 1]],
      slats: { spacing: 0.1, maxAperture: 0.4, closedStops: [[0, 0], [10, 0.2], [11, 0]] },
    },
    linear: { stops: [[0, 0], [100, 1]] },
  };
  return {
    id: 'w1', levelElevation: 0, sill: 0.9, head: 2.4,
    cover: { profile: profileKey, profileData: profiles[profileKey], inFront: false, supported: true },
  };
}

describe('covers', () => {
  test('clear height follows the profile across the opening span', () => {
    const opening = testOpening();
    assert.equal(clearHeight(opening, 100), 1.5);
    assert.equal(clearHeight(opening, 50), 0.75);
    assert.equal(clearHeight(opening, 0), 0);
  });

  test('an unknown position leaves the opening fully clear', () => {
    assert.equal(clearHeight(testOpening(), NaN), 1.5);
  });

  test('tilt wins over the closed-stop table', () => {
    const opening = testOpening();
    assert.equal(slatAperture(opening, 0, 50), 0.2);
    assert.equal(slatAperture(opening, 5, null), 0.1);
    assert.equal(slatAperture(opening, 60, null), 0);
  });

  test('light passes below the blind edge and through open slats', () => {
    const opening = testOpening();
    // Half-open: clear up to 0.9 + 0.75.
    const half = { position: 50, tilt: null };
    assert.equal(transmitsAt(opening, half, 1.2), true);
    assert.equal(transmitsAt(opening, half, 2.0), false);
    // Shut but tilted 100%: aperture 0.4 of a 0.1 m pitch.
    const tilted = { position: 0, tilt: 100 };
    assert.equal(transmitsAt(opening, tilted, 1.02), true);
    assert.equal(transmitsAt(opening, tilted, 1.07), false);
  });

  test('an unmapped cover never blocks light', () => {
    assert.equal(transmitsAt(testOpening(), undefined, 2.3), true);
  });

  test('room daylight drops to the ambient floor when every blind is shut', () => {
    const pack = {
      rooms: [
        { id: 'living', outdoor: false },
        { id: 'hall', outdoor: false },
        { id: 'balcony', outdoor: true },
      ],
      windows: [
        { ...testOpening(), id: 'w1', rooms: ['living'] },
        { ...testOpening(), id: 'w2', rooms: ['living'] },
      ],
    };
    const shut = roomDaylightFactors(pack, { w1: { position: 0, tilt: 0 }, w2: { position: 0, tilt: 0 } });
    assert.equal(Math.round(shut.get('living') * 1e6) / 1e6, AMBIENT_FLOOR);
    // A windowless room and an outdoor room are never shaded by covers.
    assert.equal(shut.get('hall'), 1);
    assert.equal(shut.get('balcony'), 1);

    const open = roomDaylightFactors(pack, { w1: { position: 100, tilt: null }, w2: { position: 100, tilt: null } });
    assert.equal(Math.round(open.get('living') * 1e6) / 1e6, 1);

    // One of two windows shut lands between the two extremes.
    const mixed = roomDaylightFactors(pack, { w1: { position: 0, tilt: 0 }, w2: { position: 100, tilt: null } });
    assert.ok(mixed.get('living') > AMBIENT_FLOOR && mixed.get('living') < 1);
  });
});

const MINIMAL = {
  pack: { schema: 1, id: 'test', name: 'Test Home' },
  model: { url: 'model.glb' },
};

describe('pack normalisation', () => {
  test('a minimal pack gains every default it needs', () => {
    const pack = normalisePack(structuredClone(MINIMAL), '/local/x');
    assert.equal(pack.model.url, '/local/x/model.glb');
    assert.equal(pack.model.up, 'Z');
    assert.equal(pack.levels.length, 1);
    assert.equal(pack.levels[0].id, 'ground');
    assert.equal(pack.cameras.length, 1);
    assert.equal(pack.cameras[0].default, true);
    assert.equal(pack.baked, null);
    assert.equal(pack.meta.units, 'm');
  });

  test('a wrong schema version is rejected loudly', () => {
    assert.throws(() => normalisePack({ ...MINIMAL, pack: { ...MINIMAL.pack, schema: 2 } }), PackError);
  });

  test('a pack with neither a model nor a bake is rejected', () => {
    assert.throws(() => normalisePack({ pack: { schema: 1, id: 'x', name: 'x' } }),
      /either model.url or a baked section/);
  });

  test('a baked-only pack loads without a model', () => {
    // A pack migrated from a purely image-based card has no GLB at all.
    const pack = normalisePack({
      pack: { schema: 1, id: 'baked-only', name: 'Baked only' },
      model: { bounds: { min: [-5, -5, 0], max: [5, 5, 2.6] } },
      fixtures: [{ id: 'lamp', kind: 'light' }],
      baked: {
        size: 1024, day: 'baked/day.png', night: 'baked/night.png',
        lights: { lamp: 'baked/lights/lamp.png' },
      },
    }, '/local/p');
    assert.equal(pack.model.url, null);
    assert.equal(pack.baked.size, 1024);
    assert.deepEqual(pack.model.bounds.max, [5, 5, 2.6]);
    // And the fixture is not reported as sourceless: its baked delta is enough.
    assert.ok(!inspectPack(pack).some(text => /lamp/i.test(text)),
      `unexpected warning: ${inspectPack(pack).join(' | ')}`);
  });

  test('a model-only pack is still reported as missing nothing', () => {
    const pack = normalisePack({
      ...structuredClone(MINIMAL),
      fixtures: [{ id: 'lamp', kind: 'light', node: 'dv_light_lamp' }],
    }, '.');
    assert.ok(!inspectPack(pack).some(text => /lamp/i.test(text)));
  });

  test('absolute and relative asset paths both resolve', () => {
    const absolute = normalisePack({
      ...structuredClone(MINIMAL),
      model: { url: '/local/shared/model.glb' },
    }, '/local/x');
    assert.equal(absolute.model.url, '/local/shared/model.glb');
  });

  test('openings resolve their wall frame and room polygons', () => {
    const pack = normalisePack({
      ...structuredClone(MINIMAL),
      levels: [{ id: 'ground', elevation: 0, height: 2.6 }],
      rooms: [{ id: 'living', name: 'Living', polygon: SQUARE }],
      walls: [{ id: 'south', a: [0, 0], b: [4, 0], exterior: true }],
      openings: [{
        id: 'w1', type: 'window', wall: 'south', offset: 2, width: 1.2,
        sill: 0.9, head: 2.3, rooms: ['living'], cover: { profile: 'venetian' },
      }],
    }, '.');
    const opening = pack.openingById.get('w1');
    assert.deepEqual(opening.origin, [0, 0]);
    assert.deepEqual(opening.tangent, [1, 0]);
    // A wall traced west to east along y=0 faces south, away from the room.
    assert.deepEqual(opening.normal, [0, -1]);
    assert.equal(opening.start, 1.4);
    assert.equal(opening.end, 2.6);
    assert.equal(opening.roomPolygons.length, 1);
    assert.equal(opening.cover.supported, true);
    assert.ok(opening.cover.profileData.stops.length >= 2);
    assert.equal(pack.windows.length, 1);
  });

  test('an opening on a missing wall is an error, not a silent skip', () => {
    assert.throws(() => normalisePack({
      ...structuredClone(MINIMAL),
      openings: [{ id: 'w1', type: 'window', wall: 'nope', width: 1 }],
    }, '.'), /unknown wall/);
  });

  test('doors admit no daylight', () => {
    const pack = normalisePack({
      ...structuredClone(MINIMAL),
      walls: [{ id: 'w', a: [0, 0], b: [3, 0] }],
      openings: [
        { id: 'd1', type: 'door', wall: 'w', offset: 1, width: 0.9 },
        { id: 'g1', type: 'glass_door', wall: 'w', offset: 2, width: 0.9 },
      ],
    }, '.');
    assert.equal(pack.windows.length, 1);
    assert.equal(pack.windows[0].id, 'g1');
  });

  test('bounds are derived when the pack omits them', () => {
    const pack = normalisePack({
      ...structuredClone(MINIMAL),
      rooms: [{ id: 'r', name: 'R', polygon: [[1, 1], [5, 1], [5, 6], [1, 6]] }],
      fixtures: [{ id: 'l', kind: 'light', emitters: [{ position: [3, 3, 2.2] }] }],
    }, '.');
    assert.deepEqual(pack.model.bounds.min.slice(0, 2), [1, 1]);
    assert.deepEqual(pack.model.bounds.max.slice(0, 2), [5, 6]);
    assert.ok(pack.model.bounds.max[2] >= 2.2);
  });

  test('fixtures get domains from their kind and keep explicit overrides', () => {
    const pack = normalisePack({
      ...structuredClone(MINIMAL),
      fixtures: [
        { id: 'a', kind: 'light' },
        { id: 'b', kind: 'media' },
        { id: 'c', kind: 'light', domains: ['switch'] },
      ],
    }, '.');
    assert.deepEqual(pack.fixtureById.get('a').domains, ['light', 'switch']);
    assert.deepEqual(pack.fixtureById.get('b').domains, ['media_player']);
    assert.deepEqual(pack.fixtureById.get('c').domains, ['switch']);
  });

  test('variant fixtures appear only when their variant is active', () => {
    const source = {
      ...structuredClone(MINIMAL),
      variants: [{ id: 'christmas', name: 'Christmas' }],
      fixtures: [
        { id: 'always', kind: 'light' },
        { id: 'tree', kind: 'light', variant: 'christmas' },
      ],
    };
    const base = normalisePack(structuredClone(source), '.');
    assert.deepEqual(base.fixtures.map(f => f.id), ['always']);
    const festive = normalisePack(structuredClone(source), '.', { variant: 'christmas' });
    assert.deepEqual(festive.fixtures.map(f => f.id).sort(), ['always', 'tree']);
  });

  test('baked assets resolve only for fixtures that exist', () => {
    const pack = normalisePack({
      ...structuredClone(MINIMAL),
      fixtures: [{ id: 'lamp', kind: 'light' }],
      baked: {
        size: 1024, day: 'baked/day.png', night: 'baked/night.png',
        gbuffer: { position: 'baked/position.png', normal: 'baked/normal.png' },
        masks: { glass: 'baked/glass.png' },
        lights: { lamp: 'baked/lights/lamp.png', ghost: 'baked/lights/ghost.png' },
      },
    }, '/local/p');
    assert.equal(pack.baked.day, '/local/p/baked/day.png');
    assert.deepEqual(Object.keys(pack.baked.lights), ['lamp']);
    assert.equal(pack.baked.gbuffer.size, 1024);
  });

  test('inspection reports what a half-finished pack is missing', () => {
    const warnings = inspectPack(normalisePack(structuredClone(MINIMAL), '.'));
    assert.ok(warnings.some(text => /No rooms/.test(text)));
    assert.ok(warnings.some(text => /No windows/.test(text)));
    assert.ok(warnings.some(text => /No light fixtures/.test(text)));
  });
});
