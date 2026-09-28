/* Home Assistant glue.
 *
 * Turns a hass object plus card config into one plain scene-state snapshot
 * that both renderers consume. Keeping this in one place means the renderers
 * never touch entity ids, and the whole thing stays testable without a
 * browser or a running Home Assistant.
 */

import { sunPosition, moonPosition, moonIllumination, sunlightColor, MOONLIGHT_COLOR } from './astro.js';
import { roomDaylightFactors } from './covers.js';
import { clamp } from './geometry.js';

const UNAVAILABLE = new Set(['unknown', 'unavailable', '']);

/** Cloud cover implied by a weather condition when no numeric sensor exists. */
const CONDITION_CLOUD = {
  'clear-night': 0, sunny: 0, partlycloudy: 45, cloudy: 85, windy: 25,
  'windy-variant': 45, rainy: 95, pouring: 100, snowy: 95, 'snowy-rainy': 95,
  fog: 100, hail: 100, lightning: 100, 'lightning-rainy': 100, exceptional: 50,
};

const RAIN_CONDITIONS = new Set(['rainy', 'pouring', 'lightning-rainy', 'snowy-rainy', 'hail']);
const SNOW_CONDITIONS = new Set(['snowy', 'snowy-rainy']);

function available(state) {
  return !!state && !UNAVAILABLE.has(String(state.state).toLowerCase());
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Kelvin to an approximate sRGB triple, adequate for tinting a light. */
export function kelvinToRgb(kelvin) {
  const temp = clamp(kelvin, 1500, 12000) / 100;
  let r, g, b;
  if (temp <= 66) {
    r = 255;
    g = 99.47 * Math.log(temp) - 161.12;
  } else {
    r = 329.7 * (temp - 60) ** -0.1332;
    g = 288.12 * (temp - 60) ** -0.0755;
  }
  if (temp >= 66) b = 255;
  else if (temp <= 19) b = 0;
  else b = 138.52 * Math.log(temp - 10) - 305.04;
  return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)].map(Math.round);
}

/**
 * Preview overrides let the visual editor and the demo page drive a scene
 * without any Home Assistant connection.
 */
export const PREVIEW_DEFAULTS = {
  enabled: false,
  date: null,
  hour: 16,
  cloud: 0,
  brightness: 100,
  coverPosition: 100,
  weather: 'dry',
  moonPhase: 'auto',
  windowOpen: false,
  latitude: 51,
  longitude: 7,
  on: {},
  levels: {},
};

export class HomeState {
  constructor(pack, config = {}, preview = PREVIEW_DEFAULTS) {
    this.pack = pack;
    this.config = config;
    this.preview = { ...PREVIEW_DEFAULTS, ...preview };
    this.hass = null;
    this.pendingBrightness = null;
    this.lastBrightness = {};
    this.lastGoodCover = {};
    this.sources = {};
  }

  setHass(hass) {
    this.hass = hass;
    if (this.pendingBrightness) {
      const { id, value } = this.pendingBrightness;
      const state = hass?.states?.[this.entityFor(id)];
      const reported = Math.round((numeric(state?.attributes?.brightness) ?? 255) / 255 * 100);
      // Clear the optimistic value once Home Assistant confirms it, so a
      // slider release does not keep overriding a later external change.
      if (state?.state === 'on' && Math.abs(reported - value) <= 1) this.pendingBrightness = null;
    }
  }

  setPreview(preview) {
    this.preview = { ...this.preview, ...preview };
  }

  /** An unmapped fixture stays deliberately dark rather than guessing an entity. */
  entityFor(fixtureId) {
    return String(this.config.entities?.[fixtureId] ?? '').trim() || null;
  }

  stateOf(fixtureId) {
    const entity = this.entityFor(fixtureId);
    return entity ? this.hass?.states?.[entity] || null : null;
  }

  get previewing() {
    return !!this.preview.enabled;
  }

  get latitude() {
    if (this.previewing) return numeric(this.preview.latitude) ?? 51;
    return numeric(this.hass?.config?.latitude) ?? numeric(this.config.latitude) ?? 51;
  }

  get longitude() {
    if (this.previewing) return numeric(this.preview.longitude) ?? 7;
    return numeric(this.hass?.config?.longitude) ?? numeric(this.config.longitude) ?? 7;
  }

