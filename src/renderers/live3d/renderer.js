/* Live WebGL renderer.
 *
 * The Home Pack's GLB is the scene. Home Assistant states become real lights,
 * blinds become real geometry that casts real shadows, and the sun is a real
 * directional light placed from its computed azimuth and elevation.
 *
 * Scene space is the pack's own space: metres, +Z up, +Y towards the pack's
 * nominal north. glTF mandates Y-up, so a Y-up model is rotated on load and
 * everything downstream can use pack coordinates unchanged.
 */

import {
  WebGLRenderer, Scene, Group, Color, Vector3, Box3, Plane,
  OrthographicCamera, PerspectiveCamera,
  DirectionalLight, HemisphereLight, AmbientLight, PointLight, SpotLight,
  Object3D, Mesh, MeshStandardMaterial, BufferGeometry, BufferAttribute,
  DoubleSide, ACESFilmicToneMapping, SRGBColorSpace, PCFSoftShadowMap,
  Points, PointsMaterial, CanvasTexture, AdditiveBlending, MathUtils,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { coverEdgeHeight, slatAperture } from '../../core/covers.js';
import { clamp, DEG, insidePolygon } from '../../core/geometry.js';

/** Real-time lights are the scarcest resource in a WebGL scene. */
export const QUALITY = {
  low:    { pointLights: 6,  spotLights: 2, shadows: false, pixelRatio: 1,   particles: 0,   softShadows: false, shadowMap: 512 },
  medium: { pointLights: 12, spotLights: 3, shadows: true,  pixelRatio: 1.5, particles: 900, softShadows: false, shadowMap: 1024 },
  high:   { pointLights: 20, spotLights: 4, shadows: true,  pixelRatio: 2,   particles: 1800, softShadows: true, shadowMap: 2048 },
};

const SUN_LUX = 3.4;
const MOON_LUX = 0.5;

function srgb(triple) {
  return new Color().setRGB(triple[0] / 255, triple[1] / 255, triple[2] / 255, SRGBColorSpace);
}

/** Soft round sprite for precipitation, generated once instead of shipped. */
function particleTexture() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export class LiveRenderer {
  constructor({ pack, quality = 'medium', interactive = true, showWeather = true, onError = () => {} }) {
    this.pack = pack;
    this.quality = QUALITY[quality] || QUALITY.medium;
    this.interactive = interactive;
    this.showWeather = showWeather;
    this.onError = onError;
    this.disposed = false;
    this.ready = false;
    this.fixtureNodes = new Map();
    this.coverMeshes = new Map();
    this.emissiveOriginals = new Map();
    this.lastKey = null;
    this.snapshot = null;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'domoview-canvas';
  }

  async init(container) {
    this.container = container;
    container.append(this.canvas);

    try {
      this.renderer = new WebGLRenderer({
        canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
      });
    } catch (error) {
      throw new Error(`WebGL unavailable: ${error.message}`);
    }
    this.renderer.setPixelRatio(Math.min(this.quality.pixelRatio, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.pack.model.exposure;
    this.renderer.shadowMap.enabled = this.quality.shadows;
    if (this.quality.shadows) this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.localClippingEnabled = true;

    this.scene = new Scene();
    Object3D.DEFAULT_UP.set(0, 0, 1);
    this.scene.up.set(0, 0, 1);

    this.buildCamera();
    this.buildStaticLights();
    this.buildLightPools();
    await this.loadModel();
    this.buildCovers();
    if (this.showWeather && this.quality.particles) this.buildWeather();

    this.ready = true;
    this.resize();
    return this;
  }

  // -- camera ---------------------------------------------------------------

  buildCamera() {
    const bounds = this.pack.model.bounds;
    this.box = new Box3(new Vector3(...bounds.min), new Vector3(...bounds.max));
    this.radius = this.box.getSize(new Vector3()).length() / 2 || 5;

    const definition = this.pack.cameras.find(entry => entry.default) || this.pack.cameras[0];
    this.camera = definition.type === 'perspective'
      ? new PerspectiveCamera(definition.fov, 1, this.radius / 100, this.radius * 20)
      : new OrthographicCamera(-1, 1, 1, -1, -this.radius * 10, this.radius * 20);
    this.camera.up.set(0, 0, 1);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.enablePan = false;
    this.controls.minPolarAngle = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.enabled = this.interactive;
    this.controls.addEventListener('change', () => this.requestFrame());

    this.clipPlane = new Plane(new Vector3(0, 0, -1), 0);
    this.setCamera(definition.id);
  }

  /**
   * Half-extents of the home as the given camera actually sees it.
   *
   * Fitting a bounding sphere instead would leave a home framed with a lot of
   * slack: an apartment is wide and short, so its diagonal is far larger than
   * what a near-top-down view of it occupies. Measured once per camera, not
   * per orbit, so dragging does not re-zoom.
   */
  computeFit(definition) {
    const azimuth = (definition.azimuth - this.pack.meta.north) * DEG;
    const elevation = definition.elevation * DEG;
    const eye = new Vector3(
      Math.sin(azimuth) * Math.cos(elevation),
      Math.cos(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
    );
    const forward = eye.clone().negate().normalize();
    const right = new Vector3().crossVectors(forward, new Vector3(0, 0, 1)).normalize();
    const up = new Vector3().crossVectors(right, forward).normalize();

    const target = new Vector3(...definition.target);
    const { min, max } = this.pack.model.bounds;
    // A cut-away view need not frame geometry it hides.
    const ceiling = definition.clip?.above != null ? Math.min(max[2], definition.clip.above) : max[2];

    let halfWidth = 0, halfHeight = 0;
    const corner = new Vector3();
    for (const x of [min[0], max[0]]) {
      for (const y of [min[1], max[1]]) {
        for (const z of [min[2], ceiling]) {
          corner.set(x, y, z).sub(target);
          halfWidth = Math.max(halfWidth, Math.abs(corner.dot(right)));
          halfHeight = Math.max(halfHeight, Math.abs(corner.dot(up)));
        }
      }
    }
    return {
      halfWidth: halfWidth || this.radius,
      halfHeight: halfHeight || this.radius,
      aspect: (halfWidth || 1) / (halfHeight || 1),
    };
  }

  /** Aspect ratio at which this pack fills the frame with no wasted band. */
  get preferredAspect() {
    return this.fit?.aspect ?? 1;
  }

  setCamera(id) {
    const definition = this.pack.cameras.find(entry => entry.id === id) ||
      this.pack.cameras.find(entry => entry.default) || this.pack.cameras[0];
    this.cameraDefinition = definition;

    const target = new Vector3(...definition.target);
    const azimuth = (definition.azimuth - this.pack.meta.north) * DEG;
    const elevation = definition.elevation * DEG;
    const distance = this.radius * 2.6;
    // Azimuth is measured clockwise from +Y, so the eye sits opposite the
    // direction the camera looks along.
    const eye = new Vector3(
      target.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
      target.y + Math.cos(azimuth) * Math.cos(elevation) * distance,
      target.z + Math.sin(elevation) * distance,
    );
    this.camera.position.copy(eye);
    this.controls.target.copy(target);
    this.zoom = definition.zoom;
    this.fit = this.computeFit(definition);

    const clipping = definition.clip?.above != null;
    this.clipPlane.constant = clipping ? definition.clip.above : 0;
    this.renderer.clippingPlanes = clipping ? [this.clipPlane] : [];

    this.controls.update();
    this.resize();
    this.requestFrame();
  }

  resetView() {
    this.setCamera(this.cameraDefinition?.id);
  }

  resize() {
    if (!this.container || !this.renderer) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight || width);
    this.renderer.setSize(width, height, false);
    const aspect = width / height;

    if (this.camera.isOrthographicCamera) {
      // Grow the frustum until the projected home fits on both axes, so the
      // limiting dimension touches the frame and nothing is cropped.
      const margin = 1.06 / (this.zoom || 1);
      const needWidth = (this.fit?.halfWidth ?? this.radius) * margin;
      const needHeight = (this.fit?.halfHeight ?? this.radius) * margin;
      const halfHeight = Math.max(needHeight, needWidth / aspect);
      const halfWidth = halfHeight * aspect;
      this.camera.left = -halfWidth;
      this.camera.right = halfWidth;
      this.camera.top = halfHeight;
      this.camera.bottom = -halfHeight;
    } else {
      this.camera.aspect = aspect;
    }
    this.camera.updateProjectionMatrix();
    this.requestFrame();
  }

  // -- lights ---------------------------------------------------------------

  buildStaticLights() {
    const environment = this.pack.model.environment;

    this.sunLight = new DirectionalLight(0xffffff, 0);
    this.sunLight.castShadow = this.quality.shadows;
    if (this.quality.shadows) {
      const shadow = this.sunLight.shadow;
      shadow.mapSize.setScalar(this.quality.shadowMap);
      shadow.bias = -0.0008;
      shadow.normalBias = 0.02;
      const extent = this.radius * 1.3;
      Object.assign(shadow.camera, {
        left: -extent, right: extent, top: extent, bottom: -extent,
        near: 0.1, far: this.radius * 8,
      });
      shadow.camera.updateProjectionMatrix();
    }
    this.scene.add(this.sunLight, this.sunLight.target);

    this.moonLight = new DirectionalLight(0xffffff, 0);
    this.scene.add(this.moonLight, this.moonLight.target);

    this.skyLight = new HemisphereLight(0xdfeaff, srgb(environment.groundColor).getHex(), 0);
    this.scene.add(this.skyLight);

    this.fillLight = new AmbientLight(0xffffff, environment.nightAmbient);
    this.scene.add(this.fillLight);
  }

  /**
   * Lights are pooled rather than created per state change: adding or removing
   * a light forces three.js to recompile every material's shader, which shows
   * up as a visible stall each time someone flips a switch.
   */
  buildLightPools() {
    this.pointPool = [];
    for (let i = 0; i < this.quality.pointLights; i++) {
      const light = new PointLight(0xffffff, 0, 8, 2);
      light.visible = false;
      this.scene.add(light);
      this.pointPool.push(light);
    }
    this.spotPool = [];
    for (let i = 0; i < this.quality.spotLights; i++) {
      const light = new SpotLight(0xffffff, 0, 10, 0.6, 0.4, 2);
      light.visible = false;
      this.scene.add(light, light.target);
      this.spotPool.push(light);
    }
    this.shadowBudget = this.quality.shadows ? 2 : 0;
  }

  // -- model ----------------------------------------------------------------

  async loadModel() {
    const loader = new GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
      loader.load(this.pack.model.url, resolve, undefined,
        error => reject(new Error(error?.message || `cannot load ${this.pack.model.url}`)));
    });

    this.modelRoot = new Group();
    // glTF is Y-up by definition; a pack that declares Z-up was exported
    // without that conversion and needs no rotation here.
    if (this.pack.model.up === 'Y') this.modelRoot.rotation.x = Math.PI / 2;
    this.modelRoot.add(gltf.scene);
    this.scene.add(this.modelRoot);

    const byName = new Map();
    gltf.scene.traverse(node => {
      if (node.name) byName.set(node.name, node);
      if (!node.isMesh) return;
      node.castShadow = this.quality.shadows;
      node.receiveShadow = this.quality.shadows;
      // Blender exports single-sided walls that vanish when the camera orbits
      // behind them; a doll-house view needs both faces.
      for (const material of [].concat(node.material)) {
        if (material) material.shadowSide = DoubleSide;
      }
    });
    this.nodesByName = byName;

    for (const fixture of this.pack.fixtures) {
      const nodes = fixture.render.emissiveNodes
        .map(name => byName.get(name))
        .filter(Boolean);
      if (nodes.length) this.fixtureNodes.set(fixture.id, nodes);
      for (const node of nodes) {
        node.traverse(child => {
          if (!child.isMesh) return;
          for (const material of [].concat(child.material)) {
            if (!material || this.emissiveOriginals.has(material)) continue;
            // Clone so two fixtures sharing a Blender material do not fight.
            this.emissiveOriginals.set(material, {
              emissive: material.emissive?.clone(),
              intensity: material.emissiveIntensity ?? 1,
            });
          }
        });
      }
    }

    if (!this.pack.model.bounds || !Number.isFinite(this.pack.model.bounds.min[0])) {
      this.box.setFromObject(this.modelRoot);
      this.radius = this.box.getSize(new Vector3()).length() / 2 || 5;
    }
  }

  // -- blinds ---------------------------------------------------------------

  buildCovers() {
    this.coverGroup = new Group();
    this.scene.add(this.coverGroup);
    const material = new MeshStandardMaterial({
      color: 0x8b9298, roughness: 0.85, metalness: 0, side: DoubleSide,
    });
    this.coverMaterial = material;

    for (const opening of this.pack.openings) {
      if (!opening.cover.supported || !opening.origin || !opening.tangent) continue;
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(12), 3));
      geometry.setAttribute('normal', new BufferAttribute(new Float32Array(12), 3));
      geometry.setIndex([0, 1, 2, 0, 2, 3]);
      const mesh = new Mesh(geometry, material);
      mesh.castShadow = this.quality.shadows;
      mesh.visible = false;
      // Blinds sit a few millimetres off the glass so they never z-fight.
      mesh.userData.opening = opening;
      this.coverGroup.add(mesh);
      this.coverMeshes.set(opening.id, mesh);
    }
  }

  updateCovers(covers) {
    for (const [id, mesh] of this.coverMeshes) {
      const opening = mesh.userData.opening;
      const state = covers[id];
      if (!state) { mesh.visible = false; continue; }
      const lower = coverEdgeHeight(opening, state.position);
      const upper = opening.levelElevation + opening.head;
      if (lower >= upper - 0.005) { mesh.visible = false; continue; }

      const offset = opening.cover.inFront ? 0.035 : -0.02;
      const [nx, ny] = opening.normal || [0, 1];
      const ox = opening.origin[0] + nx * offset;
      const oy = opening.origin[1] + ny * offset;
      const [tx, ty] = opening.tangent;
      const a = [ox + tx * opening.start, oy + ty * opening.start];
      const b = [ox + tx * opening.end, oy + ty * opening.end];

      const position = mesh.geometry.attributes.position;
      position.setXYZ(0, a[0], a[1], lower);
      position.setXYZ(1, b[0], b[1], lower);
      position.setXYZ(2, b[0], b[1], upper);
      position.setXYZ(3, a[0], a[1], upper);
      position.needsUpdate = true;

      const normal = mesh.geometry.attributes.normal;
      for (let i = 0; i < 4; i++) normal.setXYZ(i, nx, ny, 0);
      normal.needsUpdate = true;
      mesh.geometry.computeBoundingSphere();

      // Tilted slats let a fraction of the beam through: approximate that by
      // making the blind partially transparent rather than modelling slats.
      const aperture = slatAperture(opening, state.position, state.tilt);
      mesh.material = aperture > 0.01 ? this.slatMaterial(aperture) : this.coverMaterial;
      mesh.visible = true;
    }
  }

  slatMaterial(aperture) {
    this.slatMaterials ||= new Map();
    const step = Math.round(clamp(aperture, 0, 1) * 10) / 10;
    if (!this.slatMaterials.has(step)) {
      this.slatMaterials.set(step, new MeshStandardMaterial({
        color: 0x8b9298, roughness: 0.85, metalness: 0, side: DoubleSide,
        transparent: true, opacity: clamp(1 - step * 0.55, 0.3, 1),
      }));
    }
    return this.slatMaterials.get(step);
  }

  // -- weather --------------------------------------------------------------

  buildWeather() {
    // Precipitation is confined to the plan area of outdoor rooms when a pack
    // declares any; a cut-away interior with rain falling through it reads as
    // a bug rather than as weather.
    const outdoor = this.pack.rooms.filter(room => room.outdoor && room.polygon);
    this.weatherPolygons = outdoor.map(room => room.polygon);

    const count = this.quality.particles;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      this.seedParticle(positions, i);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    this.weatherSeeds = seeds;

    this.weatherPoints = new Points(geometry, new PointsMaterial({
      size: 0.05, map: particleTexture(), transparent: true, depthWrite: false,
      blending: AdditiveBlending, opacity: 0, sizeAttenuation: true,
    }));
    this.weatherPoints.visible = false;
    this.scene.add(this.weatherPoints);
  }

  seedParticle(positions, index) {
    const bounds = this.pack.model.bounds;
    let x, y;
    if (this.weatherPolygons?.length) {
      const polygon = this.weatherPolygons[index % this.weatherPolygons.length];
      let attempts = 0;
      do {
        x = MathUtils.lerp(bounds.min[0], bounds.max[0], Math.random());
        y = MathUtils.lerp(bounds.min[1], bounds.max[1], Math.random());
      } while (!insidePolygon(x, y, polygon) && ++attempts < 12);
    } else {
      x = MathUtils.lerp(bounds.min[0], bounds.max[0], Math.random());
      y = MathUtils.lerp(bounds.min[1], bounds.max[1], Math.random());
    }
    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = MathUtils.lerp(bounds.min[2], bounds.max[2] + 1.5, Math.random());
  }

  updateWeather(delta, weather) {
    if (!this.weatherPoints) return;
    const intensity = Math.max(weather.rain, weather.snow);
    this.weatherPoints.visible = intensity > 0.01;
    if (!this.weatherPoints.visible) return;

    const snowing = weather.snow > weather.rain;
    const material = this.weatherPoints.material;
    material.opacity = clamp(0.25 + intensity * 0.5, 0, 0.8);
    material.size = snowing ? 0.055 : 0.03;

    const positions = this.weatherPoints.geometry.attributes.position;
    const array = positions.array;
    const fall = (snowing ? 0.9 : 7) * (0.4 + intensity);
    const drift = weather.wind * (snowing ? 1.2 : 2.2);
    const floor = this.pack.model.bounds.min[2];
    const count = array.length / 3;
    for (let i = 0; i < count; i++) {
      const base = i * 3;
      array[base + 2] -= fall * delta;
      array[base] += drift * delta * (0.5 + this.weatherSeeds[i]);
      if (snowing) array[base + 1] += Math.sin(this.weatherSeeds[i] * 12 + performance.now() / 900) * delta * 0.3;
      if (array[base + 2] < floor) this.seedParticle(array, i);
    }
    positions.needsUpdate = true;
  }

  // -- per-state update ------------------------------------------------------

  apply(snapshot) {
    if (!this.ready) return;
    this.snapshot = snapshot;
    this.applySky(snapshot);
    this.applyFixtures(snapshot);
    this.updateCovers(snapshot.covers);
    this.requestFrame();
  }

  applySky(snapshot) {
    const { sun, moon, daylight, direct, moonStrength } = snapshot;
    const north = this.pack.meta.north;

    const place = (light, azimuth, elevation) => {
      const az = (azimuth - north) * DEG, el = elevation * DEG;
      const distance = this.radius * 4;
      light.position.set(
        Math.sin(az) * Math.cos(el) * distance,
        Math.cos(az) * Math.cos(el) * distance,
        Math.sin(el) * distance,
      ).add(new Vector3(...this.pack.model.center));
      light.target.position.set(...this.pack.model.center);
      light.target.updateMatrixWorld();
    };

    place(this.sunLight, sun.azimuth, sun.elevation);
    this.sunLight.intensity = sun.elevation > 0 ? direct * SUN_LUX : 0;
    this.sunLight.color = srgb(snapshot.sunColor);
    this.sunLight.visible = this.sunLight.intensity > 0.001;
    if (this.sunLight.castShadow) this.sunLight.castShadow = this.sunLight.visible;

    place(this.moonLight, moon.azimuth, moon.elevation);
    this.moonLight.intensity = moon.elevation > 0 ? moonStrength * MOON_LUX : 0;
    this.moonLight.color = srgb(snapshot.moonColor);
    this.moonLight.visible = this.moonLight.intensity > 0.001;

    const sky = this.pack.model.environment.skyIntensity;
    this.skyLight.intensity = (0.08 + daylight * 1.15) * sky;
    this.fillLight.intensity = this.pack.model.environment.nightAmbient * (1.6 - daylight);

    const night = 0.02 + daylight * 0.06;
    this.scene.background = null;
    this.renderer.setClearColor(new Color(night, night * 1.08, night * 1.2), 0);
  }

  applyFixtures(snapshot) {
    const emitters = [];
    for (const active of snapshot.emitters) {
      const fixture = active.fixture;
      this.setEmissive(fixture, active);
      const weightTotal = fixture.emitters.reduce((sum, e) => sum + (e.intensity || 1), 0) || 1;
      for (const emitter of fixture.emitters) {
        if (emitter.type === 'emissive') continue;
        emitters.push({
          fixture, emitter, active,
          weight: (emitter.intensity || 1) / weightTotal,
          // Big, bright fixtures win a real light slot before small accents.
          priority: active.level * (emitter.intensity || 1) * (fixture.light.lumens || 600),
        });
      }
    }
    for (const fixture of this.pack.fixtures) {
      if (!snapshot.emitters.some(active => active.fixture.id === fixture.id)) {
        this.setEmissive(fixture, null);
      }
    }

    emitters.sort((a, b) => b.priority - a.priority);
    let pointIndex = 0, spotIndex = 0, shadowsLeft = this.shadowBudget;

    for (const entry of emitters) {
      const { fixture, emitter, active, weight } = entry;
      const wantsSpot = emitter.type === 'spot' && spotIndex < this.spotPool.length;
      const light = wantsSpot ? this.spotPool[spotIndex++]
        : pointIndex < this.pointPool.length ? this.pointPool[pointIndex++] : null;
      if (!light) break;

      // Lumens to a three.js physical intensity: candela for a point light is
      // lumens / 4pi, scaled down because a rendered room reads brighter than
      // the photometric figure alone suggests.
      const lumens = (fixture.light.lumens || 600) * weight * active.level;
      light.intensity = lumens / (4 * Math.PI) * 0.06;
      light.color = srgb(active.color);
      light.distance = fixture.light.range;
      light.position.set(...emitter.position);
      light.visible = light.intensity > 0.0005;

      if (light.isSpotLight) {
        light.angle = (emitter.angle ?? 40) * DEG;
        light.penumbra = emitter.penumbra;
        const target = emitter.target || [emitter.position[0], emitter.position[1], emitter.position[2] - 2];
        light.target.position.set(...target);
        light.target.updateMatrixWorld();
      }

      const wantShadow = fixture.light.shadow && shadowsLeft > 0 && this.quality.shadows;
      if (wantShadow) {
        shadowsLeft--;
        if (!light.castShadow) {
          light.castShadow = true;
          light.shadow.mapSize.setScalar(Math.min(1024, this.quality.shadowMap));
          light.shadow.bias = -0.002;
          light.shadow.normalBias = 0.03;
        }
      } else if (light.castShadow) {
        light.castShadow = false;
      }
    }

    for (let i = pointIndex; i < this.pointPool.length; i++) {
      this.pointPool[i].visible = false;
      this.pointPool[i].intensity = 0;
    }
    for (let i = spotIndex; i < this.spotPool.length; i++) {
      this.spotPool[i].visible = false;
      this.spotPool[i].intensity = 0;
    }
  }

  /** The fixture itself glows even when it lost the contest for a real light. */
  setEmissive(fixture, active) {
    const nodes = this.fixtureNodes.get(fixture.id);
    if (!nodes) return;
    for (const node of nodes) {
      node.traverse(child => {
        if (!child.isMesh) return;
        for (const material of [].concat(child.material)) {
          const original = material && this.emissiveOriginals.get(material);
          if (!original) continue;
          if (!active) {
            if (original.emissive) material.emissive.copy(original.emissive);
            material.emissiveIntensity = original.intensity;
            continue;
          }
          material.emissive = srgb(active.color);
          material.emissiveIntensity = 0.4 + active.level * 2.6;
        }
      });
    }
  }

  // -- projection for DOM overlays -------------------------------------------

  /**
   * Where a fixture appears on screen, as percentages of the canvas. The card
   * uses this to place accessible DOM markers and climate chips over the 3D
   * view instead of picking meshes.
   */
  project(point) {
    if (!this.camera) return null;
    const vector = new Vector3(...point).project(this.camera);
    if (vector.z > 1 || vector.z < -1) return null;
    return [(vector.x + 1) / 2 * 100, (1 - vector.y) / 2 * 100];
  }

  fixtureAnchor(fixture) {
    if (fixture.emitters.length) {
      const sum = fixture.emitters.reduce((total, emitter) =>
        total.map((value, i) => value + emitter.position[i]), [0, 0, 0]);
      return sum.map(value => value / fixture.emitters.length);
    }
    const nodes = this.fixtureNodes.get(fixture.id);
    if (nodes?.length) {
      return nodes[0].getWorldPosition(new Vector3()).toArray();
    }
    return null;
  }

  fixtureScreen(fixture) {
    const anchor = this.fixtureAnchor(fixture);
    return anchor ? this.project(anchor) : null;
  }

  roomScreen(room) {
    if (!room.label) return null;
    const level = this.pack.levels.find(entry => entry.id === room.level);
    return this.project([room.label[0], room.label[1], (level?.elevation ?? 0) + 1.1]);
  }

  openingScreen(opening) {
    if (!opening.origin) return null;
    const along = (opening.start + opening.end) / 2;
    return this.project([
      opening.origin[0] + opening.tangent[0] * along,
      opening.origin[1] + opening.tangent[1] * along,
      opening.levelElevation + opening.head,
    ]);
  }

  // -- frame loop ------------------------------------------------------------

  requestFrame() {
    if (this.disposed || this.frame) return;
    this.frame = requestAnimationFrame(time => this.draw(time));
  }

  /** Keep animating only while something actually moves. */
  draw(time) {
    this.frame = null;
    if (this.disposed || !this.ready) return;
    const delta = Math.min(0.1, (time - (this.lastTime || time)) / 1000);
    this.lastTime = time;

    const damping = this.controls.update();
    const weather = this.snapshot?.weather;
    const animating = !!weather && Math.max(weather.rain, weather.snow) > 0.01;
    if (animating && !document.hidden) this.updateWeather(delta, weather);

    this.renderer.render(this.scene, this.camera);
    this.onFrame?.();
    if (damping || (animating && !document.hidden)) this.requestFrame();
  }

  setInteractive(enabled) {
    this.interactive = enabled;
    if (this.controls) this.controls.enabled = enabled;
  }

  dispose() {
    this.disposed = true;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.controls?.dispose();
    this.scene?.traverse(node => {
      if (node.isMesh || node.isPoints) {
        node.geometry?.dispose();
        for (const material of [].concat(node.material)) {
          material?.map?.dispose();
          material?.dispose();
        }
      }
    });
    this.renderer?.dispose();
    this.canvas.remove();
  }
}
