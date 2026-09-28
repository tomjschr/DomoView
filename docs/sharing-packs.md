# Sharing a Home Pack

Shared packs are the point of the format. Someone who finds a pack close to
their own layout gets a working 3D home in ten minutes instead of an evening,
and can fork it from there.

There is one thing worth thinking about first.

---

## What a pack reveals

A Home Pack is a measured floor plan of a dwelling, with the furniture
arrangement, the lighting inventory and the room labels. Published under your
own GitHub account, it says a fair amount about where and how you live.

That may be entirely fine — plenty of people publish their whole Home Assistant
configuration. It is worth being a deliberate choice rather than an accident,
so:

**Lower-risk things to publish**

- An invented layout, or a plan from a published house type or show home
- A place you have moved out of
- A generic layout: "typical 1970s three-room flat", useful as a starting point
- Your pack with room names generalised (`Room A`, `Bedroom`) and no photos

**Think twice about**

- Your current home, under your real name, together with anything that
  identifies your city
- Reference photos of your rooms — these are excluded from an export unless you
  tick each one, and that default is intentional
- `bindings`, which would carry your entity ids

**Never in a pack**

- Entity ids (`bindings` should be empty or absent)
- `pack.description` mentioning an address, a building, or a landlord
- Anything in `README.txt` you would not post publicly

The card does not need any of that. A pack is geometry plus labels; the person
installing it maps their own entities.

---

## Before you publish

```bash
node tools/pack/validate.mjs path/to/my-pack
```

Then check by hand:

- [ ] `bindings` is `{}` or absent
- [ ] No `photos/` folder unless you meant to include one
- [ ] `pack.license` is set — **CC0-1.0** (do anything) or **CC-BY-4.0**
      (credit me) are the two that make a pack genuinely reusable. A pack with
      no license is legally awkward for anyone who wants to adapt it.
- [ ] `pack.author` says what you want it to say. A handle is fine.
- [ ] Room names are ones you are happy to have read
- [ ] `model.glb` is a sane size — if a scan made it 80 MB, decimate it
- [ ] It loads: `node tools/serve.mjs` and point `examples/demo.html` at it

---

## How to publish

**As a pull request here.** Add it under `examples/<pack-id>/` with a short
`README.md` saying what kind of home it is and what someone would use it for.
Good candidates: common layouts, unusual geometry that stresses the renderer, a
pack with a well-measured cover profile.

**On your own.** A GitHub repository, a release ZIP, or a forum post all work.
A pack is just a folder. Please mention DomoView and the schema version so
people know what reads it, and open an issue here if you would like it linked.

**Just the interesting part.** You do not have to publish geometry at all. A
measured cover profile, a set of lumen values that make a common fixture read
correctly, or a note that your shutter controller reports position inverted —
those are the contributions that improve every pack at once. See
[CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Using someone else's pack

A pack is data, not code: JSON and glTF, loaded by the card, with no execution.
Still, it is input from a stranger, so:

- Run `node tools/pack/validate.mjs` over it before installing
- Check `pack.license` allows what you intend to do with it
- If you adapt and republish, keep the original author's credit when the
  license asks for it

Forking a pack to match your own home is the expected workflow. Open it in the
Studio — if the author shipped the `project.domoview.json`, you can edit it
directly; otherwise trace over your own plan and copy the fixture settings
across.

---

## Pack ids

`pack.id` is also the folder name and appears in card configs, so treat it as
stable. If you publish a revised pack, bump `pack.version` and keep the id:
that way an existing dashboard keeps working when someone drops the new folder
in place.
