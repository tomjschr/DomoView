/* Plan canvas painter.
 *
 * Draws the floor-plan backdrop and everything traced on top of it. Pure
 * rendering: it reads the project and the current tool state and never mutates
 * either, which keeps the interaction code in editor.js easy to follow.
 */

import { wallFrame, polygonCentroid } from '../../src/core/geometry.js';
import { outwardNormalScreen } from './units.js';

const COLORS = {
  wall: '#f0f4f3',
  wallExterior: '#8fe0c8',
  room: 'rgba(96, 196, 176, 0.14)',
  roomOutline: 'rgba(120, 224, 200, 0.85)',
  roomOutdoor: 'rgba(224, 186, 96, 0.16)',
  roomOutdoorOutline: 'rgba(240, 200, 120, 0.85)',
  window: '#7fc4ff',
  door: '#d7b46a',
  fixture: '#ffd479',
  fixtureMedia: '#9fc4ff',
  furniture: 'rgba(170, 164, 150, 0.35)',
  furnitureOutline: 'rgba(200, 194, 178, 0.8)',
  selection: '#ff7bd0',
  ghost: 'rgba(255, 255, 255, 0.55)',
  calibration: '#ff9f6b',
  snap: '#ffffff',
};

export class PlanRenderer {
  constructor(canvas, viewport) {
    this.canvas = canvas;
    this.viewport = viewport;
    this.context = canvas.getContext('2d');
    this.backdrop = null;
  }

