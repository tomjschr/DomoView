/* The inspector column.
 *
 * Shows project-wide settings when nothing is selected, and the properties of
 * the selected element otherwise. Every edit goes through project.commit so it
 * lands in the undo stack.
 */

import {
  el, field, group, textInput, numberInput, rangeInput, checkbox,
  selectInput, colorInput, button,
} from './ui.js';
import { PlanTransform } from './units.js';

const COVER_PROFILES = [
  ['venetian', 'Venetian blind'],
  ['roller', 'Roller shutter'],
  ['linear', 'Linear (position = opening)'],
];

const EMITTER_TYPES = [
  ['point', 'Bulb (point)'],
  ['spot', 'Spot (aimed down)'],
  ['strip', 'LED strip'],
  ['emissive', 'Glow only (no cast light)'],
];

const FIXTURE_KINDS = [
  ['light', 'Light'],
  ['media', 'Screen / TV'],
  ['speaker', 'Speaker'],
  ['appliance', 'Appliance'],
  ['vacuum', 'Robot vacuum'],
  ['marker', 'Marker only'],
];

export function renderInspector(container, context) {
  const { project, selected } = context;
  container.replaceChildren();
  if (!selected) {
    container.append(projectPanel(context), materialPanel(context), cameraPanel(context));
    return;
  }
  const entry = project.find(selected.collection, selected.id);
  if (!entry) {
    container.append(projectPanel(context));
    return;
  }
  const builders = {
    walls: wallPanel,
    rooms: roomPanel,
    openings: openingPanel,
    fixtures: fixturePanel,
    furniture: furniturePanel,
  };
  container.append(builders[selected.collection](entry, context));
  container.append(deleteRow(entry, context));
}

function edit(project, label, id, collection, mutate) {
  if (collection === 'fixtures') {
    const entry = structuredClone(project.find(collection, id));
    if (!entry) return;
    mutate(entry, project.data);
    const changes = { ...entry };
    delete changes.id;
    project.applyOperation({ type: 'fixture.update', id, changes }, label);
    return;
  }
  project.commit(label, data => {
    const entry = data[collection].find(item => item.id === id);
    if (entry) mutate(entry, data);
  });
}

function deleteRow(entry, { project, editor }) {
  return el('div', { class: 'panel-actions' }, [
    button('Delete', () => {
      project.remove(editor.selected.collection, entry.id);
      editor.select(null);
    }, { class: 'danger' }),
  ]);
}

// -- project-wide ------------------------------------------------------------

function projectPanel({ project, onPlanImage }) {
  const data = project.data;
  const scaleText = data.plan.scale
    ? `1 px = ${(data.plan.scale * 100).toFixed(2)} cm · ${(1 / data.plan.scale).toFixed(1)} px/m`
    : 'Not calibrated yet';

  const fileInput = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', class: 'file' });
  fileInput.onchange = () => {
    if (fileInput.files?.[0]) onPlanImage(fileInput.files[0]);
    fileInput.value = '';
  };

  return group('Home', [
    field('Name', textInput(data.meta.name, value =>
      project.commit('name', target => { target.meta.name = value; }))),
    field('Pack id', textInput(data.meta.id, value =>
      project.commit('pack id', target => { target.meta.id = value; })),
      'Folder name under www/domoview/homes/'),
    field('Author', textInput(data.meta.author, value =>
      project.commit('author', target => { target.meta.author = value; }))),
    field('License', selectInput(data.meta.license, [
      ['CC0-1.0', 'CC0 (public domain)'],
      ['CC-BY-4.0', 'CC BY 4.0'],
      ['CC-BY-SA-4.0', 'CC BY-SA 4.0'],
      ['', 'All rights reserved'],
    ], value => project.commit('license', target => { target.meta.license = value; })),
      'Applies if you share the pack'),
    field('North', rangeInput(data.meta.north, value =>
      project.commit('north', target => { target.meta.north = value; }),
      { min: -180, max: 180, step: 1, format: value => `${value}°` }),
      'Rotation from the plan’s up direction to geographic north'),
    field('Ceiling height', numberInput(data.level.height, value =>
      project.commit('ceiling', target => { target.level.height = value; }),
      { step: 0.05, min: 1.8, unit: 'm' })),
    el('hr', {}),
    field('Floor plan', fileInput),
    field('Plan opacity', rangeInput(Math.round(data.plan.opacity * 100), value =>
      project.touch(target => { target.plan.opacity = value / 100; }),
      { min: 0, max: 100, step: 5, format: value => `${value} %` })),
    el('p', { class: data.plan.scale ? 'note ok' : 'note warn' }, scaleText),
  ]);
}

