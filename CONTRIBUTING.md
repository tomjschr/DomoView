# Contributing to DomoView

Three kinds of contribution are all equally welcome, and they need different
things from you.

---

## 1. Share what you learned about your own home

This is the most valuable contribution and needs no code.

Modelling a real home surfaces things the docs cannot predict: that your
shutter controller reports 30 % when the window is still fully covered, that a
particular lamp needs 200 lumens rather than 600 to look right, that a bay
window has to be traced as three walls. Please write those down.

- **A measured cover profile.** If your blinds do not open linearly, measure
  the clear opening at a few positions and open an issue with the numbers. We
  add it to `coverProfiles` as a named profile everyone can pick.
  → [Cover profile issue template](https://github.com/tomjschr/DomoView/issues/new?template=cover-profile.yml)
- **A fixture recipe.** Lumens, colour and emitter layout that make a common
  fixture type read correctly.
- **A pack.** See *Contributing a Home Pack* below.

## 2. Contributing a Home Pack

A shared pack is how someone else gets a working 3D home in ten minutes instead
of an evening.

**Before you publish, read [docs/sharing-packs.md](docs/sharing-packs.md).** A
floor plan says something about where you live, and it is worth deciding
deliberately rather than by accident. Packs of show homes, rentals you have
left, or invented layouts carry none of that weight and are just as useful as
examples.

Checklist:

- [ ] `home.json` contains **no entity ids** (`bindings` empty or absent)
- [ ] No reference photos included unless you meant to include them
- [ ] A license is set in `pack.license` — CC0-1.0 or CC-BY-4.0 preferred
- [ ] `node tools/pack/validate.mjs path/to/pack` passes
- [ ] The pack loads in the card demo (`node tools/serve.mjs`)

Then open a pull request adding it under `examples/`, or just link it from an
issue if you would rather host it yourself.

## 3. Code

### Setup

```bash
git clone https://github.com/tomjschr/DomoView
cd DomoView
npm install

npm run build          # dist/domoview.js and dist/studio/
npm run watch          # rebuild on change
npm test               # core maths, pack format, export pipeline
npm run lint
npm run demo           # regenerate examples/demo-apartment
node tools/serve.mjs   # http://127.0.0.1:8099
```

`tools/serve.mjs` gives you the card demo and the Studio with no Home Assistant
involved. For the real thing, point a dashboard resource at your local
`dist/domoview.js` over a file share, or copy it after each build.

### How the pieces fit

```
src/core/          pure logic: pack format, geometry, astronomy, covers, HA glue
src/renderers/     live3d (three.js) and baked (image compositor)
src/domoview-*.js  the custom elements
studio/            the authoring app
tools/             build, demo pack generator, pack validator, Blender bake
schemas/           the Home Pack JSON Schema
```

The rule that keeps this maintainable: **nothing in `src/` may know about any
particular home.** If you find yourself writing `if (fixture.id === ...)` or
matching on a name, the information belongs in the Home Pack format instead.
That is the mistake the predecessor of this project made, and undoing it was
most of the work of writing DomoView.

`src/core/*` is deliberately free of DOM access so it can be tested in Node.
Please keep it that way; it is why `npm test` runs in under a second.

### Pull requests

- One topic per PR.
- Add a test for anything with arithmetic in it. `test/core.test.js` and
  `test/pipeline.test.js` show the style. The tests that earn their keep here
  are the ones that check geometry is not *mirrored* or *offset*, not the ones
  that check a field exists.
- If you change the Home Pack format, bump nothing yet — open an issue first.
  The schema version is a compatibility promise to every shared pack.
- Run `npm test && npm run lint && npm run build` before pushing. `dist/` is
  committed, because HACS installs it directly; include the rebuilt file.
- Comments should say *why*, not *what*. The codebase is written that way
  throughout.

### Reporting a bug

Please include:

- What you expected versus what you saw, ideally a screenshot
- `renderer:` and `quality:` from your card config
- The output of `node tools/pack/validate.mjs` on your pack, if you have the
  repository checked out
- Browser and whether it is the companion app, a tablet, or a desktop browser
- Any errors from the browser console

A bug in a renderer is much easier to fix with the pack that triggers it. A
cut-down pack with the one broken window in it is ideal.

## Code of conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
