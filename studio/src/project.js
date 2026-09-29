/* The Studio's document model.
 *
 * A project is plain JSON so it can be saved, reopened and diffed. It is the
 * authoring form: pixel coordinates on the floor plan image plus a scale. The
 * exporter converts it to metres, which is what a Home Pack stores.
 */

import { applyProjectOperation } from './operations/index.js';

export const PROJECT_VERSION = 1;

let counter = 0;
function nextId(prefix) {
  counter += 1;
  return `${prefix}_${counter.toString(36)}`;
}

/**
 * Turn a display name into a stable slug usable as a pack id.
 * Existing hyphens survive: a pack id doubles as its folder name, and turning
 * "demo-apartment" into "demo_apartment" would contradict the install path the
 * documentation prints.
 */
export function slugify(value, fallback = 'item') {
  const slug = String(value).toLowerCase()
    .replace(/[äàáâã]/g, 'a').replace(/[öòóô]/g, 'o').replace(/[üùúû]/g, 'u')
    .replace(/[ëèéê]/g, 'e').replace(/[ïìíî]/g, 'i').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');
  return slug || fallback;
}

export function emptyProject() {
  return {
    version: PROJECT_VERSION,
    meta: {
      id: 'my-home',
      name: 'My Home',
      author: '',
      license: 'CC-BY-4.0',
      description: '',
      north: 0,
    },
    plan: {
      // Data URL of the floor plan backdrop, plus the calibration that turns
      // its pixels into metres.
      image: null,
      imageWidth: 0,
      imageHeight: 0,
      opacity: 0.55,
      /** Metres per pixel. Null until the user calibrates. */
      scale: null,
      calibration: null,
    },
    level: { height: 2.55, elevation: 0 },
    walls: [],
    rooms: [],
    openings: [],
    fixtures: [],
    furniture: [],
    photos: [],
    materials: {
      wall: '#d9d4cc',
      floor: '#b08c63',
      ceiling: '#efece6',
      furniture: '#8a8478',
    },
    camera: { azimuth: 225, elevation: 40, zoom: 1, clipAbove: 0 },
  };
}

