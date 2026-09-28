/* Minimal ZIP writer, stored (uncompressed) entries only.
 *
 * A Home Pack is a GLB plus PNGs plus one small JSON: everything but the JSON
 * is already compressed, so deflate would buy a few percent for the cost of a
 * dependency. Storing keeps the Studio free of third-party code and the output
 * readable by every unzip tool.
 *
 * Format reference: PKWARE APPNOTE, sections 4.3.7 (local header),
 * 4.3.12 (central directory) and 4.3.16 (end of central directory).
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let value = i;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** MS-DOS packed date and time, which is what ZIP stores. */
function dosStamp(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function toBytes(content) {
  if (content instanceof Uint8Array) return content;
  if (content instanceof ArrayBuffer) return new Uint8Array(content);
  if (ArrayBuffer.isView(content)) return new Uint8Array(content.buffer, content.byteOffset, content.byteLength);
  return new TextEncoder().encode(String(content));
}

class ByteWriter {
  constructor() {
    this.chunks = [];
    this.length = 0;
  }

  push(bytes) {
    this.chunks.push(bytes);
    this.length += bytes.length;
  }

  struct(fields) {
    const size = fields.reduce((total, [width]) => total + width, 0);
    const buffer = new ArrayBuffer(size);
    const view = new DataView(buffer);
    let offset = 0;
    for (const [width, value] of fields) {
      if (width === 2) view.setUint16(offset, value, true);
      else view.setUint32(offset, value, true);
      offset += width;
    }
    this.push(new Uint8Array(buffer));
  }

  toBlob(type = 'application/zip') {
    return new Blob(this.chunks, { type });
  }
}

/**
 * Build a ZIP archive.
 * @param {Array<{name: string, content: any, date?: Date}>} entries
 * @returns {Blob}
 */
export function createZip(entries) {
  if (entries.length > 0xffff) {
    throw new Error('Too many files for a non-ZIP64 archive');
  }
  const writer = new ByteWriter();
  const directory = [];
  const encoder = new TextEncoder();

  for (const entry of entries) {
    const name = encoder.encode(entry.name.replace(/\\/g, '/'));
    const bytes = toBytes(entry.content);
    if (bytes.length > 0xffffffff) {
      throw new Error(`${entry.name} is too large for a non-ZIP64 archive`);
    }
    const crc = crc32(bytes);
    const stamp = dosStamp(entry.date);
    const offset = writer.length;

    writer.struct([
      [4, 0x04034b50],   // local file header signature
      [2, 20],           // version needed to extract
      [2, 0x0800],       // general purpose flags: UTF-8 file names
      [2, 0],            // compression method: stored
      [2, stamp.time],
      [2, stamp.date],
      [4, crc],
      [4, bytes.length], // compressed size
      [4, bytes.length], // uncompressed size
      [2, name.length],
      [2, 0],            // extra field length
    ]);
    writer.push(name);
    writer.push(bytes);

    directory.push({ name, crc, size: bytes.length, stamp, offset });
  }

  const directoryStart = writer.length;
  for (const entry of directory) {
    writer.struct([
      [4, 0x02014b50],   // central directory header signature
      [2, 20],           // version made by
      [2, 20],           // version needed
      [2, 0x0800],
      [2, 0],
      [2, entry.stamp.time],
      [2, entry.stamp.date],
      [4, entry.crc],
      [4, entry.size],
      [4, entry.size],
      [2, entry.name.length],
      [2, 0],            // extra
      [2, 0],            // comment
      [2, 0],            // disk number start
      [2, 0],            // internal attributes
      [4, 0],            // external attributes
      [4, entry.offset],
    ]);
    writer.push(entry.name);
  }
  const directorySize = writer.length - directoryStart;

  writer.struct([
    [4, 0x06054b50],     // end of central directory signature
    [2, 0],              // this disk
    [2, 0],              // disk with the central directory
    [2, directory.length],
    [2, directory.length],
    [4, directorySize],
    [4, directoryStart],
    [2, 0],              // comment length
  ]);

  return writer.toBlob();
}

/** Hand a Blob to the browser as a download. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
