/* Live 3D preview inside the Studio.
 *
 * Deliberately runs the card's own renderer over the card's own pack loader,
 * fed from an in-memory GLB. What you see here is what the dashboard will
 * show, so a mistake in sill heights or wall facing surfaces now rather than
 * after a copy to /config/www.
 */

import { normalisePack } from '../../src/core/pack.js';
import { HomeState } from '../../src/core/hass.js';
import { LiveRenderer } from '../../src/renderers/live3d/renderer.js';
import { buildManifest } from './export/manifest.js';
import { exportGlb } from './export/glb.js';
import { el, rangeInput, button, field, toast } from './ui.js';

export class Preview3D {
  constructor({ project, container, controls }) {
    this.project = project;
    this.container = container;
    this.controls = controls;
    this.renderer = null;
    this.modelUrl = null;
    this.busy = false;
    this.stale = true;
    this.preview = {
      enabled: true,
      hour: 14,
      cloud: 20,
      brightness: 100,
      coverPosition: 100,
      weather: 'dry',
      moonPhase: 'auto',
      on: {},
      levels: {},
      latitude: 51,
      longitude: 7,
    };
  }

  markStale() {
    this.stale = true;
    if (this.refreshButton) this.refreshButton.classList.add('attention');
  }

  /** Rebuild the GLB and reload the scene. */
  async refresh() {
    if (this.busy) return;
    const data = this.project.data;
    if (!data.plan.scale) {
      toast('Calibrate the plan scale before previewing.', 'warn');
      return;
    }
    if (!data.walls.length && !data.rooms.length) {
      toast('Trace some walls or a room first.', 'warn');
      return;
    }
    this.busy = true;
    this.setStatus('Building model…');
    try {
      this.dispose();
      const buffer = await exportGlb(data);
      this.modelUrl = URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }));
      const manifest = buildManifest(data, { modelFile: this.modelUrl });
      const pack = normalisePack(manifest, '.');

      this.state = new HomeState(pack, { entities: {} }, this.preview);
      // Preview every light as bound, so the scene is not dark by default.
      for (const fixture of pack.fixtures) {
        if (fixture.kind === 'light') this.preview.on[fixture.id] ??= true;
      }
      this.state.setPreview(this.preview);

      this.renderer = new LiveRenderer({
        pack, quality: 'high', interactive: true, showWeather: true,
        onError: error => toast(error.message, 'error'),
      });
      await this.renderer.init(this.container);
      this.apply();
      this.stale = false;
      this.refreshButton?.classList.remove('attention');
      this.setStatus(`${pack.fixtures.length} fixtures · ${pack.rooms.length} rooms · ${pack.openings.length} openings`);
    } catch (error) {
      console.error(error);
      this.setStatus(`Preview failed: ${error.message}`);
      toast(`Preview failed: ${error.message}`, 'error');
    } finally {
      this.busy = false;
    }
  }

  apply() {
    if (!this.renderer?.ready || !this.state) return;
    this.state.setPreview(this.preview);
    this.renderer.apply(this.state.snapshot());
  }

  setStatus(text) {
    if (this.statusNode) this.statusNode.textContent = text;
  }

  renderControls() {
    if (!this.controls) return;
    this.controls.replaceChildren();

    this.refreshButton = button('Rebuild preview', () => this.refresh(), { class: 'primary' });
    this.statusNode = el('span', { class: 'note' }, 'Not built yet.');

    const set = (key, value) => {
      this.preview = { ...this.preview, [key]: value };
      this.apply();
    };

    this.controls.append(
      el('div', { class: 'preview-actions' }, [
        this.refreshButton,
        button('All on', () => {
          const on = {};
          for (const fixture of this.state?.pack.fixtures || []) {
            if (fixture.kind === 'light') on[fixture.id] = true;
          }
          set('on', on);
        }, { class: 'ghost' }),
        button('All off', () => set('on', {}), { class: 'ghost' }),
        button('Reset view', () => this.renderer?.resetView(), { class: 'ghost' }),
      ]),
      field('Time of day', rangeInput(this.preview.hour, value => set('hour', value),
        { min: 0, max: 23.75, step: 0.25, format: formatHour })),
      field('Clouds', rangeInput(this.preview.cloud, value => set('cloud', value),
        { min: 0, max: 100, step: 5, format: value => `${value} %` })),
      field('Blinds', rangeInput(this.preview.coverPosition, value => set('coverPosition', value),
        { min: 0, max: 100, step: 5, format: value => `${value} %` })),
      field('Lamp brightness', rangeInput(this.preview.brightness, value => set('brightness', value),
        { min: 5, max: 100, step: 5, format: value => `${value} %` })),
      field('Weather', weatherSelect(this.preview.weather, value => set('weather', value))),
      this.statusNode,
    );
  }

  dispose() {
    this.renderer?.dispose();
    this.renderer = null;
    if (this.modelUrl) {
      URL.revokeObjectURL(this.modelUrl);
      this.modelUrl = null;
    }
  }

  resize() {
    this.renderer?.resize();
  }
}

function formatHour(value) {
  const hour = Math.floor(value);
  const minute = Math.round((value - hour) * 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function weatherSelect(value, onChange) {
  const select = el('select', {}, [
    ['dry', 'Dry'], ['rain', 'Rain'], ['snow', 'Snow'], ['mixed', 'Sleet'],
  ].map(([optionValue, label]) =>
    el('option', { value: optionValue, textContent: label, selected: optionValue === value })));
  select.onchange = () => onChange(select.value);
  return select;
}
