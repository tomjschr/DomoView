# ADR 0001: A Home Pack is the only interface between card and home

- **Status:** accepted
- **Date:** 2026-09-28

## Context

DomoView started as a card written for one apartment. Window positions, room
polygons, the device list, furniture bounding boxes and the camera basis were
constants in the JavaScript. Several lamps had behaviour selected by string
match on their id — one fixture was excluded from the bulb overlay because its
geometry already glowed, another was scaled down because it was a fragrance
lamp.

The result rendered that flat convincingly and could not render anyone else's
at all. Adopting it meant editing source.

We wanted a project other people could use and extend, which meant the
home-specific data had to move out of the code. The options were:

1. **Keep the data in code, one module per home.** No format to design; every
   user forks the repository and a card update means a merge conflict. Packs
   cannot be shared as data.
2. **Derive everything from the GLB at runtime.** Elegant in principle, but a
   GLB has no concept of a room, a window's sill height or which entity domain
   a fixture accepts. It would mean encoding all of that in node names, which
   is a worse format with no schema.
3. **A declarative manifest beside the model.** A format to design, document
   and version, but the data becomes a shareable artefact.

## Decision

A **Home Pack** — `model.glb` plus `home.json` — is the only interface between
the card and a particular home. `src/` may not contain knowledge of any
specific home; if something cannot be expressed in the format, the format gains
a field.

The manifest carries what geometry cannot: room polygons, opening sill and head
heights, which rooms an opening lights, fixture-to-emitter structure, allowed
entity domains, cover response curves, cameras, and occluders for the baked
renderer. It carries **no entity ids**, so a pack is installable by anyone.

The format is versioned by `pack.schema`, independently of the card version. A
card reads every schema version it has ever supported.

## Consequences

**Good.** Packs are shareable, forkable and reviewable. The visual editor
generates itself from the pack, so a pack that adds a lamp gets an editor row
for free. Both renderers consume the same pack, which is what made a second
renderer affordable. `normalisePack` is a single seam where defaults are
applied, so no downstream code asks whether a field was present.

**Costs.** There is now a format to design, document, validate and keep
compatible — a JSON Schema, a reference document and a validator, none of which
existed before. A schema bump is a promise to every published pack, so adding a
field carelessly is expensive. And a user must obtain or author a pack before
the card shows anything, which is a real barrier; it is the reason the Studio
(ADR 0003) and the example pack exist.

**Rejected alternative worth revisiting:** encoding more in the GLB. If glTF
extensions for rooms and openings ever become conventional, some of the
manifest could move into the model. Today it would just be node-name
conventions without a schema.
