/* Project to home.json.
 *
 * The project stores plan pixels; a Home Pack stores metres with +Y up. All of
 * that conversion happens through PlanTransform so the two never drift apart.
 */

import { PlanTransform, contentBounds, wallVectorsPack, hexToRgb255 } from '../units.js';
import { slugify } from '../project.js';
import { SCHEMA_VERSION } from '../../../src/core/pack.js';

export const STUDIO_TAG = 'domoview-studio';

export function buildManifest(data, { version = '0.1.0', modelFile = 'model.glb' } = {}) {
  const transform = new PlanTransform(data);
  const bounds = contentBounds(data);
  const level = data.level;

  const usedIds = new Set();
  const uniqueId = (preferred, fallback) => {
    let id = slugify(preferred || fallback, fallback);
    let suffix = 2;
    while (usedIds.has(id)) id = `${slugify(preferred || fallback, fallback)}_${suffix++}`;
    usedIds.add(id);
    return id;
  };

  const roomIds = new Map();
  const rooms = data.rooms.map((room, index) => {
    const id = uniqueId(room.name, `room_${index + 1}`);
    roomIds.set(room.id, id);
    return {
      id,
      name: room.name,
      level: 'ground',
      polygon: transform.polygon(room.polygon),
      outdoor: room.outdoor || undefined,
    };
  });

  const wallIds = new Map();
  const walls = data.walls.map((wall, index) => {
    const id = `w${index + 1}`;
    wallIds.set(wall.id, id);
    return {
      id,
      a: transform.point(wall.a),
      b: transform.point(wall.b),
      thickness: wall.thickness,
      height: wall.height,
      exterior: wall.exterior || undefined,
      // Safe to copy: wallVectorsPack and the pack loader apply the same
      // formula to the same pack-space tangent, so the facing agrees.
      flip: wall.flip || undefined,
    };
  });

  const openings = data.openings.map((opening, index) => {
    const wall = data.walls.find(entry => entry.id === opening.wall);
    if (!wall) return null;
    const id = uniqueId(opening.name, `${opening.type}_${index + 1}`);
    const entry = {
      id,
      type: opening.type,
      name: opening.name || defaultOpeningName(opening, data, index),
      wall: wallIds.get(wall.id),
      offset: transform.length(opening.offset),
      width: opening.width,
      sill: opening.sill,
      head: opening.head,
      rooms: opening.rooms.map(roomId => roomIds.get(roomId)).filter(Boolean),
    };
    if (opening.mullion != null) entry.mullion = opening.mullion;
    if (opening.cover && opening.type !== 'door') {
      entry.cover = { profile: opening.coverProfile || 'venetian' };
      if (opening.coverInFront) entry.cover.inFront = true;
    }
    if (opening.type !== 'door') {
      entry.glass = glassBox(opening, wall, transform);
    }
    return entry;
  }).filter(Boolean);

  const fixtures = data.fixtures.map((fixture, index) => {
    const id = uniqueId(fixture.name, `${fixture.kind}_${index + 1}`);
    return {
      id,
      name: fixture.name || `Fixture ${index + 1}`,
      kind: fixture.kind,
      room: roomIds.get(fixture.room) || undefined,
      // The GLB exporter names its marker nodes from this same id.
      node: `dv_light_${id}`,
      emitters: fixture.emitters.map(emitter => {
        const [x, y] = transform.point(emitter.point);
        const out = { position: [x, y, round(emitter.height)], type: emitter.type || 'point' };
        if (emitter.intensity != null && emitter.intensity !== 1) out.intensity = emitter.intensity;
        if (emitter.type === 'spot') {
          out.angle = emitter.angle ?? 40;
          out.target = [x, y, round(level.elevation)];
        }
        return out;
      }),
      light: {
        color: hexToRgb255(fixture.color),
        lumens: fixture.lumens,
        range: fixture.range,
        shadow: fixture.shadow || undefined,
      },
      dimmable: fixture.kind === 'light' || undefined,
      render: { bulb: fixture.bulb || 'glow' },
      variant: fixture.variant || undefined,
    };
  });

  const occluders = data.furniture.filter(item => item.occluder).map((item, index) => {
    const corners = item.rect.map(point => transform.point(point));
    const xs = corners.map(point => point[0]);
    const ys = corners.map(point => point[1]);
    return {
      name: slugify(item.name, `furniture_${index + 1}`),
      min: [round(Math.min(...xs)), round(Math.min(...ys)), round(item.base)],
      max: [round(Math.max(...xs)), round(Math.max(...ys)), round(item.top)],
    };
  });

  const packBounds = bounds ? {
    min: [...transform.point([bounds.min[0], bounds.max[1]]), round(level.elevation - 0.25)],
    max: [...transform.point([bounds.max[0], bounds.min[1]]), round(level.elevation + level.height + 0.15)],
  } : undefined;

  const manifest = {
    $schema: 'https://raw.githubusercontent.com/tomjschr/DomoView/main/schemas/home-pack-1.schema.json',
    pack: {
      schema: SCHEMA_VERSION,
      id: slugify(data.meta.id || data.meta.name, 'home'),
      name: data.meta.name || 'Home',
      version: data.meta.version || '1.0.0',
      author: data.meta.author || undefined,
      license: data.meta.license || undefined,
      description: data.meta.description || undefined,
      units: 'm',
      north: data.meta.north || 0,
      createdWith: `${STUDIO_TAG} ${version}`,
    },
    model: {
      url: modelFile,
      // Exported as a standard Y-up glTF so external viewers show it
      // upright; the card rotates it back into pack space on load.
      up: 'Y',
      bounds: packBounds,
      environment: {
        groundColor: hexToRgb255(data.materials.floor),
      },
    },
    cameras: [{
      id: 'default',
      name: 'Default view',
      type: 'orthographic',
      azimuth: data.camera.azimuth,
      elevation: data.camera.elevation,
      zoom: data.camera.zoom,
      clip: data.camera.clipAbove > 0 ? { above: data.camera.clipAbove } : undefined,
      default: true,
    }],
    levels: [{ id: 'ground', name: 'Ground floor', elevation: level.elevation, height: level.height }],
    rooms,
    walls,
    openings,
    fixtures,
    occluders: occluders.length ? occluders : undefined,
    bindings: {},
  };

  // Outdoor rooms are not repeated as baked.surfaces.wet here: the bake tool
  // derives those from rooms[].outdoor, and a manifest without a bake must not
  // carry a half-filled baked section.
  return stripUndefined(manifest);
}

