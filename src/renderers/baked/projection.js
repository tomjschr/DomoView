/* Orthographic projection matching the camera a bake was rendered from.
 *
 * The baked renderer never rasterises geometry, but it still has to know where
 * a world point lands in the image so it can draw blinds, weather and markers
 * over the pre-rendered pixels. Deriving the basis from the pack's camera
 * definition keeps that in sync with whatever the bake tool used.
 */

import { boundsCenter, boundsSpan, DEG } from '../../core/geometry.js';

function normalise(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map(value => value / length);
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Extra room around the home, so the render is not flush with the border. */
export const FRAME_MARGIN = 1.13;

export class BakeProjection {
  /**
   * @param {object} camera normalised pack camera the bake used
   * @param {object} bounds model bounds
   * @param {number} north pack north offset in degrees
   */
  constructor(camera, bounds, north = 0) {
    const azimuth = (camera.azimuth - north) * DEG;
    const elevation = camera.elevation * DEG;

    // Direction from the target towards the eye, then the view direction.
    const eye = [
      Math.sin(azimuth) * Math.cos(elevation),
      Math.cos(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
    ];
    this.forward = normalise(eye.map(value => -value));
    this.right = normalise(cross(this.forward, [0, 0, 1]));
    this.up = normalise(cross(this.right, this.forward));

    this.center = boundsCenter(bounds);
    // The bake frames the plan, not the elevation: the vertical extent of a
    // home is small next to its footprint and would waste half the image.
    const span = boundsSpan(bounds);
    this.extent = Math.max(span[0], span[1]) * FRAME_MARGIN / (camera.zoom || 1);
  }

  /** World point to image pixels for a square image of `size`. */
  project(point, size) {
    const scale = size / this.extent;
    const dx = point[0] - this.center[0];
    const dy = point[1] - this.center[1];
    const dz = point[2] - 0;
    const across = dx * this.right[0] + dy * this.right[1] + dz * this.right[2];
    const vertical = dx * this.up[0] + dy * this.up[1] + dz * this.up[2];
    return [size / 2 + across * scale, size / 2 - vertical * scale];
  }

  /** World point as a percentage of the image, for DOM overlays. */
  projectPercent(point) {
    const [x, y] = this.project(point, 100);
    return [x, y];
  }
}

/**
 * Nearest-neighbour index map from a target grid to the G-buffer grid.
 * Interpolating world positions across a silhouette edge would invent points
 * that sit inside walls, so this stays a point sample on purpose.
 */
export function resampleIndices(targetSize, sourceSize) {
  const indices = new Uint32Array(targetSize * targetSize);
  for (let y = 0; y < targetSize; y++) {
    const sourceY = Math.min(sourceSize - 1, Math.floor((y + 0.5) * sourceSize / targetSize));
    for (let x = 0; x < targetSize; x++) {
      const sourceX = Math.min(sourceSize - 1, Math.floor((x + 0.5) * sourceSize / targetSize));
      indices[y * targetSize + x] = sourceY * sourceSize + sourceX;
    }
  }
  return indices;
}
