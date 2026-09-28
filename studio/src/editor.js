/* Tool interaction on the plan canvas.
 *
 * One tool is active at a time. Each one is a small state machine over
 * pointerdown / pointermove / commit, sharing the snapping helpers below so
 * traced geometry actually closes up instead of nearly meeting.
 */

import { wallFrame, insidePolygon } from '../../src/core/geometry.js';

/** Snap radius in screen pixels, converted to plan units per call. */
const SNAP_PIXELS = 11;
const HIT_PIXELS = 8;

export const TOOLS = ['select', 'calibrate', 'wall', 'room', 'window', 'door', 'light', 'furniture'];

export class Editor {
  constructor({ canvas, viewport, project, onRedraw, onSelect, onAskDistance, onStatus }) {
    this.canvas = canvas;
    this.viewport = viewport;
    this.project = project;
    this.onRedraw = onRedraw;
    this.onSelect = onSelect || (() => {});
    this.onAskDistance = onAskDistance;
    this.onStatus = onStatus || (() => {});

    this.tool = 'select';
    this.draft = null;
    this.cursor = null;
    this.snap = null;
    this.selected = null;
    this.dragging = null;
    this.calibrationDraft = null;
    this.orthogonal = true;

    this.attach();
  }

  get data() {
    return this.project.data;
  }

  get state() {
    return {
      tool: this.tool,
      draft: this.draft,
      cursor: this.cursor,
      snap: this.snap,
      selected: this.selected,
      calibrationDraft: this.calibrationDraft,
      showHandles: this.tool === 'select',
    };
  }

  setTool(tool) {
    this.tool = tool;
    this.draft = null;
    this.calibrationDraft = null;
    this.snap = null;
    this.canvas.style.cursor = tool === 'select' ? 'default' : 'crosshair';
    this.onStatus(this.hint());
    this.onRedraw();
  }

  hint() {
    return {
      select: 'Click to select, drag to move. Delete removes the selection.',
      calibrate: 'Click two points a known distance apart, then type that distance.',
      wall: 'Click to trace wall corners. Double-click or Enter finishes the run, Escape cancels.',
      room: 'Click around a room. Double-click or Enter closes the outline.',
      window: 'Click on a wall to place a window there.',
      door: 'Click on a wall to place a door there.',
      light: 'Click to place a light. Shift-click adds another bulb to the selected fixture.',
      furniture: 'Drag a rectangle over a piece of furniture. Its height is set in the panel.',
    }[this.tool] || '';
  }

  select(collection, id) {
    this.selected = collection ? { collection, id } : null;
    this.onSelect(this.selected);
    this.onRedraw();
  }

  // -- snapping --------------------------------------------------------------

  get snapDistance() {
    return SNAP_PIXELS * this.viewport.pixelSize;
  }

  /** Nearest wall endpoint, then nearest point on a wall, then nothing. */
  findSnap(point, { skipWall = null } = {}) {
    const limit = this.snapDistance;
    let best = null;
    for (const wall of this.data.walls) {
      if (wall.id === skipWall) continue;
      for (const [corner, which] of [[wall.a, 'a'], [wall.b, 'b']]) {
        const distance = Math.hypot(point[0] - corner[0], point[1] - corner[1]);
        if (distance < limit && (!best || distance < best.distance)) {
          best = { point: [...corner], distance, kind: 'corner', wall: wall.id, which };
        }
      }
    }
    if (best) return best;
    for (const wall of this.data.walls) {
      if (wall.id === skipWall) continue;
      const projected = projectOntoSegment(point, wall.a, wall.b);
      if (projected.distance < limit && (!best || projected.distance < best.distance)) {
        best = { point: projected.point, distance: projected.distance, kind: 'edge', wall: wall.id, along: projected.along };
      }
    }
    return best;
  }

  /** Pull a free point onto the nearest 15-degree ray from an anchor. */
  constrainAngle(anchor, point) {
    if (!this.orthogonal) return point;
    const dx = point[0] - anchor[0], dy = point[1] - anchor[1];
    const length = Math.hypot(dx, dy);
    if (length < 1e-6) return point;
    const step = Math.PI / 12;
    const angle = Math.round(Math.atan2(dy, dx) / step) * step;
    return [anchor[0] + Math.cos(angle) * length, anchor[1] + Math.sin(angle) * length];
  }

