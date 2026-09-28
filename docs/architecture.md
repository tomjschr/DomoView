# Architecture

For contributors. What the pieces are, why they are separated that way, and the
one rule that keeps the project maintainable.

---

## The rule

**Nothing in `src/` may know about any particular home.**

DomoView grew out of a card written for a single apartment, where window
positions, room polygons, the device list and even per-lamp special cases were
hard-coded — including string matches on lamp names. It worked beautifully for
that one flat and was unusable for anyone else's.

So: if you find yourself writing `if (fixture.id === ...)`, or matching on a
name, or hard-coding a coordinate, the information belongs in the **Home Pack
format** instead. Add a field, document it in the schema, and let the pack
carry it. That constraint is why this codebase is shareable, and it is worth
defending in review.

---

## Layout

```
src/
  core/                 pure logic, no DOM, testable in Node
    pack.js             load and normalise a Home Pack
    geometry.js         plan maths: polygons, wall frames, ray/box, stop tables
    astro.js            solar and lunar position
    covers.js           cover position -> visible geometry, per-room daylight
    hass.js             Home Assistant states -> one scene snapshot
  renderers/
    live3d/renderer.js  three.js, renders the GLB
    baked/              image compositor: projection, solar, compositor, environment
  domoview-card.js      the custom element: DOM shell, overlays, HA plumbing
  domoview-editor.js    the visual editor, generated from the pack
  i18n/                 card translations
  styles*.js            card and editor CSS

studio/                 the authoring app (its own entry point, same core)
tools/                  build, demo pack generator, validator, dev server, bake
schemas/                the Home Pack JSON Schema
examples/               the fictional demo pack and a no-HA demo page
```

---

## Data flow

```
                        ┌──────────────┐
  home.json  ─────────▶ │  core/pack   │ ── normalised pack ──┐
  model.glb  ──┐        └──────────────┘                      │
               │                                              ▼
               │        ┌──────────────┐              ┌───────────────┐
  hass states ─┴──────▶ │  core/hass   │ ── snapshot ▶│   renderer    │
                        └──────────────┘              └───────────────┘
                          uses astro,                   live3d or baked
                          covers, geometry                    │
                                                              ▼
                                                     ┌─────────────────┐
                                                     │ card: overlays, │
                                                     │ HUD, controls   │
                                                     └─────────────────┘
```

Two seams do the work:

**`normalisePack`** takes a terse on-disk pack and fills in everything
derivable — wall frames, room centroids, opening plan geometry, cover profiles,
bounds, camera targets. Downstream code never asks "was this field present?".

**`HomeState.snapshot()`** turns `hass` plus card config into one plain object:
sun and moon positions, daylight level, cover states, per-room daylight
factors, active emitters with colour and level, weather, climate readings. The
renderers consume only that. They never see an entity id.

That second seam is why the whole scene logic is testable without a browser,
and why a preview mode was nearly free: it is the same snapshot from sliders
instead of from Home Assistant.

---

## The two renderers

Both present the same interface to the card: `init`, `apply(snapshot)`,
`fixtureScreen`, `roomScreen`, `openingScreen`, `resize`, `dispose`. The card
does not know which one it is holding.

### `live3d`

three.js renders the pack's GLB every frame that something changes.

- **Scene space is pack space**: metres, +Z up, camera `up` set accordingly. A
  Y-up glTF is rotated on load, so every coordinate downstream is the pack's
  own. Lights, blinds and cameras are placed in pack coordinates directly.
- **Lights are pooled.** A fixed set of `PointLight`s and `SpotLight`s is
  created once and reassigned per frame. Creating or destroying a light in
  three.js recompiles every material's shader, which appears as a visible stall
  every time someone flips a switch. When more fixtures are on than the pool
  holds, the brightest win a slot by `level × intensity × lumens`; the rest
  still drive their own emissive materials.
- **Blinds are geometry**, so their shadows are real rather than modelled.
  A tilted slat is approximated with partial transparency instead of modelled
  slats — cheap, and convincing at this scale.
- **Frames are on demand.** `requestFrame()` is called on state change, camera
  change and while precipitation is animating. A static scene costs nothing.

### `baked`

Composites pre-rendered images. Carried over from the predecessor project,
generalised to the pack format, and still the better choice on weak hardware.

