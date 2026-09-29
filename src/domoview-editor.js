/* Visual card editor.
 *
 * Every field is generated from the loaded Home Pack, so a pack that adds a
 * lamp or a window gets an editor row for it without a code change. Entity
 * inputs are native list-backed text fields rather than Home Assistant's own
 * pickers: those are internal components whose availability inside a custom
 * card's shadow root is not guaranteed across releases, and a broken editor is
 * worse than a plain one.
 */

import { loadPack } from './core/pack.js';
import { buildEntityCatalog, proposeEntityBindings } from './core/entity-matcher.js';
import { createTranslator } from './i18n/index.js';
import { editorStyles } from './styles-editor.js';

const RENDERERS = ['auto', 'live3d', 'baked'];
const QUALITIES = ['low', 'medium', 'high'];

/** Optional scene inputs, grouped for the "sun and weather" section. */
const SCENE_FIELDS = [
  ['sun_entity', ['sun']],
  ['weather_entity', ['weather']],
  ['cloud_entity', ['sensor']],
  ['irradiance_entity', ['sensor']],
  ['illuminance_entity', ['sensor']],
  ['rain_entity', ['binary_sensor', 'sensor']],
  ['snow_entity', ['binary_sensor', 'sensor']],
  ['precipitation_rate_entity', ['sensor']],
  ['wind_speed_entity', ['sensor']],
  ['snow_depth_entity', ['sensor']],
  ['moon_entity', ['sensor']],
];