  resolvePoint(raw, anchor) {
    const snap = this.findSnap(raw);
    this.snap = snap;
    if (snap) return snap.point;
    return anchor ? this.constrainAngle(anchor, raw) : raw;
  }

  // -- hit testing -----------------------------------------------------------

  hitTest(point) {
    const limit = HIT_PIXELS * this.viewport.pixelSize;
    for (const fixture of this.data.fixtures) {
      for (const emitter of fixture.emitters) {
        if (Math.hypot(point[0] - emitter.point[0], point[1] - emitter.point[1]) < limit) {
          return { collection: 'fixtures', id: fixture.id, emitter };
        }
      }
    }
    const pxPerMetre = this.data.plan.scale ? 1 / this.data.plan.scale : 20;
    for (const opening of this.data.openings) {
      const wall = this.data.walls.find(entry => entry.id === opening.wall);
      if (!wall) continue;
      const frame = wallFrame(wall.a, wall.b, wall.flip);
      const centre = [wall.a[0] + frame.tangent[0] * opening.offset,
                      wall.a[1] + frame.tangent[1] * opening.offset];
      if (Math.hypot(point[0] - centre[0], point[1] - centre[1]) < opening.width / 2 * pxPerMetre) {
        return { collection: 'openings', id: opening.id };
      }
    }
    for (const wall of this.data.walls) {
      for (const [corner, which] of [[wall.a, 'a'], [wall.b, 'b']]) {
        if (Math.hypot(point[0] - corner[0], point[1] - corner[1]) < limit) {
          return { collection: 'walls', id: wall.id, corner: which };
        }
      }
    }
    for (const wall of this.data.walls) {
      if (projectOntoSegment(point, wall.a, wall.b).distance < limit) {
        return { collection: 'walls', id: wall.id };
      }
    }
    for (const item of this.data.furniture) {
      if (insidePolygon(point[0], point[1], item.rect)) {
        return { collection: 'furniture', id: item.id };
      }
    }
    // Rooms last: they are large and would otherwise swallow every click.
    for (const room of this.data.rooms) {
      if (room.polygon.length >= 3 && insidePolygon(point[0], point[1], room.polygon)) {
        return { collection: 'rooms', id: room.id };
      }
    }
    return null;
  }

  // -- pointer plumbing ------------------------------------------------------

