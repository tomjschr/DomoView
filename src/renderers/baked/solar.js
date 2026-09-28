/* Screen-space sun and moon for the baked renderer.
 *
 * The bake ships a G-buffer: one image holding each pixel's world position
 * packed into RGB across the model bounds, another holding its normal. That is
 * enough to ask, per pixel, "does a ray from here reach the sky through an
 * opening?" — so direct light moves through the home at runtime without ever
 * re-rendering the geometry.
 *
 * Only upward-facing surfaces get patches. An 8-bit position map is too coarse
 * on vertical faces: the quantisation error there is larger than the width of a
 * blind's edge and produced visible speckle in the original implementation.
 */

import { insidePolygon, boxBlocks, railBlocks } from '../../core/geometry.js';
import { transmitsAt } from '../../core/covers.js';

const UP_FACING_MIN = 0.55;
const FACING_MIN = 0.035;
/** How far to trace when looking for something that shades an outdoor deck. */
const OUTDOOR_RAY_LIMIT = 18;

function loadPixels(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    };
    image.onerror = () => reject(new Error(`cannot load ${url}`));
    image.src = url;
  });
}

export class BakedSolar {
  constructor(pack) {
    this.pack = pack;
    this.ready = false;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'domoview-solar';
    this.context = this.canvas.getContext('2d');
    this.moonCanvas = document.createElement('canvas');
    this.moonCanvas.className = 'domoview-solar';
    this.moonContext = this.moonCanvas.getContext('2d');
    this.lastKey = null;
    this.lastMoonKey = null;
  }

  async load() {
    const gbuffer = this.pack.baked?.gbuffer;
    if (!gbuffer) return this;
    const [position, normal] = await Promise.all([
      loadPixels(gbuffer.position),
      loadPixels(gbuffer.normal),
    ]);
    if (position.width !== position.height) {
      throw new Error('position G-buffer must be square');
    }
    this.size = position.width;
    this.position = position.data;
    this.normal = normal.data;
    this.canvas.width = this.canvas.height = this.size;
    this.moonCanvas.width = this.moonCanvas.height = this.size;

    this.bounds = this.pack.model.bounds;
    this.span = this.bounds.max.map((value, i) => value - this.bounds.min[i]);
    this.roomLabels = this.buildRoomLabels();
    this.ready = true;
    return this;
  }

  /** Decode a pixel's baked world position. */
  worldAt(index) {
    const base = index * 4;
    return [
      this.bounds.min[0] + this.position[base] / 255 * this.span[0],
      this.bounds.min[1] + this.position[base + 1] / 255 * this.span[1],
      this.bounds.min[2] + this.position[base + 2] / 255 * this.span[2],
    ];
  }

  /**
   * Room index per G-buffer pixel, 1-based, 0 for none. Used both here (to
   * limit a window's light to the room it opens into) and by the compositor
   * (to shade a room whose blinds are down).
   */
  buildRoomLabels() {
    const rooms = this.pack.rooms.filter(room => room.polygon);
    this.labelledRooms = rooms;
    const labels = new Uint8Array(this.size * this.size);
    if (!rooms.length) return labels;
    for (let pixel = 0; pixel < labels.length; pixel++) {
      if (this.position[pixel * 4 + 3] < 128) continue;
      const [x, y] = this.worldAt(pixel);
      for (let index = 0; index < rooms.length; index++) {
        if (insidePolygon(x, y, rooms[index].polygon)) { labels[pixel] = index + 1; break; }
      }
    }
    return labels;
  }

  roomIndexOf(roomId) {
    return this.labelledRooms.findIndex(room => room.id === roomId) + 1;
  }

