/* Blinds and weather drawn over a baked composite.
 *
 * Both are 2D overlays keyed to the bake's camera. A glass mask from the bake
 * confines them to actual panes, and the pack's wet surfaces confine
 * precipitation to floors that are really outdoors — rain drawn across a
 * cut-away interior reads as a rendering fault, not as weather.
 */

import { coverEdgeHeight, slatAperture, slatSpacing } from '../../core/covers.js';
import { clamp } from '../../core/geometry.js';

function loadMask(url, size) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, size, size);
      const pixels = context.getImageData(0, 0, size, size);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const brightness = Math.max(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);
        // A render's black backdrop is never exactly zero. Using its value as
        // alpha directly leaves a faint veil across every wall, so cut it off.
        pixels.data[i + 3] = brightness < 100 ? 0 : Math.min(255, (brightness - 100) * 1.65);
      }
      context.putImageData(pixels, 0, 0);
      resolve(canvas);
    };
    image.onerror = () => reject(new Error(`cannot load ${url}`));
    image.src = url;
  });
}

/** Deterministic hash-noise, so particle layouts stay stable across frames. */
function noise(seed) {
  const value = Math.sin(seed * 126.392 + 8.437) * 43758.5453;
  return value - Math.floor(value);
}

export class BakedEnvironment {
  constructor(pack, size, projection) {
    this.pack = pack;
    this.size = size;
    this.projection = projection;
    this.weather = { rain: 0, snow: 0, wind: 0, wetGround: 0, snowCover: 0 };
    this.coverKey = null;
    this.lastFrame = 0;
    this.frame = null;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'domoview-covers';
    this.canvas.width = this.canvas.height = size;
    this.context = this.canvas.getContext('2d');

    this.weatherCanvas = document.createElement('canvas');
    this.weatherCanvas.className = 'domoview-weather';
    this.weatherCanvas.width = this.weatherCanvas.height = size;
    this.weatherContext = this.weatherCanvas.getContext('2d');

    this.glassLayer = document.createElement('canvas');
    this.glassLayer.width = this.glassLayer.height = size;
    this.glassContext = this.glassLayer.getContext('2d');
  }

  async load() {
    const url = this.pack.baked?.masks?.glass;
    if (url) {
      this.glassMask = await loadMask(url, this.size);
      // Blinds that sit in front of the pane overhang its frame slightly, so
      // they need a dilated mask or their edge gets clipped away.
      const dilated = document.createElement('canvas');
      dilated.width = dilated.height = this.size;
      const context = dilated.getContext('2d');
      for (const dy of [-3, 0, 3]) for (const dx of [-3, 0, 3]) context.drawImage(this.glassMask, dx, dy);
      this.frontMask = dilated;
    }
    this.wetMasks = this.buildWetMasks();
    return this;
  }

  /** Clip paths for the pack's outdoor floors, in image space. */
  buildWetMasks() {
    return (this.pack.baked?.surfaces?.wet || []).map(surface => ({
      id: surface.id,
      points: surface.polygon.map(([x, y]) =>
        this.projection.project([x, y, surface.height], this.size)),
    }));
  }

  openingQuad(opening, lower, upper) {
    const [ox, oy] = opening.origin;
    const [tx, ty] = opening.tangent;
    const a = [ox + tx * opening.start, oy + ty * opening.start];
    const b = [ox + tx * opening.end, oy + ty * opening.end];
    return {
      top: [this.projection.project([a[0], a[1], upper], this.size),
            this.projection.project([b[0], b[1], upper], this.size)],
      bottom: [this.projection.project([a[0], a[1], lower], this.size),
               this.projection.project([b[0], b[1], lower], this.size)],
    };
  }

  fillQuad(context, quad) {
    context.beginPath();
    context.moveTo(...quad.top[0]);
    context.lineTo(...quad.top[1]);
    context.lineTo(...quad.bottom[1]);
    context.lineTo(...quad.bottom[0]);
    context.closePath();
    context.fill();
  }

  renderCovers(covers) {
    const key = this.pack.openings.map(opening => {
      const state = covers[opening.id];
      return state ? `${Math.round(state.position)}:${Math.round(state.tilt ?? -1)}` : '-';
    }).join('|');
    if (key === this.coverKey) return;
    this.coverKey = key;

    const behind = this.pack.openings.filter(opening => opening.cover.supported && !opening.cover.inFront);
    const front = this.pack.openings.filter(opening => opening.cover.supported && opening.cover.inFront);

    this.context.clearRect(0, 0, this.size, this.size);
    this.drawCoverGroup(this.context, behind, covers, this.glassMask);
    if (front.length) {
      const layer = document.createElement('canvas');
      layer.width = layer.height = this.size;
      this.drawCoverGroup(layer.getContext('2d'), front, covers, this.frontMask || this.glassMask);
      this.context.drawImage(layer, 0, 0);
    }
  }

  drawCoverGroup(context, openings, covers, mask) {
    for (const opening of openings) {
      const state = covers[opening.id];
      if (!state || !opening.origin) continue;
      const head = opening.levelElevation + opening.head;
      const lower = clamp(coverEdgeHeight(opening, state.position),
        opening.levelElevation + opening.sill, head);
      if (lower >= head - 0.005) continue;

      context.save();
      context.fillStyle = '#737b81';
      context.globalAlpha = 0.96;
      this.fillQuad(context, this.openingQuad(opening, lower, head));

      const aperture = slatAperture(opening, state.position, state.tilt);
      const spacing = slatSpacing(opening);
      for (let height = lower + spacing; height < head; height += spacing) {
        const slatTop = Math.min(head, height + 0.012);
        context.fillStyle = '#b2b8bb';
        context.globalAlpha = 0.78;
        this.fillQuad(context, this.openingQuad(opening, height, slatTop));
        if (aperture > 0.01) {
          const gap = Math.min(head, slatTop + spacing * aperture * 0.5);
          context.fillStyle = 'rgba(21,33,39,.5)';
          context.globalAlpha = Math.min(0.8, aperture * 2.1);
          this.fillQuad(context, this.openingQuad(opening, slatTop, gap));
        }
      }
      context.restore();
    }
    if (mask) {
      context.globalCompositeOperation = 'destination-in';
      context.drawImage(mask, 0, 0);
      context.globalCompositeOperation = 'source-over';
    }
  }