  async setBackdrop(dataUrl) {
    if (!dataUrl) { this.backdrop = null; return null; }
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('The floor plan image could not be decoded.'));
      image.src = dataUrl;
    });
    this.backdrop = image;
    return image;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(rect.width * ratio));
    this.canvas.height = Math.max(1, Math.round(rect.height * ratio));
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ratio = ratio;
  }

  draw(data, tool = {}) {
    const context = this.context;
    const rect = this.canvas.getBoundingClientRect();
    context.save();
    context.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    this.drawBackdrop(data);
    this.drawRooms(data, tool);
    this.drawFurniture(data, tool);
    this.drawWalls(data, tool);
    this.drawOpenings(data, tool);
    this.drawFixtures(data, tool);
    this.drawCalibration(data, tool);
    this.drawDraft(data, tool);
    this.drawSnap(tool);
    context.restore();

    this.drawScaleBar(data, rect);
  }

  drawBackdrop(data) {
    if (!this.backdrop) return;
    const context = this.context;
    const [x, y] = this.viewport.toScreen([0, 0]);
    context.save();
    context.globalAlpha = data.plan.opacity;
    context.imageSmoothingQuality = 'high';
    context.drawImage(this.backdrop, x, y,
      this.backdrop.naturalWidth * this.viewport.scale,
      this.backdrop.naturalHeight * this.viewport.scale);
    context.restore();
  }

  path(points, close = true) {
    const context = this.context;
    context.beginPath();
    points.forEach((point, index) => {
      const [x, y] = this.viewport.toScreen(point);
      if (index) context.lineTo(x, y); else context.moveTo(x, y);
    });
    if (close) context.closePath();
  }

  drawRooms(data, tool) {
    const context = this.context;
    for (const room of data.rooms) {
      if (room.polygon.length < 3) continue;
      const selected = tool.selected?.collection === 'rooms' && tool.selected.id === room.id;
      this.path(room.polygon);
      context.fillStyle = room.outdoor ? COLORS.roomOutdoor : COLORS.room;
      context.fill();
      context.strokeStyle = selected ? COLORS.selection
        : room.outdoor ? COLORS.roomOutdoorOutline : COLORS.roomOutline;
      context.lineWidth = selected ? 2.5 : 1.3;
      context.setLineDash(room.outdoor ? [7, 4] : []);
      context.stroke();
      context.setLineDash([]);

      const [cx, cy] = this.viewport.toScreen(room.label || polygonCentroid(room.polygon));
      context.fillStyle = '#eafaf4';
      context.font = '600 12px system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(room.name, cx, cy);
    }
  }

  drawFurniture(data, tool) {
    const context = this.context;
    for (const item of data.furniture) {
      const selected = tool.selected?.collection === 'furniture' && tool.selected.id === item.id;
      this.path(item.rect);
      context.fillStyle = COLORS.furniture;
      context.fill();
      context.strokeStyle = selected ? COLORS.selection : COLORS.furnitureOutline;
      context.lineWidth = selected ? 2.5 : 1.1;
      context.stroke();
    }
  }

  drawWalls(data, tool) {
    const context = this.context;
    const metresToPx = data.plan.scale ? 1 / data.plan.scale : 20;
    for (const wall of data.walls) {
      const selected = tool.selected?.collection === 'walls' && tool.selected.id === wall.id;
      const [ax, ay] = this.viewport.toScreen(wall.a);
      const [bx, by] = this.viewport.toScreen(wall.b);
      context.beginPath();
      context.moveTo(ax, ay);
      context.lineTo(bx, by);
      context.lineCap = 'round';
      // Draw the wall at its real thickness so overlaps are visible.
      context.lineWidth = Math.max(2, wall.thickness * metresToPx * this.viewport.scale);
      context.strokeStyle = selected ? COLORS.selection
        : wall.exterior ? COLORS.wallExterior : COLORS.wall;
      context.globalAlpha = 0.9;
      context.stroke();
      context.globalAlpha = 1;

      if (selected || tool.showHandles) {
        for (const point of [wall.a, wall.b]) {
          const [x, y] = this.viewport.toScreen(point);
          context.beginPath();
          context.arc(x, y, 4, 0, Math.PI * 2);
          context.fillStyle = selected ? COLORS.selection : '#ffffffcc';
          context.fill();
        }
      }

      // Which way a wall faces decides where daylight enters, so show the
      // outward normal on exterior walls and whatever is selected.
      if (wall.exterior || selected) {
        const normal = outwardNormalScreen(wall);
        const [mx, my] = this.viewport.toScreen([
          (wall.a[0] + wall.b[0]) / 2, (wall.a[1] + wall.b[1]) / 2,
        ]);
        const tipX = mx + normal[0] * 18;
        const tipY = my + normal[1] * 18;
        context.beginPath();
        context.moveTo(mx, my);
        context.lineTo(tipX, tipY);
        context.strokeStyle = '#ffd479';
        context.lineWidth = 1.5;
        context.stroke();
        context.beginPath();
        context.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
        context.fillStyle = '#ffd479';
        context.fill();
      }
    }
  }

  drawOpenings(data, tool) {
    const context = this.context;
    const pxPerMetre = data.plan.scale ? 1 / data.plan.scale : 20;
    for (const opening of data.openings) {
      const wall = data.walls.find(entry => entry.id === opening.wall);
      if (!wall) continue;
      const frame = wallFrame(wall.a, wall.b, wall.flip);
      const halfPx = opening.width / 2 * pxPerMetre;
      const start = [wall.a[0] + frame.tangent[0] * (opening.offset - halfPx),
                     wall.a[1] + frame.tangent[1] * (opening.offset - halfPx)];
      const end = [wall.a[0] + frame.tangent[0] * (opening.offset + halfPx),
                   wall.a[1] + frame.tangent[1] * (opening.offset + halfPx)];
      const selected = tool.selected?.collection === 'openings' && tool.selected.id === opening.id;

      const [sx, sy] = this.viewport.toScreen(start);
      const [ex, ey] = this.viewport.toScreen(end);
      context.beginPath();
      context.moveTo(sx, sy);
      context.lineTo(ex, ey);
      context.lineCap = 'butt';
      context.lineWidth = Math.max(3, wall.thickness * pxPerMetre * this.viewport.scale * 1.4);
      context.strokeStyle = selected ? COLORS.selection
        : opening.type === 'door' ? COLORS.door : COLORS.window;
      context.stroke();
    }
  }

  drawFixtures(data, tool) {
    const context = this.context;
    for (const fixture of data.fixtures) {
      const selected = tool.selected?.collection === 'fixtures' && tool.selected.id === fixture.id;
      for (const emitter of fixture.emitters) {
        const [x, y] = this.viewport.toScreen(emitter.point);
        context.beginPath();
        context.arc(x, y, selected ? 7 : 5, 0, Math.PI * 2);
        context.fillStyle = fixture.kind === 'light' ? fixture.color : COLORS.fixtureMedia;
        context.fill();
        context.lineWidth = selected ? 2.5 : 1.2;
        context.strokeStyle = selected ? COLORS.selection : '#15242c';
        context.stroke();
      }
      if (fixture.emitters.length > 1) {
        this.path(fixture.emitters.map(emitter => emitter.point), false);
        context.setLineDash([3, 3]);
        context.strokeStyle = '#ffffff66';
        context.lineWidth = 1;
        context.stroke();
        context.setLineDash([]);
      }
    }
  }

  drawCalibration(data, tool) {
    const line = tool.calibrationDraft || data.plan.calibration;
    if (!line?.a) return;
    const context = this.context;
    const b = line.b || tool.cursor;
    if (!b) return;
    const [ax, ay] = this.viewport.toScreen(line.a);
    const [bx, by] = this.viewport.toScreen(b);
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.strokeStyle = COLORS.calibration;
    context.lineWidth = 2;
    context.setLineDash([6, 4]);
    context.stroke();
    context.setLineDash([]);
    for (const [x, y] of [[ax, ay], [bx, by]]) {
      context.beginPath();
      context.arc(x, y, 4, 0, Math.PI * 2);
      context.fillStyle = COLORS.calibration;
      context.fill();
    }
    if (data.plan.calibration?.metres && line === data.plan.calibration) {
      context.fillStyle = COLORS.calibration;
      context.font = '600 12px system-ui, sans-serif';
      context.textAlign = 'center';
      context.fillText(`${data.plan.calibration.metres} m`, (ax + bx) / 2, (ay + by) / 2 - 8);
    }
  }

  /** Whatever the active tool is mid-way through drawing. */
  drawDraft(data, tool) {
    const draft = tool.draft;
    if (!draft?.points?.length) return;
    const context = this.context;
    const points = tool.cursor ? [...draft.points, tool.cursor] : draft.points;

    if (draft.kind === 'rect' && points.length >= 2) {
      const [a, b] = [points[0], points[points.length - 1]];
      this.path([[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]]);
    } else {
      this.path(points, draft.kind === 'polygon');
    }
    context.strokeStyle = COLORS.ghost;
    context.lineWidth = 1.6;
    context.setLineDash([5, 4]);
    context.stroke();
    context.setLineDash([]);

    for (const point of draft.points) {
      const [x, y] = this.viewport.toScreen(point);
      context.beginPath();
      context.arc(x, y, 3.5, 0, Math.PI * 2);
      context.fillStyle = COLORS.ghost;
      context.fill();
    }

    // Live length readout while tracing, in metres when the scale is known.
    if (points.length >= 2 && data.plan.scale) {
      const a = points[points.length - 2], b = points[points.length - 1];
      const metres = Math.hypot(b[0] - a[0], b[1] - a[1]) * data.plan.scale;
      const [x, y] = this.viewport.toScreen(b);
      context.fillStyle = '#eafaf4';
      context.font = '600 11px ui-monospace, monospace';
      context.textAlign = 'left';
      context.fillText(`${metres.toFixed(2)} m`, x + 10, y - 8);
    }
  }

  drawSnap(tool) {
    if (!tool.snap) return;
    const context = this.context;
    const [x, y] = this.viewport.toScreen(tool.snap.point);
    context.beginPath();
    context.arc(x, y, 7, 0, Math.PI * 2);
    context.strokeStyle = COLORS.snap;
    context.lineWidth = 1.5;
    context.stroke();
  }

  drawScaleBar(data, rect) {
    if (!data.plan.scale) return;
    const context = this.context;
    // Choose a round metre length that lands between 60 and 180 screen pixels.
    const candidates = [0.5, 1, 2, 5, 10, 20, 50];
    const pxPerMetre = this.viewport.scale / data.plan.scale;
    const metres = candidates.find(value => value * pxPerMetre >= 60) ?? 50;
    const width = metres * pxPerMetre;
    const x = 16, y = rect.height - 22;

    context.save();
    context.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    context.fillStyle = '#0f1a20cc';
    context.fillRect(x - 6, y - 14, width + 12, 26);
    context.strokeStyle = '#eafaf4';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + width, y);
    context.moveTo(x, y - 5);
    context.lineTo(x, y + 5);
    context.moveTo(x + width, y - 5);
    context.lineTo(x + width, y + 5);
    context.stroke();
    context.fillStyle = '#eafaf4';
    context.font = '600 11px system-ui, sans-serif';
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(`${metres} m`, x, y - 6);
    context.restore();
  }
}
