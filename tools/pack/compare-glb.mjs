#!/usr/bin/env node
/* Structurally compare two glTF-Binary files.
 *
 * Byte-identical output is not something a geometry pipeline can promise
 * across toolchains: `Math.sin`, `Math.cos` and friends are not specified to
 * be bit-identical between V8 versions, and those last bits land in float32
 * vertex data. A byte comparison therefore fails between Node 22 and Node 24
 * on geometry that is correct in both.
 *
 * What actually matters is that the pipeline still produces the same model, so
 * this compares the things a reader would care about: the node tree, the mesh
 * and material inventory, and every numeric accessor within a tolerance.
 *
 * Usage: node tools/pack/compare-glb.mjs a.glb b.glb [--tolerance 1e-5]
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const COMPONENT_TYPES = {
  5120: { name: 'BYTE', array: Int8Array, size: 1 },
  5121: { name: 'UNSIGNED_BYTE', array: Uint8Array, size: 1 },
  5122: { name: 'SHORT', array: Int16Array, size: 2 },
  5123: { name: 'UNSIGNED_SHORT', array: Uint16Array, size: 2 },
  5125: { name: 'UNSIGNED_INT', array: Uint32Array, size: 4 },
  5126: { name: 'FLOAT', array: Float32Array, size: 4 },
};

const TYPE_COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

/** Parse the GLB container: chapter 4 of the glTF 2.0 specification. */
function parseGlb(buffer, label) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error(`${label}: not a GLB (bad magic)`);
  if (view.getUint32(4, true) !== 2) throw new Error(`${label}: not glTF version 2`);
  if (view.getUint32(8, true) !== buffer.byteLength) {
    throw new Error(`${label}: declared length differs from the file size`);
  }

  let json = null, binary = null, offset = 12;
  while (offset < buffer.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(buffer.subarray(start, start + length)));
    else if (type === 0x004e4942) binary = buffer.subarray(start, start + length);
    offset = start + length;
  }
  if (!json) throw new Error(`${label}: no JSON chunk`);
  return { json, binary };
}

/** Read an accessor's values, following its buffer view and stride. */
function readAccessor({ json, binary }, index) {
  const accessor = json.accessors[index];
  const component = COMPONENT_TYPES[accessor.componentType];
  const components = TYPE_COMPONENTS[accessor.type];
  if (!component || !components) {
    throw new Error(`unsupported accessor ${index}: ${accessor.componentType}/${accessor.type}`);
  }
  const count = accessor.count * components;
  if (accessor.bufferView === undefined) return new component.array(count);

  const bufferView = json.bufferViews[accessor.bufferView];
  const base = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const stride = bufferView.byteStride;

  if (!stride || stride === component.size * components) {
    // Tightly packed: read it in one go.
    const bytes = binary.subarray(base, base + count * component.size);
    return new component.array(bytes.buffer, bytes.byteOffset, count);
  }
  // Interleaved: gather element by element.
  const out = new component.array(count);
  const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
  const readers = {
    5120: view.getInt8, 5121: view.getUint8, 5122: view.getInt16,
    5123: view.getUint16, 5125: view.getUint32, 5126: view.getFloat32,
  };
  const read = readers[accessor.componentType].bind(view);
  for (let element = 0; element < accessor.count; element++) {
    for (let channel = 0; channel < components; channel++) {
      out[element * components + channel] =
        read(base + element * stride + channel * component.size, true);
    }
  }
  return out;
}

/** Node names in tree order, so a reordered hierarchy is caught. */
function nodeTree(json, index = null, depth = 0, out = []) {
  const roots = index === null
    ? (json.scenes?.[json.scene ?? 0]?.nodes ?? [])
    : (json.nodes[index].children ?? []);
  if (index !== null) {
    const node = json.nodes[index];
    out.push(`${'  '.repeat(depth)}${node.name || '(unnamed)'}${node.mesh !== undefined ? ` mesh=${node.mesh}` : ''}`);
  }
  for (const child of roots) nodeTree(json, child, index === null ? 0 : depth + 1, out);
  return out;
}

function summarise(glb) {
  const { json } = glb;
  return {
    generator: json.asset.generator,
    nodes: json.nodes?.length ?? 0,
    meshes: json.meshes?.length ?? 0,
    materials: json.materials?.length ?? 0,
    accessors: json.accessors?.length ?? 0,
    tree: nodeTree(json),
    materialNames: (json.materials ?? []).map(material => material.name ?? '(unnamed)'),
    primitives: (json.meshes ?? []).flatMap((mesh, meshIndex) =>
      mesh.primitives.map((primitive, primitiveIndex) => ({
        key: `mesh${meshIndex}.${primitiveIndex}`,
        mode: primitive.mode ?? 4,
        material: primitive.material,
        indices: primitive.indices,
        attributes: primitive.attributes,
        count: primitive.indices !== undefined
          ? json.accessors[primitive.indices].count
          : json.accessors[primitive.attributes.POSITION].count,
      }))),
  };
}

