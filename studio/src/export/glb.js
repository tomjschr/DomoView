/* Project to glTF-Binary.
 *
 * Walls with holes are built without a CSG library: a wall is cut into solid
 * pieces around its openings, plus a piece under each sill and over each head.
 * For rectangular openings in a straight wall that is exact, and it avoids
 * pulling a boolean-geometry dependency into the browser.
 *
 * The scene is assembled in pack space (metres, +Z up) and rotated to Y-up
 * immediately before export, so the file is a conventional glTF that any
 * viewer shows upright while the card's coordinates stay the pack's own.
 */

import {
  Scene, Group, Mesh, BoxGeometry, SphereGeometry, ShapeGeometry, Shape,
  MeshStandardMaterial, MeshPhysicalMaterial, Color, Matrix4, Vector3,
  SRGBColorSpace, DoubleSide,
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { PlanTransform, wallVectorsPack, hexToRgb255 } from '../units.js';
import { slugify } from '../project.js';

function srgb(hex) {
  const [r, g, b] = hexToRgb255(hex);
  return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);
}

/**
 * Box spanning a length along a wall's tangent, its thickness across, and a
 * height range, positioned and rotated into pack space.
 */
function wallPiece(origin, tangent, from, to, thickness, base, top) {
  const length = to - from;
  const height = top - base;
  if (length <= 1e-4 || height <= 1e-4) return null;
  const geometry = new BoxGeometry(length, thickness, height);
  const centreAlong = (from + to) / 2;
  const angle = Math.atan2(tangent[1], tangent[0]);
  const matrix = new Matrix4()
    .makeTranslation(
      origin[0] + tangent[0] * centreAlong,
      origin[1] + tangent[1] * centreAlong,
      base + height / 2,
    )
    .multiply(new Matrix4().makeRotationZ(angle));
  geometry.applyMatrix4(matrix);
  return geometry;
}

/** Room floor slab as an extruded outline. */
function floorSlab(polygon, elevation, thickness = 0.04) {
  const shape = new Shape(polygon.map(([x, y]) => ({ x, y })));
  const geometry = new ShapeGeometry(shape);
  // A slab rather than a plane so the floor has an edge when seen from the side.
  const top = geometry.clone().applyMatrix4(new Matrix4().makeTranslation(0, 0, elevation));
  const bottom = geometry.clone().applyMatrix4(new Matrix4().makeTranslation(0, 0, elevation - thickness));
  return mergeGeometries([top, bottom].filter(Boolean));
}

