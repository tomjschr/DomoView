# DomoView

An interactive 3D floor plan for Home Assistant. Your home as a live doll-house
view, driven by your entity states.

![How DomoView fits together: a floor plan and room photos become a Home Pack in the Studio, which the card renders either live in WebGL or from baked images.](https://raw.githubusercontent.com/tomjschr/DomoView/main/docs/images/pipeline.svg)

- **Lights are lights.** Brightness and colour from a `light.*` entity drive a
  real light source in the scene.
- **The sun is where the sun is.** Daylight enters through the windows you
  traced, at their real sill and head heights, from `sun.sun`.
- **Blinds are geometry.** A `cover.*` at 40 % casts a real shadow.
- **Weather and moon** are rendered from your weather entity and your location.

Everything home-specific lives in a **Home Pack** (`model.glb` + `home.json`),
so packs can be shared and improved by anyone.

## After installing

1. Reload your browser.
2. Copy a Home Pack into `/config/www/domoview/homes/`. The repository ships a
   fictional `demo-apartment` you can use straight away.
3. Add the card:

```yaml
type: custom:domoview-card
home: /local/domoview/homes/demo-apartment
```

4. Open the card's visual editor and map each fixture to one of your entities.

## Build a pack for your own home

Open **DomoView Studio** — either the hosted copy at
<https://tomjschr.github.io/DomoView/studio/> or, offline, the one
this installation now contains at `/local/domoview/studio/index.html`.

Drop in a floor plan image, calibrate the scale by clicking two points a known
distance apart, then trace walls, rooms, windows and lamps. Preview it with the
card's own renderer and export a ZIP to unpack into
`/config/www/domoview/homes/`.

Nothing is uploaded anywhere; the Studio runs entirely in your browser.

## Links

- [Documentation](https://github.com/tomjschr/DomoView#documentation)
- [Configuration reference](https://github.com/tomjschr/DomoView/blob/main/docs/configuration.md)
- [Troubleshooting](https://github.com/tomjschr/DomoView/blob/main/docs/troubleshooting.md)
