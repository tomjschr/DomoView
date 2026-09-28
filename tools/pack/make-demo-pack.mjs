#!/usr/bin/env node
/* Generate the example Home Pack.
 *
 * The demo apartment is invented, not anyone's real home: a shared repository
 * is the wrong place for a floor plan of where someone actually lives.
 *
 * It is built through the Studio's own exporter, so running this also checks
 * that the authoring pipeline still produces a pack the card can read.
 *
 * Usage: node tools/pack/make-demo-pack.mjs [outputDir]
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import '../dom-shim.mjs';

const { emptyProject } = await import('../../studio/src/project.js');
const { buildManifest } = await import('../../studio/src/export/manifest.js');
const { exportGlb, sceneStats } = await import('../../studio/src/export/glb.js');
const { wallVectorsPack } = await import('../../studio/src/units.js');
const { normalisePack, inspectPack } = await import('../../src/core/pack.js');

/** Plan pixels per metre. The demo is authored in metres and scaled up. */
const PPM = 100;
const m = value => value * PPM;
const point = (x, y) => [m(x), m(y)];

/* Layout in metres, in plan orientation: +x east, +y south.
 * The building occupies x 2..13, y 0..8, with a balcony to its west. */
const ROOMS = [
  { id: 'living', name: 'Living & Dining', box: [2, 0, 7.5, 5.2] },
  { id: 'kitchen', name: 'Kitchen', box: [7.5, 0, 13, 3] },
  { id: 'corridor', name: 'Corridor', box: [7.5, 3, 10, 5.2] },
  { id: 'bathroom', name: 'Bathroom', box: [10, 3, 13, 5.2] },
  { id: 'study', name: 'Study', box: [2, 5.2, 7.5, 8] },
  { id: 'bedroom', name: 'Bedroom', box: [7.5, 5.2, 13, 8] },
  { id: 'balcony', name: 'Balcony', box: [0, 1, 1.9, 6], outdoor: true },
];

const EXTERIOR = [
  { id: 'ext_n', a: [2, 0], b: [13, 0] },
  { id: 'ext_e', a: [13, 0], b: [13, 8] },
  { id: 'ext_s', a: [13, 8], b: [2, 8] },
  { id: 'ext_w', a: [2, 8], b: [2, 0] },
];

const PARTITIONS = [
  { id: 'part_v', a: [7.5, 0], b: [7.5, 8] },
  { id: 'part_h', a: [2, 5.2], b: [13, 5.2] },
  { id: 'part_kitchen', a: [7.5, 3], b: [13, 3] },
  { id: 'part_bath', a: [10, 3], b: [10, 5.2] },
];

/* Openings are placed by naming a point on the wall; the offset along that
 * wall is computed, so moving a wall does not silently move its windows. */
const OPENINGS = [
  { wall: 'ext_w', at: [2, 1.5], width: 1.5, sill: 0.9, head: 2.3, rooms: ['living'], type: 'window', name: 'Living room west', cover: 'venetian' },
  { wall: 'ext_w', at: [2, 3.5], width: 1.8, sill: 0.02, head: 2.3, rooms: ['living'], type: 'glass_door', name: 'Balcony door', cover: 'venetian', mullion: 0 },
  { wall: 'ext_w', at: [2, 6.8], width: 1.2, sill: 0.9, head: 2.3, rooms: ['study'], type: 'window', name: 'Study west', cover: 'roller' },
  { wall: 'ext_n', at: [10, 0], width: 1.4, sill: 1.05, head: 2.3, rooms: ['kitchen'], type: 'window', name: 'Kitchen north', cover: 'venetian' },
  { wall: 'ext_e', at: [13, 4.1], width: 0.8, sill: 1.35, head: 2.2, rooms: ['bathroom'], type: 'window', name: 'Bathroom east' },
  { wall: 'ext_e', at: [13, 6.6], width: 1.6, sill: 0.9, head: 2.3, rooms: ['bedroom'], type: 'window', name: 'Bedroom east', cover: 'roller' },
  { wall: 'ext_s', at: [9.5, 8], width: 1.6, sill: 0.9, head: 2.3, rooms: ['bedroom'], type: 'window', name: 'Bedroom south', cover: 'roller' },
  { wall: 'ext_s', at: [4, 8], width: 1.4, sill: 0.9, head: 2.3, rooms: ['study'], type: 'window', name: 'Study south', cover: 'roller' },
  { wall: 'part_v', at: [7.5, 4.2], width: 0.9, type: 'door', name: 'Corridor to living' },
  { wall: 'part_h', at: [4.5, 5.2], width: 0.9, type: 'door', name: 'Study door' },
  { wall: 'part_h', at: [9, 5.2], width: 0.9, type: 'door', name: 'Bedroom door' },
  { wall: 'part_bath', at: [10, 4.2], width: 0.8, type: 'door', name: 'Bathroom door' },
  { wall: 'part_kitchen', at: [9, 3], width: 1.1, type: 'door', name: 'Kitchen opening' },
];

