/* Home Pack loader and normaliser.
 *
 * A pack on disk is deliberately terse: authors omit anything derivable.
 * This module turns it into a fully resolved runtime object so neither
 * renderer ever has to ask "was this field present?".
 */

import {
  wallFrame, pointAlongWall, polygonCentroid, ensureCounterClockwise,
  boundsCenter, boundsSpan, clamp,
} from './geometry.js';

export const SCHEMA_VERSION = 1;

/** Which HA domains make sense per fixture kind, when a pack does not say. */
const DEFAULT_DOMAINS = {
  light: ['light', 'switch'],
  media: ['media_player'],
  cover: ['cover'],
  sensor: ['sensor', 'binary_sensor'],
  appliance: ['switch', 'sensor', 'binary_sensor'],
  vacuum: ['vacuum'],
  speaker: ['media_player'],
  marker: [],
};

const DEFAULT_COVER_PROFILES = {
  /* A controller that maps position linearly onto the visible opening. */
  linear: { name: 'Linear', stops: [[0, 0], [100, 1]] },
  /* Venetian blinds commonly stay almost shut over the first third of travel
   * and then open quickly. Packs should measure their own curve; this is a
   * reasonable starting shape rather than a claim about any product. */
  venetian: {
    name: 'Venetian (typical)',
    stops: [[0, 0.02], [20, 0.04], [40, 0.12], [50, 0.27], [60, 0.34],
            [70, 0.40], [80, 0.49], [100, 1]],
    slats: { spacing: 0.064, maxAperture: 0.32, closedStops: [[0, 0], [10, 0.08], [20, 0.16], [21, 0]] },
  },
  roller: { name: 'Roller shutter', stops: [[0, 0], [100, 1]] },
};

export class PackError extends Error {
  constructor(message, detail) {
    super(message);
    this.name = 'PackError';
    this.detail = detail;
  }
}

function resolveUrl(base, path) {
  if (!path) return null;
  // Anything already carrying a scheme (http:, blob:, data:) or rooted at the
  // web root is used verbatim. The Studio previews a pack straight from a
  // blob: URL, so this has to be more than an http check.
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//') || path.startsWith('/')) return path;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\.?\//, '')}`;
}

/**
 * Fetch and normalise a pack.
 * @param {string} baseUrl Folder containing home.json, e.g. /local/domoview/homes/my-flat
 * @param {object} options
 */
