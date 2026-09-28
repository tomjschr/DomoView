/* Linear-light compositor for baked packs.
 *
 * Adds the day and night beauty renders, each lamp's pre-rendered light delta
 * and the runtime sun patch. Light adds linearly, so everything is decoded to
 * linear, summed, and encoded back to sRGB once per pixel — blending in gamma
 * space would make two lamps at half brightness brighter than one at full.
 */

import { clamp } from '../../core/geometry.js';
import { resampleIndices } from './projection.js';

/** sRGB byte to linear, and a finely quantised way back. */
const TO_LINEAR = Float32Array.from({ length: 256 }, (_, value) => {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
});
const TO_SRGB = Uint8Array.from({ length: 8193 }, (_, index) => {
  const channel = index / 8192;
  return Math.round(255 * (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055));
});
const encode = value => TO_SRGB[clamp(Math.round(value * 8192), 0, 8192)];

/** Residual ambient in the night render that a closed facade must also dim. */
const NIGHT_FILL_SHARE = 0.15;
const SUN_OVERLAY_GAIN = 0.43;

function imageData(url, size) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, size, size);
      resolve(context.getImageData(0, 0, size, size).data);
    };
    image.onerror = () => reject(new Error(`cannot load ${url}`));
    image.src = url;
  });
}

/**
 * Normalised channel ratio for re-tinting a baked light delta. The delta was
 * rendered at the fixture's reference colour; dividing that out and applying
 * the reported colour lets an RGB bulb change hue without a new bake.
 */
function tintFactors(reported, reference) {
  if (!reported || !reference) return [1, 1, 1];
  const peak = array => Math.max(1e-3, Math.max(...array));
  const a = reported.map(value => value / peak(reported));
  const b = reference.map(value => value / peak(reference));
  return a.map((value, index) => clamp(value / Math.max(1e-3, b[index]), 0.2, 3));
}

export class BakedCompositor {
  constructor(pack, size, { onError = () => {} } = {}) {
    this.pack = pack;
    this.size = size;
    this.onError = onError;
    this.masks = new Map();
    this.request = 0;
    this.ready = false;
    this.lastKey = null;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'domoview-composite';
    this.canvas.width = this.canvas.height = size;
    this.context = this.canvas.getContext('2d');

    this.overlay = document.createElement('canvas');
    this.overlay.width = this.overlay.height = size;
    this.overlayContext = this.overlay.getContext('2d', { willReadFrequently: true });
  }

  async load() {
    const baked = this.pack.baked;
    const sources = [imageData(baked.day, this.size), imageData(baked.night, this.size)];
    sources.push(baked.masks.exterior ? imageData(baked.masks.exterior, this.size) : Promise.resolve(null));
    const [day, night, exterior] = await Promise.all(sources);
    this.day = day;
    this.night = night;
    this.exterior = exterior;
    this.ready = true;
    return this;
  }

  /** Per-fixture light delta, fetched and cached on first use. */
  lightDelta(fixtureId) {
    if (!this.masks.has(fixtureId)) {
      const url = this.pack.baked.lights[fixtureId];
      if (!url) {
        this.masks.set(fixtureId, Promise.resolve(null));
      } else {
        this.masks.set(fixtureId, imageData(url, this.size).catch(error => {
          // A missing delta should dim one lamp, not break the whole picture.
          console.warn(`DomoView: light delta for ${fixtureId} unavailable`, error);
          return null;
        }));
      }
    }
    return this.masks.get(fixtureId);
  }

  /**
   * Room membership per composite pixel, plus how strongly each pixel should
   * follow its room's shading.
   *
   * Seeding from clean floor pixels and flood-filling in image space is
   * deliberate: walls and furniture sit on room boundaries where the 8-bit
   * world position is ambiguous, and thresholding it directly speckles.
   */
  buildRoomCoverage(solar) {
    const count = this.size * this.size;
    const source = this.indices;
    const rooms = solar.labelledRooms;
    const levelElevation = new Map(this.pack.levels.map(level => [level.id, level.elevation]));

    const labels = new Uint8Array(count);
    const queue = new Uint32Array(count);
    let head = 0, tail = 0;

    for (let pixel = 0; pixel < count; pixel++) {
      const index = source[pixel];
      const room = solar.roomLabels[index];
      if (!room) continue;
      const floor = levelElevation.get(rooms[room - 1].level) ?? 0;
      const z = solar.worldAt(index)[2];
      if (z < floor - 0.06 || z > floor + 0.17) continue;
      if (solar.normal[index * 4 + 2] <= 215) continue;
      labels[pixel] = room;
      queue[tail++] = pixel;
    }

    const push = (neighbour, room) => {
      if (!labels[neighbour]) { labels[neighbour] = room; queue[tail++] = neighbour; }
    };
    while (head < tail) {
      const pixel = queue[head++], room = labels[pixel];
      const x = pixel % this.size;
      if (x > 0) push(pixel - 1, room);
      if (x < this.size - 1) push(pixel + 1, room);
      if (pixel >= this.size) push(pixel - this.size, room);
      if (pixel < count - this.size) push(pixel + this.size, room);
    }

    this.roomLabel = labels;
    this.roomWeight = new Uint8Array(count);
    for (let pixel = 0; pixel < count; pixel++) {
      if (!labels[pixel] || !this.day[pixel * 4 + 3]) { this.roomLabel[pixel] = 0; continue; }
      // The facade seen from outside keeps full daylight even when the rooms
      // behind it are shut; the exterior mask marks exactly those pixels.
      this.roomWeight[pixel] = this.exterior ? 255 - this.exterior[pixel * 4] : 255;
    }
    this.roomOrder = rooms.map(room => room.id);
  }