function compare(a, b, tolerance) {
  const problems = [];
  const left = summarise(a), right = summarise(b);

  for (const field of ['nodes', 'meshes', 'materials', 'accessors']) {
    if (left[field] !== right[field]) {
      problems.push(`${field}: ${left[field]} vs ${right[field]}`);
    }
  }
  if (left.generator !== right.generator) {
    // Not fatal on its own, but worth knowing: a three.js upgrade explains a
    // lot of small numeric differences.
    problems.push(`generator: "${left.generator}" vs "${right.generator}"`);
  }
  if (left.tree.join('\n') !== right.tree.join('\n')) {
    problems.push('node tree differs:\n' + diffLines(left.tree, right.tree));
  }
  if (left.materialNames.join(',') !== right.materialNames.join(',')) {
    problems.push(`material names: ${left.materialNames.join(', ')} vs ${right.materialNames.join(', ')}`);
  }

  if (left.primitives.length === right.primitives.length) {
    let worst = 0, worstWhere = '';
    let totalValues = 0;

    for (let index = 0; index < left.primitives.length; index++) {
      const one = left.primitives[index], two = right.primitives[index];
      if (one.count !== two.count) {
        problems.push(`${one.key}: element count ${one.count} vs ${two.count}`);
        continue;
      }
      if (one.mode !== two.mode) problems.push(`${one.key}: mode ${one.mode} vs ${two.mode}`);

      const names = new Set([...Object.keys(one.attributes), ...Object.keys(two.attributes)]);
      for (const name of names) {
        if (one.attributes[name] === undefined || two.attributes[name] === undefined) {
          problems.push(`${one.key}: attribute ${name} present in only one file`);
          continue;
        }
        const valuesA = readAccessor(a, one.attributes[name]);
        const valuesB = readAccessor(b, two.attributes[name]);
        if (valuesA.length !== valuesB.length) {
          problems.push(`${one.key}.${name}: ${valuesA.length} vs ${valuesB.length} values`);
          continue;
        }
        for (let i = 0; i < valuesA.length; i++) {
          const delta = Math.abs(valuesA[i] - valuesB[i]);
          totalValues++;
          if (delta > worst) { worst = delta; worstWhere = `${one.key}.${name}[${i}]`; }
        }
      }

      if (one.indices !== undefined && two.indices !== undefined) {
        const indicesA = readAccessor(a, one.indices);
        const indicesB = readAccessor(b, two.indices);
        if (indicesA.length !== indicesB.length) {
          problems.push(`${one.key}: index count ${indicesA.length} vs ${indicesB.length}`);
        } else {
          for (let i = 0; i < indicesA.length; i++) {
            // Indices are integers: any difference is a real topology change.
            if (indicesA[i] !== indicesB[i]) {
              problems.push(`${one.key}: index ${i} is ${indicesA[i]} vs ${indicesB[i]}`);
              break;
            }
          }
        }
      }
    }

    if (worst > tolerance) {
      problems.push(`numeric drift ${worst.toExponential(3)} exceeds tolerance ${tolerance.toExponential(3)} at ${worstWhere}`);
    }
    return { problems, worst, totalValues };
  }

  problems.push(`primitive count: ${left.primitives.length} vs ${right.primitives.length}`);
  return { problems, worst: NaN, totalValues: 0 };
}

function diffLines(a, b) {
  const lines = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) lines.push(`  - ${a[i] ?? '(missing)'}\n  + ${b[i] ?? '(missing)'}`);
  }
  return lines.slice(0, 20).join('\n');
}

const args = process.argv.slice(2);
const files = args.filter(argument => !argument.startsWith('--'));
const toleranceIndex = args.indexOf('--tolerance');
const tolerance = toleranceIndex >= 0 ? Number(args[toleranceIndex + 1]) : 1e-5;

if (files.length !== 2) {
  console.error('Usage: node tools/pack/compare-glb.mjs a.glb b.glb [--tolerance 1e-5]');
  process.exit(2);
}

const [pathA, pathB] = files;
const a = parseGlb(await readFile(pathA), path.basename(pathA));
const b = parseGlb(await readFile(pathB), path.basename(pathB));
const { problems, worst, totalValues } = compare(a, b, tolerance);

if (problems.length) {
  console.error(`DIFFERENT  ${path.basename(pathA)} vs ${path.basename(pathB)}`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`EQUIVALENT ${path.basename(pathA)} vs ${path.basename(pathB)}`);
console.log(`  ${totalValues.toLocaleString('en-US')} values compared, worst drift ${worst.toExponential(3)} (tolerance ${tolerance.toExponential(3)})`);
