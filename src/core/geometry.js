/* Plan-space geometry helpers. Everything here is pure and unit-agnostic;
 * a Home Pack is always in metres with +Z up in pack coordinates. */

export const DEG = Math.PI / 180;

/** Winding-independent point-in-polygon test (ray casting). */
export function insidePolygon(x, y, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > y) !== (b[1] > y) &&
        x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}

export function polygonCentroid(polygon) {
  let area = 0, cx = 0, cy = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [x0, y0] = polygon[j], [x1, y1] = polygon[i];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  // A degenerate or self-intersecting outline still needs a usable anchor,
  // so fall back to the average vertex rather than dividing by zero.
  if (Math.abs(area) < 1e-9) {
    const n = polygon.length;
    return [polygon.reduce((t, p) => t + p[0], 0) / n,
            polygon.reduce((t, p) => t + p[1], 0) / n];
  }
  return [cx / (3 * area), cy / (3 * area)];
}

export function polygonArea(polygon) {
  let area = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    area += polygon[j][0] * polygon[i][1] - polygon[i][0] * polygon[j][1];
  }
  return Math.abs(area) / 2;
}

/** Counter-clockwise in a +Y-up plan means positive signed area. */
export function ensureCounterClockwise(polygon) {
  let signed = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    signed += polygon[j][0] * polygon[i][1] - polygon[i][0] * polygon[j][1];
  }
  return signed < 0 ? polygon.slice().reverse() : polygon;
}

export function polygonBounds(polygon) {
  const xs = polygon.map(p => p[0]), ys = polygon.map(p => p[1]);
  return { min: [Math.min(...xs), Math.min(...ys)], max: [Math.max(...xs), Math.max(...ys)] };
}

/** Wall segment frame: unit tangent, outward normal and length. */
export function wallFrame(a, b, flip = false) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const length = Math.hypot(dx, dy) || 1e-6;
  const tangent = [dx / length, dy / length];
  const normal = flip ? [-tangent[1], tangent[0]] : [tangent[1], -tangent[0]];
  return { tangent, normal, length };
}

export function pointAlongWall(wall, along) {
  return [wall.a[0] + wall.tangent[0] * along, wall.a[1] + wall.tangent[1] * along];
}

export function cross2(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

/**
 * Ray/AABB intersection used for sun occlusion. Returns true when the box
 * blocks the ray from `point` along `direction` before `limit`.
 */
export function boxBlocks(point, direction, limit, box, skin = 0.015) {
  if (point.every((value, i) => value >= box.min[i] - skin && value <= box.max[i] + skin)) return false;
  let near = skin, far = limit;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(direction[i]) < 1e-6) {
      if (point[i] < box.min[i] || point[i] > box.max[i]) return false;
    } else {
      let lo = (box.min[i] - point[i]) / direction[i];
      let hi = (box.max[i] - point[i]) / direction[i];
      if (lo > hi) [lo, hi] = [hi, lo];
      near = Math.max(near, lo);
      far = Math.min(far, hi);
      if (far <= near) return false;
    }
  }
  return near < limit;
}

/**
 * Shadow of a horizontal rail with vertical posts, as cast on the point
 * (x, y, z). Cheap stand-in for real geometry on outdoor decks.
 */
export function railBlocks(x, y, z, direction, after, caster) {
  const { a, b, heights = [], postSpacing = 0.6, postRadius = 0.023, topHeight = 1 } = caster;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const determinant = cross2(direction[0], direction[1], dx, dy);
  if (Math.abs(determinant) > 1e-5) {
    const t = cross2(a[0] - x, a[1] - y, dx, dy) / determinant;
    const u = cross2(a[0] - x, a[1] - y, direction[0], direction[1]) / determinant;
    if (t > after && u >= 0 && u <= 1 &&
        heights.some(height => Math.abs(z + t * direction[2] - height) < 0.027)) return true;
  }
  const span = Math.hypot(dx, dy);
  const count = Math.max(1, Math.ceil(span / postSpacing));
  const planar = direction[0] ** 2 + direction[1] ** 2;
  if (planar < 1e-9) return false;
  for (let i = 0; i <= count; i++) {
    const px = a[0] + i * dx / count, py = a[1] + i * dy / count;
    const rate = ((px - x) * direction[0] + (py - y) * direction[1]) / planar;
    if (rate <= after || z + rate * direction[2] > topHeight) continue;
    if (Math.hypot(x + rate * direction[0] - px, y + rate * direction[1] - py) < postRadius) return true;
  }
  return false;
}

/** Linear interpolation across an ascending [input, output] stop table. */
export function interpolateStops(stops, value) {
  if (!stops?.length) return value;
  const first = stops[0], last = stops[stops.length - 1];
  if (value <= first[0]) return first[1];
  if (value >= last[0]) return last[1];
  for (let i = 1; i < stops.length; i++) {
    const [px, py] = stops[i - 1], [nx, ny] = stops[i];
    if (value <= nx) {
      const span = nx - px;
      return span < 1e-9 ? ny : py + (ny - py) * (value - px) / span;
    }
  }
  return last[1];
}

export function clamp(value, low = 0, high = 1) {
  return value < low ? low : value > high ? high : value;
}

export function boundsCenter(bounds) {
  return bounds.min.map((value, i) => (value + bounds.max[i]) / 2);
}

export function boundsSpan(bounds) {
  return bounds.max.map((value, i) => value - bounds.min[i]);
}

/**
 * Direction of a celestial body in pack coordinates. Azimuth is the
 * astronomical one (degrees clockwise from geographic north); `north` rotates
 * it into the pack's own frame so a pack does not have to be north-aligned.
 */
export function skyDirection(azimuth, elevation, north = 0) {
  const az = (azimuth - north) * DEG, el = elevation * DEG;
  return [Math.sin(az) * Math.cos(el), Math.cos(az) * Math.cos(el), Math.sin(el)];
}