function materialPanel({ project }) {
  const data = project.data;
  const swatch = (label, key, hint) => field(label,
    colorInput(data.materials[key], value =>
      project.touch(target => { target.materials[key] = value; })), hint);
  return group('Materials', [
    swatch('Walls', 'wall'),
    swatch('Floors', 'floor', 'Pick from a room photo below'),
    swatch('Furniture', 'furniture'),
  ]);
}

function cameraPanel({ project }) {
  const camera = project.data.camera;
  return group('Default view', [
    field('Direction', rangeInput(camera.azimuth, value =>
      project.touch(target => { target.camera.azimuth = value; }),
      { min: 0, max: 359, step: 1, format: value => `${value}°` }),
      'Where the camera stands, clockwise from north'),
    field('Tilt', rangeInput(camera.elevation, value =>
      project.touch(target => { target.camera.elevation = value; }),
      { min: 5, max: 90, step: 1, format: value => `${value}°` })),
    field('Zoom', rangeInput(Math.round(camera.zoom * 100), value =>
      project.touch(target => { target.camera.zoom = value / 100; }),
      { min: 40, max: 250, step: 5, format: value => `${value} %` })),
    field('Cut away above', numberInput(camera.clipAbove, value =>
      project.touch(target => { target.camera.clipAbove = value; }),
      { step: 0.1, min: 0, unit: 'm' }),
      'Hide geometry above this height. 0 disables the cut.'),
  ]);
}

// -- element panels ----------------------------------------------------------

function wallPanel(wall, { project }) {
  const scale = project.data.plan.scale;
  const lengthPx = Math.hypot(wall.b[0] - wall.a[0], wall.b[1] - wall.a[1]);
  return group('Wall', [
    el('p', { class: 'note' }, scale
      ? `Length ${(lengthPx * scale).toFixed(2)} m`
      : `Length ${lengthPx.toFixed(0)} px (uncalibrated)`),
    field('Thickness', numberInput(wall.thickness, value =>
      edit(project, 'wall thickness', wall.id, 'walls', entry => { entry.thickness = value; }),
      { step: 0.01, min: 0.02, unit: 'm' })),
    field('Height', numberInput(wall.height, value =>
      edit(project, 'wall height', wall.id, 'walls', entry => { entry.height = value; }),
      { step: 0.05, min: 0.2, unit: 'm' })),
    field('Exterior wall', checkbox(wall.exterior, value =>
      edit(project, 'wall exterior', wall.id, 'walls', entry => { entry.exterior = value; })),
      'Exterior walls show their outward direction on the plan'),
    field('Face the other way', checkbox(wall.flip, value =>
      edit(project, 'wall facing', wall.id, 'walls', entry => { entry.flip = value; })),
      'Flip if the arrow points indoors; it decides where daylight enters'),
  ]);
}

function roomPanel(room, { project }) {
  const scale = project.data.plan.scale;
  const area = scale ? polygonArea(room.polygon) * scale * scale : null;
  return group('Room', [
    field('Name', textInput(room.name, value =>
      edit(project, 'room name', room.id, 'rooms', entry => { entry.name = value; }))),
    area !== null ? el('p', { class: 'note' }, `Floor area ${area.toFixed(1)} m²`) : null,
    field('Outdoor', checkbox(room.outdoor, value =>
      edit(project, 'room outdoor', room.id, 'rooms', entry => { entry.outdoor = value; })),
      'Balconies and terraces: lit by open sky, and they catch rain and snow'),
  ]);
}

