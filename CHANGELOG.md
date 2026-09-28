# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The **Home Pack schema version** is versioned separately from the card. A card
release will always read every pack schema version it has ever supported; a
schema bump is called out explicitly here.

## [Unreleased]

## [0.1.1] - 2026-09-28

### Added

- **The Studio now exports the dashboard card YAML.** A pack carries no entity
  ids by design, which previously meant reading `home.json` to find out which
  keys exist. The export writes a `<pack>-card.yaml` listing every fixture,
  blind, window contact and room, grouped by room and labelled, each with an
  empty placeholder to fill in. There is a separate download button for it too.
- The standalone `domoview-studio.zip` now ships its own server and a README,
  so it runs on a PC without checking the repository out: unzip and
  `node serve.mjs`. ES modules cannot be loaded over `file://`, so opening
  `index.html` directly does not work and the README says so.
- `tools/pack/compare-glb.mjs` compares two glTF files structurally — node
  tree, mesh and material inventory, index topology, and numeric accessors
  within a tolerance.
- Two labelled screenshots in the READMEs: a hand-modelled home, and what the
  Studio produces from a traced floor plan. Showing only the first would
  promise a look that tracing a plan does not give you.
- The build refuses to run when the version literals in the card and the Studio
  drift from `package.json`.

### Changed

- The export zip puts the card YAML and the project file **beside** the pack
  folder rather than inside it. Everything under `/config/www` is served
  without authentication, and those two files contain entity ids and the floor
  plan image respectively.
- CI no longer asserts the demo model is byte-identical after regeneration.
  `Math.sin` and friends are not specified to be bit-identical between V8
  versions and those last bits land in float32 vertices, so the check failed
  between Node 22 and Node 24 on geometry that was correct in both. The
  manifest is still compared byte for byte; the model is compared
  structurally.

### Fixed

- The card painted one vertically squashed frame on load. The renderer sized
  itself during init, before the scene’s aspect ratio was applied, and only the
  ResizeObserver corrected it a frame or two later.
- A pack may now ship baked images without a GLB. `model.url` was required,
  which made a pack migrated from a purely image-based card impossible to
  express.
- The baked renderer left its canvases blank after a resize large enough to
  change the composite resolution: `rebuild()` re-applied the scene before
  clearing the guard that `apply()` checks.
- "Fixture has neither emitters nor a GLB node" was reported for every fixture
  in a baked pack, where a baked light delta is all the renderer needs. The
  validator's copy of that check is also scoped to light-emitting kinds now, so
  a speaker or an oven is no longer reported as a lightless light.

## [0.1.0] - 2026-09-28

First public release. Home Pack schema version **1**.

### Added

- **DomoView card** (`custom:domoview-card`) with two interchangeable renderers
  over one pack format.
  - `live3d`: three.js renders the pack's GLB every frame. Light states drive
    pooled real light sources, blinds are real geometry casting real shadows,
    and the sun and moon are placed from computed positions.
  - `baked`: composites pre-rendered images in linear light, with runtime sun
    and moon projected through a position/normal G-buffer. Locked to the camera
    the pack was baked from, and cheap enough for an old wall tablet.
  - `renderer: auto` prefers live 3D and falls back to a bake only where WebGL
    is unavailable.
- **Home Pack format v1** — `model.glb` plus `home.json` describing rooms,
  walls, openings, fixtures, cameras, occluders, cover profiles and variants,
  with a [JSON Schema](schemas/home-pack-1.schema.json) and a validator that
  also checks cross-references and wall facing.
- **Visual card editor** that generates its fields from the loaded pack, so a
  pack that adds a lamp gets an editor row for it without a code change.
- **DomoView Studio** — a browser authoring tool that turns a floor plan image
  and room photographs into a pack: scale calibration, wall and room tracing
  with snapping, openings with real sill and head heights, multi-bulb light
  fixtures, furniture, colour sampling from photos, a live 3D preview using the
  card's own renderer, and ZIP export. Runs entirely locally.
- **Per-room daylight** from cover positions, including measured non-linear
  blind profiles and tilted venetian slats.
- **Weather and moon**: rain and snow confined to surfaces marked outdoors, wet
  and snow-covered ground, and moonlight from date, time and place.
- **Room climate chips** bound to temperature and humidity entities, and
  window-open badges bound to contact sensors.
- Accessible overlays: light fixtures are focusable DOM buttons with labels in
  both renderers, rather than picked meshes.
- English and German card translations, following the Home Assistant user's own
  language setting.
- `examples/demo-apartment`, a fictional six-room apartment with a balcony,
  generated by `tools/pack/make-demo-pack.mjs`.
- A standalone card demo (`examples/demo.html`) and dev server that need no
  Home Assistant instance.
- Blender bake pipeline (`tools/bake/`) for producing baked pack assets.
- HACS packaging as a Dashboard plugin.

### Notes

- DomoView generalises a hand-built light map for a single apartment. None of
  that home's geometry or entity ids are in this repository; the example pack
  is invented.

[Unreleased]: https://github.com/tomjschr/DomoView/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/tomjschr/DomoView/releases/tag/v0.1.1
[0.1.0]: https://github.com/tomjschr/DomoView/releases/tag/v0.1.0
