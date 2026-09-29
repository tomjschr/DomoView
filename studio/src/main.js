/* DomoView Studio.
 *
 * Turns a floor plan image and a set of room photos into a Home Pack: a GLB
 * plus a home.json the card can read. Everything runs in the browser; nothing
 * is uploaded anywhere.
 */

import { Project, projectStatus, slugify } from './project.js';
import { LocalProjectClient } from './project-client.js';
import { Viewport } from './viewport.js';
import { PlanRenderer } from './render2d.js';
import { Editor } from './editor.js';
import { renderInspector, renderOutline, planSummary } from './panels.js';
import { PhotoShelf, colourTargetMenu } from './photos.js';
import { Preview3D } from './preview3d.js';
import { buildManifest } from './export/manifest.js';
import { exportGlb, sceneStats } from './export/glb.js';
import { createZip, downloadBlob } from './export/zip.js';
import { buildCardYaml, cardYamlSummary } from './export/cardyaml.js';
import {
  el, button, group, field, askNumber, toast,
  readFileAsDataUrl, normaliseImage,
} from './ui.js';

const STUDIO_VERSION = '0.1.1';
const STORAGE_KEY = 'domoview.studio.project';
const WORKSPACE_KEY = 'domoview.studio.workspace-project';

/** Each step binds a canvas tool and a short instruction. */
const STEPS = [
  { id: 'plan', label: 'Plan', tool: 'select' },
  { id: 'scale', label: 'Scale', tool: 'calibrate' },
  { id: 'walls', label: 'Walls', tool: 'wall' },
  { id: 'rooms', label: 'Rooms', tool: 'room' },
  { id: 'openings', label: 'Windows', tool: 'window' },
  { id: 'lights', label: 'Lights', tool: 'light' },
  { id: 'furniture', label: 'Furniture', tool: 'furniture' },
  { id: 'photos', label: 'Photos', tool: 'select' },
  { id: 'preview', label: 'Preview', tool: 'select' },
  { id: 'export', label: 'Export', tool: 'select' },
];

class Studio {
  constructor(root) {
    this.root = root;
    this.project = restoreProject();
    this.localProjects = new LocalProjectClient();
    this.workspaceRecord = restoreWorkspaceRecord();
    this.step = 'plan';
    this.build();
    this.project.subscribe(() => this.onProjectChange());
    this.setStep('plan');
    this.loadBackdrop();
    void this.initLocalServer();
  }

  build() {
    this.root.replaceChildren();

    this.canvas = el('canvas', { class: 'plan-canvas', tabIndex: 0 });
    this.previewHost = el('div', { class: 'preview-host', hidden: true });
    this.stage = el('div', { class: 'stage' }, [this.canvas, this.previewHost]);

    this.outlineHost = el('div', { class: 'outline' });
    this.inspectorHost = el('div', { class: 'inspector' });
    this.stepPanelHost = el('div', { class: 'step-panel' });
    this.hintNode = el('p', { class: 'hint' });
    this.summaryNode = el('p', { class: 'summary' });

    this.stepsNav = el('nav', { class: 'steps', 'aria-label': 'Authoring steps' },
      STEPS.map(step => button(step.label, () => this.setStep(step.id), {
        class: 'step', dataset: { step: step.id },
      })));

    this.root.append(
      el('header', { class: 'topbar' }, [
        el('div', { class: 'brand' }, [
          el('strong', {}, 'DomoView Studio'),
          el('span', { class: 'version' }, STUDIO_VERSION),
        ]),
        el('div', { class: 'topbar-actions' }, [
          button('New', () => this.newProject(), { class: 'ghost' }),
          button('Open…', () => this.openProject(), { class: 'ghost' }),
          button('Save project', () => this.saveProject(), { class: 'ghost' }),
          (() => {
            this.openWorkspaceButton = button('Open workspace…', () => this.openWorkspaceProject(), {
              class: 'ghost', hidden: true,
            });
            return this.openWorkspaceButton;
          })(),
          (() => {
            this.saveWorkspaceButton = button('Save to workspace', () => this.saveWorkspaceProject(), {
              class: 'ghost', hidden: true,
            });
            return this.saveWorkspaceButton;
          })(),
          button('Undo', () => this.project.undo(), { class: 'ghost', title: 'Ctrl+Z' }),
          button('Redo', () => this.project.redo(), { class: 'ghost', title: 'Ctrl+Shift+Z' }),
          button('Export pack', () => { this.setStep('export'); }, { class: 'primary' }),
        ]),
      ]),
      this.stepsNav,
      el('main', { class: 'workspace' }, [
        el('aside', { class: 'column left' }, [
          el('h2', {}, 'Outline'),
          this.outlineHost,
        ]),
        this.stage,
        el('aside', { class: 'column right' }, [
          this.stepPanelHost,
          this.inspectorHost,
        ]),
      ]),
      el('footer', { class: 'statusbar' }, [this.hintNode, this.summaryNode]),
    );

    this.viewport = new Viewport(this.canvas);
    this.viewport.attach();
    this.renderer = new PlanRenderer(this.canvas, this.viewport);
    this.viewport.onChange = () => this.draw();

    this.editor = new Editor({
      canvas: this.canvas,
      viewport: this.viewport,
      project: this.project,
      onRedraw: () => this.draw(),
      onSelect: () => this.renderSide(),
      onAskDistance: pixels => askNumber({
        title: 'Calibrate scale',
        message: `How long is that line in reality? It measures ${Math.round(pixels)} plan pixels.`,
        unit: 'm',
        initial: '',
      }),
      onStatus: status => {
        if (status?.error) toast(status.error, 'warn');
        else if (typeof status === 'string') this.hintNode.textContent = status;
      },
    });

    this.photos = new PhotoShelf({
      project: this.project,
      container: el('div'),
      onPickColor: (hex, photo) => this.showColourMenu(hex, photo),
    });

    this.preview = new Preview3D({
      project: this.project,
      container: this.previewHost,
      controls: el('div', { class: 'preview-controls' }),
    });

    this.observer = new ResizeObserver(() => {
      this.renderer.resize();
      this.draw();
      this.preview.resize();
    });
    this.observer.observe(this.stage);

    this.installDropTarget();
    this.installShortcuts();
  }

