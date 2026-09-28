# DomoView

**An interactive 3D floor plan for Home Assistant.** Your home as a live doll-house
view: lamps light the rooms they are actually in, the sun moves through the real
windows, and the blinds you close actually darken the room behind them.

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🇩🇪 [Deutsche Version dieser Anleitung](README.de.md)

---

## What makes it different

Most floor-plan cards are a picture with buttons on top. DomoView renders a real
3D model, and drives it from your entity states:

- **Lights are lights.** A `light.*` entity's brightness and colour drive an
  actual light source in the scene. Turn on the bedside lamp and the bedroom
  gets a warm pool of light — not a glowing dot on a bitmap.
- **The sun is where the sun is.** Azimuth and elevation come from `sun.sun`,
  and daylight enters through the windows you traced, at their real sill and
  head heights. Afternoon sun reaches the west rooms; it does not reach the
  north ones.
- **Blinds are geometry.** A `cover.*` at 40 % is a real surface that casts a
  real shadow. Venetian slats let a slice of light through when tilted.
- **Weather and moon.** Rain and snow fall on the surfaces you marked as
  outdoors. Moonlight is computed from date, time and place.

Everything home-specific lives in a **Home Pack** — a `model.glb` plus a
`home.json`. The card itself knows nothing about any particular home, so packs
can be shared, forked and improved by anyone.

## Getting started

### 1. Install the card

**Via HACS** (recommended)

1. HACS → ⋮ → **Custom repositories**
2. Add `https://github.com/tomjschr/interactive_floormap`, category **Dashboard**
3. Install **DomoView**, then reload your browser

**Manually**

1. Download `domoview.js` from the [latest release](https://github.com/tomjschr/interactive_floormap/releases)
2. Copy it to `/config/www/domoview/domoview.js`
3. Settings → Dashboards → ⋮ → **Resources** → add `/local/domoview/domoview.js`
   as a **JavaScript module**

### 2. Get a Home Pack

Try the example first — it needs no modelling at all:

```bash
# from the repository
cp -r examples/demo-apartment /config/www/domoview/homes/
```

Then add the card:

```yaml
type: custom:domoview-card
home: /local/domoview/homes/demo-apartment
```

Open the card's visual editor and map a few fixtures to your own entities. The
demo apartment is not your home, but it shows you exactly what the card does.

### 3. Build a pack for your own home

Open **[DomoView Studio](https://tomjschr.github.io/interactive_floormap/studio/)**
in a browser. Nothing is uploaded; it all runs locally.

```
  Floor plan image  ──┐
                      ├──▶  Studio  ──▶  model.glb + home.json  ──▶  the card
  Photos per room   ──┘
```

1. **Plan** — drop in a floor plan (PNG/JPG; export a PDF page as an image first)
2. **Scale** — click the two ends of something you know the length of, type the
   metres. Everything downstream is real-world accurate from here.
3. **Walls** — trace wall runs. Corners snap to each other; hold <kbd>Shift</kbd>
   to draw freely instead of on 15° increments.
4. **Rooms** — outline each room. Mark balconies and terraces as *outdoor*.
5. **Windows** — click on a wall. Set the sill and head heights from a photo or
   a tape measure; this is what decides where sunlight lands.
6. **Lights** — click where each lamp is, set its height.
   <kbd>Shift</kbd>-click adds another bulb to the same fixture, for a
   three-spot track or an LED strip.
7. **Furniture** — drag rectangles over the big pieces. They become geometry and
   they block sunlight.
8. **Photos** — attach photos per room and click them to sample wall and floor
   colours. Photos stay in the project file; only those you explicitly tick are
   written into an exported pack.
9. **Preview** — the card's own renderer, on your model. Scrub time of day and
   close the blinds before you ever touch Home Assistant.
10. **Export** — download a ZIP, unpack it into
    `/config/www/domoview/homes/<your-pack>/`.

The Studio also runs offline from your own install once DomoView is
installed: `/local/domoview/studio/index.html`.

## Configuration

Minimal:

```yaml
type: custom:domoview-card
home: /local/domoview/homes/my-flat
```

Everything else has a sensible default, and the visual editor generates its
fields from your pack — add a lamp to the pack and a row for it appears.

```yaml
type: custom:domoview-card
home: /local/domoview/homes/my-flat
renderer: auto          # auto | live3d | baked
quality: medium         # low | medium | high
camera: iso_sw          # a camera id from the pack
variant: base           # e.g. christmas, if the pack defines variants

entities:               # fixture id -> entity
  living_ceiling_spots: light.living_spots
  bedside_lamp_left: light.bedside_tom

covers:                 # opening id -> cover entity
  living_room_west: cover.living_blind_west

window_sensors:         # opening id -> contact sensor
  bedroom_east: binary_sensor.bedroom_window

rooms:                  # room id -> climate sensors
  bedroom:
    temperature: sensor.bedroom_temperature
    humidity: sensor.bedroom_humidity

weather_entity: weather.home
irradiance_entity: sensor.solar_radiation   # optional, beats a cloud estimate
```

Full reference: **[docs/configuration.md](docs/configuration.md)**

## Two renderers, one pack

| | `live3d` | `baked` |
|---|---|---|
| How | three.js renders the GLB every frame | pre-rendered images composited per state |
| Camera | orbit freely, multiple presets | locked to the camera it was baked from |
| Quality | good real-time PBR | as good as your offline renderer |
| Cost | needs WebGL, a GPU helps | cheap; fine on an old wall tablet |
| Setup | none | requires a Blender bake |

`renderer: auto` picks `live3d` and falls back to `baked` only where WebGL is
missing. Baking is optional and documented in
**[tools/bake/README.md](tools/bake/README.md)**.

## Sharing a pack

This is the point of the format. A pack is a folder anyone can drop into their
own install:

```
my-flat/
├── home.json     rooms, walls, windows, fixtures, cameras
├── model.glb     the geometry
├── baked/        optional pre-rendered assets
└── README.txt
```

`home.json` ships **no entity ids** — the person installing it maps their own.
If you publish a pack, please pick a license in the Studio (CC0 or CC BY are
both good choices) and consider that a floor plan says something about where
you live. See **[docs/sharing-packs.md](docs/sharing-packs.md)**.

## Documentation

| | |
|---|---|
| [Installation](docs/installation.md) | HACS, manual, upgrading |
| [Configuration](docs/configuration.md) | every card option |
| [Home Pack format](docs/home-pack-format.md) | the `home.json` reference |
| [GLB conventions](docs/glb-conventions.md) | node naming, bring your own model |
| [Authoring from photos](docs/authoring-from-photos.md) | getting real measurements out of a plan and a phone |
| [Baking a pack](tools/bake/README.md) | the Blender path |
| [Architecture](docs/architecture.md) | how the pieces fit, for contributors |
| [Troubleshooting](docs/troubleshooting.md) | when the home is black, or the sun is wrong |

## Contributing

Packs, bug reports and code are all welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md). Development setup:

```bash
npm install
npm run build        # dist/domoview.js and dist/studio/
npm test             # core maths, pack format, export pipeline
node tools/serve.mjs # http://127.0.0.1:8099 — card demo and Studio, no HA needed
```

## Credits

DomoView grew out of a hand-built light map for one apartment, generalised so
it works for any home. It bundles [three.js](https://threejs.org) (MIT) and a
handful of [Material Design Icons](https://pictogrammers.com/library/mdi/)
paths (Apache-2.0); see [NOTICE](NOTICE).

Not affiliated with the Home Assistant project.