function openingPanel(opening, { project }) {
  const rooms = project.data.rooms;
  const roomToggles = rooms.length ? el('div', { class: 'checklist' }, rooms.map(room =>
    checkbox(opening.rooms.includes(room.id), value =>
      edit(project, 'opening rooms', opening.id, 'openings', entry => {
        entry.rooms = value
          ? [...new Set([...entry.rooms, room.id])]
          : entry.rooms.filter(id => id !== room.id);
      }), room.name))) : el('p', { class: 'note warn' }, 'Outline a room first.');

  const isWindow = opening.type !== 'door';
  return group(isWindow ? 'Window' : 'Door', [
    field('Name', textInput(opening.name, value =>
      edit(project, 'opening name', opening.id, 'openings', entry => { entry.name = value; }),
      { placeholder: 'Living room west' })),
    field('Type', selectInput(opening.type, [
      ['window', 'Window'],
      ['glass_door', 'Glazed door'],
      ['door', 'Door'],
    ], value => edit(project, 'opening type', opening.id, 'openings', entry => {
      entry.type = value;
      entry.cover = value !== 'door' && entry.cover;
    }))),
    field('Width', numberInput(opening.width, value =>
      edit(project, 'opening width', opening.id, 'openings', entry => { entry.width = value; }),
      { step: 0.05, min: 0.1, unit: 'm' })),
    field('Sill height', numberInput(opening.sill, value =>
      edit(project, 'opening sill', opening.id, 'openings', entry => { entry.sill = value; }),
      { step: 0.05, min: 0, unit: 'm' }), 'Lower edge above the floor'),
    field('Head height', numberInput(opening.head, value =>
      edit(project, 'opening head', opening.id, 'openings', entry => { entry.head = value; }),
      { step: 0.05, min: 0.2, unit: 'm' }), 'Upper edge above the floor'),
    isWindow ? field('Lights these rooms', roomToggles) : null,
    isWindow ? field('Centre post', numberInput(opening.mullion ?? 0, value =>
      edit(project, 'opening mullion', opening.id, 'openings', entry => {
        entry.mullion = value > 0 ? value : null;
      }), { step: 0.05, min: 0, unit: 'm' }),
      'Distance from the centre to a vertical post that blocks light. 0 for none.') : null,
    isWindow ? field('Has a blind', checkbox(opening.cover, value =>
      edit(project, 'opening cover', opening.id, 'openings', entry => { entry.cover = value; }))) : null,
    isWindow && opening.cover ? field('Blind type', selectInput(opening.coverProfile, COVER_PROFILES,
      value => edit(project, 'cover profile', opening.id, 'openings', entry => { entry.coverProfile = value; }))) : null,
    isWindow && opening.cover ? field('Blind in front of glass', checkbox(opening.coverInFront, value =>
      edit(project, 'cover side', opening.id, 'openings', entry => { entry.coverInFront = value; })),
      'For windows seen from outside in the default view') : null,
  ]);
}

function fixturePanel(fixture, { project }) {
  const rooms = project.data.rooms;
  const emitters = el('div', { class: 'emitters' }, fixture.emitters.map((emitter, index) =>
    el('div', { class: 'emitter' }, [
      el('span', { class: 'emitter-index' }, `#${index + 1}`),
      numberInput(emitter.height, value =>
        edit(project, 'bulb height', fixture.id, 'fixtures', entry => {
          entry.emitters[index].height = value;
        }), { step: 0.05, min: 0, unit: 'm' }),
      selectInput(emitter.type, EMITTER_TYPES, value =>
        edit(project, 'bulb type', fixture.id, 'fixtures', entry => {
          entry.emitters[index].type = value;
        })),
      fixture.emitters.length > 1 ? button('×', () =>
        edit(project, 'remove bulb', fixture.id, 'fixtures', entry => {
          entry.emitters.splice(index, 1);
        }), { class: 'ghost tiny', title: 'Remove this bulb' }) : null,
    ])));

  return group('Fixture', [
    field('Name', textInput(fixture.name, value =>
      edit(project, 'fixture name', fixture.id, 'fixtures', entry => { entry.name = value; }),
      { placeholder: 'Living room pendant' })),
    field('Kind', selectInput(fixture.kind, FIXTURE_KINDS, value =>
      edit(project, 'fixture kind', fixture.id, 'fixtures', entry => { entry.kind = value; }))),
    field('Room', selectInput(fixture.room || '', [['', '—'], ...rooms.map(room => [room.id, room.name])],
      value => edit(project, 'fixture room', fixture.id, 'fixtures', entry => { entry.room = value || null; }))),
    field('Colour', colorInput(fixture.color, value =>
      edit(project, 'fixture colour', fixture.id, 'fixtures', entry => { entry.color = value; })),
      'Used when the bound entity reports no colour'),
    field('Brightness', numberInput(fixture.lumens, value =>
      edit(project, 'fixture lumens', fixture.id, 'fixtures', entry => { entry.lumens = value; }),
      { step: 50, min: 10, unit: 'lm' })),
    field('Reach', numberInput(fixture.range, value =>
      edit(project, 'fixture range', fixture.id, 'fixtures', entry => { entry.range = value; }),
      { step: 0.5, min: 0.5, unit: 'm' })),
    field('Casts shadows', checkbox(fixture.shadow, value =>
      edit(project, 'fixture shadow', fixture.id, 'fixtures', entry => { entry.shadow = value; })),
      'Costly in the live renderer; keep it to a couple of hero lights'),
    el('h4', {}, 'Bulbs'),
    emitters,
    el('p', { class: 'note' }, 'Shift-click on the plan adds another bulb to this fixture.'),
  ]);
}