  // -- steps ---------------------------------------------------------------

  setStep(id) {
    const step = STEPS.find(entry => entry.id === id) || STEPS[0];
    this.step = step.id;
    for (const node of this.stepsNav.children) {
      node.classList.toggle('active', node.dataset.step === step.id);
    }
    const previewing = step.id === 'preview';
    this.previewHost.hidden = !previewing;
    this.canvas.hidden = previewing;
    this.editor.setTool(step.tool);
    if (previewing) {
      this.preview.renderControls();
      if (this.preview.stale) this.preview.refresh();
    }
    this.renderSide();
    this.hintNode.textContent = this.editor.hint();
    if (!previewing) {
      this.renderer.resize();
      this.draw();
    }
  }

  renderSide() {
    this.stepPanelHost.replaceChildren(this.stepPanel());
    renderInspector(this.inspectorHost, {
      project: this.project,
      editor: this.editor,
      selected: this.editor.selected,
      onPlanImage: file => this.setPlanImage(file),
    });
    renderOutline(this.outlineHost, { project: this.project, editor: this.editor });
    this.summaryNode.textContent = planSummary(this.project.data);
  }

  stepPanel() {
    switch (this.step) {
      case 'photos':
        this.photos.container = el('div', { class: 'photo-shelf' });
        this.photos.render();
        return group('Photos', [this.photos.container]);
      case 'preview':
        return group('Preview', [this.preview.controls]);
      case 'export':
        return this.exportPanel();
      case 'openings':
        return group('Windows and doors', [
          el('p', { class: 'note' },
            'Click on a wall to place a window. Switch the tool to Door in the panel below, or press D.'),
          el('div', { class: 'preview-actions' }, [
            button('Window tool', () => this.editor.setTool('window'),
              { class: this.editor.tool === 'window' ? 'primary' : 'ghost' }),
            button('Door tool', () => this.editor.setTool('door'),
              { class: this.editor.tool === 'door' ? 'primary' : 'ghost' }),
          ]),
        ]);
      case 'scale':
        return group('Scale', [
          el('p', { class: 'note' },
            'Click the two ends of something you know the length of — a door is usually 0.90 m, a room wall is better if you have a measurement.'),
          this.project.data.plan.scale
            ? button('Re-calibrate', () => this.editor.setTool('calibrate'), { class: 'ghost' })
            : null,
        ]);
      default:
        return group(STEPS.find(step => step.id === this.step)?.label || '', [
          el('p', { class: 'note' }, this.editor.hint()),
        ]);
    }
  }

  // -- plan image ----------------------------------------------------------

