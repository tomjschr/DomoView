/* Room reference photos.
 *
 * Photos are what turns a flat outline into a believable home: they tell you
 * how high the sill really is, where the lamps hang and what colour the floor
 * is. They stay reference material — the exporter does not put them in a
 * shared pack unless you ask, because photos of your own rooms are not
 * something to publish by accident.
 */

import { el, button, toast, readFileAsDataUrl, normaliseImage } from './ui.js';
import { rgb255ToHex } from './units.js';

const MAX_PHOTO_EDGE = 1400;

export class PhotoShelf {
  constructor({ project, container, onPickColor }) {
    this.project = project;
    this.container = container;
    this.onPickColor = onPickColor;
    this.picking = null;
  }

  async add(files) {
    const added = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const raw = await readFileAsDataUrl(file);
        const { dataUrl, width, height } = await normaliseImage(raw, MAX_PHOTO_EDGE);
        added.push({
          id: `photo_${Math.random().toString(36).slice(2, 9)}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          dataUrl, width, height,
          room: null,
          include: false,
          note: '',
        });
      } catch (error) {
        toast(error.message, 'error');
      }
    }
    if (!added.length) return;
    this.project.commit('add photos', data => data.photos.push(...added));
  }

  render() {
    const data = this.project.data;
    this.container.replaceChildren();

    const fileInput = el('input', {
      type: 'file', accept: 'image/*', multiple: true, class: 'file',
    });
    fileInput.onchange = () => {
      if (fileInput.files?.length) this.add([...fileInput.files]);
      fileInput.value = '';
    };

    this.container.append(el('div', { class: 'photo-toolbar' }, [
      el('label', { class: 'field-label' }, 'Room photos'),
      fileInput,
    ]));

    if (!data.photos.length) {
      this.container.append(el('p', { class: 'note' },
        'Add photos of each room. Click a photo to sample a colour for the walls, floor or a lamp.'));
      return;
    }

    const grid = el('div', { class: 'photo-grid' });
    for (const photo of data.photos) {
      grid.append(this.card(photo));
    }
    this.container.append(grid);
    this.container.append(el('p', { class: 'note' },
      'Photos are kept in the project file. Only those marked "include" are written into an exported pack.'));
  }

  card(photo) {
    const data = this.project.data;
    const image = el('img', { src: photo.dataUrl, alt: photo.name, loading: 'lazy' });
    image.onclick = event => this.sample(event, image, photo);

    const roomSelect = el('select', { class: 'photo-room' }, [
      el('option', { value: '', textContent: 'Unassigned' }),
      ...data.rooms.map(room =>
        el('option', { value: room.id, textContent: room.name, selected: room.id === photo.room })),
    ]);
    roomSelect.onchange = () => this.update(photo.id, entry => { entry.room = roomSelect.value || null; });

    const include = el('input', { type: 'checkbox', checked: photo.include });
    include.onchange = () => this.update(photo.id, entry => { entry.include = include.checked; });

    return el('figure', { class: 'photo-card' }, [
      image,
      el('figcaption', {}, [
        roomSelect,
        el('label', { class: 'check tiny' }, [include, el('span', {}, 'include')]),
        button('×', () => {
          this.project.commit('remove photo', target => {
            target.photos = target.photos.filter(entry => entry.id !== photo.id);
          });
        }, { class: 'ghost tiny', title: 'Remove photo' }),
      ]),
    ]);
  }

  update(id, mutate) {
    this.project.commit('photo', data => {
      const photo = data.photos.find(entry => entry.id === id);
      if (photo) mutate(photo);
    });
  }

  /**
   * Average a small patch under the click rather than a single pixel: one
   * pixel of a JPEG is mostly compression noise.
   */
  sample(event, image, photo) {
    const rect = image.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / rect.width * photo.width);
    const y = Math.round((event.clientY - rect.top) / rect.height * photo.height);

    const canvas = el('canvas', { width: photo.width, height: photo.height });
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, photo.width, photo.height);

    const radius = 4;
    const left = Math.max(0, x - radius), top = Math.max(0, y - radius);
    const width = Math.min(photo.width - left, radius * 2 + 1);
    const height = Math.min(photo.height - top, radius * 2 + 1);
    if (width <= 0 || height <= 0) return;

    const pixels = context.getImageData(left, top, width, height).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 8) continue;
      r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2];
      count += 1;
    }
    if (!count) return;
    const hex = rgb255ToHex([r / count, g / count, b / count]);
    this.onPickColor(hex, photo);
  }
}

/** Ask where a sampled colour should go. */
export function colourTargetMenu(hex, { project, selected, onDone }) {
  const targets = [
    ['wall', 'Walls'],
    ['floor', 'Floors'],
    ['furniture', 'Furniture'],
  ];
  const menu = el('div', { class: 'colour-menu' }, [
    el('span', { class: 'swatch', style: { background: hex } }),
    el('code', {}, hex),
    ...targets.map(([key, label]) => button(label, () => {
      project.commit(`${key} colour`, data => { data.materials[key] = hex; });
      onDone();
    }, { class: 'ghost tiny' })),
    selected?.collection === 'fixtures' ? button('Selected lamp', () => {
      project.applyOperation({
        type: 'fixture.update',
        id: selected.id,
        changes: { color: hex },
      }, 'lamp colour');
      onDone();
    }, { class: 'ghost tiny' }) : null,
    button('Cancel', onDone, { class: 'ghost tiny' }),
  ]);
  return menu;
}
