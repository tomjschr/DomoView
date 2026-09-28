# Card configuration

Every option except `home` is optional, and the visual editor covers all of
them. This page is the reference for people who prefer YAML.

```yaml
type: custom:domoview-card
home: /local/domoview/homes/my-flat
```

---

## Pack and rendering

| Option | Type | Default | Meaning |
|---|---|---|---|
| `home` | string | *required* | Folder containing `home.json`, or the URL of the file itself. |
| `renderer` | `auto` \| `live3d` \| `baked` | `auto` | `auto` prefers live 3D and falls back to a bake only where WebGL is missing. |
| `quality` | `low` \| `medium` \| `high` | `medium` | Real-time light budget, shadow maps, pixel ratio and particle count. See the table below. |
| `camera` | string | pack default | A camera id from the pack. Ignored by the baked renderer, which is locked to the camera it was baked from. |
| `variant` | string | `base` | A variant id from the pack, e.g. `christmas`. |
| `aspect` | number | derived | Width ÷ height of the card. By default DomoView measures how the pack projects under its camera and shapes the card to fit, so no band of empty background is left over. |
| `interactive` | boolean | `true` | Allow orbit and zoom. Set `false` for a kiosk dashboard. |
| `show_climate` | boolean | `true` | Room temperature and humidity chips. |
| `show_weather` | boolean | `true` | Rain, snow, wet and snow-covered ground. |
| `cache_bust` | string | — | Appended to asset URLs as `?v=…`. Useful after replacing a pack in place, since browsers cache `/local/` aggressively. |

### Quality tiers

| | `low` | `medium` | `high` |
|---|---|---|---|
| Simultaneous point lights | 6 | 12 | 20 |
| Simultaneous spot lights | 2 | 3 | 4 |
| Shadows | off | on | on, soft |
| Shadow map | — | 1024 | 2048 |
| Device pixel ratio cap | 1 | 1.5 | 2 |
| Weather particles | 0 | 900 | 1800 |

Lights are **pooled**, not created on demand: adding or removing a light in
three.js recompiles every material's shader, which shows up as a visible stall
each time someone flips a switch. When more fixtures are on than the tier
allows, the brightest win a real light slot and the rest still glow — their own
geometry lights up, they just do not cast into the room.

If a wall tablet struggles, try `quality: low` before `renderer: baked`.

---

## Binding entities

### Lights and screens

```yaml
entities:
  living_ceiling_spots: light.living_spots
  dining_pendant: light.dining
  bedside_lamp_left: switch.bedside_socket    # on/off only, no dimmer
  living_tv: media_player.living_room_tv
```

Keys are **fixture ids from the pack** — read them from the visual editor or
from `home.json`. A fixture with no entity stays deliberately dark rather than
guessing; that is what lets you install a 40-lamp pack and bind five of them.

What DomoView reads from a light entity:

- `state` — `on` drives the light
- `brightness` (0–255) — the emitted level
- `rgb_color`, else `color_temp_kelvin`, else the pack's own colour
- `supported_color_modes` — whether to offer the brightness slider at all

A `media_player` fixture reads as on for any state that is not `off`,
`standby`, `idle`, `unavailable` or `unknown`, and emits a cool screen glow. No
video is shown.

### Blinds and shutters

```yaml
covers:
  living_room_west: cover.living_blind_west
  bedroom_east: cover.bedroom_shutter
```

`current_position` drives the blind, and `current_tilt_position` opens the
slats if the entity reports one. A cover that goes briefly unavailable holds
its last known position instead of snapping open and re-lighting the room.

