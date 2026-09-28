# Home Pack format

A Home Pack is a folder. It holds the geometry of one home and everything the
card needs to drive it, and it holds **no entity ids** — the person installing
it maps their own. That separation is what makes packs shareable.

```
my-flat/
├── home.json               the manifest (this document)
├── model.glb               geometry, glTF-Binary
├── baked/                  optional pre-rendered assets
│   ├── day.png
│   ├── night.png
│   ├── position.png        world-position G-buffer
│   ├── normal.png          normal G-buffer
│   ├── exterior-mask.png
│   ├── window-mask.png
│   └── lights/<fixture>.png
├── photos/                 optional reference photos
└── README.txt
```

The authoritative definition is
[`schemas/home-pack-1.schema.json`](../../schemas/home-pack-1.schema.json).
Validate a pack with:

```bash
node tools/pack/validate.mjs path/to/my-flat
```

That checks the schema **and** the things a schema cannot express:
cross-references, openings that overrun their wall, and exterior walls facing
the wrong way.

## Conventions that apply throughout

- **Units are metres.** Always. There is no unit field to get wrong.
- **Coordinates are +X east, +Y north, +Z up**, in the pack's own frame. The
  pack does not have to be north-aligned; `pack.north` records the offset.
- **2D points are `[x, y]`**, 3D are `[x, y, z]`, colours are sRGB `[r, g, b]`
  in 0–255.
- **Ids match `^[a-z0-9][a-z0-9_-]*$`** and are referenced from the card
  config, so changing one breaks an installed dashboard. Treat them as API.
- **Omit anything derivable.** Every field below with a default can be left
  out; the loader fills it in.

---

## `pack`

```json
{
  "pack": {
    "schema": 1,
    "id": "my-flat",
    "name": "My Flat",
    "version": "1.2.0",
    "author": "Your name",
    "license": "CC-BY-4.0",
    "description": "Two-bedroom flat, west-facing balcony.",
    "north": -12,
    "createdWith": "domoview-studio 0.1.0"
  }
}
```

| Field | Notes |
|---|---|
| `schema` | Must be `1`. The card refuses a version it does not know rather than half-reading it. |
| `id` | Also the folder name. Hyphens are preserved deliberately. |
| `north` | Degrees to rotate from the pack's +Y to geographic north. `0` means +Y *is* north. Solar and lunar azimuths are corrected by this, so a pack traced from a plan that is not north-up still gets the sun right. |
| `license` | SPDX id. Matters if you share the pack. |

**Getting `north` right is worth the trouble.** It is the difference between
afternoon sun in the living room and afternoon sun in the bedroom. Find your
building on a map, note which way the plan's "up" direction actually points,
and enter the offset.

---

## `model`

```json
{
  "model": {
    "url": "model.glb",
    "up": "Y",
    "bounds": { "min": [-6.5, -4, -0.25], "max": [6.5, 4, 2.7] },
    "exposure": 1,
    "environment": {
      "skyIntensity": 1,
      "groundColor": [165, 130, 91],
      "nightAmbient": 0.04
    }
  }
}
```

| Field | Notes |
|---|---|
| `url` | Relative to `home.json`, or absolute. **Optional** for a baked-only pack: a pack migrated from a purely image-based card has no GLB, and renders in `baked` mode alone. One of `model.url` or `baked` must be present. |
| `up` | `Y` for a conventional glTF (what the Studio writes, and what external viewers expect); `Z` if the model was exported without the conversion. The card rotates a Y-up model into pack space on load. |
| `bounds` | Frames the cameras, and decodes the baked position G-buffer. Derived from the plan data if absent, but a bake **requires** it: the G-buffer packs world positions into 8 bits per axis across exactly this box. |
| `exposure` | Tone-mapping multiplier for the live renderer. |

See [GLB conventions](glb-conventions.md) for node naming and for bringing your
own model.

---

## `cameras`

```json
{
  "cameras": [
    {
      "id": "iso_sw",
      "name": "From the south-west",
      "type": "orthographic",
      "azimuth": 225,
      "elevation": 42,
      "zoom": 1,
      "target": [0, 0, 1.2],
      "clip": { "above": 1.4 },
      "default": true
    }
  ]
}
```

`azimuth` is degrees clockwise from the pack's +Y; `elevation` is degrees above
the horizon, where 90 looks straight down. `clip.above` hides geometry above
that height, which is how you get a doll-house cut-away from a model that has a
ceiling.

The card offers a picker when a pack defines more than one camera. The baked
renderer ignores all of this and uses `baked.camera`.

