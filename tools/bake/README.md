# Baking a Home Pack

> **Status: least-tested part of this repository.** `bake.py` was written
> against the Blender 4.x Python API and reviewed carefully, but it has not been
> executed end to end in CI — Blender is a 300 MB dependency that CI does not
> install, and the author's development machine had no Blender available.
> Expect to need small fixes, and please open a PR with them. The card, the
> Studio, the pack format and the live renderer are all covered by
> `npm test`; this is the one piece that is not.
>
> If you only want DomoView working, **you do not need this page.** The live
> renderer needs no bake.

---

## Why bake at all

The baked renderer composites pre-rendered images instead of rasterising the
GLB every frame. Two reasons to want it:

- **Old hardware.** A wall tablet that cannot hold 30 fps in WebGL shows a
  baked scene for almost nothing.
- **Fidelity.** Cycles with 256 samples does things real-time PBR does not:
  proper indirect bounce, soft area shadows, believable glass.

The costs: a fixed camera, a Blender toolchain, roughly 10–20 MB of images per
home, and a re-bake whenever geometry changes.

## What gets produced

```
baked/
├── day.png              full daylight, lamps off
├── night.png            lamps off, faint ambient
├── lights/<id>.png      each fixture's contribution, alone in the dark
├── position.png         world position packed into RGB across model.bounds
├── normal.png           world normal, packed
├── exterior-mask.png    white where the camera sees the outside of the building
└── window-mask.png      white on visible glass
```

and a `baked` section written back into `home.json`, plus a `screen` coordinate
on each fixture so the card can place its markers without projecting anything.

### The idea worth understanding

Each fixture is rendered **alone with no world lighting**, so the image is the
light it *adds*, not a lit scene. The card decodes those to linear, multiplies
by the entity's brightness, sums them and encodes back once. That is why:

- two lamps at 50 % look exactly like one at 100 %
- a fixture dims smoothly with no extra renders
- an RGB bulb can change colour without a re-bake — the reference colour is in
  the manifest and gets divided out at runtime

It also means the tone mapping must stay **Standard**. Filmic or AgX remap
highlights non-linearly and the addition stops being valid; `bake.py` sets this
and you should not change it.

### The G-buffer

`position.png` stores each pixel's world position packed into 8 bits per axis
across exactly `model.bounds`; `normal.png` stores its normal. With those two
images the card can ask, per pixel, whether a ray from that surface reaches the
sky through one of the pack's openings — so the sun and moon move through the
home at runtime with no re-render.

**`model.bounds` must be present and correct**, or the decode is wrong and sun
patches land in the wrong place. `bake.py` refuses to run without it.

Eight bits across a 13 m span is about 5 cm per step. That is coarser than the
edge of a lowered blind, which is why the runtime projection only trusts
upward-facing surfaces — floors and the tops of furniture. Vertical walls
speckle, and the original implementation this is derived from learned that the
hard way.

---

## Requirements

- **Blender 4.2 LTS or newer**, on your `PATH` as `blender`
- A GPU helps a lot. 40 fixtures at 2048 px and 256 samples is 43 renders.
- `numpy`, which ships inside Blender

## Running it

```bash
blender --background --python tools/bake/bake.py -- \
    --pack /path/to/my-pack
```

Options:

| Flag | Default | Meaning |
|---|---|---|
| `--pack` | *required* | Folder containing `home.json` |
| `--size` | `2048` | Square edge length. Try `1024` first. |
| `--samples` | `256` | Cycles samples. `64` for a test bake. |
| `--only` | all | Comma-separated subset: `day,night,lights,masks,gbuffer` |
| `--device` | `GPU` | `CPU` to force it |

Everything after `--` goes to the script; Blender consumes what comes before.

### Suggested first run

Prove the pipeline cheaply before committing an hour of render time:

```bash
blender --background --python tools/bake/bake.py -- \
    --pack examples/demo-apartment --size 512 --samples 32
node tools/pack/validate.mjs examples/demo-apartment
```

Then look at it:

```bash
node tools/serve.mjs
```

and set `renderer: baked` in `examples/demo.html`.

### Re-baking one thing

Changed a lamp's colour or lumens? Just its pass:

```bash
blender --background --python tools/bake/bake.py -- --pack my-pack --only lights
```

Geometry changed? Everything, including the G-buffer and the masks.

---

## Bringing your own Blender scene

`bake.py` imports the pack's GLB. If you have a properly dressed Blender scene
with real materials, better geometry and furniture you actually modelled, you
will get a much better result by baking that instead.

What the card requires of the images, whatever produced them:

1. **One camera for all of them.** Orthographic, and matching the pack's camera
   definition. `bake.py` sets `ortho_scale = max(span_x, span_y) × 1.13 / zoom`;
   that `1.13` must equal `FRAME_MARGIN` in
   `src/renderers/baked/projection.js`, or every blind, weather effect and
   marker the card draws over the bake lands in the wrong place.
2. **Square, identical resolution**, matching `baked.size`.
3. **Transparent background.** The card composites the home onto the dashboard.
4. **Linear-additive light passes**, as described above. Standard view
   transform, exposure 0, gamma 1.
5. **A G-buffer encoded across `model.bounds`**, non-colour, 8-bit.
6. **Masks as white-on-black**, non-colour. The card cuts everything below
   value 100 to transparent, because a render's black backdrop is never exactly
   zero and using it directly leaves a veil across every wall.

Then write the `baked` section of `home.json` yourself and validate it.

---

## Known rough edges

Places a first real run is most likely to need a fix:

- **EXR channel order.** `render_gbuffer` locates the position and normal
  channels by assuming Blender's multilayer layout. It prints the channel names
  it found; if position and normal come out swapped or shifted, that is the
  place to look.
- **Light energy.** The lumens-to-watts conversion is a flat `/120`. It gives
  consistent relative brightness across a pack, which is what matters, but the
  absolute level may want an offset for your scene.
- **Exterior mask on interior walls.** The mask marks any surface facing away
  from the home's centre, which catches the outward face of interior walls too.
  Harmless — those pixels are behind other geometry from the bake camera — but
  a pack with an unusual plan might see it.
- **Glass detection.** `render_window_mask` matches on the name `dv_glass`. A
  model that names its panes otherwise needs that adjusted.

If you get it working, a note in an issue about which Blender version and what
you had to change would help the next person more than almost anything else in
this repository.