  /** Clock used for astronomy: real now, or the preview's scrubbed moment. */
  now() {
    if (!this.previewing) return new Date();
    const stamp = this.preview.date || new Date().toISOString().slice(0, 10);
    const [year, month, day] = stamp.split('-').map(Number);
    const hour = Math.floor(this.preview.hour);
    const minute = Math.round((this.preview.hour - hour) * 60);
    return new Date(year, (month || 1) - 1, day || 1, hour, minute);
  }

  sun() {
    if (this.previewing) {
      return sunPosition(this.now(), this.latitude, this.longitude);
    }
    const entity = this.hass?.states?.[this.config.sun_entity || 'sun.sun'];
    const azimuth = numeric(entity?.attributes?.azimuth);
    const elevation = numeric(entity?.attributes?.elevation);
    if (azimuth !== null && elevation !== null) return { azimuth, elevation };
    // No sun entity: compute it, which also covers installations that
    // disabled the sun integration.
    return sunPosition(new Date(), this.latitude, this.longitude);
  }

  moon() {
    const date = this.now();
    const position = moonPosition(date, this.latitude, this.longitude);
    const phaseEntity = this.config.moon_entity ? this.hass?.states?.[this.config.moon_entity] : null;
    const illumination = this.previewing && this.preview.moonPhase === 'full' ? 1
      : this.previewing && this.preview.moonPhase === 'new' ? 0
      : moonIllumination(date, available(phaseEntity) ? phaseEntity.state : null);
    return { ...position, illumination };
  }

  weatherEntity() {
    const states = this.hass?.states || {};
    if (this.config.weather_entity) {
      const chosen = states[this.config.weather_entity];
      return available(chosen) ? chosen : null;
    }
    if (available(states['weather.home'])) return states['weather.home'];
    const id = Object.keys(states).sort()
      .find(key => key.startsWith('weather.') && available(states[key]));
    return id ? states[id] : null;
  }

  cloudCover() {
    if (this.previewing) {
      this.sources.cloud = 'preview';
      return clamp(numeric(this.preview.cloud) ?? 0, 0, 100);
    }
    const sensor = this.config.cloud_entity ? this.hass?.states?.[this.config.cloud_entity] : null;
    const reading = available(sensor) ? numeric(sensor.state) : null;
    if (reading !== null) {
      this.sources.cloud = 'sensor';
      return clamp(reading, 0, 100);
    }
    const weather = this.weatherEntity();
    const reported = numeric(weather?.attributes?.cloud_coverage);
    if (reported !== null) {
      this.sources.cloud = 'weather';
      return clamp(reported, 0, 100);
    }
    this.sources.cloud = weather ? 'condition' : 'assumed';
    return CONDITION_CLOUD[weather?.state] ?? 50;
  }

  weather() {
    if (this.previewing) {
      const mode = this.preview.weather;
      const strong = mode === 'rain' || mode === 'snow' ? 0.8 : mode === 'mixed' ? 0.55 : 0;
      return {
        rain: mode === 'rain' || mode === 'mixed' ? strong : 0,
        snow: mode === 'snow' || mode === 'mixed' ? strong : 0,
        wetGround: mode === 'rain' || mode === 'mixed' ? 0.8 : 0,
        snowCover: mode === 'snow' || mode === 'mixed' ? 0.8 : 0,
        wind: 0.15,
      };
    }
    const states = this.hass?.states || {};
    const weather = this.weatherEntity();
    const condition = weather?.state;
    let rain = RAIN_CONDITIONS.has(condition) ? (condition === 'pouring' ? 1 : 0.65) : 0;
    let snow = SNOW_CONDITIONS.has(condition) ? 0.65 : 0;

    const rainEntity = this.config.rain_entity ? states[this.config.rain_entity] : null;
    if (available(rainEntity)) {
      rain = ['on', 'true', 'rainy', 'wet'].includes(String(rainEntity.state).toLowerCase()) ? 0.75 : 0;
    }
    const snowEntity = this.config.snow_entity ? states[this.config.snow_entity] : null;
    if (available(snowEntity)) {
      snow = ['on', 'true', 'snowy'].includes(String(snowEntity.state).toLowerCase()) ? 0.75 : 0;
    }

    const rateEntity = this.config.precipitation_rate_entity ? states[this.config.precipitation_rate_entity] : null;
    const rate = available(rateEntity) ? numeric(rateEntity.state) : null;
    if (rate !== null && rate >= 0) {
      if (rate === 0) { rain = 0; snow = 0; }
      else {
        const strength = clamp(rate / 5, 0.18, 1);
        if (rain) rain = strength;
        if (snow) snow = strength;
        if (!rain && !snow) rain = strength;
      }
    }

    const windEntity = this.config.wind_speed_entity ? states[this.config.wind_speed_entity] : null;
    const wind = numeric(available(windEntity) ? windEntity.state : weather?.attributes?.wind_speed) ?? 0;

    const depthEntity = this.config.snow_depth_entity ? states[this.config.snow_depth_entity] : null;
    const depth = available(depthEntity) ? numeric(depthEntity.state) : null;

    return {
      rain, snow,
      wetGround: rain,
      snowCover: depth !== null && depth >= 0 ? clamp(depth / 5, 0, 1) : snow,
      wind: clamp(wind / 35, 0, 1),
    };
  }

