/* Baked renderer: assembles pre-rendered images instead of rasterising the GLB.
 *
 * Locked to the camera the pack was baked from, and far cheaper per frame than
 * the live renderer, which makes it the better choice on wall tablets. It
 * presents the same interface as the live renderer so the card does not care
 * which one it is holding.
 */

import { BakedSolar } from './solar.js';
import { BakedCompositor } from './compositor.js';
import { BakedEnvironment } from './environment.js';
import { BakeProjection } from './projection.js';

/** Composite resolution per quality tier, capped by the bake's own size. */
const MAX_SIZE = { low: 768, medium: 1408, high: 2048 };

export class BakedRenderer {
  constructor({ pack, quality = 'medium', showWeather = true, onError = () => {} }) {
    if (!pack.baked) throw new Error('pack has no baked assets');
    this.pack = pack;
    this.qualityName = quality;
    this.showWeather = showWeather;
    this.onError = onError;
    this.disposed = false;
    this.ready = false;

    const camera = pack.cameras.find(entry => entry.id === pack.baked.camera) ||
      pack.cameras.find(entry => entry.default) || pack.cameras[0];
    this.camera = camera;
    this.projection = new BakeProjection(camera, pack.model.bounds, pack.meta.north);

    this.layer = document.createElement('div');
    this.layer.className = 'domoview-baked';
  }

  chooseSize(container) {
    const width = container?.clientWidth || 960;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const ceiling = Math.min(this.pack.baked.size, MAX_SIZE[this.qualityName] ?? 1408);
    // Round to a multiple of 128 so a slow resize does not re-decode every
    // image for a two-pixel change.
    const target = Math.ceil(width * ratio / 128) * 128;
    return Math.min(ceiling, Math.max(512, target));
  }

  async init(container) {
    this.container = container;
    container.append(this.layer);
    this.size = this.chooseSize(container);

    this.solar = new BakedSolar(this.pack);
    this.compositor = new BakedCompositor(this.pack, this.size, { onError: this.onError });
    this.environment = new BakedEnvironment(this.pack, this.size, this.projection);

    const [, , ] = await Promise.all([
      this.compositor.load(),
      this.solar.load().catch(error => {
        // Without a G-buffer the pack still composites; it just loses runtime
        // sun and moon, which is a graceful degradation worth allowing.
        console.warn('DomoView: baked G-buffer unavailable, sun disabled', error);
        return null;
      }),
      this.environment.load().catch(error => {
        console.warn('DomoView: glass mask unavailable', error);
        return null;
      }),
    ]);

    this.layer.append(this.compositor.canvas);
    if (this.showWeather) this.layer.append(this.environment.weatherCanvas);
    this.layer.append(this.environment.canvas);

    this.observeResize();
    this.ready = true;
    return this;
  }

  observeResize() {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.disposed || this.rebuilding) return;
      if (this.chooseSize(this.container) === this.size) return;
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.rebuild(), 250);
    });
    this.resizeObserver.observe(this.container);
  }

  /** Re-decode every image at a new resolution after a lasting size change. */
  async rebuild() {
    if (this.disposed) return;
    this.rebuilding = true;
    const snapshot = this.snapshot;
    this.layer.replaceChildren();
    this.environment.stop();
    try {
      this.size = this.chooseSize(this.container);
      this.compositor = new BakedCompositor(this.pack, this.size, { onError: this.onError });
      this.environment = new BakedEnvironment(this.pack, this.size, this.projection);
      await Promise.all([this.compositor.load(), this.environment.load().catch(() => null)]);
      this.layer.append(this.compositor.canvas);
      if (this.showWeather) this.layer.append(this.environment.weatherCanvas);
      this.layer.append(this.environment.canvas);
      // Clear the guard before re-applying: apply() refuses to draw while a
      // rebuild is in flight, so leaving this until the finally block left the
      // freshly rebuilt canvases blank.
      this.rebuilding = false;
      if (snapshot) this.apply(snapshot);
    } catch (error) {
      this.onError(error);
    } finally {
      this.rebuilding = false;
    }
  }

  apply(snapshot) {
    if (!this.ready || this.rebuilding) return;
    this.snapshot = snapshot;

    if (this.solar?.ready) {
      this.solar.render('sun', snapshot.sun.azimuth, snapshot.sun.elevation,
        snapshot.direct, snapshot.covers, snapshot.sunColor);
      this.solar.render('moon', snapshot.moon.azimuth, snapshot.moon.elevation,
        snapshot.moonStrength, snapshot.covers, snapshot.moonColor);
    }
    this.environment.renderCovers(snapshot.covers);
    if (this.showWeather) this.environment.setWeather(snapshot.weather);
    this.compositor.render(snapshot, this.solar, () => this.onFrame?.());
  }

  /** The bake is one fixed viewpoint; switching cameras is not meaningful. */
  setCamera() {}
  resetView() {}
  resize() {}
  setInteractive() {}

  project(point) {
    const [x, y] = this.projection.project(point, 100);
    return [x, y];
  }

  fixtureScreen(fixture) {
    // A bake tool writes screen percentages straight into the pack, which is
    // both cheaper and exactly right for the camera it rendered from.
    if (fixture.screen) return fixture.screen;
    const anchor = fixture.emitters.length
      ? fixture.emitters.reduce((total, emitter) =>
          total.map((value, i) => value + emitter.position[i] / fixture.emitters.length), [0, 0, 0])
      : null;
    return anchor ? this.project(anchor) : null;
  }

  roomScreen(room) {
    if (!room.label) return null;
    const level = this.pack.levels.find(entry => entry.id === room.level);
    return this.project([room.label[0], room.label[1], (level?.elevation ?? 0) + 1.1]);
  }

  openingScreen(opening) {
    if (!opening.origin) return null;
    const along = (opening.start + opening.end) / 2;
    return this.project([
      opening.origin[0] + opening.tangent[0] * along,
      opening.origin[1] + opening.tangent[1] * along,
      opening.levelElevation + opening.head,
    ]);
  }

  dispose() {
    this.disposed = true;
    clearTimeout(this.resizeTimer);
    this.resizeObserver?.disconnect();
    this.environment?.stop();
    this.layer.remove();
  }
}