  async setPlanImage(file) {
    try {
      const raw = await readFileAsDataUrl(file);
      const { dataUrl, width, height } = await normaliseImage(raw);
      this.project.commit('load plan', data => {
        data.plan.image = dataUrl;
        data.plan.imageWidth = width;
        data.plan.imageHeight = height;
      });
      await this.loadBackdrop();
      this.viewport.fit(width, height);
      if (!this.project.data.plan.scale) {
        toast('Plan loaded. Calibrate the scale next.', 'info');
        this.setStep('scale');
      }
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  async loadBackdrop() {
    const data = this.project.data;
    try {
      await this.renderer.setBackdrop(data.plan.image);
    } catch (error) {
      toast(error.message, 'error');
    }
    this.renderer.resize();
    if (data.plan.imageWidth) this.viewport.fit(data.plan.imageWidth, data.plan.imageHeight);
    this.draw();
  }

  installDropTarget() {
    const stop = event => { event.preventDefault(); event.stopPropagation(); };
    for (const type of ['dragenter', 'dragover', 'dragleave', 'drop']) {
      this.stage.addEventListener(type, stop);
    }
    this.stage.addEventListener('dragover', () => this.stage.classList.add('dropping'));
    this.stage.addEventListener('dragleave', () => this.stage.classList.remove('dropping'));
    this.stage.addEventListener('drop', event => {
      this.stage.classList.remove('dropping');
      const files = [...(event.dataTransfer?.files || [])];
      if (!files.length) return;
      const project = files.find(file => file.name.endsWith('.json'));
      if (project) { this.readProjectFile(project); return; }
      if (this.step === 'photos') this.photos.add(files);
      else this.setPlanImage(files[0]);
    });
  }

  installShortcuts() {
    window.addEventListener('keydown', event => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const map = {
        v: 'select', c: 'calibrate', w: 'wall', r: 'room',
        n: 'window', d: 'door', l: 'light', f: 'furniture',
      };
      const tool = map[event.key.toLowerCase()];
      if (tool) {
        this.editor.setTool(tool);
        this.hintNode.textContent = this.editor.hint();
      }
    });
  }

  showColourMenu(hex, photo) {
    const existing = this.root.querySelector('.colour-menu');
    existing?.remove();
    const menu = colourTargetMenu(hex, {
      project: this.project,
      selected: this.editor.selected,
      onDone: () => menu.remove(),
    });
    this.stepPanelHost.prepend(menu);
    void photo;
  }

  // -- project persistence --------------------------------------------------

  async initLocalServer() {
    if (!await this.localProjects.available()) return;
    this.openWorkspaceButton.hidden = false;
    this.saveWorkspaceButton.hidden = false;
  }

  onProjectChange() {
    this.editor.project = this.project;
    this.preview.project = this.project;
    this.photos.project = this.project;
    this.draw();
    this.renderSide();
    this.preview.markStale();
    this.persist();
  }

  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, this.project.toJSON());
    } catch {
      // A project with many photos can exceed the quota. Autosave is a
      // convenience; the explicit Save project button is the real safety net.
      this.summaryNode.textContent = 'Autosave is full — use Save project to keep your work.';
    }
  }

  newProject() {
    if (!confirm('Discard the current project and start over?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
    location.reload();
  }

  saveProject() {
    const name = slugify(this.project.data.meta.id || this.project.data.meta.name, 'home');
    downloadBlob(new Blob([this.project.toJSON()], { type: 'application/json' }), `${name}.domoview.json`);
  }

  openProject() {
    const input = el('input', { type: 'file', accept: '.json,application/json' });
    input.onchange = () => {
      if (input.files?.[0]) this.readProjectFile(input.files[0]);
    };
    input.click();
  }

  async readProjectFile(file) {
    try {
      const text = await file.text();
      const loaded = Project.fromJSON(text);
      this.workspaceRecord = null;
      localStorage.removeItem(WORKSPACE_KEY);
      await this.replaceProject(loaded);
      toast(`Opened ${file.name}`, 'info');
    } catch (error) {
      toast(`Could not open that project: ${error.message}`, 'error');
    }
  }

  async openWorkspaceProject() {
    try {
      const projects = await this.localProjects.list();
      if (!projects.length) {
        toast('The local workspace has no projects yet.', 'info');
        return;
      }
      const options = projects.map(project =>
        `${project.id} — ${project.name} (revision ${project.revision})`).join('\n');
      const id = window.prompt(`Open which workspace project?\n\n${options}`, projects[0].id)?.trim();
      if (!id) return;
      const record = await this.localProjects.get(id);
      await this.replaceProject(Project.fromJSON(JSON.stringify(record.project)));
      this.setWorkspaceRecord({ id: record.id, revision: record.revision });
      toast(`Opened ${record.id} from the local workspace.`, 'info');
    } catch (error) {
      toast(`Could not open workspace project: ${error.message}`, 'error');
    }
  }

  async saveWorkspaceProject() {
    try {
      const raw = JSON.parse(this.project.toJSON());
      const record = this.workspaceRecord
        ? await this.localProjects.update(this.workspaceRecord.id, this.workspaceRecord.revision, raw)
        : await this.localProjects.create(raw, slugify(raw.meta?.id || raw.meta?.name, 'project'));
      this.setWorkspaceRecord({ id: record.id, revision: record.revision });
      toast(`Saved ${record.id} at revision ${record.revision}.`, 'ok');
    } catch (error) {
      if (error.code === 'revision_conflict') {
        toast('This workspace project changed elsewhere. Open it again before saving.', 'error');
      } else {
        toast(`Could not save workspace project: ${error.message}`, 'error');
      }
    }
  }

  setWorkspaceRecord(record) {
    this.workspaceRecord = record;
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(record));
  }

  async replaceProject(project) {
    this.project = project;
    this.editor.project = project;
    this.preview.project = project;
    this.photos.project = project;
    project.subscribe(() => this.onProjectChange());
    await this.loadBackdrop();
    this.preview.markStale();
    this.renderSide();
    this.persist();
  }

  // -- export ---------------------------------------------------------------

  exportPanel() {
    const data = this.project.data;
    const issues = projectStatus(data);
    const blocking = issues.filter(issue => ['scale', 'walls', 'rooms'].includes(issue.step));

    let stats = null;
    try {
      stats = data.plan.scale ? sceneStats(data) : null;
    } catch {
      stats = null;
    }

    return group('Export Home Pack', [
      issues.length
        ? el('ul', { class: 'issues' }, issues.map(issue =>
            el('li', { class: blocking.includes(issue) ? 'blocking' : '' }, issue.text)))
        : el('p', { class: 'note ok' }, 'Everything needed is in place.'),
      stats ? el('p', { class: 'note' },
        `Model: ${stats.meshes} meshes, about ${stats.triangles.toLocaleString()} triangles.`) : null,
      (() => {
        // What the card YAML will ask you to map, so there are no surprises.
        try {
          const counts = cardYamlSummary(buildManifest(data, { version: STUDIO_VERSION }));
          const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
          return el('p', { class: 'note' }, 'Card YAML lists ' + [
            plural(counts.fixtures, 'fixture', 'fixtures'),
            plural(counts.covers, 'blind', 'blinds'),
            plural(counts.windows, 'window contact', 'window contacts'),
            plural(counts.rooms, 'room', 'rooms'),
          ].join(', ') + ' to map.');
        } catch {
          return null;
        }
      })(),
      field('Include marked photos', (() => {
        const input = el('input', { type: 'checkbox', checked: !!this.includePhotos });
        input.onchange = () => { this.includePhotos = input.checked; };
        return input;
      })(), 'Only photos ticked on the Photos step'),
      el('div', { class: 'preview-actions' }, [
        button('Download pack (.zip)', () => this.exportPack(), {
          class: 'primary', disabled: blocking.length > 0,
        }),
        button('Download model only (.glb)', () => this.exportModelOnly(), { class: 'ghost' }),
        button('Download home.json', () => this.exportManifestOnly(), { class: 'ghost' }),
        button('Download card.yaml', () => this.exportCardYaml(), { class: 'ghost' }),
      ]),
      el('pre', { class: 'install-hint' }, (() => {
        const id = slugify(data.meta.id || data.meta.name, 'home');
        return [
          `The zip contains:`,
          '',
          `  ${id}/                 the pack — upload this folder`,
          `  ${id}-card.yaml        paste into a dashboard card`,
          `  ${id}.domoview.json    your editable source — keep it`,
          '',
          '1. Upload the folder to Home Assistant so that',
          `     /config/www/domoview/homes/${id}/home.json`,
          '   exists. File Editor, Samba or the VS Code add-on all work.',
          '',
          '2. Open the card YAML, replace each \'\' with one of your',
          '   entities, and paste it into Edit dashboard → Add card',
          '   → Manual.',
          '',
          'Keep the YAML and the project file out of /config/www:',
          'anything under www is served without authentication.',
        ].join('\n');
      })()),
    ]);
  }

  async exportPack() {
    const data = this.project.data;
    const name = slugify(data.meta.id || data.meta.name, 'home');
    const notice = toast('Building pack…', 'info', 60000);
    try {
      const buffer = await exportGlb(data);
      const manifest = buildManifest(data, { version: STUDIO_VERSION });
      const entries = [
        { name: `${name}/home.json`, content: `${JSON.stringify(manifest, null, 2)}\n` },
        { name: `${name}/model.glb`, content: buffer },
        { name: `${name}/README.txt`, content: readmeFor(name, data) },
        // Siblings of the pack folder, deliberately not inside it. Everything
        // under /config/www is served without authentication: the card YAML
        // lists entity ids once filled in, and the project file embeds the
        // floor plan image and any photos.
        {
          name: `${name}-card.yaml`,
          content: buildCardYaml(manifest, { version: STUDIO_VERSION }),
        },
        { name: `${name}.domoview.json`, content: this.project.toJSON() },
      ];

      if (this.includePhotos) {
        for (const photo of data.photos.filter(entry => entry.include)) {
          const bytes = dataUrlToBytes(photo.dataUrl);
          if (bytes) {
            entries.push({
              name: `${name}/photos/${slugify(photo.name, photo.id)}.${bytes.extension}`,
              content: bytes.data,
            });
          }
        }
      }

      downloadBlob(createZip(entries), `${name}-domoview-pack.zip`);
      notice.remove();
      toast('Pack downloaded.', 'ok');
    } catch (error) {
      notice.remove();
      console.error(error);
      toast(`Export failed: ${error.message}`, 'error');
    }
  }

  async exportModelOnly() {
    try {
      const buffer = await exportGlb(this.project.data);
      const name = slugify(this.project.data.meta.id, 'home');
      downloadBlob(new Blob([buffer], { type: 'model/gltf-binary' }), `${name}.glb`);
    } catch (error) {
      toast(`Export failed: ${error.message}`, 'error');
    }
  }

  exportCardYaml() {
    const manifest = buildManifest(this.project.data, { version: STUDIO_VERSION });
    const name = slugify(this.project.data.meta.id || this.project.data.meta.name, 'home');
    downloadBlob(
      new Blob([buildCardYaml(manifest, { version: STUDIO_VERSION })], { type: 'text/yaml' }),
      `${name}-card.yaml`,
    );
  }

  exportManifestOnly() {
    const manifest = buildManifest(this.project.data, { version: STUDIO_VERSION });
    downloadBlob(new Blob([`${JSON.stringify(manifest, null, 2)}\n`], { type: 'application/json' }), 'home.json');
  }

  draw() {
    if (this.canvas.hidden) return;
    this.renderer.draw(this.project.data, this.editor.state);
  }
}