  /** 0 at night, 1 in full day, with a soft twilight ramp around the horizon. */
  daylight(sun = this.sun(), weather = this.weather()) {
    const base = clamp((sun.elevation + 6) / 10, 0, 1);
    return base * (1 - weather.rain * 0.14 - weather.snow * 0.08);
  }

  /** Strength of the direct beam, from a real irradiance sensor if one exists. */
  directSun(sun = this.sun(), cloud = this.cloudCover()) {
    if (sun.elevation <= 0) {
      this.sources.direct = 'below-horizon';
      return 0;
    }
    const states = this.hass?.states || {};
    for (const [key, full, source] of [
      ['irradiance_entity', 850, 'irradiance'],
      ['illuminance_entity', 90000, 'illuminance'],
    ]) {
      const entity = this.config[key] ? states[this.config[key]] : null;
      const reading = available(entity) ? numeric(entity.state) : null;
      if (reading !== null && reading >= 0) {
        const expected = full * Math.max(0.10, Math.sin(sun.elevation * Math.PI / 180));
        this.sources.direct = source;
        return clamp(reading / expected, 0, 1);
      }
    }
    this.sources.direct = this.sources.cloud || 'condition';
    return clamp((85 - cloud) / 65, 0, 1);
  }

  covers() {
    const result = {};
    for (const opening of this.pack.openings) {
      if (this.previewing) {
        if (opening.cover.supported) {
          result[opening.id] = { position: clamp(numeric(this.preview.coverPosition) ?? 100, 0, 100), tilt: null };
        }
        continue;
      }
      const entity = this.config.covers?.[opening.id];
      if (!entity) continue;
      const state = this.hass?.states?.[entity];
      if (!available(state)) {
        // A cover that is briefly unavailable should hold its last known
        // position instead of snapping open and re-lighting the room.
        if (this.lastGoodCover[opening.id]) result[opening.id] = this.lastGoodCover[opening.id];
        continue;
      }
      const reported = numeric(state.attributes?.current_position);
      const position = reported !== null ? clamp(reported, 0, 100)
        : state.state === 'closed' ? 0
        : state.state === 'open' ? 100
        : this.lastGoodCover[opening.id]?.position ?? null;
      if (position === null) continue;
      const tiltRaw = numeric(state.attributes?.current_tilt_position);
      const entry = { position, tilt: tiltRaw === null ? null : clamp(tiltRaw, 0, 100) };
      result[opening.id] = entry;
      this.lastGoodCover[opening.id] = entry;
    }
    return result;
  }

  openWindows() {
    const open = new Set();
    for (const opening of this.pack.openings) {
      if (this.previewing) {
        if (this.preview.windowOpen && opening.admitsLight) open.add(opening.id);
        continue;
      }
      const entity = this.config.window_sensors?.[opening.id];
      const state = entity ? this.hass?.states?.[entity] : null;
      if (available(state) && ['on', 'open', 'tilted'].includes(String(state.state).toLowerCase())) {
        open.add(opening.id);
      }
    }
    return open;
  }

