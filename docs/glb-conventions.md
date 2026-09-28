# GLB conventions

The Studio writes a model that follows these rules automatically. Read this if
you want to **bring your own model** — a Blender scene, a SketchUp export, a
LiDAR room scan — and annotate it instead of tracing a plan.

## The contract

| | |
|---|---|
| Format | glTF-Binary (`.glb`), glTF 2.0 |
| Up axis | `+Y` (the glTF convention), declared as `model.up: "Y"` |
| Units | metres, scale 1.0 |
| Origin | roughly the centre of the home's footprint |

The card rotates a Y-up model into pack space (+Z up) on load. If your model is
Z-up and you would rather not re-export it, set `model.up: "Z"` and no rotation
is applied — but then external glTF viewers will show it lying on its side,
which is why the Studio writes Y-up.

**Pack coordinates are what `home.json` uses.** So a lamp at `[-2.9, 2.6, 2.5]`
in `home.json` is 2.5 m above the floor, even though inside the GLB that same
point is stored as `[-2.9, 2.5, -2.6]`. Getting this backwards puts every lamp
on the floor; the Studio's 3D preview is the fastest way to catch it.

## Node names

The card finds things in your model by name. Prefix is what matters; the rest is
yours.

| Prefix | Purpose |
|---|---|
| `dv_light_<fixture-id>` | A light fixture's geometry. Its materials' emissive channel follows that fixture's state, so the lamp itself glows. **Must match the `node` field of the fixture in `home.json`.** |
| `dv_glass` | Window panes. Kept separate so they can use a transmissive material. |
| `dv_walls` | Wall geometry. |
| `dv_floor` | Floor slabs. |
| `dv_occluder_<name>` | Furniture and other solid bodies. |
| `dv_root` | The Y-up wrapper the Studio adds. Optional in your own model. |

Only `dv_light_*` is load-bearing. The others are conventions that make a model
readable and make future features possible; a model with one mesh called
`Scene` renders fine, it just cannot make its lamps glow.

Nothing breaks if you add nodes with other names. Everything in the GLB is
rendered.

## Materials

Standard glTF PBR (`pbrMetallicRoughness`) is what the live renderer expects.
Practical notes:

- **Emissive is reserved for lamps.** A fixture's state overwrites the emissive
  channel of every material under its node. Do not use emissive for decoration
  on a `dv_light_*` node; it will be replaced.
- **Double-sided walls.** Blender exports single-sided faces by default, which
  vanish when the camera orbits behind a wall. The card forces double-sided
  shadows, but enable backface rendering on wall materials for a clean result.
- **Textures are allowed but weigh a lot.** A pack is downloaded over a home
  network by a tablet. Untextured PBR with good colours reads better at
  doll-house scale than 4K textures and loads in a fraction of the time.
- **No ceilings, or a clipped camera.** A model with ceilings looks like a roof
  from above. Either leave them out, or set `cameras[].clip.above` to cut them
  away.

## Bringing a room scan

A LiDAR scan from Polycam, Scaniverse or similar gives you geometry that a
traced plan never will. It also gives you a single soup mesh with no rooms, no
windows and no lamps.

That is workable, because `home.json` carries all of that separately:

1. **Export the scan as GLB** and check the scale. Scanning apps are usually
   metric and correct; verify against a doorway, which is almost always
   0.80–0.90 m wide.
2. **Orient it** so up is +Y and the footprint is roughly centred on the
   origin.
3. **Write the manifest by hand or in the Studio.** Trace the room polygons,
   walls and openings over your floor plan as usual, but point `model.url` at
   the scan instead of exporting geometry. The plan data does not have to
   produce the visible walls — it exists so the renderer knows where rooms are
   and where light enters.
4. **Add `dv_light_*` nodes** for the lamps, or leave `node` unset on the
   fixtures and rely on `emitters` alone. Without a node the lamp lights the
   room but its own body does not glow.
5. **Validate**: `node tools/pack/validate.mjs path/to/pack`.

The mismatch to watch for: if your traced walls do not line up with the scanned
geometry, sun patches land in the wrong place. Use the Studio's 3D preview with
the scan loaded to check the two agree before you bind a single entity.

## Checklist before publishing a model

- [ ] `npx gltf-validator model.glb` reports no errors (or the
      [online validator](https://github.khronos.org/glTF-Validator/) does)
- [ ] Doorways measure 0.80–0.90 m in the Studio preview
- [ ] Lamp heights look right in the preview, not on the floor
- [ ] `model.bounds` in `home.json` actually contains the geometry
- [ ] Every `node` named in `home.json` exists in the GLB — `validate.mjs`
      does not check this, but `test/pipeline.test.js` shows how to
- [ ] File size is sane. The example apartment is 180 kB; if yours is 80 MB,
      decimate it before asking a tablet to load it.
