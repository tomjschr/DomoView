#!/usr/bin/env node
/* Validate a Home Pack.
 *
 * Two passes, because they catch different mistakes:
 *   1. JSON Schema — is every field the right shape?
 *   2. Semantic checks — do the references resolve, do walls face outward,
 *      do the baked assets that home.json promises actually exist?
 *
 * Usage: node tools/pack/validate.mjs <path to home.json or pack folder> [...]
 */

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { normalisePack, inspectPack } from '../../src/core/pack.js';

const schemaPath = path.join(import.meta.dirname, '../../schemas/home-pack-1.schema.json');

async function loadValidator() {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/** Checks the schema cannot express: cross-references and geometric sanity. */
async function semanticChecks(manifest, root) {
  const problems = [];
  const notes = [];

  const roomIds = new Set((manifest.rooms || []).map(room => room.id));
  const wallIds = new Set((manifest.walls || []).map(wall => wall.id));
  const levelIds = new Set((manifest.levels || []).map(level => level.id));
  if (!levelIds.size) levelIds.add('ground');

  for (const room of manifest.rooms || []) {
    if (room.level && !levelIds.has(room.level)) {
      problems.push(`room "${room.id}" references unknown level "${room.level}"`);
    }
    if (room.polygon && room.polygon.length < 3) {
      problems.push(`room "${room.id}" has a polygon with fewer than three points`);
    }
  }
  for (const wall of manifest.walls || []) {
    if (wall.level && !levelIds.has(wall.level)) {
      problems.push(`wall "${wall.id}" references unknown level "${wall.level}"`);
    }
    if (Math.hypot(wall.b[0] - wall.a[0], wall.b[1] - wall.a[1]) < 0.02) {
      problems.push(`wall "${wall.id}" is shorter than 2 cm`);
    }
  }
  for (const opening of manifest.openings || []) {
    if (opening.wall && !wallIds.has(opening.wall)) {
      problems.push(`opening "${opening.id}" references unknown wall "${opening.wall}"`);
    }
    for (const roomId of opening.rooms || []) {
      if (!roomIds.has(roomId)) {
        problems.push(`opening "${opening.id}" references unknown room "${roomId}"`);
      }
    }
    if (opening.head !== undefined && opening.sill !== undefined && opening.head <= opening.sill) {
      problems.push(`opening "${opening.id}" has its head at or below its sill`);
    }
  }
  for (const fixture of manifest.fixtures || []) {
    if (fixture.room && !roomIds.has(fixture.room)) {
      problems.push(`fixture "${fixture.id}" references unknown room "${fixture.room}"`);
    }
    if (!fixture.emitters?.length && !fixture.node) {
      notes.push(`fixture "${fixture.id}" has neither emitters nor a GLB node`);
    }
  }

  // Referenced files must exist, or the card shows a broken scene.
  const assets = [manifest.model?.url];
  if (manifest.baked) {
    assets.push(manifest.baked.day, manifest.baked.night,
      manifest.baked.gbuffer?.position, manifest.baked.gbuffer?.normal,
      manifest.baked.masks?.exterior, manifest.baked.masks?.glass,
      ...Object.values(manifest.baked.lights || {}));
  }
  for (const variant of manifest.variants || []) assets.push(variant.model);
  for (const asset of assets.filter(Boolean)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(asset) || asset.startsWith('/')) continue;
    if (!await exists(path.join(root, asset))) {
      problems.push(`missing file: ${asset}`);
    }
  }

  // Exterior walls whose normal points at the home's centre are almost always
  // traced the wrong way round, and daylight then enters from inside.
  const pack = normalisePack(structuredClone(manifest), root);
  const centre = [
    (pack.model.bounds.min[0] + pack.model.bounds.max[0]) / 2,
    (pack.model.bounds.min[1] + pack.model.bounds.max[1]) / 2,
  ];
  for (const wall of pack.walls.filter(entry => entry.exterior)) {
    const mid = [(wall.a[0] + wall.b[0]) / 2, (wall.a[1] + wall.b[1]) / 2];
    const towards = [centre[0] - mid[0], centre[1] - mid[1]];
    if (wall.normal[0] * towards[0] + wall.normal[1] * towards[1] > 0) {
      notes.push(`exterior wall "${wall.id}" faces the inside of the home; set flip on it`);
    }
  }

  return { problems, notes, pack };
}

async function validateOne(target, validate) {
  const resolved = path.resolve(target);
  const isDirectory = (await stat(resolved)).isDirectory();
  const manifestPath = isDirectory ? path.join(resolved, 'home.json') : resolved;
  const root = path.dirname(manifestPath);

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    console.error(`FAIL ${path.relative(process.cwd(), manifestPath)}\n  cannot read: ${error.message}`);
    return false;
  }

  const label = path.relative(process.cwd(), manifestPath) || manifestPath;
  const schemaOk = validate(manifest);
  const schemaErrors = schemaOk ? [] : validate.errors.map(error =>
    `${error.instancePath || '/'} ${error.message}${error.params?.allowedValues ? ` (${error.params.allowedValues.join(', ')})` : ''}`);

  let semantic = { problems: [], notes: [] };
  try {
    semantic = await semanticChecks(manifest, root);
  } catch (error) {
    semantic.problems.push(`pack could not be normalised: ${error.message}`);
  }

  const failed = schemaErrors.length > 0 || semantic.problems.length > 0;
  console.log(`${failed ? 'FAIL' : 'OK  '} ${label}`);

  for (const error of schemaErrors) console.log(`  schema:   ${error}`);
  for (const problem of semantic.problems) console.log(`  problem:  ${problem}`);
  for (const note of semantic.notes) console.log(`  note:     ${note}`);
  if (semantic.pack && !failed) {
    const pack = semantic.pack;
    console.log(`  ${pack.meta.name} — ${pack.rooms.length} rooms, ${pack.lights.length} lights, ` +
      `${pack.windows.length} windows, ${pack.baked ? 'baked' : 'live only'}`);
    for (const warning of inspectPack(pack)) console.log(`  note:     ${warning}`);
  }
  return !failed;
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('Usage: node tools/pack/validate.mjs <home.json or pack folder> [...]');
  process.exit(2);
}

const validate = await loadValidator();
let allPassed = true;
for (const target of targets) {
  allPassed = (await validateOne(target, validate)) && allPassed;
}
process.exit(allPassed ? 0 : 1);