  roomDaylight(coverStates = this.covers()) {
    return roomDaylightFactors(this.pack, coverStates);
  }

  climate() {
    const result = new Map();
    for (const room of this.pack.rooms) {
      const mapping = this.config.rooms?.[room.id];
      if (!mapping) continue;
      const temperature = this.readClimate(mapping.temperature, 'temperature');
      const humidity = this.readClimate(mapping.humidity, 'humidity');
      if (temperature === null && humidity === null) continue;
      result.set(room.id, { temperature, humidity });
    }
    return result;
  }

  readClimate(entityId, kind) {
    const state = entityId ? this.hass?.states?.[entityId] : null;
    if (!available(state)) return null;
    const raw = entityId.startsWith('climate.')
      ? state.attributes?.[kind === 'temperature' ? 'current_temperature' : 'current_humidity']
      : state.state;
    return numeric(raw);
  }

  /** True when this fixture should read as emitting light. */
  isOn(fixture) {
    if (this.previewing) return !!this.preview.on[fixture.id];
    if (this.pendingBrightness?.id === fixture.id) return true;
    const state = this.stateOf(fixture.id);
    if (!state) return false;
    if (fixture.kind === 'media' || fixture.kind === 'speaker') {
      return !['off', 'standby', 'idle', 'unavailable', 'unknown'].includes(String(state.state).toLowerCase());
    }
    return String(state.state).toLowerCase() === 'on';
  }

  /** 0..1 emission weight for a fixture. */
  level(fixture) {
    if (!this.isOn(fixture)) return 0;
    if (fixture.kind === 'media' || fixture.kind === 'speaker') {
      return this.previewing ? clamp(this.preview.brightness / 100) : 0.85;
    }
    if (this.previewing) {
      return clamp((this.preview.levels[fixture.id] ?? this.preview.brightness) / 100);
    }
    if (this.pendingBrightness?.id === fixture.id) return clamp(this.pendingBrightness.value / 100);
    const brightness = numeric(this.stateOf(fixture.id)?.attributes?.brightness);
    return brightness === null ? 1 : clamp(brightness / 255);
  }

  /** sRGB triple for a fixture's current emission. */
  color(fixture) {
    const attributes = this.stateOf(fixture.id)?.attributes || {};
    if (Array.isArray(attributes.rgb_color) && attributes.rgb_color.length === 3) {
      return attributes.rgb_color.map(value => clamp(numeric(value) ?? 0, 0, 255));
    }
    const kelvin = numeric(attributes.color_temp_kelvin);
    if (kelvin !== null) return kelvinToRgb(kelvin);
    if (fixture.light.color) return fixture.light.color;
    if (fixture.light.kelvin) return kelvinToRgb(fixture.light.kelvin);
    return fixture.kind === 'media' ? [176, 208, 255] : [255, 221, 164];
  }

  /** Whether the bound entity actually supports a brightness channel. */
  canDim(fixture) {
    if (fixture.kind !== 'light') return false;
    if (this.previewing) return true;
    const entity = this.entityFor(fixture.id);
    if (!entity?.startsWith('light.')) return false;
    const attributes = this.hass?.states?.[entity]?.attributes || {};
    const modes = attributes.supported_color_modes;
    if (Array.isArray(modes)) return modes.some(mode => !['onoff', 'unknown'].includes(mode));
    return numeric(attributes.brightness) !== null;
  }

  brightnessPercent(fixture) {
    if (this.previewing) return this.preview.levels[fixture.id] ?? this.preview.brightness;
    if (this.pendingBrightness?.id === fixture.id) return this.pendingBrightness.value;
    const state = this.stateOf(fixture.id);
    const brightness = numeric(state?.attributes?.brightness);
    if (state?.state === 'on' && brightness > 0) {
      this.lastBrightness[fixture.id] = Math.round(brightness / 255 * 100);
    }
    return this.lastBrightness[fixture.id] ?? 100;
  }

  /** Fixtures that are bound (or previewed) and currently emitting. */
  activeEmitters() {
    return this.pack.fixtures
      .filter(fixture => (fixture.kind === 'light' || fixture.kind === 'media') &&
        (this.previewing || this.entityFor(fixture.id)))
      .filter(fixture => this.isOn(fixture))
      .map(fixture => ({
        fixture,
        id: fixture.id,
        level: this.level(fixture),
        color: this.color(fixture),
      }));
  }