function furniturePanel(item, { project }) {
  return group('Furniture', [
    field('Name', textInput(item.name, value =>
      edit(project, 'furniture name', item.id, 'furniture', entry => { entry.name = value; }))),
    field('Base height', numberInput(item.base, value =>
      edit(project, 'furniture base', item.id, 'furniture', entry => { entry.base = value; }),
      { step: 0.05, min: 0, unit: 'm' })),
    field('Top height', numberInput(item.top, value =>
      edit(project, 'furniture top', item.id, 'furniture', entry => { entry.top = value; }),
      { step: 0.05, min: 0.02, unit: 'm' })),
    field('Solid geometry', checkbox(item.solid, value =>
      edit(project, 'furniture solid', item.id, 'furniture', entry => { entry.solid = value; })),
      'Include a box for it in the exported model'),
    field('Blocks sunlight', checkbox(item.occluder, value =>
      edit(project, 'furniture occluder', item.id, 'furniture', entry => { entry.occluder = value; })),
      'Casts shadows in the baked renderer'),
  ]);
}

function polygonArea(polygon) {
  let area = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    area += polygon[j][0] * polygon[i][1] - polygon[i][0] * polygon[j][1];
  }
  return Math.abs(area) / 2;
}

/** Outline shown in the left rail so large projects stay navigable. */
export function renderOutline(container, { project, editor }) {
  const data = project.data;
  container.replaceChildren();
  const sections = [
    ['rooms', 'Rooms', data.rooms, entry => entry.name],
    ['openings', 'Openings', data.openings, entry => entry.name || entry.id],
    ['fixtures', 'Fixtures', data.fixtures, entry => entry.name || entry.id],
    ['furniture', 'Furniture', data.furniture, entry => entry.name],
  ];
  for (const [collection, title, items, label] of sections) {
    if (!items.length) continue;
    const list = el('ul', { class: 'outline-list' }, items.map(item => {
      const active = editor.selected?.collection === collection && editor.selected.id === item.id;
      return el('li', {}, [
        el('button', {
          type: 'button',
          class: active ? 'active' : '',
          textContent: label(item),
          onClick: () => editor.select(collection, item.id),
        }),
      ]);
    }));
    container.append(el('div', { class: 'outline-group' }, [
      el('h4', {}, `${title} (${items.length})`),
      list,
    ]));
  }
  if (!container.children.length) {
    container.append(el('p', { class: 'note' }, 'Nothing traced yet.'));
  }
}

/** Metre readout of the traced extent, for a sanity check against reality. */
export function planSummary(data) {
  if (!data.plan.scale) return 'Calibrate the scale to see real dimensions.';
  const transform = new PlanTransform(data);
  const points = [];
  for (const wall of data.walls) points.push(transform.point(wall.a), transform.point(wall.b));
  if (!points.length) return 'No walls traced yet.';
  const xs = points.map(point => point[0]);
  const ys = points.map(point => point[1]);
  const width = Math.max(...xs) - Math.min(...xs);
  const depth = Math.max(...ys) - Math.min(...ys);
  return `Traced extent ${width.toFixed(2)} m × ${depth.toFixed(2)} m`;
}
