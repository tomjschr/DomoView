## What this changes

<!-- One or two sentences. Link the issue if there is one. -->

## Why

<!-- The problem it solves. For a rendering change, before/after screenshots
     say more than any description. -->

## Checks

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` run, and `dist/` committed (HACS installs it directly)
- [ ] Added or updated a test, if this changes behaviour with arithmetic in it

## If this touches the Home Pack format

- [ ] `schemas/home-pack-1.schema.json` updated
- [ ] `normalisePack` handles the field, including when it is absent
- [ ] `docs/home-pack-format.md` documents it
- [ ] `npm run demo` re-run, and `examples/` committed
- [ ] Existing packs still load — the schema version is a promise to every
      published pack

## If this touches a renderer

- [ ] Checked in `examples/demo.html` via `node tools/serve.mjs`
- [ ] Considered the other renderer: does it need the same change, and if not,
      is the asymmetry acceptable?
