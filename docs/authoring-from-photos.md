# Authoring from photos and floor plans

How to get from "a PDF from the letting agent and a phone full of photos" to a
model where the afternoon sun lands on the right patch of floor.

The Studio handles the drawing. This page is about the *measurements*, because
that is what separates a model that looks like your home from one that behaves
like it.

---

## What each source is good for

| Source | Gives you | Does not give you |
|---|---|---|
| Floor plan | the plan: walls, room shapes, where windows are | any height whatsoever |
| Photos | heights, lamp positions, colours, what is actually in the room | reliable dimensions |
| A tape measure | the four numbers that matter most | patience |

A plan alone produces a home where every window runs floor to ceiling. Photos
alone produce a shoebox. You need both, and about five minutes with a tape
measure.

---

## Step 1: get a usable plan image

A floor plan from a letting agent, a building application, or a hand sketch all
work. The Studio takes PNG, JPEG and WebP. For a PDF, export the page as an
image first at 150 dpi or better.

No plan at all? Sketch one on squared paper, photograph it flat, and calibrate
against the squares. It does not need to be pretty — it is a tracing guide that
gets hidden behind the 3D model in the end.

Images larger than 3000 px on the long edge are downscaled on import to keep
the project file manageable. Above that resolution you are tracing JPEG
artefacts anyway.

---

## Step 2: calibrate the scale, carefully

This is the one step where an error propagates into everything else.

The Studio asks you to click two points and type the real distance. **Pick the
longest thing you can actually verify.** Precision in the click matters less
the longer the reference is: a 2-pixel misclick over 8 m is a 0.3 % error; over
0.9 m it is 2 %.

In order of preference:

1. **A measured wall.** Walk the longest interior wall with a tape. Best
   possible reference.
2. **A dimension printed on the plan.** Most architectural plans are
   dimensioned. Use the longest chain you can find.
3. **The plan's own scale bar**, if it has one.
4. **A doorway.** Interior doors are 0.80–0.90 m in most of Europe, 0.81 m
   (32″) commonly in North America. Measure one rather than assuming.

Check your work: after calibrating, the Studio's status bar shows the traced
extent in metres. Trace just the outer walls first and see whether "11.00 m ×
8.00 m" matches what you believe your home to be. If it says 34 m, the
calibration is wrong, not your home.

> If the plan is a photo of a printed page taken at an angle, perspective makes
> the scale vary across the image. Rescan it flat. No calibration fixes a
> trapezoid.

---

## Step 3: trace walls and rooms

Walls first, then rooms, because room outlines snap to wall corners.

- Corners snap to each other and to existing wall lines, so a traced outline
  actually closes. Watch for the white snap ring.
- Segments snap to 15° increments; hold <kbd>Shift</kbd> to draw freely. Most
  homes are rectangular and the snap saves a lot of nudging.
- A bay window is three wall segments, not a curve.
- **Mark exterior walls as exterior**, and check the little arrow points
  *outdoors*. That arrow is where daylight comes from. Getting it wrong lights
  your rooms from the inside.

Rooms need a polygon each. Mark balconies, terraces and roof decks as
**outdoor**: they get sky light instead of window light, they are never dimmed
by blinds, and they are where rain and snow land.

You do not need to trace every cupboard. Trace what bounds a room and what
holds a window.

---

## Step 4: the four numbers worth measuring

Take a tape measure round once and write these down. Everything else can be
estimated.

1. **Ceiling height.** One number for the whole home, usually 2.4–2.6 m.
   Measure it; "about 2.5" is out by enough to notice.
2. **Window sill height** — floor to the bottom of the glass. Typically
   0.85–1.10 m in a living room, higher over a kitchen counter, higher again in
   a bathroom. **This is the single most important measurement in the whole
   process**, because it sets where a sun patch lands: a sill 20 cm too high
   moves the patch most of a metre across the floor.
3. **Window head height** — floor to the top of the glass. Often 2.1–2.3 m, and
   frequently the same as the door height.
4. **Window width.** The plan may already tell you; verify one to check the
   plan's dimensions are trustworthy.

If a window differs from the others — a small bathroom window, a floor-to-
ceiling balcony door — measure that one separately. Those are the ones that
look wrong when guessed.

### Reading heights off a photo

For a window you cannot reach, a photo with a known reference works well
enough. Stand square to the wall, get a door or a radiator in the same frame,
and compare in pixels: a 2.00 m door occupying 800 px tells you the sill at
360 px is 0.90 m up. Squareness matters more than resolution.

---

## Step 5: lights

Click where each lamp is and set its height. Two things to get right:

**One fixture per switch, not per bulb.** A three-spot track that switches
together is *one* fixture with three emitters —
<kbd>Shift</kbd>-click adds an emitter to the selected fixture. This matters
because you will bind one entity to it, and because the total lumens are split
across the emitters.

**Heights come from the type:**

| Fixture | Typical height |
|---|---|
| Ceiling spot, flush ceiling light | ceiling height − 0.05 m |
| Pendant over a dining table | 1.55–1.75 m |
| Pendant elsewhere | 1.9–2.2 m |
| Wall light | 1.6–1.9 m |
| Floor lamp | 1.3–1.7 m |
| Table or bedside lamp | 0.5–0.8 m |
| Under-cabinet LED | 1.40–1.50 m |
| Cove or wardrobe-top LED | just under the ceiling |

