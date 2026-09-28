/* Tiny DOM helpers.
 *
 * The Studio deliberately has no framework: it is one canvas plus a few forms,
 * and a contributor should be able to read any file without learning a build
 * abstraction first. These helpers keep that readable without a dependency.
 */

export function el(tag, properties = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(properties)) {
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') node[key.toLowerCase()] = value;
    else if (key === 'html') node.innerHTML = value;
    else if (value !== undefined && value !== null) node[key] = value;
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function field(label, control, hint) {
  return el('label', { class: 'field' }, [
    el('span', { class: 'field-label' }, label),
    control,
    hint ? el('small', {}, hint) : null,
  ]);
}

export function textInput(value, onChange, options = {}) {
  const input = el('input', { type: 'text', value: value ?? '', ...options });
  input.onchange = () => onChange(input.value);
  return input;
}

export function numberInput(value, onChange, options = {}) {
  const { step = 0.01, min, max, unit } = options;
  const input = el('input', {
    type: 'number', value: value ?? 0, step,
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
  });
  const commit = () => {
    const parsed = Number(input.value);
    if (!Number.isFinite(parsed)) return;
    onChange(parsed);
  };
  input.onchange = commit;
  if (!unit) return input;
  return el('span', { class: 'with-unit' }, [input, el('span', { class: 'unit' }, unit)]);
}

export function rangeInput(value, onChange, options = {}) {
  const { min = 0, max = 100, step = 1, format = v => String(v) } = options;
  const input = el('input', { type: 'range', min, max, step, value });
  const readout = el('output', { class: 'readout' }, format(value));
  const handler = () => {
    readout.textContent = format(Number(input.value));
    onChange(Number(input.value));
  };
  input.oninput = handler;
  return el('span', { class: 'with-readout' }, [input, readout]);
}

export function checkbox(value, onChange, label) {
  const input = el('input', { type: 'checkbox', checked: !!value });
  input.onchange = () => onChange(input.checked);
  return label ? el('span', { class: 'check' }, [input, el('span', {}, label)]) : input;
}

export function selectInput(value, options, onChange) {
  const select = el('select', {}, options.map(([optionValue, text]) =>
    el('option', { value: optionValue, textContent: text, selected: String(optionValue) === String(value) })));
  select.onchange = () => onChange(select.value);
  return select;
}

export function colorInput(value, onChange) {
  const input = el('input', { type: 'color', value: value || '#ffffff' });
  input.oninput = () => onChange(input.value);
  return input;
}

export function button(label, onClick, options = {}) {
  return el('button', { type: 'button', textContent: label, onClick, ...options });
}

export function group(title, children) {
  return el('section', { class: 'group' }, [
    title ? el('h3', {}, title) : null,
    ...[].concat(children).filter(Boolean),
  ]);
}

/** A modal that resolves with a number, used for scale calibration. */
export function askNumber({ title, message, unit = 'm', initial = '' }) {
  return new Promise(resolve => {
    const input = el('input', { type: 'number', step: '0.001', min: '0.001', value: initial });
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      resolve(value);
    };
    const submit = () => {
      const parsed = Number(input.value);
      finish(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
    };
    const onKey = event => {
      if (event.key === 'Escape') finish(null);
      if (event.key === 'Enter') { event.preventDefault(); submit(); }
    };
    const overlay = el('div', { class: 'modal-backdrop' }, [
      el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, [
        el('h2', {}, title),
        el('p', {}, message),
        el('div', { class: 'modal-row' }, [input, el('span', { class: 'unit' }, unit)]),
        el('div', { class: 'modal-actions' }, [
          button('Cancel', () => finish(null), { class: 'ghost' }),
          button('Apply', submit, { class: 'primary' }),
        ]),
      ]),
    ]);
    overlay.onclick = event => { if (event.target === overlay) finish(null); };
    document.addEventListener('keydown', onKey);
    document.body.append(overlay);
    input.focus();
    input.select();
  });
}

export function toast(message, kind = 'info', timeout = 4200) {
  let host = document.querySelector('.toasts');
  if (!host) {
    host = el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(host);
  }
  const node = el('div', { class: `toast ${kind}` }, message);
  host.append(node);
  setTimeout(() => node.remove(), timeout);
  return node;
}

/** Read a File as a data URL, which is how the plan image is stored. */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`${file.name} could not be read.`));
    reader.readAsDataURL(file);
  });
}

/** Downscale an oversized plan image so the project file stays manageable. */
export async function normaliseImage(dataUrl, maxEdge = 3000) {
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('That file is not an image this browser can decode.'));
    image.src = dataUrl;
  });
  const { naturalWidth: width, naturalHeight: height } = image;
  if (Math.max(width, height) <= maxEdge) {
    return { dataUrl, width, height };
  }
  const scale = maxEdge / Math.max(width, height);
  const canvas = el('canvas', { width: Math.round(width * scale), height: Math.round(height * scale) });
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.88),
    width: canvas.width,
    height: canvas.height,
  };
}