  /** One immutable snapshot for the renderers. */
  snapshot() {
    const sun = this.sun();
    const weather = this.weather();
    const cloud = this.cloudCover();
    const daylight = this.daylight(sun, weather);
    const covers = this.covers();
    const moon = this.moon();
    const precipitation = Math.max(weather.rain, weather.snow);
    const direct = this.directSun(sun, cloud) * daylight *
      clamp(sun.elevation / 7, 0, 1) * (1 - precipitation);
    const moonStrength = 0.38 * clamp(moon.illumination) *
      Math.max(0, 1 - cloud / 100) ** 2 * (1 - clamp(daylight)) * (1 - precipitation);

    return {
      time: this.now(),
      sun, moon, cloud, weather, daylight, covers,
      direct,
      moonStrength,
      sunColor: sunlightColor(sun.elevation),
      moonColor: MOONLIGHT_COLOR,
      roomDaylight: this.roomDaylight(covers),
      openWindows: this.openWindows(),
      climate: this.climate(),
      emitters: this.activeEmitters(),
      sources: { ...this.sources },
    };
  }

  // -- service calls ---------------------------------------------------------

  async toggle(fixture) {
    if (this.previewing) {
      this.preview.on[fixture.id] = !this.preview.on[fixture.id];
      return { ok: true };
    }
    const entity = this.entityFor(fixture.id);
    if (!entity || !this.hass?.states?.[entity]) return { ok: false, reason: 'unbound' };
    const domain = entity.split('.')[0];
    if (!['light', 'switch', 'input_boolean', 'fan', 'media_player'].includes(domain)) {
      return { ok: false, reason: 'domain', domain };
    }
    const on = this.isOn(fixture);
    if (this.pendingBrightness?.id === fixture.id) this.pendingBrightness = null;
    const service = domain === 'media_player'
      ? (on ? 'turn_off' : 'turn_on')
      : (on ? 'turn_off' : 'turn_on');
    await this.hass.callService(domain, service, { entity_id: entity });
    return { ok: true };
  }

  /** Optimistically hold the requested percentage until Home Assistant agrees. */
  setBrightness(fixture, percent) {
    const value = clamp(Math.round(percent), 1, 100);
    if (this.previewing) {
      this.preview.levels[fixture.id] = value;
      this.preview.on[fixture.id] = true;
      return;
    }
    this.pendingBrightness = { id: fixture.id, value };
    clearTimeout(this._pendingTimer);
    this._pendingTimer = setTimeout(() => {
      if (this.pendingBrightness?.id === fixture.id) this.pendingBrightness = null;
    }, 5000);
  }

  async sendBrightness(fixture) {
    const pending = this.pendingBrightness;
    if (!pending || pending.id !== fixture.id || this.previewing) return { ok: true };
    const entity = this.entityFor(fixture.id);
    if (!entity?.startsWith('light.')) return { ok: false, reason: 'not-dimmable' };
    const key = `${entity}:${pending.value}`;
    const now = Date.now();
    // Slider drags fire fast; collapse repeats of the same value.
    if (key === this._lastSent?.key && now - this._lastSent.time < 300) return { ok: true };
    this._lastSent = { key, time: now };
    await this.hass.callService('light', 'turn_on', { entity_id: entity, brightness_pct: pending.value });
    return { ok: true };
  }

  async setCover(opening, position) {
    if (this.previewing) {
      this.preview.coverPosition = clamp(position, 0, 100);
      return { ok: true };
    }
    const entity = this.config.covers?.[opening.id];
    if (!entity) return { ok: false, reason: 'unbound' };
    await this.hass.callService('cover', 'set_cover_position', {
      entity_id: entity, position: clamp(Math.round(position), 0, 100),
    });
    return { ok: true };
  }

  /** Fire the standard more-info dialog so the card fits Lovelace conventions. */
  showMoreInfo(host, fixtureId) {
    const entity = this.entityFor(fixtureId);
    if (!entity) return false;
    host.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId: entity }, bubbles: true, composed: true,
    }));
    return true;
  }
}
