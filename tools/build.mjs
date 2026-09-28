#!/usr/bin/env node
/* Build script.
 *
 * Produces two artefacts:
 *   dist/domoview.js        the Lovelace resource HACS installs
 *   dist/studio/            the standalone authoring app
 *
 * Both are single self-contained files. Home Assistant installs frequently run
 * without internet access, so nothing is pulled from a CDN at runtime and code
 * splitting is off: one request, one file, works offline.
 */

import * as esbuild from 'esbuild';
import { readFile, writeFile, mkdir, rm, cp, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const watch = process.argv.includes('--watch');
const targets = process.argv.slice(2).filter(argument => !argument.startsWith('--'));
const wanted = targets.length ? targets : ['card', 'studio'];

/* No build timestamp on purpose: dist/ is committed because HACS installs it
 * directly, and CI verifies the bundle matches the sources. A timestamp would
 * make every build differ and that check useless. */
const banner = `/*! DomoView ${pkg.version} | ${pkg.license} | ${pkg.homepage}
 * Bundles three.js (MIT) and Material Design Icons paths (Apache-2.0).
 */`;

/* The version appears in the bundle banner, in the card's console line, in the
 * Studio's title bar and in the createdWith field of every generated pack. It
 * is written as a literal in each place rather than injected, so that the
 * sources run unbuilt in Node for the tests -- which means it can drift.
 * Catch that here instead of shipping a card that reports the wrong version. */
async function checkVersionLiterals() {
  const expected = pkg.version;
  const places = [
    ['src/domoview-card.js', /export const VERSION = '([^']+)'/],
    ['studio/src/main.js', /const STUDIO_VERSION = '([^']+)'/],
  ];
  const wrong = [];
  for (const [file, pattern] of places) {
    const match = pattern.exec(await readFile(path.join(root, file), 'utf8'));
    if (!match) wrong.push(`${file}: version literal not found`);
    else if (match[1] !== expected) wrong.push(`${file}: ${match[1]} (expected ${expected})`);
  }
  if (wrong.length) {
    console.error(`\nVersion mismatch against package.json ${expected}:`);
    for (const line of wrong) console.error(`  ${line}`);
    process.exit(1);
  }
}

await checkVersionLiterals();

const shared = {
  bundle: true,
  format: 'esm',
  target: ['es2022', 'chrome111', 'firefox115', 'safari16'],
  minify: !watch,
  sourcemap: watch ? 'inline' : 'linked',
  legalComments: 'none',
  banner: { js: banner },
  logLevel: 'info',
  define: { __DOMOVIEW_VERSION__: JSON.stringify(pkg.version) },
};

const configs = {
  card: {
    ...shared,
    entryPoints: [path.join(root, 'src/index.js')],
    outfile: path.join(root, 'dist/domoview.js'),
    // Dynamic imports stay inlined on purpose: a split chunk would need a
    // correct base URL, and /local/ paths differ per installation.
    splitting: false,
  },
  studio: {
    ...shared,
    entryPoints: [path.join(root, 'studio/src/main.js')],
    outfile: path.join(root, 'dist/studio/studio.js'),
    splitting: false,
    loader: { '.css': 'text' },
  },
};

async function copyStudioShell() {
  await mkdir(path.join(root, 'dist/studio'), { recursive: true });
  await cp(path.join(root, 'studio/index.html'), path.join(root, 'dist/studio/index.html'));
  if (existsSync(path.join(root, 'studio/assets'))) {
    await cp(path.join(root, 'studio/assets'), path.join(root, 'dist/studio/assets'), { recursive: true });
  }
}

async function report(label, file) {
  try {
    const { size } = await stat(file);
    console.log(`  ${label.padEnd(8)} ${(size / 1024).toFixed(1)} kB  ${path.relative(root, file)}`);
  } catch {
    /* esbuild already reported the failure. */
  }
}

async function writeVersionFile() {
  await writeFile(path.join(root, 'dist/VERSION'), `${pkg.version}\n`, 'utf8');
}

/* Clean only what this invocation rebuilds. Wiping all of dist/ would mean
 * `build card` silently deletes the Studio that a previous `build` produced. */
const OUTPUT_PATHS = {
  card: ['dist/domoview.js', 'dist/domoview.js.map'],
  studio: ['dist/studio'],
};

if (!watch) {
  for (const name of wanted) {
    for (const target of OUTPUT_PATHS[name] || []) {
      await rm(path.join(root, target), { recursive: true, force: true });
    }
  }
}
await mkdir(path.join(root, 'dist'), { recursive: true });

if (watch) {
  for (const name of wanted) {
    const context = await esbuild.context(configs[name]);
    await context.watch();
    console.log(`watching ${name}`);
  }
  if (wanted.includes('studio')) await copyStudioShell();
} else {
  for (const name of wanted) {
    await esbuild.build(configs[name]);
    await report(name, configs[name].outfile);
  }
  if (wanted.includes('studio')) await copyStudioShell();
  await writeVersionFile();
  console.log(`\nDomoView ${pkg.version} built.`);
}
