# ADR 0003: Author packs in a browser tool, not a CLI

- **Status:** accepted
- **Date:** 2026-09-28

## Context

A Home Pack (ADR 0001) is only worth having if people can produce one. The
input people actually have is a floor plan image and a phone full of room
photos.

Fully automatic reconstruction from photographs was considered and rejected as
dishonest for this project: photogrammetry of a furnished interior needs
careful capture, produces a mesh with no notion of rooms or windows, and would
fail unpredictably for most users. Where someone *has* a good LiDAR scan, the
right answer is to let them bring it and annotate it — which the pack format
already allows, because geometry and annotation are separate.

So the tool's job is assisted authoring: calibrate a plan, trace it, place
things, export. The options for where that lives:

1. **Python/Blender CLI.** Powerful, scriptable, and a natural fit for the bake
   pipeline. But it requires installing Blender and Python, and authoring means
   editing a YAML description with no visual feedback. For a project whose
   value depends on non-programmers contributing packs, the barrier is fatal.
2. **A Home Assistant panel/integration.** Lives where the user already is. But
   it makes the project an integration rather than a card, ties authoring to a
   Home Assistant restart cycle, and puts a canvas editor inside a dashboard
   iframe.
3. **A static browser app.** Zero installation, works from GitHub Pages and
   from the user's own `/local/`, and can run the card's real renderer for
   preview.

## Decision

**DomoView Studio** is a static, dependency-light browser application in the
same repository. It is served from GitHub Pages and also shipped inside the
card's `dist/`, so it works offline from `/local/domoview/studio/index.html`.

It imports the same `src/core` as the card, and its 3D preview builds the GLB
in memory and renders it through the card's own `LiveRenderer`. There is one
implementation of the pack format and one renderer, not a second approximation
inside a tool.

Everything stays in the browser. Nothing is uploaded — the Studio handles floor
plans and photographs of real homes, and "no network requests" is a much
stronger promise than a privacy policy.

The Blender path is kept for **baking** only (ADR 0002), which is genuinely a
render-farm job and not authoring.

## Consequences

**Good.** No installation, so someone can try it from a link. The preview uses
the production render path, so errors in sill heights and wall facing surface
before any file is copied to `/config/www`. Reusing `src/core` means the
exporter cannot drift from the loader, and the demo-pack generator runs the
Studio's own exporter headlessly under a small DOM shim — so generating the
example also tests the authoring pipeline.

**Costs.** A canvas editor is a lot of code to own: viewport, snapping, tools,
undo, an inspector. Browser limits are real — `localStorage` autosave overflows
on a project with many photos, which is handled but is a rough edge, and
project files carry base64 images so they are large. Texture export is
impossible headlessly, so the Node path produces untextured geometry.

We also deliberately skipped PDF support, since bundling a PDF renderer would
roughly double the app for a step the user can do in any viewer.

**No framework** was used, to keep the code readable for drive-by contributors.
That is a bet: if the Studio grows much beyond its current scope, the hand-
rolled DOM helpers in `studio/src/ui.js` will start costing more than a small
framework would.