  attach() {
    this.canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || this.viewport.spaceHeld) return;
      this.orthogonal = !event.shiftKey;
      const raw = this.viewport.eventToPlan(event);
      this.handleDown(raw, event);
    });

    this.canvas.addEventListener('pointermove', event => {
      this.orthogonal = !event.shiftKey;
      const raw = this.viewport.eventToPlan(event);
      this.handleMove(raw, event);
    });

    this.canvas.addEventListener('pointerup', event => {
      if (event.button !== 0) return;
      this.handleUp(this.viewport.eventToPlan(event), event);
    });

    this.canvas.addEventListener('dblclick', event => {
      event.preventDefault();
      this.finishDraft();
    });

    this.canvas.addEventListener('pointerleave', () => {
      this.cursor = null;
      this.snap = null;
      this.onRedraw();
    });

    window.addEventListener('keydown', event => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'Escape') { this.draft = null; this.calibrationDraft = null; this.onRedraw(); }
      if (event.key === 'Enter') this.finishDraft();
      if ((event.key === 'Delete' || event.key === 'Backspace') && this.selected) {
        event.preventDefault();
        this.project.remove(this.selected.collection, this.selected.id);
        this.select(null);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) this.project.redo(); else this.project.undo();
      }
    });
  }

  handleDown(raw, event) {
    switch (this.tool) {
      case 'select': return this.startSelectDrag(raw);
      case 'calibrate': return this.handleCalibrate(raw);
      case 'wall': case 'room': return this.addDraftPoint(raw);
      case 'window': case 'door': return this.placeOpening(raw);
      case 'light': return this.placeLight(raw, event);
      case 'furniture': return this.startRect(raw);
      default: return undefined;
    }
  }

  handleMove(raw, event) {
    const anchor = this.draft?.points?.at(-1) || null;
    this.cursor = this.resolvePoint(raw, anchor);

    if (this.dragging) {
      this.applyDrag(this.cursor, event);
    } else if (this.tool === 'furniture' && this.draft?.kind === 'rect') {
      /* the draft renderer shows the rubber band */
    }
    this.onRedraw();
  }

  handleUp() {
    if (this.dragging?.moved) {
      // Fold the whole drag into a single undo entry.
      const snapshot = this.dragging.before;
      const after = structuredClone(this.data);
      this.project.data = snapshot;
      this.project.commit(`move ${this.dragging.target.collection}`, data => {
        Object.assign(data, after);
      });
    }
    this.dragging = null;
    if (this.tool === 'furniture' && this.draft?.kind === 'rect' && this.draft.points.length === 1) {
      this.finishDraft();
    }
  }

  // -- select and drag -------------------------------------------------------

  startSelectDrag(raw) {
    const hit = this.hitTest(raw);
    this.select(hit?.collection || null, hit?.id);
    if (!hit) return;
    this.dragging = {
      target: hit,
      origin: raw,
      before: structuredClone(this.data),
      moved: false,
    };
  }

  applyDrag(point, event) {
    const { target, origin } = this.dragging;
    const dx = point[0] - origin[0], dy = point[1] - origin[1];
    if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return;
    this.dragging.moved = true;
    this.dragging.origin = point;

    this.project.touch(data => {
      if (target.collection === 'walls') {
        const wall = data.walls.find(entry => entry.id === target.id);
        if (!wall) return;
        if (target.corner) {
          const snapped = this.findSnap(point, { skipWall: wall.id });
          wall[target.corner] = snapped ? [...snapped.point] : point;
        } else {
          wall.a = [wall.a[0] + dx, wall.a[1] + dy];
          wall.b = [wall.b[0] + dx, wall.b[1] + dy];
        }
      } else if (target.collection === 'fixtures') {
        const fixture = data.fixtures.find(entry => entry.id === target.id);
        const emitter = fixture?.emitters.find(entry =>
          entry.point[0] === target.emitter.point[0] && entry.point[1] === target.emitter.point[1]);
        if (emitter) { emitter.point = point; target.emitter = emitter; }
        else if (fixture) for (const item of fixture.emitters) {
          item.point = [item.point[0] + dx, item.point[1] + dy];
        }
      } else if (target.collection === 'rooms') {
        const room = data.rooms.find(entry => entry.id === target.id);
        if (room) room.polygon = room.polygon.map(([x, y]) => [x + dx, y + dy]);
      } else if (target.collection === 'furniture') {
        const item = data.furniture.find(entry => entry.id === target.id);
        if (item) item.rect = item.rect.map(([x, y]) => [x + dx, y + dy]);
      } else if (target.collection === 'openings') {
        const opening = data.openings.find(entry => entry.id === target.id);
        const wall = data.walls.find(entry => entry.id === opening?.wall);
        if (opening && wall) {
          const projected = projectOntoSegment(point, wall.a, wall.b);
          opening.offset = projected.along;
        }
      }
    });
    if (event?.shiftKey === false) this.snap = this.findSnap(point);
  }

  // -- calibration -----------------------------------------------------------

  async handleCalibrate(raw) {
    if (!this.calibrationDraft?.a) {
      this.calibrationDraft = { a: raw };
      this.onRedraw();
      return;
    }
    const a = this.calibrationDraft.a;
    const b = this.constrainAngle(a, raw);
    const pixels = Math.hypot(b[0] - a[0], b[1] - a[1]);
    this.calibrationDraft = { a, b };
    this.onRedraw();

    if (pixels < 4) {
      this.onStatus({ error: 'Those two points are too close together to calibrate from.' });
      this.calibrationDraft = null;
      return;
    }
    const metres = await this.onAskDistance(pixels);
    if (!metres || !(metres > 0)) {
      this.calibrationDraft = null;
      this.onRedraw();
      return;
    }
    this.project.commit('calibrate', data => {
      data.plan.scale = metres / pixels;
      data.plan.calibration = { a, b, metres };
    });
    this.calibrationDraft = null;
    this.setTool('wall');
  }

  // -- drafting --------------------------------------------------------------

  addDraftPoint(raw) {
    const anchor = this.draft?.points?.at(-1) || null;
    const point = this.resolvePoint(raw, anchor);
    if (!this.draft) {
      this.draft = { kind: this.tool === 'room' ? 'polygon' : 'polyline', points: [point] };
    } else {
      const first = this.draft.points[0];
      // Clicking the first point again closes a room outline.
      if (this.draft.kind === 'polygon' && this.draft.points.length >= 3 &&
          Math.hypot(point[0] - first[0], point[1] - first[1]) < this.snapDistance) {
        this.finishDraft();
        return;
      }
      this.draft.points.push(point);
    }
    this.onRedraw();
  }

  startRect(raw) {
    this.draft = { kind: 'rect', points: [raw] };
    this.dragging = null;
    this.onRedraw();
  }

  finishDraft() {
    const draft = this.draft;
    if (!draft) return;
    this.draft = null;

    if (draft.kind === 'polyline' && draft.points.length >= 2) {
      this.project.commit('trace walls', data => {
        for (let i = 1; i < draft.points.length; i++) {
          data.walls.push({
            id: `wall_${Math.random().toString(36).slice(2, 8)}`,
            a: draft.points[i - 1], b: draft.points[i],
            thickness: 0.12, height: data.level.height,
            exterior: false, flip: false,
          });
        }
      });
    } else if (draft.kind === 'polygon' && draft.points.length >= 3) {
      this.project.addRoom(draft.points);
    } else if (draft.kind === 'rect' && this.cursor) {
      const [a, b] = [draft.points[0], this.cursor];
      if (Math.abs(b[0] - a[0]) > 2 && Math.abs(b[1] - a[1]) > 2) {
        this.project.addFurniture([[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]]);
      }
    }
    this.onRedraw();
  }

  // -- placement -------------------------------------------------------------

  placeOpening(raw) {
    const limit = 16 * this.viewport.pixelSize;
    let best = null;
    for (const wall of this.data.walls) {
      const projected = projectOntoSegment(raw, wall.a, wall.b);
      if (projected.distance < limit && (!best || projected.distance < best.distance)) {
        best = { wall, ...projected };
      }
    }
    if (!best) {
      this.onStatus({ error: 'Click directly on a wall to place an opening in it.' });
      return;
    }
    const opening = this.project.addOpening(best.wall.id, best.along, this.tool);
    // Pre-fill the room the opening faces, which is what the renderer lights.
    const frame = wallFrame(best.wall.a, best.wall.b, best.wall.flip);
    const probe = [best.point[0] - frame.normal[0] * limit, best.point[1] - frame.normal[1] * limit];
    const room = this.data.rooms.find(entry =>
      entry.polygon.length >= 3 && insidePolygon(probe[0], probe[1], entry.polygon));
    if (room) {
      this.project.touch(data => {
        data.openings.find(entry => entry.id === opening.id).rooms = [room.id];
      });
    }
    this.select('openings', opening.id);
  }

  placeLight(raw, event) {
    const point = this.snap?.point || raw;
    if (event.shiftKey && this.selected?.collection === 'fixtures') {
      const id = this.selected.id;
      this.project.commit('add bulb', data => {
        const fixture = data.fixtures.find(entry => entry.id === id);
        if (fixture) {
          fixture.emitters.push({
            point, height: fixture.emitters.at(-1)?.height ?? data.level.height - 0.15,
            type: fixture.emitters.at(-1)?.type ?? 'point', intensity: 1,
          });
        }
      });
      this.onRedraw();
      return;
    }
    const fixture = this.project.addFixture(point);
    const room = this.data.rooms.find(entry =>
      entry.polygon.length >= 3 && insidePolygon(point[0], point[1], entry.polygon));
    if (room) {
      this.project.touch(data => {
        const created = data.fixtures.find(entry => entry.id === fixture.id);
        created.room = room.id;
        created.name = `${room.name} light ${data.fixtures.filter(f => f.room === room.id).length}`;
      });
    }
    this.select('fixtures', fixture.id);
  }
}

/** Closest point on segment a-b, with its distance and along-length. */
export function projectOntoSegment(point, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared < 1e-9 ? 0
    : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
  const projected = [a[0] + dx * t, a[1] + dy * t];
  return {
    point: projected,
    distance: Math.hypot(point[0] - projected[0], point[1] - projected[1]),
    along: t * Math.sqrt(lengthSquared),
  };
}
