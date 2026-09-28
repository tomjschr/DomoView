# Local Home Packs

**This folder is gitignored.** Put packs of homes you do not intend to publish
here, and they stay out of the repository.

```
homes/
├── my-flat/
│   ├── home.json
│   └── model.glb
└── holiday-house/
    └── ...
```

Why the default is "not published": a Home Pack is a measured floor plan of a
dwelling, with the furniture arrangement and the lighting inventory. Publishing
one is a perfectly reasonable thing to do — just as a deliberate choice rather
than because a directory happened to be tracked. See
[docs/sharing-packs.md](../docs/sharing-packs.md).

Packs meant for everyone go in [`examples/`](../examples/), which **is**
tracked.

## Working with a local pack

Validate it:

```bash
node tools/pack/validate.mjs homes/my-flat
```

View it without Home Assistant:

```bash
node tools/serve.mjs
```

then <http://127.0.0.1:8099/examples/demo.html?pack=../homes/my-flat>, adding
`&renderer=baked` if the pack has baked assets. The demo page binds every
fixture to a synthetic light entity, so the switches work.

Install it:

```
/config/www/domoview/homes/my-flat/
```

```yaml
type: custom:domoview-card
home: /local/domoview/homes/my-flat
```

## Keep the project file

`Save project` in the Studio gives you a `.domoview.json`. Keep it next to the
pack: the pack is the *output*, the project is the *source*. Without it,
changing a sill height means tracing the plan again.