- `day.png` and `night.png` are blended per pixel by the daylight level, scaled
  per room by that room's cover state.
- Each fixture has a **light delta** image, added in linear light and scaled by
  brightness. Light adds linearly, so everything is decoded to linear, summed,
  and encoded back once per pixel — blending in gamma space makes two lamps at
  half brightness brighter than one at full.
- A fixture's delta can be **re-tinted**: the reference colour it was rendered
  at is divided out and the reported colour applied, so an RGB bulb changes hue
  without a new bake.
- Sun and moon come from a **G-buffer**: `position.png` holds each pixel's
  world position packed into RGB across `model.bounds`, `normal.png` its
  normal. With those, the renderer asks per pixel whether a ray reaches the sky
  through an opening. Only upward-facing surfaces get patches — 8-bit position
  on a vertical wall is coarser than the edge of a blind, and thresholding it
  speckles.
- Room membership is seeded from clean floor pixels and **flood-filled in image
  space**. Walls and furniture sit on room boundaries where the quantised world
  position is ambiguous; thresholding it directly produced visible speckle.

---

## Overlays

Fixture markers, climate chips and window badges are **DOM elements projected
over the scene**, not picked meshes. They are focusable buttons with labels, so
the card is usable by keyboard and screen reader in both renderers, and the
implementation is shared. The renderer only answers "where is this point on
screen"; the card owns the elements.

---

## The Studio

A separate entry point that imports the same `src/core` and the same
`LiveRenderer`. Project state is plain JSON in plan-pixel coordinates plus a
scale; the exporter converts to metres.

The Y flip between plan space (+Y down, as every raster image has it) and pack
space (+Y up, so +Y can mean north) is the subtlety. It also mirrors wall
normals, which is why `wallVectorsPack` is the single source of truth for wall
facing and is used by the exporter, the canvas arrow and the demo generator
alike. An earlier copy of that formula with one sign wrong produced a home lit
from inside; `test/pipeline.test.js` now asserts every exterior wall faces
outward.

The 3D preview builds the GLB in memory, hands it to `normalisePack` as a
`blob:` URL and renders it with the card's own renderer. Same code path as
production, so a mistake surfaces before any file is copied.

---

## Tests

```bash
npm test
```

`test/core.test.js` covers the maths: polygons, wall frames, ray/box
intersection, solar and lunar positions against known values, cover profiles,
pack normalisation and its error cases.

`test/pipeline.test.js` is the one that earns its keep. It validates the
example pack against the JSON Schema, checks the schema is strict enough to
reject a stray field, asserts every exterior wall faces outward and every
window opens into a room whose polygon contains it, parses the GLB container by
hand against the glTF spec, checks every `node` named in `home.json` exists in
the model, and rebuilds the manifest from the saved project to prove the
exporter is deterministic.

The useful lesson from writing it: the bugs in this kind of project are not
missing fields, they are **mirrored, offset or rotated** geometry. Every shape
was valid while the home was lit from the inside. Test the geometric property,
not the field's presence.

`src/core/*` is free of DOM access so all of this runs in Node in under a
second. Please keep it that way.

Browser-side code is verified by hand against `examples/demo.html` and the
Studio, via `node tools/serve.mjs`.

---

## Build

`tools/build.mjs` runs esbuild twice: `dist/domoview.js` (the Lovelace
resource) and `dist/studio/`. Both are single self-contained files with three.js
bundled and code splitting off, because Home Assistant installs frequently have
no internet access and `/local/` paths differ per installation. `dist/` is
committed, since HACS installs it directly.

---

## Where to add things

| You want to | Change |
|---|---|
| support a new entity kind | `fixtures[].kind` in the schema, `DEFAULT_DOMAINS` in `core/pack.js`, and the renderer's handling |
| improve how light looks | `applyFixtures` in `live3d/renderer.js`, or the fixture's `lumens` in the pack |
| add a pack field | `schemas/home-pack-1.schema.json`, `normalisePack`, `docs/home-pack-format.md`, and a test |
| add a Studio tool | `TOOLS` and the handlers in `studio/src/editor.js`, drawing in `render2d.js`, a panel in `panels.js` |
| translate the card | a file in `src/i18n/` and an entry in its `index.js` |