const FIXTURES = [
  { name: 'Living ceiling spots', room: 'living', kind: 'light', lumens: 1400, color: '#fff0d4', range: 7,
    bulbs: [[3.6, 1.4], [4.9, 2.3], [3.6, 3.4]], height: 2.5, type: 'spot', shadow: true },
  { name: 'Dining pendant', room: 'living', kind: 'light', lumens: 900, color: '#ffdca8', range: 5,
    bulbs: [[5.9, 4.1]], height: 1.75 },
  { name: 'Living floor lamp', room: 'living', kind: 'light', lumens: 500, color: '#ffd29a', range: 4,
    bulbs: [[2.7, 4.6]], height: 1.5 },
  { name: 'Living TV', room: 'living', kind: 'media', lumens: 260, color: '#b6d4ff', range: 3.5,
    bulbs: [[6.9, 2.0]], height: 1.1, type: 'emissive' },
  { name: 'Kitchen ceiling', room: 'kitchen', kind: 'light', lumens: 1500, color: '#fff6e4', range: 6,
    bulbs: [[9.3, 1.5], [11.4, 1.5]], height: 2.5 },
  { name: 'Kitchen counter LED', room: 'kitchen', kind: 'light', lumens: 400, color: '#ffeccb', range: 2.4,
    bulbs: [[8.4, 0.55], [9.9, 0.55], [11.4, 0.55]], height: 1.45, type: 'strip' },
  { name: 'Corridor ceiling', room: 'corridor', kind: 'light', lumens: 700, color: '#fff2dc', range: 4,
    bulbs: [[8.7, 4.1]], height: 2.5 },
  { name: 'Bathroom ceiling', room: 'bathroom', kind: 'light', lumens: 900, color: '#f6faff', range: 4,
    bulbs: [[11.4, 4.1]], height: 2.5 },
  { name: 'Bathroom mirror light', room: 'bathroom', kind: 'light', lumens: 350, color: '#eef6ff', range: 2,
    bulbs: [[10.35, 3.7]], height: 1.85, type: 'strip' },
  { name: 'Bedroom pendant', room: 'bedroom', kind: 'light', lumens: 800, color: '#ffdca8', range: 5,
    bulbs: [[10.2, 6.5]], height: 2.15 },
  { name: 'Bedside lamp left', room: 'bedroom', kind: 'light', lumens: 220, color: '#ffc98c', range: 2.4,
    bulbs: [[8.5, 5.9]], height: 0.62 },
  { name: 'Bedside lamp right', room: 'bedroom', kind: 'light', lumens: 220, color: '#ffc98c', range: 2.4,
    bulbs: [[11.9, 5.9]], height: 0.62 },
  { name: 'Study ceiling', room: 'study', kind: 'light', lumens: 1100, color: '#fff4e0', range: 6,
    bulbs: [[4.2, 6.4]], height: 2.5 },
  { name: 'Desk lamp', room: 'study', kind: 'light', lumens: 320, color: '#fff0cf', range: 2.2,
    bulbs: [[6.4, 6.2]], height: 1.05, type: 'spot' },
  { name: 'Balcony string light', room: 'balcony', kind: 'light', lumens: 260, color: '#ffd9a0', range: 3,
    bulbs: [[0.5, 2.0], [0.5, 3.5], [0.5, 5.0]], height: 2.1, type: 'strip' },
];