**Brightness in lumens**, not watts. On the box, or:

| | Lumens |
|---|---|
| Bedside / accent lamp | 150–300 |
| Table lamp, single pendant | 400–800 |
| Room ceiling light | 1000–1600 |
| Kitchen or bathroom ceiling | 1200–2000 |
| LED strip, per metre | 300–800 |

If a room renders too bright, lower the lumens rather than reaching for
`exposure`. Exposure moves the whole scene; lumens fix the one lamp.

Set **spot** for anything aimed down — it looks markedly better than a point
light for ceiling spots and desk lamps. Set **strip** for LED tape. Set
**emissive** for a TV: it glows without lighting the room like a lamp would.

---

## Step 6: furniture

Drag rectangles over the big pieces and set base and top heights. This is worth
doing for two reasons beyond looks: furniture blocks sunlight, and a room with
a sofa and a table in it reads as a room rather than as an empty box.

Sofa 0.80–0.85 m, dining table 0.75 m, coffee table 0.40–0.45 m, bed 0.50–0.60 m,
worktop 0.90 m, wardrobe 2.0–2.4 m.

Skip the small stuff. Nothing under about 0.4 m across is visible at this
scale.

---

## Step 7: photos, for colour and for checking

Attach a photo or two per room. Two uses:

**Colour sampling.** Click a photo to sample the colour under the cursor — it
averages a small patch, because a single JPEG pixel is mostly compression
noise. Assign it to walls, floors, furniture or the selected lamp. Sample from
a part of the wall that is in *diffuse* light: a sunlit patch reads far lighter
than the paint actually is, and a corner reads darker.

**Checking your work.** Keep the photo open beside the 3D preview. Is the lamp
on the right wall? Does the window really start that low? Is the wardrobe on
the correct side of the bed? This catches more mistakes than any amount of
staring at the plan.

Photos stay in the project file and are **not** written into an exported pack
unless you tick them individually. Photographs of your rooms are not something
to publish by accident.

---

## Step 8: preview before you bind anything

The Preview step runs the card's actual renderer on your actual model. Use it
properly — it is much cheaper to fix a sill height here than after copying
files to `/config/www`.

Check, in this order:

1. **Is anything inside out?** Walls facing the wrong way, rooms with no floor.
2. **Scrub the time of day.** Does morning sun reach the east rooms and
   afternoon sun the west ones? If the sun enters the wrong rooms, `north` is
   wrong — fix it on the Plan step, not by moving windows.
3. **Close the blinds.** Do the right rooms go dark? A room that stays bright
   has no window assigned to it, or its window lists the wrong room.
4. **All lights on, at night.** Does each room light up? A dark room means a
   fixture is missing or its lumens are too low.
5. **Lamp heights.** Any lamp glowing at floor level is a height left at its
   default.

---

## Step 9: export and install

Export downloads a ZIP with three things in it:

```
my-home/                  the pack — upload this folder
  home.json
  model.glb
  README.txt
my-home-card.yaml         paste into a dashboard card
my-home.domoview.json     your editable source — keep it
```

**1. Upload the folder** so that
`/config/www/domoview/homes/my-home/home.json` exists. The File Editor add-on,
a Samba share or the VS Code add-on all work; DomoView does not care how the
files got there.

**2. Open the card YAML.** It lists every fixture, blind, window contact and
room the pack defines, grouped by room and labelled:

```yaml
type: custom:domoview-card
home: /local/domoview/homes/my-home

entities:
  # Living & Dining
  living_ceiling_spots: ''  # Living ceiling spots · 3 bulbs, spot
  dining_pendant: ''        # Dining pendant
  living_floor_lamp: ''     # Living floor lamp
```

Replace each `''` with one of your entities. An empty value means unbound, and
an unbound fixture stays dark on purpose — so you can map five lamps today and
the rest whenever you like.

**3. Paste it** into *Edit dashboard → + Add card → Manual*. The card's visual
editor offers the same keys with entity pickers if you would rather click than
type; both write the same config.

### Two files belong outside `www`

The card YAML and the project file are **not** inside the pack folder, and that
is deliberate: everything under `/config/www` is served **without
authentication**. Once filled in, the YAML lists your entity ids, and the
project file embeds your floor plan image and any photos you attached. Keep
both somewhere else.

### Keep the project file

`my-home.domoview.json` is the source; the pack is the output. Reopen it in the
Studio with **Open…** to correct a sill height or add the lamp you bought last
week, then export again. Without it you are tracing the plan from scratch.

---

## Common mistakes, and what they look like

| Symptom | Cause |
|---|---|
| Sun comes in the wrong side of the home | `north` is wrong |
| Rooms lit from inside; outside is dark | exterior wall normals flipped |
| Sun patches land too close to the wall | window sill too high |
| Everything is oddly large or small | scale calibration off — check the traced extent |
| A room never darkens with the blinds shut | its window has no `rooms` entry, or no cover |
| Lamps glow but nothing is lit | emitter type is `emissive` |
| Whole home is washed out | too many lumens, not too much exposure |
| A lamp is on the floor | emitter height left at its default |

---

Next: [GLB conventions](glb-conventions.md) if you would rather bring your own
model, or [Sharing packs](sharing-packs.md) before you publish one.