export function buildScene(data) {
  const transform = new PlanTransform(data);
  const level = data.level;
  const scene = new Scene();
  scene.name = slugify(data.meta.name, 'home');

  const materials = {
    wall: new MeshStandardMaterial({ name: 'dv_wall', color: srgb(data.materials.wall), roughness: 0.85, metalness: 0 }),
    floor: new MeshStandardMaterial({ name: 'dv_floor', color: srgb(data.materials.floor), roughness: 0.7, metalness: 0, side: DoubleSide }),
    furniture: new MeshStandardMaterial({ name: 'dv_furniture', color: srgb(data.materials.furniture), roughness: 0.8, metalness: 0 }),
    glass: new MeshPhysicalMaterial({
      name: 'dv_glass', color: 0xdfeaf2, roughness: 0.05, metalness: 0,
      transparent: true, opacity: 0.25, transmission: 0.85, thickness: 0.006,
    }),
  };

  // -- floors ---------------------------------------------------------------
  const floorGeometries = [];
  for (const room of data.rooms) {
    if (room.polygon.length < 3) continue;
    floorGeometries.push(floorSlab(transform.polygon(room.polygon), level.elevation));
  }
  if (floorGeometries.length) {
    const mesh = new Mesh(mergeGeometries(floorGeometries), materials.floor);
    mesh.name = 'dv_floor';
    scene.add(mesh);
  }

  // -- walls ----------------------------------------------------------------
  const wallGeometries = [];
  const glassGeometries = [];
  for (const wall of data.walls) {
    const { tangent, length } = wallVectorsPack(wall);
    const metres = transform.length(Math.hypot(wall.b[0] - wall.a[0], wall.b[1] - wall.a[1]));
    const origin = transform.point(wall.a);
    const base = level.elevation;
    const top = base + wall.height;

    const holes = data.openings
      .filter(opening => opening.wall === wall.id)
      .map(opening => {
        const centre = transform.length(opening.offset);
        return {
          from: Math.max(0, centre - opening.width / 2),
          to: Math.min(metres, centre + opening.width / 2),
          sill: base + opening.sill,
          head: Math.min(top, base + opening.head),
          type: opening.type,
          id: opening.id,
        };
      })
      .filter(hole => hole.to > hole.from)
      .sort((a, b) => a.from - b.from);

    let cursor = 0;
    for (const hole of holes) {
      // Solid wall up to this opening.
      wallGeometries.push(wallPiece(origin, tangent, cursor, hole.from, wall.thickness, base, top));
      // Spandrel below the sill and lintel above the head.
      wallGeometries.push(wallPiece(origin, tangent, hole.from, hole.to, wall.thickness, base, hole.sill));
      wallGeometries.push(wallPiece(origin, tangent, hole.from, hole.to, wall.thickness, hole.head, top));
      if (hole.type !== 'door') {
        glassGeometries.push(wallPiece(origin, tangent, hole.from, hole.to, 0.012, hole.sill, hole.head));
      }
      cursor = Math.max(cursor, hole.to);
    }
    wallGeometries.push(wallPiece(origin, tangent, cursor, metres, wall.thickness, base, top));
    void length;
  }

  const solidWalls = wallGeometries.filter(Boolean);
  if (solidWalls.length) {
    const mesh = new Mesh(mergeGeometries(solidWalls), materials.wall);
    mesh.name = 'dv_walls';
    scene.add(mesh);
  }
  const panes = glassGeometries.filter(Boolean);
  if (panes.length) {
    const mesh = new Mesh(mergeGeometries(panes), materials.glass);
    mesh.name = 'dv_glass';
    scene.add(mesh);
  }

  // -- furniture ------------------------------------------------------------
  const solidFurniture = data.furniture.filter(item => item.solid);
  if (solidFurniture.length) {
    const group = new Group();
    group.name = 'dv_furniture';
    for (const item of solidFurniture) {
      const corners = item.rect.map(point => transform.point(point));
      const xs = corners.map(point => point[0]);
      const ys = corners.map(point => point[1]);
      const width = Math.max(...xs) - Math.min(...xs);
      const depth = Math.max(...ys) - Math.min(...ys);
      const height = Math.max(0.02, item.top - item.base);
      if (width < 1e-3 || depth < 1e-3) continue;
      const mesh = new Mesh(new BoxGeometry(width, depth, height), materials.furniture);
      mesh.name = `dv_occluder_${slugify(item.name, item.id)}`;
      mesh.position.set(
        (Math.min(...xs) + Math.max(...xs)) / 2,
        (Math.min(...ys) + Math.max(...ys)) / 2,
        item.base + height / 2,
      );
      group.add(mesh);
    }
    if (group.children.length) scene.add(group);
  }

  // -- light fixture markers ------------------------------------------------
  const usedIds = new Set();
  const lights = new Group();
  lights.name = 'dv_lights';
  for (const [index, fixture] of data.fixtures.entries()) {
    let id = slugify(fixture.name, `${fixture.kind}_${index + 1}`);
    let suffix = 2;
    while (usedIds.has(id)) id = `${slugify(fixture.name, `${fixture.kind}_${index + 1}`)}_${suffix++}`;
    usedIds.add(id);

    const group = new Group();
    // Must match the node name the manifest writes, or the live renderer
    // cannot find the geometry to make glow.
    group.name = `dv_light_${id}`;
    const emissive = new MeshStandardMaterial({
      name: `dv_emissive_${id}`,
      color: 0x1a1a1a,
      emissive: srgb(fixture.color),
      emissiveIntensity: 1,
      roughness: 0.4,
    });
    for (const emitter of fixture.emitters) {
      const [x, y] = transform.point(emitter.point);
      const radius = emitter.type === 'strip' ? 0.02 : 0.045;
      const mesh = new Mesh(new SphereGeometry(radius, 10, 8), emissive);
      mesh.position.set(x, y, emitter.height);
      group.add(mesh);
    }
    if (group.children.length) lights.add(group);
  }
  if (lights.children.length) scene.add(lights);

  return { scene, transform };
}

/**
 * Export the project as a GLB ArrayBuffer.
 * The whole scene is wrapped in a group rotated -90 degrees about X, which
 * converts pack space (+Z up) into the glTF convention (+Y up).
 */
export async function exportGlb(data) {
  const { scene } = buildScene(data);
  const root = new Group();
  root.name = 'dv_root';
  root.rotation.x = -Math.PI / 2;
  while (scene.children.length) root.add(scene.children[0]);
  const wrapper = new Scene();
  wrapper.name = scene.name;
  wrapper.add(root);
  wrapper.updateMatrixWorld(true);

  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(wrapper, result => {
      if (result instanceof ArrayBuffer) resolve(result);
      else reject(new Error('GLTFExporter returned JSON where binary was requested'));
    }, error => reject(error instanceof Error ? error : new Error(String(error))), {
      binary: true,
      onlyVisible: false,
      truncateDrawRange: false,
    });
  });
}

/** Rough triangle count, shown in the export panel as a complexity hint. */
export function sceneStats(data) {
  const { scene } = buildScene(data);
  let triangles = 0, meshes = 0;
  scene.traverse(node => {
    if (!node.isMesh) return;
    meshes += 1;
    const index = node.geometry.getIndex();
    const position = node.geometry.getAttribute('position');
    triangles += (index ? index.count : position?.count || 0) / 3;
    node.geometry.dispose();
  });
  const box = new Vector3();
  return { triangles: Math.round(triangles), meshes, size: box };
}