const FURNITURE = [
  { name: 'Sofa', box: [2.3, 3.9, 5.0, 4.9], base: 0, top: 0.82 },
  { name: 'Coffee table', box: [3.2, 2.9, 4.4, 3.6], base: 0, top: 0.42 },
  { name: 'Dining table', box: [5.2, 3.5, 6.7, 4.7], base: 0, top: 0.75 },
  { name: 'TV lowboard', box: [6.6, 1.3, 7.3, 2.7], base: 0, top: 0.48 },
  { name: 'Kitchen counter', box: [7.7, 0.15, 12.8, 0.75], base: 0, top: 0.92 },
  { name: 'Fridge', box: [12.2, 0.9, 12.85, 1.6], base: 0, top: 1.85 },
  { name: 'Bed', box: [9.1, 5.5, 11.3, 7.5], base: 0, top: 0.58 },
  { name: 'Wardrobe', box: [7.7, 5.4, 8.3, 7.8], base: 0, top: 2.2 },
  { name: 'Desk', box: [5.6, 5.9, 7.3, 6.6], base: 0, top: 0.74 },
  { name: 'Bookshelf', box: [2.15, 5.4, 2.6, 7.6], base: 0, top: 1.9 },
  { name: 'Bathtub', box: [10.2, 4.6, 12.8, 5.05], base: 0, top: 0.55 },
  { name: 'Balcony table', box: [0.35, 3.1, 1.45, 4.0], base: 0, top: 0.74 },
  { name: 'Planter', box: [0.2, 1.2, 0.7, 1.9], base: 0, top: 0.65 },
];

/**
 * Set `flip` so the wall's outward normal points away from a reference point.
 * Deriving it beats hand-tuning eight booleans and getting one wrong: the
 * facing decides which side daylight enters from.
 *
 * The normal comes from wallVectorsPack rather than being restated here. An
 * earlier copy of that formula had one sign wrong, which only showed up on
 * walls that were not axis-aligned in y.
 */
function faceAwayFrom(wall, reference) {
  const { normal } = wallVectorsPack({ ...wall, flip: false });
  // Compare in pack orientation: +y up, so plan y is negated on both sides.
  const mid = [(wall.a[0] + wall.b[0]) / 2, -(wall.a[1] + wall.b[1]) / 2];
  const towards = [reference[0] - mid[0], -reference[1] - mid[1]];
  const dot = normal[0] * towards[0] + normal[1] * towards[1];
  // Positive means the default normal points at the reference, so flip it.
  return dot > 0;
}

function offsetAlong(wall, at) {
  const dx = wall.b[0] - wall.a[0], dy = wall.b[1] - wall.a[1];
  const length = Math.hypot(dx, dy) || 1;
  return ((at[0] - wall.a[0]) * dx + (at[1] - wall.a[1]) * dy) / length;
}

function buildProject() {
  const data = emptyProject();
  data.meta = {
    id: 'demo-apartment',
    name: 'Demo Apartment',
    author: 'DomoView contributors',
    license: 'CC0-1.0',
    description: 'A fictional six-room apartment with a west balcony, used to demonstrate DomoView. Not a real home.',
    north: 0,
    version: '1.0.0',
  };
  data.level = { height: 2.55, elevation: 0 };
  data.plan = {
    ...data.plan,
    image: null,
    imageWidth: m(15),
    imageHeight: m(9),
    scale: 1 / PPM,
    opacity: 0.5,
  };
  data.materials = { wall: '#dcd7cd', floor: '#a5825b', ceiling: '#f1eee8', furniture: '#8d8578' };
  data.camera = { azimuth: 215, elevation: 42, zoom: 1, clipAbove: 0 };

  const centre = [m(7.5), m(4)];

  data.walls = [
    ...EXTERIOR.map(wall => ({
      id: wall.id,
      a: point(...wall.a), b: point(...wall.b),
      thickness: 0.26, height: data.level.height,
      exterior: true,
      flip: faceAwayFrom({ a: point(...wall.a), b: point(...wall.b) }, centre),
    })),
    ...PARTITIONS.map(wall => ({
      id: wall.id,
      a: point(...wall.a), b: point(...wall.b),
      thickness: 0.115, height: data.level.height,
      exterior: false, flip: false,
    })),
  ];

  data.rooms = ROOMS.map(room => {
    const [x0, y0, x1, y1] = room.box;
    return {
      id: room.id,
      name: room.name,
      polygon: [point(x0, y0), point(x1, y0), point(x1, y1), point(x0, y1)],
      outdoor: !!room.outdoor,
      label: null,
      climate: true,
    };
  });

  data.openings = OPENINGS.map((opening, index) => {
    const wall = data.walls.find(entry => entry.id === opening.wall);
    if (!wall) throw new Error(`demo pack references unknown wall ${opening.wall}`);
    return {
      id: `op_${index + 1}`,
      type: opening.type,
      name: opening.name || '',
      wall: wall.id,
      offset: offsetAlong(wall, point(...opening.at)),
      width: opening.width,
      sill: opening.sill ?? 0,
      head: opening.head ?? 2.05,
      rooms: opening.rooms || [],
      mullion: opening.mullion ?? null,
      cover: !!opening.cover,
      coverProfile: opening.cover || 'venetian',
      coverInFront: false,
    };
  });

  data.fixtures = FIXTURES.map((fixture, index) => ({
    id: `fx_${index + 1}`,
    name: fixture.name,
    kind: fixture.kind,
    room: fixture.room,
    emitters: fixture.bulbs.map(([x, y]) => ({
      point: point(x, y),
      height: fixture.height,
      type: fixture.type || 'point',
      intensity: 1,
      angle: fixture.type === 'spot' ? 45 : undefined,
    })),
    lumens: fixture.lumens,
    color: fixture.color,
    range: fixture.range,
    shadow: !!fixture.shadow,
    bulb: fixture.type === 'strip' ? 'strip' : 'glow',
    variant: null,
  }));

  data.furniture = FURNITURE.map((item, index) => {
    const [x0, y0, x1, y1] = item.box;
    return {
      id: `fn_${index + 1}`,
      name: item.name,
      rect: [point(x0, y0), point(x1, y0), point(x1, y1), point(x0, y1)],
      base: item.base,
      top: item.top,
      solid: true,
      occluder: true,
    };
  });

  return data;
}

