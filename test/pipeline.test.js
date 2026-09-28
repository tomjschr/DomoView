/* End-to-end checks over the authoring pipeline and the shipped example pack.
 *
 * These are the tests that would have caught the wall-facing sign error: the
 * shapes were all valid, the geometry was just mirrored.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import '../tools/dom-shim.mjs';
import { normalisePack, inspectPack } from '../src/core/pack.js';

const root = path.join(import.meta.dirname, '..');
const packDir = path.join(root, 'examples/demo-apartment');

let manifest;
let schemaValidate;
let pack;

before(async () => {
  manifest = JSON.parse(await readFile(path.join(packDir, 'home.json'), 'utf8'));
  const schema = JSON.parse(await readFile(path.join(root, 'schemas/home-pack-1.schema.json'), 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  schemaValidate = ajv.compile(schema);
  pack = normalisePack(structuredClone(manifest), packDir);
});

describe('example pack', () => {
  test('validates against the Home Pack schema', () => {
    const valid = schemaValidate(manifest);
    const errors = (schemaValidate.errors || [])
      .map(error => `${error.instancePath || '/'} ${error.message}`).join('\n');
    assert.ok(valid, `schema errors:\n${errors}`);
  });

  test('the schema is strict enough to reject a stray field', () => {
    const broken = structuredClone(manifest);
    broken.notAField = true;
    assert.equal(schemaValidate(broken), false);
  });

  test('the schema rejects a wrong-typed polygon', () => {
    const broken = structuredClone(manifest);
    broken.rooms[0].polygon = [[0, 0], [1, 'x'], [2, 2]];
    assert.equal(schemaValidate(broken), false);
  });

  test('loads without warnings', () => {
    assert.deepEqual(inspectPack(pack), []);
  });

  test('has the content the demo promises', () => {
    assert.equal(pack.meta.id, 'demo-apartment');
    assert.equal(pack.rooms.length, 7);
    assert.ok(pack.lights.length >= 12);
    assert.equal(pack.windows.length, 8);
    assert.ok(pack.occluders.length >= 10);
    assert.ok(pack.rooms.some(room => room.outdoor), 'expected an outdoor room');
    assert.ok(pack.shadowCasters.length >= 3, 'expected balcony railings');
  });

  test('every exterior wall faces away from the home', () => {
    const centre = [
      (pack.model.bounds.min[0] + pack.model.bounds.max[0]) / 2,
      (pack.model.bounds.min[1] + pack.model.bounds.max[1]) / 2,
    ];
    const exterior = pack.walls.filter(wall => wall.exterior);
    assert.ok(exterior.length >= 4);
    for (const wall of exterior) {
      const mid = [(wall.a[0] + wall.b[0]) / 2, (wall.a[1] + wall.b[1]) / 2];
      const towards = [centre[0] - mid[0], centre[1] - mid[1]];
      const dot = wall.normal[0] * towards[0] + wall.normal[1] * towards[1];
      assert.ok(dot < 0, `wall ${wall.id} normal ${wall.normal} points inward`);
    }
  });

  test('every window opens into a room whose polygon contains it', () => {
    for (const opening of pack.windows) {
      assert.ok(opening.rooms.length, `${opening.id} lights no room`);
      assert.ok(opening.roomPolygons.length, `${opening.id} has no room polygon`);
      // The point just inside the opening must fall in one of its rooms.
      const along = (opening.start + opening.end) / 2;
      const inward = [
        opening.origin[0] + opening.tangent[0] * along - opening.normal[0] * 0.4,
        opening.origin[1] + opening.tangent[1] * along - opening.normal[1] * 0.4,
      ];
      const hit = opening.roomPolygons.some(polygon => pointInPolygon(inward, polygon));
      assert.ok(hit, `${opening.id} does not open into ${opening.rooms.join('/')}`);
    }
  });

  test('openings fit inside their wall and below the ceiling', () => {
    const height = pack.levels[0].height;
    for (const opening of pack.openings) {
      const wall = pack.walls.find(entry => entry.id === opening.wall);
      assert.ok(wall, `${opening.id} has no wall`);
      assert.ok(opening.start >= -0.01, `${opening.id} starts before the wall`);
      assert.ok(opening.end <= wall.length + 0.01,
        `${opening.id} ends past the wall (${opening.end} > ${wall.length})`);
      assert.ok(opening.head <= height + 0.001, `${opening.id} reaches above the ceiling`);
      assert.ok(opening.head > opening.sill, `${opening.id} head is not above its sill`);
    }
  });

  test('bounds contain every fixture and room vertex', () => {
    const { min, max } = pack.model.bounds;
    for (const room of pack.rooms) {
      for (const [x, y] of room.polygon) {
        assert.ok(x >= min[0] - 0.01 && x <= max[0] + 0.01, `room ${room.id} x out of bounds`);
        assert.ok(y >= min[1] - 0.01 && y <= max[1] + 0.01, `room ${room.id} y out of bounds`);
      }
    }
    for (const fixture of pack.fixtures) {
      for (const emitter of fixture.emitters) {
        assert.ok(emitter.position[2] >= min[2] && emitter.position[2] <= max[2],
          `fixture ${fixture.id} sits outside the vertical bounds`);
      }
    }
  });
});

describe('example model', () => {
  let glb;

  before(async () => {
    glb = await readFile(path.join(packDir, 'model.glb'));
  });

  /** Parse the GLB container by hand: chapter 4 of the glTF 2.0 spec. */
  function parseGlb(buffer) {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    assert.equal(view.getUint32(0, true), 0x46546c67, 'bad glTF magic');
    assert.equal(view.getUint32(4, true), 2, 'expected glTF version 2');
    assert.equal(view.getUint32(8, true), buffer.byteLength, 'declared length differs from the file size');

    const chunks = [];
    let offset = 12;
    while (offset < buffer.byteLength) {
      const length = view.getUint32(offset, true);
      const type = view.getUint32(offset + 4, true);
      chunks.push({ type, start: offset + 8, length });
      // Chunks are four-byte aligned; a misaligned file breaks strict loaders.
      assert.equal(length % 4, 0, 'chunk length is not 4-byte aligned');
      offset += 8 + length;
    }
    assert.equal(offset, buffer.byteLength, 'chunks do not fill the file exactly');

    const jsonChunk = chunks.find(chunk => chunk.type === 0x4e4f534a);
    assert.ok(jsonChunk, 'no JSON chunk');
    const json = JSON.parse(new TextDecoder().decode(
      buffer.subarray(jsonChunk.start, jsonChunk.start + jsonChunk.length)));
    return { json, chunks };
  }

  test('is a well-formed binary glTF 2.0 container', () => {
    const { json, chunks } = parseGlb(glb);
    assert.ok(chunks.some(chunk => chunk.type === 0x004e4942), 'no BIN chunk');
    assert.equal(json.asset.version, '2.0');
    assert.ok(json.meshes?.length, 'no meshes');
    assert.ok(json.nodes?.length, 'no nodes');
    assert.ok(json.materials?.length, 'no materials');
  });

  test('carries the named nodes the card looks for', () => {
    const { json } = parseGlb(glb);
    const names = new Set(json.nodes.map(node => node.name).filter(Boolean));
    for (const expected of ['dv_walls', 'dv_floor', 'dv_glass', 'dv_lights']) {
      assert.ok(names.has(expected), `missing node "${expected}" (have: ${[...names].slice(0, 12).join(', ')})`);
    }
  });

  test('every fixture node named in home.json exists in the model', () => {
    const { json } = parseGlb(glb);
    const names = new Set(json.nodes.map(node => node.name).filter(Boolean));
    const referenced = manifest.fixtures.map(fixture => fixture.node).filter(Boolean);
    assert.ok(referenced.length >= 12);
    for (const node of referenced) {
      assert.ok(names.has(node), `home.json references node "${node}" which the GLB does not contain`);
    }
  });

  test('is rotated into the Y-up glTF convention the manifest declares', () => {
    const { json } = parseGlb(glb);
    assert.equal(manifest.model.up, 'Y');
    const rootNode = json.nodes.find(node => node.name === 'dv_root');
    assert.ok(rootNode, 'no dv_root wrapper node');

    // Assert the transform's effect rather than its encoding: glTF allows
    // either a matrix or separate TRS, and the exporter picks the matrix.
    const axis = index => {
      if (rootNode.matrix) {
        // glTF matrices are column-major, so column n is the image of axis n.
        return rootNode.matrix.slice(index * 4, index * 4 + 3);
      }
      const [x, y, z, w] = rootNode.rotation ?? [0, 0, 0, 1];
      const basis = [0, 0, 0];
      basis[index] = 1;
      return rotateByQuaternion(basis, [x, y, z, w]);
    };
    const close = (got, want) => got.every((value, i) => Math.abs(value - want[i]) < 1e-6);

    assert.ok(close(axis(2), [0, 1, 0]), `pack +Z should map to glTF +Y, got ${axis(2)}`);
    assert.ok(close(axis(1), [0, 0, -1]), `pack +Y should map to glTF -Z, got ${axis(1)}`);
    assert.ok(close(axis(0), [1, 0, 0]), `pack +X should stay +X, got ${axis(0)}`);
  });
});