export class DomoViewCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.config = {};
    this.pack = null;
    this.packError = null;
    this.bindingSuggestions = [];
    this.registries = {};
    this.t = createTranslator('en');
    this.open = new Set(['home', 'fixtures']);
  }

  setConfig(config) {
    const previous = this.config.home;
    this.config = { ...config };
    if (this.config.home !== previous || !this.pack) {
      this.bindingSuggestions = [];
      this.loadPack();
    }
    else this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.t = createTranslator(hass?.locale?.language || hass?.language || 'en');
    this.render();
    this.loadRegistries(hass);
  }

  connectedCallback() {
    this.render();
  }

  async loadPack() {
    if (!this.config.home) { this.pack = null; this.render(); return; }
    const token = (this.token || 0) + 1;
    this.token = token;
    try {
      this.pack = await loadPack(this.config.home, { variant: this.config.variant });
      this.packError = null;
    } catch (error) {
      this.pack = null;
      this.packError = error.message;
    }
    if (token === this.token) this.render();
  }

  emit(patch) {
    this.config = { ...this.config, ...patch };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config }, bubbles: true, composed: true,
    }));
    this.render();
  }

  /** Nested maps (entities, covers, rooms) are patched key by key. */
  emitMapped(group, key, value) {
    const next = { ...(this.config[group] || {}) };
    if (value) next[key] = value; else delete next[key];
    this.emit({ [group]: next });
  }

  emitRoom(roomId, field, value) {
    const rooms = { ...(this.config.rooms || {}) };
    const room = { ...(rooms[roomId] || {}) };
    if (value) room[field] = value; else delete room[field];
    if (Object.keys(room).length) rooms[roomId] = room; else delete rooms[roomId];
    this.emit({ rooms });
  }

  entityOptions(domains) {
    const states = this._hass?.states || {};
    return Object.keys(states)
      .filter(id => !domains?.length || domains.includes(id.split('.')[0]))
      .sort();
  }

  async loadRegistries(hass) {
    if (!hass?.callWS || this.registrySource === hass) return;
    this.registrySource = hass;
    try {
      const [areas, devices, entities] = await Promise.all([
        hass.callWS({ type: 'config/area_registry/list' }),
        hass.callWS({ type: 'config/device_registry/list' }),
        hass.callWS({ type: 'config/entity_registry/list' }),
      ]);
      if (this._hass !== hass) return;
      this.registries = { areas, devices, entities };
    } catch (error) {
      console.info('DomoView: entity matching will continue without registry metadata.', error);
      this.registries = {};
    }
  }

  findBindingSuggestions() {
    const catalog = buildEntityCatalog(this._hass?.states, this.registries);
    this.bindingSuggestions = proposeEntityBindings(
      this.pack?.fixtures.filter(fixture => fixture.kind !== 'marker') || [],
      catalog,
      this.config.entities || {},
    ).filter(suggestion => suggestion.confidence === 'high');
    this.render();
  }

  applyBindingSuggestions() {
    if (!this.bindingSuggestions.length) return;
    const entities = { ...(this.config.entities || {}) };
    for (const suggestion of this.bindingSuggestions) {
      if (!entities[suggestion.fixtureId]) entities[suggestion.fixtureId] = suggestion.entityId;
    }
    this.bindingSuggestions = [];
    this.emit({ entities });
  }

  // -- rendering -------------------------------------------------------------

  render() {
    if (!this.shadowRoot) return;
    // Section builders read this.t themselves.
    this.shadowRoot.innerHTML = `<style>${editorStyles()}</style><div class="editor"></div>`;
    const root = this.shadowRoot.querySelector('.editor');

    root.append(this.homeSection());
    if (this.pack) {
      root.append(
        this.fixtureSection(),
        this.coverSection(),
        this.windowSensorSection(),
        this.roomSection(),
        this.sceneSection(),
        this.advancedSection(),
      );
    }
  }

  section(id, title, builder, badge) {
    const details = document.createElement('details');
    details.className = 'section';
    details.open = this.open.has(id);
    details.ontoggle = () => {
      if (details.open) this.open.add(id); else this.open.delete(id);
    };
    const summary = document.createElement('summary');
    summary.textContent = title;
    if (badge) {
      const chip = document.createElement('span');
      chip.className = 'badge';
      chip.textContent = badge;
      summary.append(chip);
    }
    details.append(summary);
    const body = document.createElement('div');
    body.className = 'body';
    builder(body);
    details.append(body);
    return details;
  }

  field(label, control, hint) {
    const wrapper = document.createElement('label');
    wrapper.className = 'field';
    const caption = document.createElement('span');
    caption.className = 'label';
    caption.textContent = label;
    wrapper.append(caption, control);
    if (hint) {
      const note = document.createElement('small');
      note.textContent = hint;
      wrapper.append(note);
    }
    return wrapper;
  }

  textInput(value, onChange, placeholder = '') {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value ?? '';
    input.placeholder = placeholder;
    input.onchange = () => onChange(input.value.trim());
    return input;
  }

  /** Text field backed by a datalist of matching entity ids. */
  entityInput(value, domains, onChange) {
    const wrapper = document.createElement('span');
    wrapper.className = 'entity';
    const listId = `dv-list-${Math.random().toString(36).slice(2, 9)}`;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value ?? '';
    input.placeholder = this.t('editor.unassigned');
    input.setAttribute('list', listId);
    input.spellcheck = false;
    input.autocapitalize = 'none';
    input.onchange = () => onChange(input.value.trim());

    const list = document.createElement('datalist');
    list.id = listId;
    list.replaceChildren(...this.entityOptions(domains).map(id => {
      const option = document.createElement('option');
      option.value = id;
      const friendly = this._hass?.states?.[id]?.attributes?.friendly_name;
      if (friendly) option.label = friendly;
      return option;
    }));

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'clear';
    clear.textContent = '×';
    clear.title = this.t('editor.unassigned');
    clear.onclick = () => { input.value = ''; onChange(''); };

    wrapper.append(input, list, clear);
    return wrapper;
  }

  selectInput(value, options, onChange) {
    const select = document.createElement('select');
    select.replaceChildren(...options.map(([optionValue, text]) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = text;
      option.selected = String(optionValue) === String(value);
      return option;
    }));
    select.onchange = () => onChange(select.value);
    return select;
  }

  toggleInput(value, onChange) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!value;
    input.onchange = () => onChange(input.checked);
    return input;
  }

  // -- sections --------------------------------------------------------------

  homeSection() {
    const t = this.t;
    return this.section('home', t('editor.home'), body => {
      body.append(this.field(
        t('editor.homePath'),
        this.textInput(this.config.home, value => this.emit({ home: value }), '/local/domoview/homes/my-flat'),
        t('editor.homeHint'),
      ));

      const status = document.createElement('p');
      status.className = this.pack ? 'status ok' : 'status bad';
      status.textContent = this.pack
        ? t('editor.packOk', {
            name: this.pack.meta.name,
            rooms: this.pack.rooms.length,
            lights: this.pack.lights.length,
            windows: this.pack.windows.length,
          })
        : t('editor.packFail', { error: this.packError || '…' });
      body.append(status);

      if (!this.pack) return;

      body.append(this.field(t('editor.renderer'), this.selectInput(
        this.config.renderer || 'auto',
        RENDERERS.map(id => [id, t(`editor.renderer${id === 'auto' ? 'Auto' : id === 'baked' ? 'Baked' : 'Live'}`)]),
        value => this.emit({ renderer: value }),
      )));

      if (this.pack.cameras.length > 1) {
        body.append(this.field(t('editor.camera'), this.selectInput(
          this.config.camera || this.pack.cameras.find(camera => camera.default)?.id,
          this.pack.cameras.map(camera => [camera.id, camera.name]),
          value => this.emit({ camera: value }),
        )));
      }

      if (this.pack.variants.length) {
        body.append(this.field(t('editor.variant'), this.selectInput(
          this.config.variant || 'base',
          [['base', t('editor.variantBase')], ...this.pack.variants.map(variant => [variant.id, variant.name])],
          value => this.emit({ variant: value }),
        )));
      }
    });
  }

  fixtureSection() {
    const t = this.t;
    const fixtures = this.pack.fixtures.filter(fixture => fixture.kind !== 'marker');
    const bound = fixtures.filter(fixture => this.config.entities?.[fixture.id]).length;
    return this.section('fixtures', t('editor.fixtures'), body => {
      const matching = document.createElement('div');
      matching.className = 'matching';
      const find = document.createElement('button');
      find.type = 'button';
      find.className = 'action';
      find.textContent = t('editor.findMatches');
      find.onclick = () => this.findBindingSuggestions();
      matching.append(find);

      if (this.bindingSuggestions.length) {
        const preview = document.createElement('div');
        preview.className = 'match-preview';
        preview.append(...this.bindingSuggestions.map(suggestion => {
          const row = document.createElement('div');
          row.textContent = `${suggestion.fixtureName} → ${suggestion.entityId} (${Math.round(suggestion.score * 100)}%)`;
          return row;
        }));
        const apply = document.createElement('button');
        apply.type = 'button';
        apply.className = 'action primary';
        apply.textContent = t('editor.applyMatches', { count: this.bindingSuggestions.length });
        apply.onclick = () => this.applyBindingSuggestions();
        matching.append(preview, apply);
      } else {
        const note = document.createElement('small');
        note.textContent = t('editor.matchHint');
        matching.append(note);
      }
      body.append(matching);

      const groups = new Map();
      for (const fixture of fixtures) {
        const key = fixture.roomName || '—';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(fixture);
      }
      for (const [room, items] of groups) {
        const heading = document.createElement('h4');
        heading.textContent = room;
        body.append(heading);
        for (const fixture of items) {
          body.append(this.field(
            fixture.name.replace(/^.*\|\s*/, ''),
            this.entityInput(
              this.config.entities?.[fixture.id],
              fixture.domains,
              value => this.emitMapped('entities', fixture.id, value),
            ),
          ));
        }
      }
    }, `${bound}/${fixtures.length}`);
  }

  coverSection() {
    const t = this.t;
    const openings = this.pack.openings.filter(opening => opening.cover.supported);
    if (!openings.length) return document.createComment('no covers');
    const bound = openings.filter(opening => this.config.covers?.[opening.id]).length;
    return this.section('covers', t('editor.covers'), body => {
      for (const opening of openings) {
        body.append(this.field(opening.name, this.entityInput(
          this.config.covers?.[opening.id], ['cover'],
          value => this.emitMapped('covers', opening.id, value),
        )));
      }
    }, `${bound}/${openings.length}`);
  }

  windowSensorSection() {
    const t = this.t;
    const openings = this.pack.openings.filter(opening => opening.admitsLight);
    if (!openings.length) return document.createComment('no windows');
    const bound = openings.filter(opening => this.config.window_sensors?.[opening.id]).length;
    return this.section('window_sensors', t('editor.windowSensors'), body => {
      for (const opening of openings) {
        body.append(this.field(opening.name, this.entityInput(
          this.config.window_sensors?.[opening.id], ['binary_sensor'],
          value => this.emitMapped('window_sensors', opening.id, value),
        )));
      }
    }, `${bound}/${openings.length}`);
  }

  roomSection() {
    const t = this.t;
    if (!this.pack.rooms.length) return document.createComment('no rooms');
    const bound = this.pack.rooms.filter(room => this.config.rooms?.[room.id]).length;
    return this.section('rooms', t('editor.rooms'), body => {
      for (const room of this.pack.rooms) {
        const heading = document.createElement('h4');
        heading.textContent = room.name;
        body.append(heading);
        body.append(this.field(t('editor.temperature'), this.entityInput(
          this.config.rooms?.[room.id]?.temperature, ['sensor', 'climate', 'number'],
          value => this.emitRoom(room.id, 'temperature', value),
        )));
        body.append(this.field(t('editor.humidity'), this.entityInput(
          this.config.rooms?.[room.id]?.humidity, ['sensor', 'climate'],
          value => this.emitRoom(room.id, 'humidity', value),
        )));
      }
    }, `${bound}/${this.pack.rooms.length}`);
  }

  sceneSection() {
    const t = this.t;
    return this.section('scene', t('editor.weather'), body => {
      for (const [key, domains] of SCENE_FIELDS) {
        body.append(this.field(
          key.replace(/_entity$/, '').replace(/_/g, ' '),
          this.entityInput(this.config[key], domains, value => this.emit({ [key]: value || undefined })),
        ));
      }
    });
  }

  advancedSection() {
    const t = this.t;
    return this.section('advanced', t('editor.advanced'), body => {
      body.append(this.field(t('editor.quality'), this.selectInput(
        this.config.quality || 'medium',
        QUALITIES.map(id => [id, t(`editor.quality${id[0].toUpperCase()}${id.slice(1)}`)]),
        value => this.emit({ quality: value }),
      )));
      body.append(this.field(t('editor.interaction'), this.toggleInput(
        this.config.interactive !== false, value => this.emit({ interactive: value }),
      )));
      body.append(this.field(t('editor.showClimate'), this.toggleInput(
        this.config.show_climate !== false, value => this.emit({ show_climate: value }),
      )));
      body.append(this.field(t('editor.showWeather'), this.toggleInput(
        this.config.show_weather !== false, value => this.emit({ show_weather: value }),
      )));

      const diagnostics = document.createElement('pre');
      diagnostics.className = 'diagnostics';
      diagnostics.textContent = [
        `pack        ${this.pack.meta.id} ${this.pack.meta.version}`,
        `author      ${this.pack.meta.author || '—'}`,
        `license     ${this.pack.meta.license || '—'}`,
        `model       ${this.pack.model.url}`,
        `up axis     ${this.pack.model.up}`,
        `north       ${this.pack.meta.north}°`,
        `rooms       ${this.pack.rooms.length}`,
        `fixtures    ${this.pack.fixtures.length}`,
        `openings    ${this.pack.openings.length}`,
        `baked       ${this.pack.baked ? `${this.pack.baked.size}px, ${Object.keys(this.pack.baked.lights).length} light deltas` : 'none'}`,
      ].join('\n');
      body.append(diagnostics);
    });
  }
}

if (!customElements.get('domoview-card-editor')) {
  customElements.define('domoview-card-editor', DomoViewCardEditor);
}
