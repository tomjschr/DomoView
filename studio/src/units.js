/* Plan pixels to pack metres.
 *
 * The floor plan image has +X right and +Y *down*, the convention every raster
 * image uses. A Home Pack has +X right and +Y up, so that its +Y can mean
 * north and solar azimuths work out. The Y flip is the one subtlety here, and
 * it also mirrors wall normals, which is why the outward normal must be
 * computed in pack space rather than on screen.
 */

export class PlanTransform {
  constructor(data) {
    this.scale = data.plan.scale || 0.02;
    const bounds = contentBounds(data) || {
      min: [0, 0],
      max: [data.plan.imageWidth || 1000, data.plan.imageHeight || 1000],
    };
    // Centre the home on the origin so cameras frame it without an offset.
    this.originX = (bounds.min[0] + bounds.max[0]) / 2;
    this.originY = (bounds.min[1] + bounds.max[1]) / 2;
  }

  /** Plan pixel point to pack metres (2D). */
  point([x, y]) {
    return [
      round((x - this.originX) * this.scale),
      round(-(y - this.originY) * this.scale),
    ];
  }

  /** Plan pixel length to metres. */
  length(pixels) {
    return round(pixels * this.scale);
  }

  polygon(points) {
    return points.map(point => this.point(point));
  }
}

function round(value) {
  const rounded = Math.round(value * 1e4) / 1e4;
  // Collapse -0 to 0: JSON has no negative zero, so keeping it would make a
  // freshly built manifest differ from the same manifest read back from disk.
  return rounded === 0 ? 0 : rounded;
}

export function contentBounds(data) {
  const points = [];
  for (const wall of data.walls) points.push(wall.a, wall.b);
  for (const room of data.rooms) points.push(...room.polygon);
  for (const item of data.furniture) points.push(...item.rect);
  for (const fixture of data.fixtures) for (const emitter of fixture.emitters) points.push(emitter.point);
  if (!points.length) return null;
  const xs = points.map(point => point[0]);
  const ys = points.map(point => point[1]);
  return { min: [Math.min(...xs), Math.min(...ys)], max: [Math.max(...xs), Math.max(...ys)] };
}

/**
 * Unit tangent and outward normal of a wall, in pack space, derived from the
 * plan-space endpoints. This is the single source of truth for wall facing;
 * the exporter and the canvas arrow both use it so they cannot disagree.
 */
export function wallVectorsPack(wall) {
  const dx = wall.b[0] - wall.a[0];
  const dy = -(wall.b[1] - wall.a[1]);
  const length = Math.hypot(dx, dy) || 1e-6;
  const tangent = [dx / length, dy / length];
  const normal = wall.flip
    ? [-tangent[1], tangent[0]]
    : [tangent[1], -tangent[0]];
  return { tangent, normal, length };
}

/** The same outward normal, expressed back in screen space for drawing. */
export function outwardNormalScreen(wall) {
  const { normal } = wallVectorsPack(wall);
  return [normal[0], -normal[1]];
}

export function hexToRgb255(hex) {
  const value = String(hex).replace('#', '');
  const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
  const number = Number.parseInt(full, 16);
  if (!Number.isFinite(number)) return [255, 221, 164];
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

export function rgb255ToHex([r, g, b]) {
  const clamp = value => Math.max(0, Math.min(255, Math.round(value)));
  return `#${[r, g, b].map(value => clamp(value).toString(16).padStart(2, '0')).join('')}`;
}