function defaultOpeningName(opening, data, index) {
  const room = data.rooms.find(entry => opening.rooms.includes(entry.id));
  const label = opening.type === 'door' ? 'Door' : opening.type === 'glass_door' ? 'Glass door' : 'Window';
  return room ? `${room.name} ${label.toLowerCase()}` : `${label} ${index + 1}`;
}

/** Thin box around the pane, so weather effects can be clipped to real glass. */
function glassBox(opening, wall, transform) {
  const { tangent } = wallVectorsPack(wall);
  const origin = transform.point(wall.a);
  const centre = transform.length(opening.offset);
  const half = opening.width / 2;
  const a = [origin[0] + tangent[0] * (centre - half), origin[1] + tangent[1] * (centre - half)];
  const b = [origin[0] + tangent[0] * (centre + half), origin[1] + tangent[1] * (centre + half)];
  const pad = 0.02;
  return {
    min: [round(Math.min(a[0], b[0]) - pad), round(Math.min(a[1], b[1]) - pad), round(opening.sill)],
    max: [round(Math.max(a[0], b[0]) + pad), round(Math.max(a[1], b[1]) + pad), round(opening.head)],
  };
}

function round(value) {
  const rounded = Math.round(value * 1e4) / 1e4;
  // Collapse -0 to 0: JSON has no negative zero, so keeping it would make a
  // freshly built manifest differ from the same manifest read back from disk.
  return rounded === 0 ? 0 : rounded;
}

/** Keep the emitted JSON readable: drop keys the schema treats as optional. */
function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, stripUndefined(entry)]));
  }
  return value;
}