describe('manifest builder', () => {
  test('rebuilding from the saved project reproduces the shipped manifest', async () => {
    const project = JSON.parse(await readFile(path.join(packDir, 'project.domoview.json'), 'utf8'));
    const { buildManifest } = await import('../studio/src/export/manifest.js');
    // Read from package.json: the shipped manifest records the version that
    // generated it, so a hardcoded literal here breaks on every release.
    const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
    const rebuilt = buildManifest(project, { version });
    // shadowCasters are added by the demo generator, not the exporter.
    const shipped = structuredClone(manifest);
    delete shipped.shadowCasters;
    assert.deepEqual(rebuilt, shipped);
  });

  test('assigns unique ids even when two fixtures share a name', async () => {
    const { buildManifest } = await import('../studio/src/export/manifest.js');
    const { emptyProject } = await import('../studio/src/project.js');
    const project = emptyProject();
    project.plan.scale = 0.01;
    project.fixtures = [
      { id: 'a', name: 'Ceiling', kind: 'light', room: null, emitters: [{ point: [0, 0], height: 2.4, type: 'point' }], lumens: 600, color: '#fff', range: 5, bulb: 'glow' },
      { id: 'b', name: 'Ceiling', kind: 'light', room: null, emitters: [{ point: [10, 0], height: 2.4, type: 'point' }], lumens: 600, color: '#fff', range: 5, bulb: 'glow' },
    ];
    const built = buildManifest(project);
    const ids = built.fixtures.map(fixture => fixture.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.join(', ')}`);
  });
});

function rotateByQuaternion([x, y, z], [qx, qy, qz, qw]) {
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ];
}

function pointInPolygon([x, y], polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}