---

## `levels`

```json
{ "levels": [{ "id": "ground", "name": "Ground floor", "elevation": 0, "height": 2.55 }] }
```

Single-storey packs can omit this; one level named `ground` at elevation 0 is
assumed. Rooms, walls and openings reference a level, and an opening's `sill`
and `head` are measured from its level's floor.

---

## `rooms`

```json
{
  "rooms": [
    {
      "id": "living_dining",
      "name": "Living & Dining",
      "level": "ground",
      "polygon": [[-4.5, 4], [1, 4], [1, -1.2], [-4.5, -1.2]],
      "label": [-1.8, 1.4],
      "outdoor": false
    }
  ]
}
```

`polygon` is the floor outline; winding is normalised on load, so either
direction works. It does real work:

- a window only lights the rooms it lists, tested against these polygons
- closing the blinds dims **this** room and not the one next door
- the climate chip anchors at `label`, or at the centroid if absent

`outdoor: true` marks balconies and terraces. Those are lit by the open sky
rather than through openings, they are never dimmed by covers, and they are
where rain and snow land.

---

## `walls`

```json
{
  "walls": [
    { "id": "w1", "a": [-6.5, 4], "b": [6.5, 4], "thickness": 0.26,
      "height": 2.55, "exterior": true, "flip": false }
  ]
}
```

A wall's **outward normal** is `[tangent.y, -tangent.x]`, or its negation when
`flip` is true. Which side is "out" decides where daylight comes from, so this
is the field most worth checking. `validate.mjs` warns about exterior walls
whose normal points at the middle of the home, and the Studio draws the normal
as a small arrow on every exterior wall.

Walls are optional for a pack whose GLB already contains final geometry — but
openings need a wall to sit in, so a pack without walls has no daylight.

---

## `openings`

```json
{
  "openings": [
    {
      "id": "living_room_west",
      "type": "window",
      "name": "Living room west",
      "wall": "w4",
      "offset": 6.5,
      "width": 1.5,
      "sill": 0.9,
      "head": 2.3,
      "rooms": ["living_dining"],
      "mullion": null,
      "glass": { "min": [-4.52, 1.73, 0.9], "max": [-4.48, 3.27, 2.3] },
      "cover": { "profile": "venetian", "inFront": false }
    }
  ]
}
```

| Field | Notes |
|---|---|
| `type` | `window`, `glass_door`, `door` or `skylight`. A plain `door` admits no daylight. |
| `offset` | Distance along the wall from its point `a` to the opening's **centre**, in metres. |
| `sill`, `head` | Lower and upper edge above the level's floor. These two numbers decide where a sun patch lands on the floor; measuring them is the highest-value few minutes in the whole process. |
| `rooms` | Which rooms this opening lights. Usually one. |
| `mullion` | Distance from the opening's own centre to a vertical post that blocks light. `null` for none. |
| `glass` | Bounds of the visible pane. Only used by the baked renderer, to keep rain and snow on actual glass. |
| `cover.profile` | Key into `coverProfiles`. Omitting `cover` entirely means this window has no blind and can never be dimmed. |
| `cover.inFront` | True when the blind is drawn *in front of* the pane from the pack's camera — typical for a window seen from outside the building. |

---

## `coverProfiles`

Controllers rarely map position linearly onto how much glass is actually clear.
A profile records the real curve, as *fraction of the opening height that is
clear* against reported position.

```json
{
  "coverProfiles": {
    "my_venetian": {
      "name": "Bedroom venetian",
      "stops": [[0, 0.02], [20, 0.04], [40, 0.12], [50, 0.27],
                [60, 0.34], [70, 0.40], [80, 0.49], [100, 1]],
      "slats": {
        "spacing": 0.064,
        "maxAperture": 0.32,
        "closedStops": [[0, 0], [10, 0.08], [20, 0.16], [21, 0]]
      }
    }
  }
}
```

Three profiles are built in and need no declaration: `linear`, `venetian` and
`roller`.

**How to measure your own:** set the cover to 10 %, measure from the sill to
the bottom edge of the blind, divide by the total opening height. Repeat every
10 %. Ten numbers, and the room finally darkens when it should.
[Please contribute them](../CONTRIBUTING.md) — anyone with the same hardware
benefits.

`slats.closedStops` covers controllers that leak light over the first few
percent of travel without reporting a tilt channel. `maxAperture` is the
fraction of the slat pitch that opens at full tilt.

---

## `fixtures`

Everything the card can bind to an entity.