export class Project {
  constructor(data = emptyProject()) {
    this.data = data;
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(reason = 'change') {
    for (const listener of this.listeners) listener(this.data, reason);
  }

  /**
   * Mutate through here so every change is undoable. The snapshot is a deep
   * clone of the whole document; projects are small enough that this is far
   * simpler and safer than tracking patches.
   */
  commit(label, mutator) {
    this.undoStack.push({ label, data: structuredClone(this.data) });
    if (this.undoStack.length > 80) this.undoStack.shift();
    this.redoStack.length = 0;
    mutator(this.data);
    this.notify(label);
  }

  applyOperation(operation, label) {
    const result = applyProjectOperation(this.data, operation);
    this.undoStack.push({ label: label || result.summary, data: structuredClone(this.data) });
    if (this.undoStack.length > 80) this.undoStack.shift();
    this.redoStack.length = 0;
    this.data = result.project;
    this.notify(label || result.summary);
    return result;
  }

  /** For live drags: change without pushing a new undo entry every frame. */
  touch(mutator, reason = 'drag') {
    mutator(this.data);
    this.notify(reason);
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return false;
    this.redoStack.push({ label: entry.label, data: structuredClone(this.data) });
    this.data = entry.data;
    this.notify('undo');
    return true;
  }

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return false;
    this.undoStack.push({ label: entry.label, data: structuredClone(this.data) });
    this.data = entry.data;
    this.notify('redo');
    return true;
  }

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }

  // -- element helpers -------------------------------------------------------

  addWall(a, b) {
    const wall = {
      id: nextId('wall'), a, b,
      thickness: 0.12,
      height: this.data.level.height,
      exterior: false,
      flip: false,
    };
    this.commit('add wall', data => data.walls.push(wall));
    return wall;
  }

  addRoom(points, name) {
    const room = {
      id: nextId('room'),
      name: name || `Room ${this.data.rooms.length + 1}`,
      polygon: points,
      outdoor: false,
      label: null,
      climate: true,
    };
    this.commit('add room', data => data.rooms.push(room));
    return room;
  }

  addOpening(wallId, offsetPx, type = 'window') {
    const opening = {
      id: nextId(type === 'door' ? 'door' : 'win'),
      type,
      name: '',
      wall: wallId,
      offset: offsetPx,
      width: type === 'door' ? 0.9 : 1.2,
      sill: type === 'window' ? 0.9 : 0,
      head: type === 'window' ? 2.2 : 2.05,
      rooms: [],
      mullion: null,
      cover: type === 'window',
      coverProfile: 'venetian',
      coverInFront: false,
    };
    this.commit('add opening', data => data.openings.push(opening));
    return opening;
  }

  addFixture(point, kind = 'light', initial = {}) {
    const fixture = {
      id: nextId(kind),
      name: '',
      kind,
      room: null,
      emitters: [{ point, height: this.data.level.height - 0.15, type: 'point', intensity: 1 }],
      lumens: 600,
      color: '#ffdda4',
      range: 6,
      shadow: false,
      bulb: 'glow',
      variant: null,
      ...initial,
    };
    this.applyOperation({ type: 'fixture.add', value: fixture }, 'add fixture');
    return fixture;
  }

  addFurniture(points) {
    const item = {
      id: nextId('furn'),
      name: 'Furniture',
      rect: points,
      base: 0,
      top: 0.75,
      solid: true,
      occluder: true,
    };
    this.commit('add furniture', data => data.furniture.push(item));
    return item;
  }

  remove(collection, id) {
    if (collection === 'fixtures') {
      this.applyOperation({ type: 'fixture.remove', id }, 'remove fixtures');
      return;
    }
    this.commit(`remove ${collection}`, data => {
      data[collection] = data[collection].filter(entry => entry.id !== id);
      if (collection === 'walls') {
        data.openings = data.openings.filter(opening => opening.wall !== id);
      }
    });
  }

  find(collection, id) {
    return this.data[collection].find(entry => entry.id === id) || null;
  }

  // -- persistence -----------------------------------------------------------

  toJSON() {
    return JSON.stringify({ ...this.data, version: PROJECT_VERSION }, null, 2);
  }

  static fromJSON(text) {
    const parsed = JSON.parse(text);
    return new Project(migrateProjectData(parsed));
  }
}

export function migrateProjectData(parsed) {
  const version = parsed?.version ?? 1;
  if (version !== PROJECT_VERSION) {
    throw new Error(`Project file version ${version} cannot be opened by this build (expected ${PROJECT_VERSION})`);
  }
    // Merge onto a fresh document so a project saved by an older build still
    // gains any field added since.
    const merged = { ...emptyProject(), ...parsed };
    merged.version = PROJECT_VERSION;
    merged.meta = { ...emptyProject().meta, ...parsed.meta };
    merged.plan = { ...emptyProject().plan, ...parsed.plan };
    merged.materials = { ...emptyProject().materials, ...parsed.materials };
    merged.camera = { ...emptyProject().camera, ...parsed.camera };
    return merged;
}

/** Readiness of each authoring step, used to gate the export button. */
export function projectStatus(data) {
  const issues = [];
  if (!data.plan.scale) issues.push({ step: 'scale', text: 'Calibrate the plan scale first.' });
  if (!data.walls.length) issues.push({ step: 'walls', text: 'Trace at least the outer walls.' });
  if (!data.rooms.length) issues.push({ step: 'rooms', text: 'Outline at least one room.' });
  if (!data.fixtures.length) issues.push({ step: 'lights', text: 'Place at least one light fixture.' });
  for (const opening of data.openings) {
    if (opening.type !== 'door' && !opening.rooms.length) {
      issues.push({ step: 'openings', text: `Window "${opening.name || opening.id}" is not assigned to a room, so it will not light one.` });
    }
  }
  for (const fixture of data.fixtures) {
    if (!fixture.room) {
      issues.push({ step: 'lights', text: `Fixture "${fixture.name || fixture.id}" has no room; it will still work but is harder to find in the editor.` });
    }
  }
  return issues;
}
