/* DomoView Lovelace card.
 *
 * Owns the DOM shell, the accessible overlays and the Home Assistant plumbing.
 * All rendering is delegated to one of two interchangeable renderers, and
 * everything home-specific comes from the Home Pack, so this file contains no
 * knowledge of any particular home.
 */

import { loadPack, inspectPack, PackError } from './core/pack.js';
import { HomeState, PREVIEW_DEFAULTS } from './core/hass.js';
import { createTranslator, createFormatter } from './i18n/index.js';
import { clamp } from './core/geometry.js';
import { cardStyles } from './styles.js';
import { ICONS } from './icons.js';

export const VERSION = '0.1.0';

const DEFAULT_CONFIG = {
  home: '/local/domoview/homes/demo',
  renderer: 'auto',
  aspect: null,
  quality: 'medium',
  camera: null,
  variant: 'base',
  interactive: true,
  show_climate: true,
  show_weather: true,
  sun_entity: 'sun.sun',
  entities: {},
  covers: {},
  window_sensors: {},
  rooms: {},
};

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export class DomoViewCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.config = { ...DEFAULT_CONFIG };
    this.preview = { ...PREVIEW_DEFAULTS };
    this.pack = null;
    this.renderer = null;
    this.state = null;
    this.selected = null;
    this.inspecting = false;
    this.loadToken = 0;
  }

  // -- Lovelace contract -----------------------------------------------------

  setConfig(config) {
    if (!config?.home) throw new Error('DomoView: "home" is required (path to a Home Pack folder)');
    const previous = this.config;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.preview = { ...this.preview, ...(config.preview || {}), enabled: !!config.preview?.enabled || !!config.demo };

    const structural = ['home', 'renderer', 'quality', 'variant', 'show_weather'];
    const changed = structural.some(key => previous[key] !== this.config[key]);
    if (!this.isConnected) return;
    if (changed || !this.pack) this.load();
    else {
      this.state.config = this.config;
      this.buildOverlays();
      this.update();
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.language = hass?.locale?.language || hass?.language || 'en';
    this.t = createTranslator(this.language);
    this.format = createFormatter(this.language);
    this.state?.setHass(hass);
    this.update();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 11;
  }

  getGridOptions() {
    return { columns: 'full', min_columns: 6, rows: 'auto' };
  }

  static getConfigElement() {
    return document.createElement('domoview-card-editor');
  }

  static getStubConfig() {
    return { home: '/local/domoview/homes/demo', renderer: 'auto', entities: {} };
  }

  connectedCallback() {
    this.t ||= createTranslator('en');
    this.format ||= createFormatter('en');
    if (!this.pack && !this.loading) this.load();
  }

  disconnectedCallback() {
    this.teardown();
  }

  teardown() {
    this.renderer?.dispose();
    this.renderer = null;
    this.frameObserver?.disconnect();
    clearTimeout(this.brightnessTimer);
  }

  // -- lifecycle -------------------------------------------------------------

  async load() {
    if (this.loading) { this.reloadQueued = true; return; }
    this.loading = true;
    const token = ++this.loadToken;
    this.teardown();
    this.drawShell();

    try {
      this.pack = await loadPack(this.config.home, {
        variant: this.config.variant,
        cacheBust: this.config.cache_bust || null,
      });
      if (token !== this.loadToken) return;

      this.state = new HomeState(this.pack, this.config, this.preview);
      this.state.setHass(this._hass);

      const mode = this.pickRenderer();
      this.renderer = await this.createRenderer(mode);
      if (token !== this.loadToken) { this.renderer?.dispose(); return; }

      this.renderer.onFrame = () => this.positionOverlays();
      this.applyAspect();
      this.buildOverlays();
      this.observeSize();
      this.update();
      for (const warning of inspectPack(this.pack)) console.info('DomoView:', warning);
    } catch (error) {
      if (token !== this.loadToken) return;
      const key = error instanceof PackError ? 'error.pack' : 'error.model';
      this.fail(this.t(key, { error: error.message }), error);
    } finally {
      this.loading = false;
      if (this.reloadQueued && this.isConnected) {
        this.reloadQueued = false;
        queueMicrotask(() => this.load());
      }
    }
  }

  pickRenderer() {
    const wanted = this.config.renderer;
    if (wanted === 'baked') {
      if (!this.pack.baked) throw new Error(this.t('error.noBaked'));
      return 'baked';
    }
    if (wanted === 'live3d') {
      if (!this.pack.model.url) throw new Error(this.t('error.noModel'));
      if (!webglAvailable()) throw new Error(this.t('error.webgl'));
      return 'live3d';
    }
    // Automatic: prefer live 3D because the GLB is the pack's source of truth,
    // and fall back to a bake where WebGL is missing or the pack ships no
    // geometry at all.
    if (this.pack.model.url && webglAvailable()) return 'live3d';
    if (this.pack.baked) return 'baked';
    throw new Error(this.t(this.pack.model.url ? 'error.webgl' : 'error.noModel'));
  }

  async createRenderer(mode) {
    const stage = this.shadowRoot.querySelector('.stage');
    this.rendererMode = mode;
    if (mode === 'baked') {
      const { BakedRenderer } = await import('./renderers/baked/renderer.js');
      return new BakedRenderer({
        pack: this.pack,
        quality: this.config.quality,
        showWeather: this.config.show_weather,
        onError: error => this.notify(error.message),
      }).init(stage);
    }
    const { LiveRenderer } = await import('./renderers/live3d/renderer.js');
    const renderer = new LiveRenderer({
      pack: this.pack,
      quality: this.config.quality,
      interactive: this.config.interactive,
      showWeather: this.config.show_weather,
      onError: error => this.notify(error.message),
    });
    await renderer.init(stage);
    if (this.config.camera) renderer.setCamera(this.config.camera);
    return renderer;
  }

  /**
   * Shape the card to the home rather than to a fixed square. A flat, wide
   * apartment in a 1:1 frame wastes a third of the card on empty background.
   */
  applyAspect() {
    const scene = this.shadowRoot.querySelector('.scene');
    if (!scene) return;
    const configured = Number(this.config.aspect);
    const preferred = this.renderer?.preferredAspect;
    const value = Number.isFinite(configured) && configured > 0 ? configured
      : preferred ? clamp(preferred, 0.85, 2.4)
      : 1;
    scene.style.setProperty('--domoview-aspect', String(value));
  }

  observeSize() {
    this.frameObserver = new ResizeObserver(() => {
      this.renderer?.resize();
      this.positionOverlays();
    });
    this.frameObserver.observe(this.shadowRoot.querySelector('.scene'));
  }

  /**
   * The shell is drawn before Home Assistant hands over `hass`, so its static
   * labels are written in English first. Re-label them once the user's
   * language is known instead of redrawing the shell, which would tear down
   * the renderer's canvas.
   */
  applyStaticLabels() {
    const root = this.shadowRoot;
    const scene = root.querySelector('.scene');
    if (!scene) return;
    this.labelledLanguage = this.language;

    scene.setAttribute('aria-label', this.t('card.scene'));
    const inspect = root.querySelector('.inspect');
    if (inspect) inspect.textContent = this.t(this.inspecting ? 'hud.done' : 'hud.fixtures');
    const camera = root.querySelector('.camera');
    if (camera) camera.setAttribute('aria-label', this.t('hud.view'));

    const info = root.querySelector('.control-info');
    if (info) {
      info.title = this.t('fixture.moreInfo');
      info.setAttribute('aria-label', this.t('fixture.moreInfo'));
    }
    const close = root.querySelector('.control-close');
    if (close) close.setAttribute('aria-label', this.t('fixture.close'));

    const brightnessLabel = root.querySelector('.dimmer label');
    if (brightnessLabel) brightnessLabel.textContent = this.t('fixture.brightness');
    const range = root.querySelector('.dimmer-range');
    if (range) range.setAttribute('aria-label', this.t('fixture.brightness'));

    if (this.preview.enabled) this.buildPreviewBar();
  }

  update() {
    if (!this.state || !this.renderer?.ready) return;
    if (this.language !== this.labelledLanguage) this.applyStaticLabels();
    const snapshot = this.state.snapshot();
    this.snapshot = snapshot;
    this.renderer.apply(snapshot);
    this.renderMarkers(snapshot);
    this.renderClimate(snapshot);
    this.renderWindows(snapshot);
    this.renderControl();
    this.renderCounts();
  }

  // -- shell -----------------------------------------------------------------

  drawShell() {
    const t = this.t;
    const cameras = this.pack?.cameras || [];
    this.shadowRoot.innerHTML = `
      <style>${cardStyles()}</style>
      <div class="card">
        <div class="scene" role="group" aria-label="${this.escape(t('card.scene'))}">
          <div class="stage"></div>
          <div class="overlays">
            <div class="climate" aria-hidden="false"></div>
            <div class="windows"></div>
            <div class="markers"></div>
          </div>
          <div class="hud">
            <button class="inspect" type="button" aria-pressed="false">${this.escape(t('hud.fixtures'))}</button>
            <span class="counts"></span>
            ${cameras.length > 1 ? `<select class="camera" aria-label="${this.escape(t('hud.view'))}"></select>` : ''}
          </div>
          <div class="control" hidden>
            <div class="control-head">
              <span class="control-name"></span>
              <button class="control-info" type="button" title="${this.escape(t('fixture.moreInfo'))}" aria-label="${this.escape(t('fixture.moreInfo'))}">${ICONS.info}</button>
              <button class="control-close" type="button" aria-label="${this.escape(t('fixture.close'))}">&times;</button>
            </div>
            <button class="control-power" type="button"></button>
            <div class="dimmer" hidden>
              <label for="dv-brightness">${this.escape(t('fixture.brightness'))}</label>
              <output class="dimmer-value"></output>
              <input id="dv-brightness" class="dimmer-range" type="range" min="1" max="100" step="1"
                     aria-label="${this.escape(t('fixture.brightness'))}">
            </div>
          </div>
          <p class="notice" role="status"></p>
        </div>
        <div class="preview-bar"></div>
      </div>`;

    this.bindShell();
    if (this.preview.enabled) this.buildPreviewBar();
  }

  bindShell() {
    const root = this.shadowRoot;
    root.querySelector('.inspect').onclick = () => this.toggleInspect();
    root.querySelector('.control-close').onclick = () => { this.selected = null; this.renderControl(); };
    root.querySelector('.control-power').onclick = () => this.toggleSelected();
    root.querySelector('.control-info').onclick = () => {
      if (this.selected) this.state.showMoreInfo(this, this.selected);
    };
    const range = root.querySelector('.dimmer-range');
    range.oninput = () => this.applyBrightness(Number(range.value), false);
    range.onchange = () => this.applyBrightness(Number(range.value), true);

    const camera = root.querySelector('.camera');
    if (camera) {
      camera.replaceChildren(...(this.pack?.cameras || []).map(entry => {
        const option = document.createElement('option');
        option.value = entry.id;
        option.textContent = entry.name;
        option.selected = entry.id === (this.config.camera || this.pack.cameras.find(c => c.default)?.id);
        return option;
      }));
      camera.onchange = () => {
        this.renderer?.setCamera(camera.value);
        this.positionOverlays();
      };
    }
  }

  toggleInspect() {
    this.inspecting = !this.inspecting;
    if (!this.inspecting) this.selected = null;
    const button = this.shadowRoot.querySelector('.inspect');
    button.setAttribute('aria-pressed', String(this.inspecting));
    button.textContent = this.inspecting ? this.t('hud.done') : this.t('hud.fixtures');
    this.shadowRoot.querySelector('.markers').classList.toggle('inspecting', this.inspecting);
    for (const marker of this.shadowRoot.querySelectorAll('.marker')) {
      marker.tabIndex = this.inspecting ? 0 : -1;
      marker.setAttribute('aria-hidden', String(!this.inspecting));
    }
    this.renderControl();
  }

  // -- overlays --------------------------------------------------------------

  /** Markers are DOM buttons rather than picked meshes, so they stay reachable
   *  by keyboard and screen readers in both renderers. */
  buildOverlays() {
    if (!this.pack) return;
    const box = this.shadowRoot.querySelector('.markers');
    if (!box) return;
    const bound = this.pack.fixtures.filter(fixture =>
      this.preview.enabled || this.state.entityFor(fixture.id));

    this.markerElements = new Map();
    box.replaceChildren(...bound.map(fixture => {
      const button = document.createElement('button');
      button.className = `marker kind-${fixture.kind}`;
      button.type = 'button';
      button.title = fixture.name;
      button.setAttribute('aria-label', fixture.name);
      button.tabIndex = this.inspecting ? 0 : -1;
      button.setAttribute('aria-hidden', String(!this.inspecting));
      button.dataset.fixture = fixture.id;
      button.onclick = () => { this.selected = fixture.id; this.renderControl(); };
      this.markerElements.set(fixture.id, button);
      return button;
    }));
    this.positionOverlays();
  }

  /** Reproject overlays after a camera move or a resize. */
  positionOverlays() {
    if (!this.renderer || !this.pack) return;
    for (const [id, element] of this.markerElements || []) {
      const fixture = this.pack.fixtureById.get(id);
      const point = fixture && this.renderer.fixtureScreen(fixture);
      if (!point) { element.style.display = 'none'; continue; }
      element.style.display = '';
      element.style.left = `${point[0]}%`;
      element.style.top = `${point[1]}%`;
    }
    for (const [id, element] of this.climateElements || []) {
      const room = this.pack.roomById.get(id);
      const point = room && this.renderer.roomScreen(room);
      if (!point) { element.style.display = 'none'; continue; }
      element.style.display = '';
      element.style.left = `${point[0]}%`;
      element.style.top = `${point[1]}%`;
    }
    for (const [id, element] of this.windowElements || []) {
      const opening = this.pack.openingById.get(id);
      const point = opening && this.renderer.openingScreen(opening);
      if (!point) { element.style.display = 'none'; continue; }
      element.style.display = '';
      element.style.left = `${point[0]}%`;
      element.style.top = `${point[1]}%`;
    }
  }

  renderMarkers(snapshot) {
    const on = new Set(snapshot.emitters.map(item => item.id));
    for (const [id, element] of this.markerElements || []) {
      element.classList.toggle('on', on.has(id));
    }
  }

  renderClimate(snapshot) {
    const box = this.shadowRoot.querySelector('.climate');
    if (!box) return;
    if (!this.config.show_climate) { box.replaceChildren(); this.climateElements = new Map(); return; }

    this.climateElements = new Map();
    const chips = [];
    for (const [roomId, values] of snapshot.climate) {
      const room = this.pack.roomById.get(roomId);
      const chip = document.createElement('div');
      chip.className = 'chip';
      const parts = [];
      if (values.temperature !== null) {
        parts.push(`<span>${ICONS.thermometer}${this.format.temperature(values.temperature)}°</span>`);
      }
      if (values.humidity !== null) {
        parts.push(`<span>${ICONS.humidity}${this.format.percent(values.humidity)} %</span>`);
      }
      const spoken = [
        values.temperature !== null ? this.t('climate.temperature', { value: this.format.temperature(values.temperature) }) : '',
        values.humidity !== null ? this.t('climate.humidity', { value: this.format.percent(values.humidity) }) : '',
      ].filter(Boolean).join(', ');
      chip.setAttribute('aria-label', `${room.name}: ${spoken}`);
      chip.innerHTML = `<span class="chip-values">${parts.join('')}</span>`;
      this.climateElements.set(roomId, chip);
      chips.push(chip);
    }
    box.replaceChildren(...chips);
    this.positionOverlays();
  }

  renderWindows(snapshot) {
    const box = this.shadowRoot.querySelector('.windows');
    if (!box) return;
    this.windowElements = new Map();
    const badges = [];
    for (const id of snapshot.openWindows) {
      const opening = this.pack.openingById.get(id);
      if (!opening) continue;
      const badge = document.createElement('span');
      badge.className = 'window-open';
      badge.setAttribute('role', 'img');
      const label = this.t('window.open', { name: opening.name });
      badge.setAttribute('aria-label', label);
      badge.title = label;
      badge.innerHTML = ICONS.windowOpen;
      this.windowElements.set(id, badge);
      badges.push(badge);
    }
    box.replaceChildren(...badges);
    this.positionOverlays();
  }

  renderCounts() {
    const counts = this.shadowRoot.querySelector('.counts');
    if (!counts) return;
    const total = this.pack.fixtures.length;
    const bound = this.pack.fixtures.filter(fixture => this.state.entityFor(fixture.id)).length;
    counts.textContent = this.t('hud.count', { bound, total });
  }

  // -- fixture control -------------------------------------------------------

  renderControl() {
    const box = this.shadowRoot.querySelector('.control');
    if (!box) return;
    const fixture = this.selected ? this.pack.fixtureById.get(this.selected) : null;
    box.hidden = !fixture || !this.inspecting;
    if (box.hidden) return;

    const entity = this.state.entityFor(fixture.id);
    const raw = this.preview.enabled ? 'on' : this._hass?.states?.[entity]?.state;
    const usable = this.preview.enabled || (!!raw && !['unavailable', 'unknown'].includes(raw));
    const on = this.state.isOn(fixture);

    box.querySelector('.control-name').textContent =
      fixture.roomName ? `${fixture.roomName} · ${fixture.name.replace(/^.*\|\s*/, '')}` : fixture.name;
    box.querySelector('.control-info').hidden = !entity;

    const power = box.querySelector('.control-power');
    power.textContent = usable
      ? this.t(on ? 'fixture.turnOff' : 'fixture.turnOn')
      : this.t('fixture.unavailable');
    power.disabled = !usable;

    const dimmer = box.querySelector('.dimmer');
    dimmer.hidden = !usable || !this.state.canDim(fixture);
    if (!dimmer.hidden) {
      const percent = this.state.brightnessPercent(fixture);
      dimmer.querySelector('.dimmer-value').textContent = `${percent} %`;
      dimmer.querySelector('.dimmer-range').value = String(percent);
    }
  }

  async toggleSelected() {
    const fixture = this.selected && this.pack.fixtureById.get(this.selected);
    if (!fixture) return;
    const result = await this.state.toggle(fixture);
    if (!result.ok) {
      this.notify(this.t(result.reason === 'unbound' ? 'fixture.unbound' : 'fixture.badDomain',
        { name: fixture.name }));
    }
    this.update();
  }

  applyBrightness(percent, commit) {
    const fixture = this.selected && this.pack.fixtureById.get(this.selected);
    if (!fixture || !this.state.canDim(fixture)) return;
    this.state.setBrightness(fixture, percent);
    clearTimeout(this.brightnessTimer);
    const send = async () => {
      try {
        await this.state.sendBrightness(fixture);
      } catch (error) {
        this.notify(this.t('fixture.brightnessFailed', { error: error.message || error }));
        this.state.pendingBrightness = null;
      }
      this.update();
    };
    // Throttle while dragging; send immediately on release.
    if (commit) send();
    else this.brightnessTimer = setTimeout(send, 220);
    this.update();
  }

  // -- preview bar -----------------------------------------------------------

  buildPreviewBar() {
    const bar = this.shadowRoot.querySelector('.preview-bar');
    if (!bar) return;
    const t = this.t;
    const rows = [
      ['date', 'date', t('preview.date'), {}],
      ['range', 'hour', t('preview.time'), { min: 0, max: 23.75, step: 0.25 }],
      ['range', 'cloud', t('preview.clouds'), { min: 0, max: 100, step: 5 }],
      ['range', 'coverPosition', t('preview.covers'), { min: 0, max: 100, step: 10 }],
      ['range', 'brightness', t('preview.brightness'), { min: 5, max: 100, step: 5 }],
      ['select', 'weather', t('preview.weather'), {
        options: [['dry', t('preview.dry')], ['rain', t('preview.rain')],
                  ['snow', t('preview.snow')], ['mixed', t('preview.mixed')]],
      }],
      ['select', 'moonPhase', t('preview.moon'), {
        options: [['auto', t('preview.realPhase')], ['full', t('preview.fullMoon')], ['new', t('preview.newMoon')]],
      }],
    ];
    if (this.pack?.variants?.length) {
      rows.push(['select', '__variant', t('preview.variant'), {
        options: [['base', t('editor.variantBase')], ...this.pack.variants.map(v => [v.id, v.name])],
      }]);
    }

    bar.replaceChildren();
    for (const [type, key, label, options] of rows) {
      const wrapper = document.createElement('label');
      wrapper.className = 'preview-field';
      const caption = document.createElement('span');
      caption.textContent = label;
      let input;
      if (type === 'select') {
        input = document.createElement('select');
        input.replaceChildren(...options.options.map(([value, text]) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = text;
          return option;
        }));
        input.value = key === '__variant' ? (this.config.variant || 'base') : this.preview[key];
      } else {
        input = document.createElement('input');
        input.type = type;
        if (type === 'range') Object.assign(input, options);
        input.value = key === 'date'
          ? (this.preview.date || new Date().toISOString().slice(0, 10))
          : String(this.preview[key]);
      }
      input.setAttribute('aria-label', label);
      const readout = document.createElement('output');
      if (type === 'range') readout.textContent = String(this.preview[key]);

      const handler = () => {
        if (key === '__variant') {
          this.setConfig({ ...this.config, variant: input.value });
          return;
        }
        const value = type === 'range' ? Number(input.value) : input.value;
        this.preview = { ...this.preview, [key]: value };
        this.state?.setPreview(this.preview);
        if (type === 'range') readout.textContent = String(value);
        this.update();
      };
      input.oninput = handler;
      input.onchange = handler;

      wrapper.append(caption, input, readout);
      bar.append(wrapper);
    }

    const toggles = document.createElement('div');
    toggles.className = 'preview-actions';
    for (const [label, all] of [[this.t('preview.allOn'), true], [this.t('preview.allOff'), false]]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.onclick = () => {
        const on = {};
        for (const fixture of this.pack.fixtures) {
          if (fixture.kind === 'light') on[fixture.id] = all;
        }
        this.preview = { ...this.preview, on };
        this.state?.setPreview(this.preview);
        this.update();
      };
      toggles.append(button);
    }
    const windowButton = document.createElement('button');
    windowButton.type = 'button';
    const labelFor = () => `${this.t('preview.windowOpen')}: ${this.t(this.preview.windowOpen ? 'preview.open' : 'preview.closed')}`;
    windowButton.textContent = labelFor();
    windowButton.onclick = () => {
      this.preview = { ...this.preview, windowOpen: !this.preview.windowOpen };
      this.state?.setPreview(this.preview);
      windowButton.textContent = labelFor();
      this.update();
    };
    toggles.append(windowButton);
    bar.append(toggles);
  }

  // -- diagnostics -----------------------------------------------------------

  notify(message) {
    const notice = this.shadowRoot.querySelector('.notice');
    if (notice) notice.textContent = message ? `DomoView: ${message}` : '';
  }

  fail(message, error) {
    console.error('DomoView:', error || message);
    this.shadowRoot.innerHTML = `
      <style>${cardStyles()}</style>
      <div class="fatal" role="alert">
        <strong>DomoView ${VERSION}</strong>
        <p>${this.escape(message)}</p>
        <p class="fatal-hint">${this.escape(this.config.home)}</p>
      </div>`;
  }

  escape(value) {
    return String(value).replace(/[&<>"']/g, character =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }
}

if (!customElements.get('domoview-card')) {
  customElements.define('domoview-card', DomoViewCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'domoview-card')) {
  window.customCards.push({
    type: 'domoview-card',
    name: 'DomoView',
    description: 'Interactive 3D floor plan driven by a Home Pack (GLB + manifest)',
    preview: true,
    documentationURL: 'https://github.com/tomjschr/interactive_floormap',
  });
}

console.info(
  `%c DOMOVIEW %c ${VERSION} `,
  'background:#0e665b;color:#eafaf4;font-weight:600;border-radius:3px 0 0 3px',
  'background:#1b2a33;color:#cfe3dc;border-radius:0 3px 3px 0',
);
