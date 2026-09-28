# Demo Apartment

A **fictional** six-room apartment with a west-facing balcony, used to
demonstrate DomoView and to test the renderers. It does not depict any real
dwelling.

License: **CC0-1.0** — do anything you like with it.

```
11.0 m × 8.0 m, single storey, 2.55 m ceiling

           ┌──────────────┬──────────────────┐
           │              │     Kitchen      │
           │              │                  │
   Balcony │   Living &   ├────────┬─────────┤
    (out)  │   Dining     │Corridor│ Bathroom│
           │              ├────────┴─────────┤
           │              │                  │
           ├──────────────┤     Bedroom      │
           │    Study     │                  │
           └──────────────┴──────────────────┘
                            north is up
```

| | |
|---|---|
| Rooms | 7, one of them outdoors |
| Windows | 8 (plus a balcony door), 5 with blinds |
| Doors | 5 |
| Light fixtures | 14, several with multiple bulbs |
| Furniture | 13 pieces, all of which block sunlight |
| Model | ~180 kB, ~3,900 triangles |

## Try it

In Home Assistant, copy this folder to
`/config/www/domoview/homes/demo-apartment/` and add:

```yaml
type: custom:domoview-card
home: /local/domoview/homes/demo-apartment
```

Without Home Assistant, from a checkout of this repository:

```bash
npm install && npm run build
node tools/serve.mjs
```

then open <http://127.0.0.1:8099/examples/demo.html>. The demo page binds every
fixture to a synthetic light entity, so the switches, the blinds and the time
of day all work.

## What it is useful for

- **Seeing what the card does** before spending an evening modelling
- **Checking your install** — if this renders, the card and the resource are
  fine and the problem is your pack
- **Testing a renderer change.** It deliberately contains the awkward cases: an
  outdoor room with a railing that casts bar shadows, a window with no blind
  (the bathroom), an `emissive` fixture that glows without lighting the room
  (the TV), a strip fixture with three emitters, a room with no exterior wall
  (the corridor), and spot fixtures that cast real shadows.

## How it was made

Generated, not traced:

```bash
npm run demo
```

`tools/pack/make-demo-pack.mjs` describes the apartment in metres and then runs
**the Studio's own exporter** under a small DOM shim. So regenerating it also
tests the authoring pipeline, and `test/pipeline.test.js` asserts that
rebuilding from `project.domoview.json` reproduces `home.json` byte for byte.

## Files

| | |
|---|---|
| `home.json` | the manifest — rooms, walls, openings, fixtures, cameras, occluders |
| `model.glb` | the geometry, Y-up glTF-Binary |
| `project.domoview.json` | the Studio project, so you can open and edit it |

There are no baked assets: this pack renders in `live3d` only. To try the baked
renderer, bake it — see [tools/bake/README.md](../../tools/bake/README.md).

## Editing it

Open <https://tomjschr.github.io/DomoView/studio/>, use
**Open…** and pick `project.domoview.json`. Change what you like and export.
It is a reasonable starting point if your own home is a similar shape — and
forking a pack is much faster than tracing one.
