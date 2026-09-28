import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { crc32, createZip } from '../studio/src/export/zip.js';

const encoder = new TextEncoder();

describe('crc32', () => {
  test('matches the published check values', () => {
    assert.equal(crc32(encoder.encode('')), 0);
    assert.equal(crc32(encoder.encode('123456789')), 0xcbf43926);
    assert.equal(
      crc32(encoder.encode('The quick brown fox jumps over the lazy dog')),
      0x414fa339,
    );
  });
});

/** Read the archive back with a small independent parser. */
function parseZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();

  // Locate the end-of-central-directory record from the tail.
  let end = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  assert.notEqual(end, -1, 'no end-of-central-directory record');

  const count = view.getUint16(end + 10, true);
  const directorySize = view.getUint32(end + 12, true);
  const directoryStart = view.getUint32(end + 16, true);
  assert.equal(directoryStart + directorySize, end, 'central directory does not abut the EOCD');

  const files = [];
  let cursor = directoryStart;
  for (let i = 0; i < count; i++) {
    assert.equal(view.getUint32(cursor, true), 0x02014b50, 'bad central directory signature');
    const crc = view.getUint32(cursor + 16, true);
    const size = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const offset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));

    assert.equal(view.getUint32(offset, true), 0x04034b50, 'bad local header signature');
    const localNameLength = view.getUint16(offset + 26, true);
    const localExtraLength = view.getUint16(offset + 28, true);
    const dataStart = offset + 30 + localNameLength + localExtraLength;
    const content = bytes.subarray(dataStart, dataStart + size);
    assert.equal(crc32(content), crc, `crc mismatch for ${name}`);

    files.push({ name, content, size });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

describe('zip writer', () => {
  test('round-trips text and binary entries', async () => {
    const binary = new Uint8Array(517);
    for (let i = 0; i < binary.length; i++) binary[i] = (i * 37) & 0xff;

    const blob = createZip([
      { name: 'home.json', content: '{"pack":{"schema":1}}' },
      { name: 'model.glb', content: binary },
      { name: 'baked/lights/lamp.png', content: new Uint8Array([1, 2, 3]) },
      { name: 'empty.txt', content: '' },
    ]);
    assert.equal(blob.type, 'application/zip');

    const files = parseZip(new Uint8Array(await blob.arrayBuffer()));
    assert.deepEqual(files.map(file => file.name),
      ['home.json', 'model.glb', 'baked/lights/lamp.png', 'empty.txt']);
    assert.equal(new TextDecoder().decode(files[0].content), '{"pack":{"schema":1}}');
    assert.deepEqual([...files[1].content], [...binary]);
    assert.equal(files[3].size, 0);
  });

  test('normalises backslashes in paths', async () => {
    const blob = createZip([{ name: 'baked\\lights\\a.png', content: 'x' }]);
    const files = parseZip(new Uint8Array(await blob.arrayBuffer()));
    assert.equal(files[0].name, 'baked/lights/a.png');
  });

  test('refuses an archive that would need ZIP64', () => {
    const many = Array.from({ length: 0x10000 }, (_, i) => ({ name: `f${i}`, content: '' }));
    assert.throws(() => createZip(many), /ZIP64/);
  });
});