export async function loadPack(baseUrl, options = {}) {
  const base = String(baseUrl).replace(/\/+$/, '');
  const manifestUrl = base.endsWith('.json') ? base : `${base}/home.json`;
  const root = manifestUrl.slice(0, manifestUrl.lastIndexOf('/'));
  const bust = options.cacheBust ? `?v=${encodeURIComponent(options.cacheBust)}` : '';

  let raw;
  try {
    const response = await fetch(`${manifestUrl}${bust}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    raw = await response.json();
  } catch (error) {
    throw new PackError(`Cannot read home.json at ${manifestUrl}`, error.message);
  }
  return normalisePack(raw, root, options);
}

export function normalisePack(raw, root = '.', options = {}) {
  if (!raw || typeof raw !== 'object') throw new PackError('home.json is not an object');
  const meta = raw.pack || {};
  if (meta.schema !== SCHEMA_VERSION) {
    throw new PackError(
      `Unsupported Home Pack schema ${meta.schema ?? '(missing)'}; this build reads version ${SCHEMA_VERSION}`,
    );
  }
  if (!raw.model?.url) throw new PackError('home.json is missing model.url');

  const variantId = options.variant && options.variant !== 'base' ? options.variant : null;
  const variants = (raw.variants || []).map(entry => ({ ...entry }));
  const variant = variantId ? variants.find(entry => entry.id === variantId) || null : null;

  const levels = normaliseLevels(raw.levels);
  const levelById = new Map(levels.map(level => [level.id, level]));
  const rooms = normaliseRooms(raw.rooms, levels);
  const roomById = new Map(rooms.map(room => [room.id, room]));
  const walls = normaliseWalls(raw.walls, levelById);
  const wallById = new Map(walls.map(wall => [wall.id, wall]));
  const coverProfiles = { ...DEFAULT_COVER_PROFILES, ...(raw.coverProfiles || {}) };
  const openings = normaliseOpenings(raw.openings, wallById, roomById, levelById, coverProfiles);
  const fixtures = normaliseFixtures(raw.fixtures, roomById, variantId);
  const bounds = normaliseBounds(raw.model.bounds, { rooms, openings, fixtures });
  const cameras = normaliseCameras(raw.cameras, bounds);

  const modelUrl = resolveUrl(root, variant?.model || raw.model.url);
  const bakedSource = variant?.baked
    ? withBakedRoot(raw.baked, variant.baked)
    : raw.baked;
  const baked = normaliseBaked(bakedSource, root, fixtures);

  return {
    root,
    meta: {
      id: meta.id || 'home',
      name: meta.name || 'Home',
      version: meta.version || '0',
      author: meta.author || '',
      license: meta.license || '',
      description: meta.description || '',
      units: 'm',
      north: Number(meta.north) || 0,
      createdWith: meta.createdWith || '',
    },
    model: {
      url: modelUrl,
      up: raw.model.up === 'Y' ? 'Y' : 'Z',
      bounds,
      center: boundsCenter(bounds),
      span: boundsSpan(bounds),
      exposure: Number(raw.model.exposure) || 1,
      environment: {
        skyIntensity: raw.model.environment?.skyIntensity ?? 1,
        groundColor: raw.model.environment?.groundColor || [92, 88, 80],
        nightAmbient: raw.model.environment?.nightAmbient ?? 0.04,
      },
    },
    cameras,
    levels,
    rooms,
    walls,
    openings,
    coverProfiles,
    fixtures,
    occluders: (raw.occluders || []).map((box, index) => ({
      name: box.name || `occluder_${index}`,
      min: box.min.slice(), max: box.max.slice(),
    })),
    shadowCasters: (raw.shadowCasters || []).map((caster, index) => ({
      id: caster.id || `caster_${index}`,
      a: caster.a.slice(), b: caster.b.slice(),
      heights: caster.heights || [],
      postSpacing: caster.postSpacing ?? 0.6,
      postRadius: caster.postRadius ?? 0.023,
      topHeight: caster.topHeight ?? 1,
    })),
    variants,
    variant: variantId,
    baked,
    bindings: { ...(raw.bindings || {}) },

    // Convenience lookups the renderers and the editor both want.
    roomById,
    fixtureById: new Map(fixtures.map(fixture => [fixture.id, fixture])),
    openingById: new Map(openings.map(opening => [opening.id, opening])),
    windows: openings.filter(opening => opening.admitsLight),
    lights: fixtures.filter(fixture => fixture.kind === 'light'),
  };
}

function withBakedRoot(baked, folder) {
  if (!baked) return null;
  const swap = path => (path ? `${folder.replace(/\/+$/, '')}/${path.split('/').pop()}` : path);
  return {
    ...baked,
    day: swap(baked.day),
    night: swap(baked.night),
    gbuffer: baked.gbuffer && {
      ...baked.gbuffer,
      position: swap(baked.gbuffer.position),
      normal: swap(baked.gbuffer.normal),
    },
    masks: baked.masks && {
      exterior: swap(baked.masks.exterior),
      glass: swap(baked.masks.glass),
    },
    lights: Object.fromEntries(Object.entries(baked.lights || {})
      .map(([id, path]) => [id, `${folder.replace(/\/+$/, '')}/lights/${path.split('/').pop()}`])),
  };
}

function normaliseLevels(levels) {
  if (!levels?.length) return [{ id: 'ground', name: 'Ground floor', elevation: 0, height: 2.5 }];
  return levels.map((level, index) => ({
    id: level.id || `level_${index}`,
    name: level.name || level.id || `Level ${index + 1}`,
    elevation: Number(level.elevation) || 0,
    height: Number(level.height) || 2.5,
  }));
}

function normaliseRooms(rooms, levels) {
  const fallbackLevel = levels[0].id;
  return (rooms || []).map((room, index) => {
    const polygon = room.polygon?.length >= 3 ? ensureCounterClockwise(room.polygon.map(p => p.slice())) : null;
    return {
      id: room.id || `room_${index}`,
      name: room.name || room.id || `Room ${index + 1}`,
      level: room.level || fallbackLevel,
      polygon,
      label: room.label?.slice() || (polygon ? polygonCentroid(polygon) : null),
      outdoor: !!room.outdoor,
    };
  });
}

function normaliseWalls(walls, levelById) {
  return (walls || []).map((wall, index) => {
    const a = wall.a.slice(), b = wall.b.slice();
    const frame = wallFrame(a, b, !!wall.flip);
    const level = levelById.get(wall.level) || levelById.values().next().value;
    return {
      id: wall.id || `wall_${index}`,
      a, b,
      thickness: wall.thickness ?? 0.12,
      height: wall.height ?? level?.height ?? 2.5,
      level: wall.level || level?.id,
      exterior: !!wall.exterior,
      flip: !!wall.flip,
      ...frame,
    };
  });
}

function normaliseOpenings(openings, wallById, roomById, levelById, coverProfiles) {
  return (openings || []).map((opening, index) => {
    const id = opening.id || `opening_${index}`;
    const wall = opening.wall ? wallById.get(opening.wall) : null;
    if (opening.wall && !wall) {
      throw new PackError(`Opening ${id} references unknown wall ${opening.wall}`);
    }
    const level = levelById.get(wall?.level) || levelById.values().next().value;
    const width = Number(opening.width) || 1;
    const sill = opening.sill ?? (opening.type === 'door' || opening.type === 'glass_door' ? 0 : 0.9);
    const head = opening.head ?? Math.min((level?.height ?? 2.5) - 0.1, sill + 1.4);

    // Resolve plan geometry once: the renderers project light through these.
    let origin = null, tangent = null, normal = null, start = 0, end = width;
    if (wall) {
      const offset = Number(opening.offset) || 0;
      origin = wall.a.slice();
      tangent = wall.tangent.slice();
      normal = opening.normal?.slice() || wall.normal.slice();
      start = offset - width / 2;
      end = offset + width / 2;
    } else if (opening.normal) {
      normal = opening.normal.slice();
    }

    const rooms = (opening.rooms || []).filter(roomId => roomById.has(roomId));
    const profileKey = opening.cover?.profile || 'linear';

    return {
      id,
      type: opening.type || 'window',
      name: opening.name || id,
      wall: wall?.id || null,
      level: level?.id,
      levelElevation: level?.elevation ?? 0,
      offset: Number(opening.offset) || 0,
      width, sill, head,
      origin, tangent, normal,
      start, end,
      mullion: opening.mullion ?? null,
      rooms,
      roomPolygons: rooms.map(roomId => roomById.get(roomId).polygon).filter(Boolean),
      glass: opening.glass ? { min: opening.glass.min.slice(), max: opening.glass.max.slice() } : null,
      cover: {
        profile: profileKey,
        profileData: coverProfiles[profileKey] || coverProfiles.linear,
        inFront: !!opening.cover?.inFront,
        supported: !!opening.cover,
      },
      outside: !!opening.outside,
      admitsLight: opening.type !== 'door',
      // Precomputed for the solar projection: the two plan points of the span.
      spanStart: wall ? pointAlongWall({ a: wall.a, tangent: wall.tangent }, start) : null,
      spanEnd: wall ? pointAlongWall({ a: wall.a, tangent: wall.tangent }, end) : null,
    };
  });
}

function normaliseFixtures(fixtures, roomById, variantId) {
  return (fixtures || [])
    .filter(fixture => !fixture.variant || fixture.variant === variantId)
    .map((fixture, index) => {
      const kind = fixture.kind || 'light';
      const emitters = (fixture.emitters || []).map(emitter => ({
        position: emitter.position.slice(),
        type: emitter.type || 'point',
        target: emitter.target?.slice() || null,
        intensity: emitter.intensity ?? 1,
        radius: emitter.radius ?? 0.06,
        angle: emitter.angle ?? null,
        penumbra: emitter.penumbra ?? 0.4,
      }));
      const room = fixture.room ? roomById.get(fixture.room) : null;
      return {
        id: fixture.id || `fixture_${index}`,
        name: fixture.name || fixture.id || `Fixture ${index + 1}`,
        kind,
        room: room?.id || null,
        roomName: room?.name || '',
        node: fixture.node || null,
        domains: fixture.domains?.length ? fixture.domains : (DEFAULT_DOMAINS[kind] || []),
        emitters,
        light: {
          color: fixture.light?.color || null,
          kelvin: fixture.light?.kelvin ?? null,
          lumens: fixture.light?.lumens ?? 600,
          range: fixture.light?.range ?? 6,
          shadow: !!fixture.light?.shadow,
        },
        dimmable: fixture.dimmable ?? (kind === 'light'),
        screen: fixture.screen?.slice() || null,
        render: {
          bulb: fixture.render?.bulb || (kind === 'light' ? 'glow' : 'none'),
          scale: fixture.render?.scale ?? 1,
          emissiveNodes: fixture.render?.emissiveNodes || (fixture.node ? [fixture.node] : []),
        },
        variant: fixture.variant || null,
      };
    });
}

function normaliseBounds(bounds, { rooms, openings, fixtures }) {
  if (bounds?.min && bounds?.max) {
    return { min: bounds.min.slice(), max: bounds.max.slice() };
  }
  // Derive from whatever plan data exists so cameras can still frame the home.
  const min = [Infinity, Infinity, 0], max = [-Infinity, -Infinity, 2.5];
  const swallow = (x, y, z) => {
    if (Number.isFinite(x)) { min[0] = Math.min(min[0], x); max[0] = Math.max(max[0], x); }
    if (Number.isFinite(y)) { min[1] = Math.min(min[1], y); max[1] = Math.max(max[1], y); }
    if (Number.isFinite(z)) { min[2] = Math.min(min[2], z); max[2] = Math.max(max[2], z); }
  };
  for (const room of rooms) for (const point of room.polygon || []) swallow(point[0], point[1], undefined);
  for (const opening of openings) {
    if (opening.spanStart) swallow(opening.spanStart[0], opening.spanStart[1], opening.head);
    if (opening.spanEnd) swallow(opening.spanEnd[0], opening.spanEnd[1], opening.sill);
  }
  for (const fixture of fixtures) for (const emitter of fixture.emitters) {
    swallow(emitter.position[0], emitter.position[1], emitter.position[2]);
  }
  if (!Number.isFinite(min[0])) { min[0] = min[1] = -5; max[0] = max[1] = 5; }
  return { min, max };
}

function normaliseCameras(cameras, bounds) {
  const center = boundsCenter(bounds);
  const list = (cameras?.length ? cameras : [
    { id: 'iso_sw', name: 'Isometric', azimuth: 225, elevation: 40, default: true },
  ]).map((camera, index) => ({
    id: camera.id || `camera_${index}`,
    name: camera.name || camera.id || `View ${index + 1}`,
    type: camera.type === 'perspective' ? 'perspective' : 'orthographic',
    azimuth: Number(camera.azimuth) || 0,
    elevation: clamp(Number(camera.elevation) || 40, 0, 90),
    target: camera.target?.slice() || [center[0], center[1], bounds.min[2] + 1.2],
    zoom: camera.zoom > 0 ? camera.zoom : 1,
    fov: camera.fov ?? 35,
    clip: camera.clip?.above != null ? { above: Number(camera.clip.above) } : null,
    default: !!camera.default,
  }));
  if (!list.some(camera => camera.default)) list[0].default = true;
  return list;
}

function normaliseBaked(baked, root, fixtures) {
  if (!baked?.day || !baked?.night) return null;
  const size = Number(baked.size) || 1024;
  const lights = {};
  for (const fixture of fixtures) {
    const path = baked.lights?.[fixture.id];
    if (path) lights[fixture.id] = resolveUrl(root, path);
  }
  return {
    size,
    camera: baked.camera || null,
    day: resolveUrl(root, baked.day),
    night: resolveUrl(root, baked.night),
    gbuffer: baked.gbuffer?.position && baked.gbuffer?.normal ? {
      position: resolveUrl(root, baked.gbuffer.position),
      normal: resolveUrl(root, baked.gbuffer.normal),
      size: Number(baked.gbuffer.size) || size,
    } : null,
    masks: {
      exterior: resolveUrl(root, baked.masks?.exterior),
      glass: resolveUrl(root, baked.masks?.glass),
    },
    lights,
    surfaces: {
      wet: (baked.surfaces?.wet || []).map((surface, index) => ({
        id: surface.id || `wet_${index}`,
        polygon: surface.polygon.map(p => p.slice()),
        height: surface.height ?? 0,
      })),
    },
  };
}

/** Structural problems worth surfacing in the card editor, not worth throwing for. */
export function inspectPack(pack) {
  const warnings = [];
  if (!pack.rooms.length) warnings.push('No rooms defined: per-room daylight and climate chips stay off.');
  if (!pack.windows.length) warnings.push('No windows defined: sunlight cannot enter the model.');
  if (!pack.lights.length) warnings.push('No light fixtures defined: nothing to bind.');
  for (const fixture of pack.lights) {
    if (!fixture.emitters.length && !fixture.node) {
      warnings.push(`Fixture "${fixture.name}" has neither emitters nor a GLB node.`);
    }
  }
  for (const opening of pack.windows) {
    if (!opening.roomPolygons.length) {
      warnings.push(`Window "${opening.name}" lights no room with a polygon; its sunlight is skipped.`);
    }
  }
  return warnings;
}