function restoreProject() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return Project.fromJSON(saved);
  } catch (error) {
    console.warn('DomoView Studio: autosave could not be restored', error);
  }

  return new Project();
}

function restoreWorkspaceRecord() {
  try {
    const record = JSON.parse(localStorage.getItem(WORKSPACE_KEY));
    return typeof record?.id === 'string' && Number.isInteger(record.revision) ? record : null;
  } catch {
    return null;
  }
}

function dataUrlToBytes(dataUrl) {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl || '');
  if (!match) return null;
  const [, mime, base64, payload] = match;
  const extension = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
  if (!base64) return { data: decodeURIComponent(payload), extension };
  const binary = atob(payload);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
  return { data, extension };
}

function readmeFor(name, data) {
  return [
    `${data.meta.name} — a DomoView Home Pack`,
    '',
    `Created with DomoView Studio ${STUDIO_VERSION}.`,
    data.meta.author ? `Author: ${data.meta.author}` : null,
    data.meta.license ? `License: ${data.meta.license}` : null,
    '',
    'Install',
    '-------',
    `1. Copy this folder to /config/www/domoview/homes/${name}/`,
    `   so that /config/www/domoview/homes/${name}/home.json exists.`,
    '',
    `2. Open ${name}-card.yaml, which came alongside this folder in the zip.`,
    '   It lists every fixture, blind, window contact and room this pack',
    '   defines. Replace each \'\' with one of your entities.',
    '',
    '3. Paste it into Edit dashboard -> + Add card -> Manual.',
    '   The card\'s visual editor offers the same keys with entity pickers,',
    '   if you would rather click than type.',
    '',
    'Contents',
    '--------',
    'home.json   the manifest: rooms, walls, windows, fixtures, cameras',
    'model.glb   the geometry, Y-up glTF-Binary',
    '',
    'The card YAML and the project file are NOT in this folder on purpose.',
    'Everything under /config/www is served without authentication, and',
    'those two contain your entity ids and your floor plan image.',
    '',
    'Documentation: https://github.com/tomjschr/DomoView',
  ].filter(line => line !== null).join('\n');
}

const root = document.querySelector('#studio');
if (root) new Studio(root);
