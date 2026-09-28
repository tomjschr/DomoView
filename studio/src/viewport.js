/* Pan and zoom for the plan canvas.
 *
 * Two coordinate systems meet here: "plan" pixels, which are the floor plan
 * image's own pixels and what the project stores, and "screen" pixels on the
 * canvas. Every tool works in plan space, so it never has to think about zoom.
 */

export class Viewport {
  constructor(canvas) {
    this.canvas = canvas;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.minScale = 0.05;
    this.maxScale = 40;
    this.onChange = () => {};
  }

  toScreen(point) {
    return [point[0] * this.scale + this.offsetX, point[1] * this.scale + this.offsetY];
  }

  toPlan(x, y) {
    return [(x - this.offsetX) / this.scale, (y - this.offsetY) / this.scale];
  }

  /** Plan-space distance covered by one screen pixel, for hit tolerances. */
  get pixelSize() {
    return 1 / this.scale;
  }

  eventToPlan(event) {
    const rect = this.canvas.getBoundingClientRect();
    return this.toPlan(event.clientX - rect.left, event.clientY - rect.top);
  }

  /** Fit a plan-space box into the canvas with a margin. */
  fit(width, height, margin = 0.06) {
    const rect = this.canvas.getBoundingClientRect();
    if (!width || !height || !rect.width) return;
    const scale = Math.min(rect.width / width, rect.height / height) * (1 - margin * 2);
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
    this.offsetX = (rect.width - width * this.scale) / 2;
    this.offsetY = (rect.height - height * this.scale) / 2;
    this.onChange();
  }

  zoomAt(screenX, screenY, factor) {
    const next = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));
    if (next === this.scale) return;
    // Keep the plan point under the cursor fixed while zooming.
    const [planX, planY] = this.toPlan(screenX, screenY);
    this.scale = next;
    this.offsetX = screenX - planX * this.scale;
    this.offsetY = screenY - planY * this.scale;
    this.onChange();
  }

  pan(dx, dy) {
    this.offsetX += dx;
    this.offsetY += dy;
    this.onChange();
  }

  /** Attach wheel zoom and middle/space-drag panning. */
  attach() {
    this.canvas.addEventListener('wheel', event => {
      event.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * 0.0016);
      this.zoomAt(event.clientX - rect.left, event.clientY - rect.top, factor);
    }, { passive: false });

    let panning = null;
    this.canvas.addEventListener('pointerdown', event => {
      const wantsPan = event.button === 1 || event.button === 2 ||
        (event.button === 0 && (event.spaceKey || this.spaceHeld));
      if (!wantsPan) return;
      event.preventDefault();
      panning = { x: event.clientX, y: event.clientY, id: event.pointerId };
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', event => {
      if (!panning || panning.id !== event.pointerId) return;
      this.pan(event.clientX - panning.x, event.clientY - panning.y);
      panning.x = event.clientX;
      panning.y = event.clientY;
    });
    const stop = event => {
      if (panning?.id === event.pointerId) {
        this.canvas.releasePointerCapture?.(event.pointerId);
        panning = null;
      }
    };
    this.canvas.addEventListener('pointerup', stop);
    this.canvas.addEventListener('pointercancel', stop);
    this.canvas.addEventListener('contextmenu', event => event.preventDefault());

    window.addEventListener('keydown', event => {
      if (event.code === 'Space') this.spaceHeld = true;
    });
    window.addEventListener('keyup', event => {
      if (event.code === 'Space') this.spaceHeld = false;
    });
  }
}