How a position maps to a *visible* opening is the pack's business, not the
card's — see `coverProfiles` in the
[Home Pack format](home-pack-format.md#coverprofiles). If your blind looks
half-open when it is nearly shut, the pack needs a measured profile, and
[a contribution of those numbers](../CONTRIBUTING.md) helps everyone with the
same controller.

### Window contacts

```yaml
window_sensors:
  bedroom_east: binary_sensor.bedroom_window
```

A window reported as `on`, `open` or `tilted` gets a small badge. Closed and
unknown states show nothing — an unconfigured home should not look alarming.

### Room climate

```yaml
rooms:
  bedroom:
    temperature: sensor.bedroom_temperature
    humidity: sensor.bedroom_humidity
  living_dining:
    temperature: climate.living_thermostat     # reads current_temperature
```

A `climate.*` entity is read through its `current_temperature` and
`current_humidity` attributes; anything else is read from its state. Only rooms
with at least one valid reading get a chip.

---

## Sun, sky and weather

```yaml
sun_entity: sun.sun
weather_entity: weather.home
```

`sun.sun` supplies `azimuth` and `elevation`. If the entity is missing — some
installations disable the sun integration — DomoView computes the position from
your Home Assistant latitude and longitude instead, so the sun is never simply
wrong.

`weather_entity` is optional. Without it, DomoView uses `weather.home`, or the
first available `weather.*` entity, or falls back to an assumed 50 % cloud
cover.

### Optional measured inputs

Each of these replaces an estimate with a real reading. All are optional.

```yaml
cloud_entity: sensor.cloud_coverage            # percent
irradiance_entity: sensor.solar_radiation      # W/m²
illuminance_entity: sensor.outdoor_lux         # lx
rain_entity: binary_sensor.rain
snow_entity: binary_sensor.snow
precipitation_rate_entity: sensor.rain_rate    # mm/h
wind_speed_entity: sensor.wind_speed
snow_depth_entity: sensor.snow_depth           # cm
moon_entity: sensor.moon_phase
```

The direct-sun strength is taken from the first of these that reports a usable
value, in order: `irradiance_entity`, `illuminance_entity`, then an estimate
from cloud cover. An irradiance sensor is the single biggest improvement you
can make to how the light reads, because a thin overcast and a bright haze look
nothing alike but report the same condition.

`moon_entity` only refines the illuminated fraction. The moon's *position* is
always computed from date, time and place, because no core entity publishes it.

> The light in the scene is a visual simulation, not a measurement. Sun patches
> and shadows are modelled, not metered illuminance.

---

## Preview mode

Drives the scene from sliders instead of from Home Assistant. This is what the
visual editor and the standalone demo use.

```yaml
preview:
  enabled: true
  hour: 16
  date: '2026-06-21'
  cloud: 20
  brightness: 100
  coverPosition: 100
  weather: dry        # dry | rain | snow | mixed
  moonPhase: auto     # auto | full | new
  windowOpen: false
  latitude: 51
  longitude: 7
```

With `enabled: true` no service calls are made, every fixture behaves as if
bound, and a control strip appears under the scene. Useful for a screenshot,
for checking a pack, or for a dashboard that has to demo something.

---

## Layout

The card reports `columns: full` to the sections view, so it takes the full
width of its section. For a view-wide scene, use a **Panel** view with this
card alone.

The scene's own proportions come from `aspect` (see above). To force a
letterbox:

```yaml
aspect: 2.2
```

---

## A complete example

```yaml
type: custom:domoview-card
home: /local/domoview/homes/my-flat
renderer: auto
quality: medium
camera: iso_sw

sun_entity: sun.sun
weather_entity: weather.home
irradiance_entity: sensor.solar_radiation
snow_depth_entity: sensor.snow_depth

entities:
  living_ceiling_spots: light.living_spots
  dining_pendant: light.dining_pendant
  kitchen_counter_led: light.kitchen_under_cabinet
  bedside_lamp_left: light.bedside_left
  bedside_lamp_right: light.bedside_right
  bathroom_ceiling: switch.bathroom_light
  living_tv: media_player.living_tv

covers:
  living_room_west: cover.living_west
  bedroom_east: cover.bedroom_east

window_sensors:
  bedroom_east: binary_sensor.bedroom_window

rooms:
  living_dining:
    temperature: sensor.living_temperature
    humidity: sensor.living_humidity
  bedroom:
    temperature: sensor.bedroom_temperature
    humidity: sensor.bedroom_humidity
```

---

Next: [Troubleshooting](troubleshooting.md) ·
[Home Pack format](home-pack-format.md)