  /**
   * Paint the direct patches for one body.
   * @param {'sun'|'moon'} kind
   */
  render(kind, azimuth, elevation, strength, covers, color) {
    if (!this.ready) return;
    const moon = kind === 'moon';
    const context = moon ? this.moonContext : this.context;
    const keyName = moon ? 'lastMoonKey' : 'lastKey';
    const coverKey = this.pack.openings.map(opening => {
      const state = covers[opening.id];
      return state ? `${Math.round(state.position)}:${Math.round(state.tilt ?? -1)}` : '-';
    }).join(',');
    const key = `${azimuth.toFixed(1)}/${elevation.toFixed(1)}/${strength.toFixed(3)}/${coverKey}`;
    if (key === this[keyName]) return;
    this[keyName] = key;

    const size = this.size;
    if (elevation <= 0 || strength <= 0.005) {
      context.clearRect(0, 0, size, size);
      return;
    }

    const radians = Math.PI / 180;
    const azimuthRad = (azimuth - this.pack.meta.north) * radians;
    const elevationRad = elevation * radians;
    const direction = [
      Math.sin(azimuthRad) * Math.cos(elevationRad),
      Math.cos(azimuthRad) * Math.cos(elevationRad),
      Math.sin(elevationRad),
    ];

    // Only openings the body can actually see from outside are candidates.
    const openings = this.pack.windows.filter(opening => opening.normal &&
      direction[0] * opening.normal[0] + direction[1] * opening.normal[1] > 0.045);
    const outdoorIndices = new Set(this.pack.rooms
      .map((room, index) => (room.outdoor && room.polygon ? index + 1 : 0))
      .filter(Boolean));

    const maxAlpha = moon ? 0.19 : 0.55;
    const gain = moon ? 0.32 : 0.52;
    const outdoorMaxAlpha = moon ? 0.25 : 0.67;
    const outdoorGain = moon ? 0.39 : 0.57;

    const result = context.createImageData(size, size);
    const out = result.data;

    for (let pixel = 0; pixel < size * size; pixel++) {
      const base = pixel * 4;
      if (this.position[base + 3] < 128) continue;

      const nz = this.normal[base + 2] / 127.5 - 1;
      if (nz < UP_FACING_MIN) continue;
      const nx = this.normal[base] / 127.5 - 1;
      const ny = this.normal[base + 1] / 127.5 - 1;
      const facing = Math.max(0, nx * direction[0] + ny * direction[1] + nz * direction[2]);
      if (facing < FACING_MIN) continue;

      const [x, y, z] = this.worldAt(pixel);
      const label = this.roomLabels[pixel];

      if (outdoorIndices.has(label)) {
        if (this.outdoorShaded(x, y, z, direction)) continue;
        const exposure = strength * Math.sqrt(facing);
        out[base] = color[0]; out[base + 1] = color[1]; out[base + 2] = color[2];
        out[base + 3] = Math.round(Math.min(outdoorMaxAlpha, exposure * outdoorGain) * 255);
        continue;
      }

      for (const opening of openings) {
        if (!this.pixelBelongsTo(opening, label, x, y)) continue;
        const denominator = direction[0] * opening.normal[0] + direction[1] * opening.normal[1];
        const distance = ((opening.origin[0] - x) * opening.normal[0] +
                          (opening.origin[1] - y) * opening.normal[1]) / denominator;
        if (distance <= 0.005) continue;

        const hitX = x + distance * direction[0] - opening.origin[0];
        const hitY = y + distance * direction[1] - opening.origin[1];
        const along = hitX * opening.tangent[0] + hitY * opening.tangent[1];
        const height = z + distance * direction[2];
        const sill = opening.levelElevation + opening.sill;
        const head = opening.levelElevation + opening.head;
        if (along < opening.start || along > opening.end || height < sill || height > head) continue;
        if (!transmitsAt(opening, covers[opening.id], height)) continue;
        if (opening.mullion !== null &&
            Math.abs(along - (opening.offset + opening.mullion)) < 0.025) continue;
        if (this.blockedBefore(x, y, z, direction, distance)) continue;

        const exposure = strength * Math.sqrt(facing) * Math.min(1, denominator * 2.1);
        out[base] = color[0]; out[base + 1] = color[1]; out[base + 2] = color[2];
        out[base + 3] = Math.round(Math.min(maxAlpha, exposure * gain) * 255);
        break;
      }
    }
    context.putImageData(result, 0, 0);
  }

  /**
   * A window only lights the rooms it opens into. Falling back to the polygon
   * test covers packs whose rooms overlap in plan across levels.
   */
  pixelBelongsTo(opening, label, x, y) {
    if (!opening.rooms.length) return false;
    if (label) {
      const room = this.labelledRooms[label - 1];
      return opening.rooms.includes(room.id);
    }
    return opening.roomPolygons.some(polygon => insidePolygon(x, y, polygon));
  }

  blockedBefore(x, y, z, direction, distance) {
    const point = [x, y, z];
    for (const box of this.pack.occluders) {
      if (boxBlocks(point, direction, distance, box)) return true;
    }
    for (const caster of this.pack.shadowCasters) {
      if (railBlocks(x, y, z, direction, distance, caster)) return true;
    }
    return false;
  }

  outdoorShaded(x, y, z, direction) {
    const point = [x, y, z];
    for (const box of this.pack.occluders) {
      if (boxBlocks(point, direction, OUTDOOR_RAY_LIMIT, box)) return true;
    }
    for (const caster of this.pack.shadowCasters) {
      if (railBlocks(x, y, z, direction, 0, caster)) return true;
    }
    return false;
  }
}
