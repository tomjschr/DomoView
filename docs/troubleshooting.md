# Troubleshooting

Start with the browser console (F12 → Console). DomoView logs a version banner,
reports pack problems as `DomoView:` messages, and prints structural warnings
about the loaded pack on load.

---

## The card does not appear at all

**"Custom element doesn't exist: domoview-card"**

The resource is not loading. Check in order:

1. Is the resource registered? *Settings → Dashboards → ⋮ → Resources*. It must
   be type **JavaScript module**, not stylesheet.
2. Does the URL resolve? Open `/local/domoview/domoview.js` directly in a
   browser tab. A 404 means the file is not where the resource says it is.
3. Hard-reload (Ctrl/Cmd + Shift + R). `/local/` is cached aggressively.
4. If `www/` was created recently, restart Home Assistant once — the `/local/`
   route is registered at startup.

**A red box saying "Home Pack could not be loaded"**

The card loaded; the pack did not. The path is printed in the box. Open
`<that path>/home.json` in a browser tab: you should see JSON. Remember the
`home:` option is the browser path (`/local/...`), not the filesystem path
(`/config/www/...`).

---

## The home is black, or nothing is lit

**Nothing is bound yet.** This is the most common case, and it is by design: a
pack ships with no entity ids, and an unbound fixture stays dark rather than
guessing at one. Open the visual editor and map a few fixtures. The HUD shows
`0 of 15 bound` until you do.

**It is night in the scene.** Daylight follows `sun.sun`. At night, only bound
lights that are actually on light anything. Switch a light on, or use
`preview: {enabled: true}` and scrub the time of day.

**A room stays dark with its light on.** Check the fixture's `light.lumens` in
the pack — 200 lumens will not light a living room. Also check the emitter type
is not `emissive`, which glows without casting.

**Every room is dark but the lamps glow.** All the emitters are `emissive`, or
`quality: low` has exhausted its light budget. Try `quality: medium`.

---

## The sun is wrong

**It enters the wrong side of the home.** `pack.north` is wrong. It is the
rotation from the pack's +Y to geographic north; a plan traced from a sheet that
was not north-up needs it set. Fix it in the Studio on the Plan step and
re-export — do not compensate by moving windows.

**It comes from inside the walls.** Exterior wall normals are flipped. Run:

```bash
node tools/pack/validate.mjs path/to/pack
```

It warns about exterior walls whose normal points at the middle of the home. In
the Studio, exterior walls draw a small arrow that must point outdoors.

**Sun patches land too near the wall, or too far into the room.** The window's
`sill` height is off. It is the number that most directly controls where the
patch falls: 20 cm of sill error moves the patch most of a metre. Measure it.

**No sun at all in a room that should have it.** The window's `rooms` list is
empty or names the wrong room. `validate.mjs` reports this, and the Studio's
window panel has the room checkboxes.

**The sun is in the wrong place entirely.** Check Home Assistant's own
latitude, longitude and time zone in *Settings → System → General*. DomoView
uses `sun.sun` when present, and computes the position from your coordinates
when it is not — both are only as right as your configured location.

---

## Blinds behave oddly

**A closed blind does not darken the room.** The window has no `cover` in the
pack, or no `cover.*` entity mapped in the card config, or its `rooms` list is
empty.

**The blind looks half-open when it is nearly shut.** The cover profile does not
match your hardware. Most controllers do not map position linearly onto the
visible opening. Measure the clear opening at every 10 % and put the numbers in
a `coverProfiles` entry — see
[the format reference](home-pack-format.md#coverprofiles). Please also
[contribute the profile](../CONTRIBUTING.md); anyone with the same controller
benefits.

**The blind is drawn behind the window frame and barely visible.** Set
`cover.inFront: true` on that opening. Windows seen from outside the building
in the default camera need it.

**A blind jumps open for a moment.** The cover entity went unavailable.
DomoView holds the last known position through brief outages, but a restart
clears that memory.

---

## Performance

**Choppy on a tablet.** In order of effect:

1. `quality: low` — fewer lights, no shadows, pixel ratio 1
2. `interactive: false` — no orbit, so no continuous redraw
3. `show_weather: false` — stops the particle animation
4. `renderer: baked`, if the pack has baked assets

DomoView only redraws when something changes: a state update, a camera move, or
active precipitation. A static scene costs nothing per frame.

**A visible stall when a light switches.** Should not happen — lights are
pooled specifically to avoid the shader recompile that causes it. If you see
it, please report it with your pack and quality tier.

**Slow first load.** The GLB is downloaded once and cached. If it is slow every
time, the model is probably too big; the example apartment is 180 kB. Decimate
a scan before shipping it.

---

## The visual editor

**A fixture is missing from the editor.** The editor lists what the pack
contains. If a lamp is not there, it is not in the pack — add it in the Studio
and re-export.

**The entity list is empty.** The editor offers entities filtered by the
fixture's `domains`. A `light` fixture offers `light.*` and `switch.*`. You can
always type an entity id by hand; the list is a convenience.

**"Pack not loaded" in the editor but the card renders.** The editor loads the
pack independently. Usually a typo in the `home:` path that the card is
tolerating from a cached value — reload the browser.

---

## Renderers

**"WebGL is unavailable in this browser"**

Rare but real: hardware acceleration disabled, a very old tablet, or a
remote-desktop session. Either enable acceleration or use `renderer: baked`
with a baked pack.

**"This Home Pack has no baked assets"**

You asked for `renderer: baked` on a pack that only has a GLB. Use
`renderer: live3d`, or bake the pack — see
[tools/bake/README.md](../tools/bake/README.md).

---

## Checking a pack in isolation

The fastest way to tell a pack problem from a Home Assistant problem:

```bash
git clone https://github.com/tomjschr/interactive_floormap
cd interactive_floormap && npm install && npm run build
node tools/pack/validate.mjs /path/to/your/pack
node tools/serve.mjs
```

`validate.mjs` checks the schema, resolves every cross-reference, verifies the
files the manifest promises exist, and warns about inside-out walls. Then
`http://127.0.0.1:8099` renders the card with no Home Assistant involved.

---

## Reporting a problem

Please include the pack that triggers it — a cut-down pack with the one broken
window in it is ideal — plus your `renderer` and `quality` settings, the
browser, and any console output. See [CONTRIBUTING.md](../CONTRIBUTING.md).