  setWeather(weather) {
    this.weather = weather;
    const active = weather.rain || weather.snow || weather.snowCover || weather.wetGround;
    if (!active) {
      this.weatherContext.clearRect(0, 0, this.size, this.size);
      this.stop();
    } else if (!this.frame) {
      this.frame = requestAnimationFrame(time => this.drawWeather(time));
    }
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  clipTo(context, points) {
    context.beginPath();
    points.forEach(([x, y], index) => (index ? context.lineTo(x, y) : context.moveTo(x, y)));
    context.closePath();
    context.clip();
  }

  drawWeather(time) {
    this.frame = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.hidden || (reduced && time - this.lastFrame < 900) || time - this.lastFrame < 70) {
      this.frame = requestAnimationFrame(next => this.drawWeather(next));
      return;
    }
    this.lastFrame = time;

    const context = this.weatherContext;
    const { rain, snow, wind, wetGround, snowCover } = this.weather;
    context.clearRect(0, 0, this.size, this.size);
    const moving = time / 1000;

    for (const surface of this.wetMasks) {
      if (!wetGround && !snowCover && !rain && !snow) break;
      context.save();
      this.clipTo(context, surface.points);
      if (snowCover || wetGround) {
        context.fillStyle = snowCover
          ? `rgba(235,242,247,${Math.min(0.66, 0.2 + snowCover * 0.42)})`
          : `rgba(28,43,54,${Math.min(0.3, 0.1 + wetGround * 0.18)})`;
        context.fillRect(0, 0, this.size, this.size);
      }
      if (rain) {
        context.fillStyle = `rgba(30,49,58,${Math.min(0.14, 0.05 + rain * 0.08)})`;
        context.fillRect(0, 0, this.size, this.size);
        context.strokeStyle = 'rgba(208,231,240,.45)';
        context.lineWidth = 1.2;
        const count = Math.round(70 + rain * 100);
        for (let i = 0; i < count; i++) {
          const x = (noise(i + 21) * this.size + moving * (34 + wind * 22)) % this.size;
          const y = (noise(i + 510) * this.size + moving * (100 + rain * 160)) % this.size;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x + 2 + wind * 3, y + 7 + rain * 7);
          context.stroke();
        }
      }
      if (snow) {
        context.fillStyle = 'rgba(245,250,252,.77)';
        const count = Math.round(45 + snow * 70);
        for (let i = 0; i < count; i++) {
          const x = (noise(i + 940) * this.size + moving * (12 + wind * 22)) % this.size;
          const y = (noise(i + 1900) * this.size + moving * (20 + snow * 27)) % this.size;
          context.beginPath();
          context.arc(x, y, 0.7 + noise(i + 245) * 1.4, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.restore();
    }

    if (rain || snow) this.drawGlassWeather(moving);
    if (rain || snow) this.frame = requestAnimationFrame(next => this.drawWeather(next));
  }

  drawGlassWeather(moving) {
    const context = this.glassContext;
    const { rain, snow } = this.weather;
    context.clearRect(0, 0, this.size, this.size);

    for (const opening of this.pack.openings) {
      if (!opening.origin || !opening.admitsLight) continue;
      const quad = this.openingQuad(opening,
        opening.levelElevation + opening.sill, opening.levelElevation + opening.head);
      const xs = [...quad.top, ...quad.bottom].map(point => point[0]);
      const ys = [...quad.top, ...quad.bottom].map(point => point[1]);
      const left = Math.min(...xs), right = Math.max(...xs);
      const upper = Math.min(...ys), lower = Math.max(...ys);

      context.save();
      this.clipTo(context, [quad.top[0], quad.top[1], quad.bottom[1], quad.bottom[0]]);
      if (rain) {
        context.strokeStyle = `rgba(214,236,244,${0.22 + rain * 0.24})`;
        context.lineWidth = 1;
        for (let i = 0; i < 55; i++) {
          const x = left + noise(i + opening.start * 117) * Math.max(1, right - left);
          const y = upper + ((noise(i + opening.end * 219) + (moving * 0.22 + i * 0.017)) % 1) *
            Math.max(1, lower - upper);
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x + 0.3, y + 1.5 + noise(i + 88) * 6);
          context.stroke();
        }
      }
      if (snow) {
        context.fillStyle = 'rgba(244,249,253,.53)';
        for (let i = 0; i < 35; i++) {
          const x = (noise(i + opening.start * 31) * this.size + moving * 8) % this.size;
          const y = (noise(i + opening.end * 51) * this.size + moving * 17) % this.size;
          context.beginPath();
          context.arc(x, y, 1, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.restore();
    }

    if (this.glassMask) {
      context.globalCompositeOperation = 'destination-in';
      context.drawImage(this.glassMask, 0, 0);
      context.globalCompositeOperation = 'source-over';
    }
    this.weatherContext.drawImage(this.glassLayer, 0, 0);
  }
}