  prepare(solar) {
    if (!solar?.ready || this.sampleSource === solar.size) return;
    this.indices = resampleIndices(this.size, solar.size);
    this.sampleSource = solar.size;
    this.buildRoomCoverage(solar);
  }

  /**
   * @param {object} snapshot scene state
   * @param {BakedSolar} solar loaded G-buffer projector
   * @param {Function} onDraw called once new pixels are on the canvas
   */
  render(snapshot, solar, onDraw) {
    if (!this.ready) return;
    this.prepare(solar);

    const active = snapshot.emitters.filter(item => this.pack.baked.lights[item.id]);
    const factors = this.roomOrder
      ? this.roomOrder.map(id => snapshot.roomDaylight.get(id) ?? 1)
      : [];
    const key = [
      snapshot.daylight.toFixed(3),
      solar?.lastKey || '', solar?.lastMoonKey || '',
      factors.map(value => value.toFixed(2)).join(','),
      active.map(item => `${item.id}:${item.level.toFixed(3)}:${item.color.join('.')}`).join(','),
    ].join('|');
    if (key === this.lastKey) return;
    this.lastKey = key;

    const request = ++this.request;
    Promise.all(active.map(item => this.lightDelta(item.id))).then(deltas => {
      if (request !== this.request) return;
      this.composite(snapshot, solar, active, deltas, factors);
      onDraw();
    }).catch(error => {
      this.lastKey = null;
      this.onError(error);
    });
  }

  composite(snapshot, solar, active, deltas, factors) {
    const size = this.size;
    let sky = null;
    if (solar?.ready) {
      // A single blur softens the hard edges the point-sampled G-buffer leaves
      // along a patch boundary.
      this.overlayContext.clearRect(0, 0, size, size);
      this.overlayContext.filter = 'blur(1.5px)';
      this.overlayContext.drawImage(solar.canvas, 0, 0, size, size);
      this.overlayContext.drawImage(solar.moonCanvas, 0, 0, size, size);
      this.overlayContext.filter = 'none';
      sky = this.overlayContext.getImageData(0, 0, size, size).data;
    }

    const tints = active.map((item, index) =>
      (deltas[index] ? tintFactors(item.color, item.fixture.light.color) : null));

    const result = this.context.createImageData(size, size);
    const out = result.data, day = this.day, night = this.night;
    const daylight = snapshot.daylight;

    for (let i = 0; i < out.length; i += 4) {
      const pixel = i >> 2;
      const label = this.roomLabel?.[pixel];
      const roomFactor = label
        ? 1 - (1 - factors[label - 1]) * this.roomWeight[pixel] / 255
        : 1;

      const mixDay = clamp(daylight * roomFactor);
      const mixNight = 1 - mixDay;
      let r = TO_LINEAR[day[i]] * mixDay + TO_LINEAR[night[i]] * mixNight;
      let g = TO_LINEAR[day[i + 1]] * mixDay + TO_LINEAR[night[i + 1]] * mixNight;
      let b = TO_LINEAR[day[i + 2]] * mixDay + TO_LINEAR[night[i + 2]] * mixNight;

      const shade = 1 - NIGHT_FILL_SHARE * (1 - roomFactor);
      r *= shade; g *= shade; b *= shade;

      for (let j = 0; j < deltas.length; j++) {
        const delta = deltas[j];
        if (!delta) continue;
        const level = active[j].level, tint = tints[j];
        r += TO_LINEAR[delta[i]] * level * tint[0];
        g += TO_LINEAR[delta[i + 1]] * level * tint[1];
        b += TO_LINEAR[delta[i + 2]] * level * tint[2];
      }

      if (sky && sky[i + 3]) {
        const intensity = sky[i + 3] / 255 * SUN_OVERLAY_GAIN;
        r += TO_LINEAR[sky[i]] * intensity;
        g += TO_LINEAR[sky[i + 1]] * intensity;
        b += TO_LINEAR[sky[i + 2]] * intensity;
      }

      out[i] = encode(r);
      out[i + 1] = encode(g);
      out[i + 2] = encode(b);
      out[i + 3] = Math.max(day[i + 3], night[i + 3]);
    }
    this.context.putImageData(result, 0, 0);
  }
}
