/* Flat ESLint config.
 *
 * Intentionally light. The rules that are on are the ones that catch real
 * mistakes in this codebase: unused variables left behind by a refactor,
 * accidental globals, and equality bugs. Style is handled by .editorconfig and
 * by reading the surrounding code, not by a linter.
 */

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  localStorage: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  Image: 'readonly',
  Blob: 'readonly',
  File: 'readonly',
  FileReader: 'readonly',
  URL: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  CustomEvent: 'readonly',
  HTMLElement: 'readonly',
  HTMLInputElement: 'readonly',
  HTMLSelectElement: 'readonly',
  HTMLTextAreaElement: 'readonly',
  Node: 'readonly',
  customElements: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  queueMicrotask: 'readonly',
  structuredClone: 'readonly',
  performance: 'readonly',
  ResizeObserver: 'readonly',
  Intl: 'readonly',
  atob: 'readonly',
  confirm: 'readonly',
  matchMedia: 'readonly',
  getComputedStyle: 'readonly',
};

const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  URL: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  Blob: 'readonly',
  structuredClone: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  queueMicrotask: 'readonly',
  globalThis: 'readonly',
};

const shared = {
  'no-unused-vars': ['warn', { args: 'after-used', argsIgnorePattern: '^_' }],
  'no-undef': 'error',
  eqeqeq: ['warn', 'smart'],
  'no-var': 'error',
  'prefer-const': 'warn',
  'no-implicit-globals': 'error',
  'no-console': 'off',
  'no-empty': ['warn', { allowEmptyCatch: true }],
};

export default [
  {
    files: ['src/**/*.js', 'studio/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: browserGlobals,
    },
    rules: shared,
  },
  {
    files: ['tools/**/*.mjs', 'test/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...nodeGlobals, ...browserGlobals },
    },
    rules: shared,
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'examples/**/*.json'],
  },
];
