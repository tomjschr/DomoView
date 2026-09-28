# Examples

## Packs

| Pack | What it is | License |
|---|---|---|
| [`demo-apartment/`](demo-apartment/) | A fictional six-room flat with a balcony. The reference pack, and what the tests run against. | CC0-1.0 |

**Contributions welcome.** A pack close to someone's own layout saves them an
evening. Read [sharing packs](../docs/sharing-packs.md) first — a floor plan
says something about where you live, and that is worth deciding deliberately.
Then see [CONTRIBUTING.md](../CONTRIBUTING.md#2-contributing-a-home-pack).

Packs that would be especially useful:

- Common layouts — a terraced house, a studio flat, a bungalow
- **Multi-storey.** The format has `levels`, but no pack here exercises them.
- Geometry that stresses a renderer: a bay window, a curved wall, an atrium,
  a roof light
- A pack with **baked assets**, since nothing here has them yet
- A pack built from a **LiDAR room scan** rather than a traced plan

## `demo.html`

The card running against a stub Home Assistant — no instance required. It binds
every fixture to a synthetic light entity and adds controls for the sun,
weather, blinds and lights.

```bash
npm install && npm run build
node tools/serve.mjs
```

<http://127.0.0.1:8099/examples/demo.html>

This is how browser-side changes get checked, since `npm test` covers the
maths and the pack pipeline but cannot render anything. To point it at your own
pack, drop the pack in this folder and change `PACK` near the top of the
`<script>` block.
