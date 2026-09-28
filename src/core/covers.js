/* Blinds and shutters: controller position to visible geometry.
 *
 * A cover's reported position rarely maps linearly onto how much glass is
 * actually clear, so each Home Pack can carry a measured stop table. Profiles
 * express the clear fraction (0..1) of the opening height; this module turns
 * that into absolute heights for the opening it belongs to.
 */

import { interpolateStops, clamp } from './geometry.js';

/** Light still reaching a room whose windows are fully shut, from bounce and leaks. */
export const AMBIENT_FLOOR = 0.30;

/**
 * Height above the opening's sill that is still clear glass, in metres.
 * @param {object} opening normalised pack opening
 * @param {number} position 0..100 as reported by the cover entity
 */
export function clearHeight(opening, position) {
  const span = Math.max(0, opening.head - opening.sill);
  if (!Number.isFinite(position)) return span;
  const fraction = clamp(interpolateStops(opening.cover.profileData.stops, clamp(position, 0, 100)), 0, 1);
  return span * fraction;
}

/** Absolute height of the blind's lower edge, in pack Z. */
export function coverEdgeHeight(opening, position) {
  return opening.levelElevation + opening.sill + clearHeight(opening, position);
}

/**
 * Fraction of the slat pitch that light passes through. Tilt wins when the
 * controller reports one; otherwise a profile may declare that the first few
 * percent of travel already leak.
 */
export function slatAperture(opening, position, tilt) {
  const slats = opening.cover.profileData.slats;
  if (!slats) return 0;
  if (Number.isFinite(tilt)) return clamp(tilt / 100 * (slats.maxAperture ?? 0.32), 0, 1);
  if (!slats.closedStops?.length) return 0;
  return clamp(interpolateStops(slats.closedStops, clamp(position, 0, 100)), 0, 1);
}

export function slatSpacing(opening) {
  return opening.cover.profileData.slats?.spacing ?? 0.064;
}

/**
 * Does direct light at `height` (absolute pack Z) get past this cover?
 * Between slats it passes only inside the open part of each pitch.
 */
export function transmitsAt(opening, coverState, height) {
  if (!coverState) return true;
  if (height < coverEdgeHeight(opening, coverState.position)) return true;
  const aperture = slatAperture(opening, coverState.position, coverState.tilt);
  if (aperture <= 0) return false;
  const pitch = slatSpacing(opening);
  return ((height - opening.levelElevation) / pitch) % 1 <= aperture;
}

/**
 * Per-room diffuse daylight factor. 1 means unobstructed, AMBIENT_FLOOR means
 * every window in the room is shut. Rooms without windows, and windows whose
 * cover is unmapped, stay at 1 so an unconfigured home never looks wrong.
 */
export function roomDaylightFactors(pack, coverStates = {}, floor = AMBIENT_FLOOR) {
  const factors = new Map();
  for (const room of pack.rooms) {
    const windows = pack.windows.filter(opening => opening.rooms.includes(room.id));
    if (!windows.length || room.outdoor) {
      factors.set(room.id, 1);
      continue;
    }
    let total = 0;
    for (const opening of windows) {
      const state = coverStates[opening.id];
      if (!state) { total += 1; continue; }
      const span = Math.max(1e-6, opening.head - opening.sill);
      const open = clamp(clearHeight(opening, state.position) / span, 0, 1);
      const slat = slatAperture(opening, state.position, state.tilt);
      // A tilted-but-lowered blind admits diffuse light at roughly half the
      // rate of clear glass; the rest is absorbed by the slats themselves.
      total += open + (1 - open) * slat * 0.55;
    }
    factors.set(room.id, floor + (1 - floor) * (total / windows.length));
  }
  return factors;
}

/** Stable cache key so renderers can skip unchanged frames. */
export function coverKey(pack, coverStates = {}) {
  return pack.openings.map(opening => {
    const state = coverStates[opening.id];
    return state ? `${Math.round(state.position)}:${Math.round(state.tilt ?? -1)}` : '-';
  }).join(',');
}