```json
{
  "fixtures": [
    {
      "id": "living_ceiling_spots",
      "name": "Living ceiling spots",
      "kind": "light",
      "room": "living_dining",
      "node": "dv_light_living_ceiling_spots",
      "emitters": [
        { "position": [-2.9, 2.6, 2.5], "type": "spot", "angle": 45, "target": [-2.9, 2.6, 0] },
        { "position": [-1.6, 1.7, 2.5], "type": "spot", "angle": 45, "target": [-1.6, 1.7, 0] }
      ],
      "light": { "color": [255, 240, 212], "lumens": 1400, "range": 7, "shadow": true },
      "dimmable": true,
      "render": { "bulb": "glow", "emissiveNodes": ["dv_light_living_ceiling_spots"] }
    }
  ]
}
```

| Field | Notes |
|---|---|
| `kind` | `light`, `media`, `cover`, `sensor`, `appliance`, `vacuum`, `speaker`, `marker`. Decides which entity domains the editor offers and how the state is drawn. |
| `emitters` | One entry per bulb. A three-spot track is **one** fixture with three emitters, because that is how it switches. |
| `emitters[].type` | `point`, `spot`, `strip`, `area`, `emissive`. `emissive` glows but casts no light — right for a TV screen. |
| `light.lumens` | Total output, split across the emitters by `intensity`. This is the dial to turn when a room looks too bright or too dim. |
| `light.range` | Falloff distance. Keep it near the room size; a huge range leaks light through walls in the live renderer. |
| `light.shadow` | Real-time shadow map. Costly — reserve it for one or two hero fixtures. |
| `screen` | `[x, y]` as a percentage of the baked image, for the marker position. Written by the bake tool; the live renderer projects the node instead. |
| `variant` | Present only when that variant is active. |

---

## `occluders` and `shadowCasters`

```json
{
  "occluders": [
    { "name": "sofa", "min": [-5.17, -2.78, 0], "max": [-3.37, 0.24, 0.87] }
  ],
  "shadowCasters": [
    { "id": "rail_west", "a": [-6.5, -3], "b": [-6.5, 2],
      "heights": [0.42, 0.72, 1.02], "topHeight": 1.05,
      "postSpacing": 0.62, "postRadius": 0.022 }
  ]
}
```

Both exist for the **baked** renderer, which has no geometry to trace against
and needs the shading described analytically. The live renderer ignores them
because the furniture in the GLB already casts shadows.

`occluders` are axis-aligned boxes. `shadowCasters` are horizontal rails with
vertical posts, which is what a balcony railing is; modelling one as a box
would shade the whole deck.

---

## `variants`

```json
{
  "variants": [
    { "id": "christmas", "name": "Christmas", "model": "model-christmas.glb", "baked": "baked-christmas" }
  ]
}
```

A seasonal dressing, selectable with `variant:` in the card config. Fixtures
tagged with that variant appear only when it is active, so the tree's lights
are bindable in December and gone in March. Omit `model` to reuse the base
geometry and only add fixtures.

---

## `baked`

Only needed for `renderer: baked`. See [Baking a pack](../tools/bake/README.md)
for how these images are produced and what each one has to contain.

```json
{
  "baked": {
    "size": 2048,
    "camera": "iso_sw",
    "day": "baked/day.png",
    "night": "baked/night.png",
    "gbuffer": { "position": "baked/position.png", "normal": "baked/normal.png" },
    "masks": { "exterior": "baked/exterior-mask.png", "glass": "baked/window-mask.png" },
    "lights": { "living_ceiling_spots": "baked/lights/living_ceiling_spots.png" },
    "surfaces": { "wet": [{ "id": "balcony", "polygon": [[-6.5, -3]], "height": 0 }] }
  }
}
```

The interesting one is `gbuffer`. `position.png` stores each pixel's world
position packed into RGB across `model.bounds`, and `normal.png` its normal.
With those two images the card can ask, per pixel, whether a ray from that
surface reaches the sky through an opening — so the sun moves through the home
at runtime without ever re-rendering the geometry.

---

## `bindings`

```json
{ "bindings": {} }
```

Suggested default entity mapping. **Leave it empty in a shared pack.** It
exists for the case where you keep a pack alongside a known Home Assistant
configuration and want it pre-wired.

---

## Versioning

`pack.schema` is a compatibility promise. A card release reads every schema
version it has ever supported, so a pack published today keeps working. If you
need a field the format does not have, open an issue rather than adding one
locally: a pack with an unknown field fails validation, and additive changes to
the schema are cheap to make properly.
