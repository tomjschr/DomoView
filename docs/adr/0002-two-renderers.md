# ADR 0002: Ship both a live WebGL renderer and a baked compositor

- **Status:** accepted
- **Date:** 2026-09-28

## Context

The predecessor project rendered nothing at runtime. It shipped a 2048 px day
render, a night render, one light-delta image per lamp, and a world-position
plus normal G-buffer. The card blended those in linear light and projected the
sun through the G-buffer per pixel. It looked genuinely good — offline
path-traced quality on a wall tablet — and it cost about 15 MB of assets per
home, locked the camera to the angle it was baked from, and needed Blender plus
a render per lamp for every change.

The requirement for DomoView was that a GLB produced from a floor plan *is* the
3D floor plan. That points at live rendering: the model is the source of truth,
there is no bake step, and the camera can move.

But throwing the baked path away would have meant discarding working, proven
code and regressing on the one axis where it wins: a five-year-old wall tablet
rendering a beautiful static scene for free.

Options:

1. **Live only.** One code path, no Blender anywhere, GLB is unambiguously the
   truth. Quality capped by real-time PBR; old hardware may struggle.
2. **Baked only.** Keep the existing quality. But the GLB is never shown, every
   user needs Blender, and the camera cannot move — which contradicts the goal.
3. **Both, over one pack format.**

## Decision

Both renderers, presenting the same interface to the card, consuming the same
Home Pack.

`live3d` is the default and the primary path: three.js renders the pack's GLB,
Home Assistant states drive real lights, blinds are real geometry casting real
shadows. `baked` is optional and requires `baked.*` assets in the pack.

`renderer: auto` prefers `live3d` and falls back to `baked` only where WebGL is
unavailable — not by guessing at device performance, which is unreliable.

## Consequences

**Good.** Most users never bake anything. Someone who wants maximum fidelity or
has weak hardware has a supported route. Because both read the same pack, a
pack gains baked assets without any change to its manifest structure. Keeping
the baked renderer also kept its better ideas: linear-light compositing,
per-room daylight factors, and the G-buffer trick for runtime sun.

**Costs.** Two render paths to maintain and to reason about, and a shared
interface (`apply`, `fixtureScreen`, `roomScreen`, `openingScreen`) that both
must honour. Some pack fields exist only for the baked path — `occluders`,
`shadowCasters`, `baked.masks`, `fixtures[].screen` — which is a wart in the
format: a live-only pack carries fields it never uses. Features can land in one
renderer and not the other, and that asymmetry will need policing.

The baked path also makes the Blender tool a supported surface, and Blender's
Python API changes between releases.

**If it becomes a burden**, the honest move is to deprecate `baked` rather than
let it rot half-maintained. It earns its place only while it is genuinely better
on hardware people actually use.
