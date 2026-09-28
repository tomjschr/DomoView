/* Just enough browser surface for three.js and GLTFExporter to run in Node.
 *
 * The Studio's exporter is browser code; running it headless lets the demo
 * pack be generated in CI and keeps one implementation of the geometry rather
 * than a second one for tooling. Only the APIs the exporter actually reaches
 * for are provided, and each stub throws or no-ops in an obvious way rather
 * than silently returning wrong data.
 *
 * Texture export is the one thing this cannot support: it needs a real canvas.
 * A pack built by these tools therefore carries untextured materials, which is
 * what the generated geometry uses anyway.
 */

class StubCanvas {
  constructor() {
    this.width = 1;
    this.height = 1;
  }

  getContext() {
    throw new Error('Canvas rendering is not available in Node; export textures from the browser Studio.');
  }

  toDataURL() {
    throw new Error('Canvas rendering is not available in Node; export textures from the browser Studio.');
  }
}

class StubElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.style = {};
    this.children = [];
  }

  appendChild(child) { this.children.push(child); return child; }
  append(...nodes) { this.children.push(...nodes); }
  remove() {}
  setAttribute() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement(tag) {
      return tag === 'canvas' ? new StubCanvas() : new StubElement(tag);
    },
    createElementNS(_namespace, tag) {
      return this.createElement(tag);
    },
    createTextNode(text) {
      return { nodeValue: String(text) };
    },
    body: new StubElement('body'),
    documentElement: new StubElement('html'),
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}

if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = callback => setTimeout(() => callback(Date.now()), 16);
  globalThis.cancelAnimationFrame = handle => clearTimeout(handle);
}

if (typeof globalThis.matchMedia === 'undefined') {
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
}

if (typeof globalThis.URL.createObjectURL === 'undefined') {
  globalThis.URL.createObjectURL = () => {
    throw new Error('Object URLs are not available in Node.');
  };
  globalThis.URL.revokeObjectURL = () => {};
}

if (typeof globalThis.Image === 'undefined') {
  globalThis.Image = class {
    set src(_value) {
      // Fail loudly rather than hanging: nothing headless can decode this.
      queueMicrotask(() => this.onerror?.(new Error('Image decoding is not available in Node.')));
    }
  };
}

if (typeof globalThis.FileReader === 'undefined') {
  // GLTFExporter assembles the GLB as a Blob and reads it back through a
  // FileReader. Node has Blob but not FileReader, so bridge the two.
  globalThis.FileReader = class {
    constructor() {
      this.result = null;
      this.error = null;
      this.readyState = 0;
    }

    #finish(result) {
      this.result = result;
      this.readyState = 2;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    }

    #fail(error) {
      this.error = error;
      this.readyState = 2;
      this.onerror?.({ target: this });
      this.onloadend?.({ target: this });
    }

    readAsArrayBuffer(blob) {
      this.readyState = 1;
      blob.arrayBuffer().then(buffer => this.#finish(buffer), error => this.#fail(error));
    }

    readAsDataURL(blob) {
      this.readyState = 1;
      blob.arrayBuffer().then(buffer => {
        const base64 = Buffer.from(buffer).toString('base64');
        this.#finish(`data:${blob.type || 'application/octet-stream'};base64,${base64}`);
      }, error => this.#fail(error));
    }

    readAsText(blob) {
      this.readyState = 1;
      blob.text().then(text => this.#finish(text), error => this.#fail(error));
    }

    abort() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