/** Balcony railing, so afternoon sun casts bars across the deck. */
function balconyShadowCasters(manifest) {
  const balcony = manifest.rooms.find(room => room.id === 'balcony');
  if (!balcony) return [];
  const xs = balcony.polygon.map(p => p[0]);
  const ys = balcony.polygon.map(p => p[1]);
  const west = Math.min(...xs), east = Math.max(...xs);
  const south = Math.min(...ys), north = Math.max(...ys);
  const rail = { heights: [0.42, 0.72, 1.02], topHeight: 1.05, postSpacing: 0.62, postRadius: 0.022 };
  return [
    { id: 'rail_west', a: [west, south], b: [west, north], ...rail },
    { id: 'rail_south', a: [west, south], b: [east, south], ...rail },
    { id: 'rail_north', a: [west, north], b: [east, north], ...rail },
  ];
}

async function main() {
  const outputDir = path.resolve(process.argv[2] ||
    path.join(import.meta.dirname, '../../examples/demo-apartment'));
  const data = buildProject();

  const manifest = buildManifest(data, { version: '0.1.1' });
  manifest.shadowCasters = balconyShadowCasters(manifest);

  // Prove the card can actually read what we just wrote.
  const pack = normalisePack(structuredClone(manifest), outputDir);
  const warnings = inspectPack(pack);

  const glb = await exportGlb(data);
  const stats = sceneStats(data);

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'home.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'model.glb'), Buffer.from(glb));
  await writeFile(path.join(outputDir, 'project.domoview.json'), `${JSON.stringify(data, null, 2)}\n`);

  console.log(`Demo pack written to ${path.relative(process.cwd(), outputDir)}`);
  console.log(`  rooms      ${pack.rooms.length}`);
  console.log(`  walls      ${pack.walls.length}`);
  console.log(`  openings   ${pack.openings.length} (${pack.windows.length} admit light)`);
  console.log(`  fixtures   ${pack.fixtures.length} (${pack.lights.length} lights)`);
  console.log(`  occluders  ${pack.occluders.length}`);
  console.log(`  model      ${(glb.byteLength / 1024).toFixed(1)} kB, ${stats.meshes} meshes, ~${stats.triangles.toLocaleString('en-US')} triangles`);
  console.log(`  bounds     ${pack.model.bounds.min.map(v => v.toFixed(2)).join(', ')} .. ${pack.model.bounds.max.map(v => v.toFixed(2)).join(', ')}`);
  if (warnings.length) {
    console.log('\nWarnings:');
    for (const warning of warnings) console.log(`  - ${warning}`);
  }
}

await main();
