# Installation

DomoView is a dashboard card: a single JavaScript file registered as a Lovelace
resource, plus a Home Pack in your `www` folder. There is no integration and
nothing to add to `configuration.yaml`.

Requirements: Home Assistant 2024.8 or newer, and a browser with WebGL for the
live renderer (any browser from the last five years, including the companion
app). Without WebGL the card falls back to the baked renderer, if the pack has
baked assets.

---

## Install the card

### Via HACS

DomoView is not yet in the default HACS list, so add it as a custom repository:

1. **HACS → ⋮ (top right) → Custom repositories**
2. URL: `https://github.com/tomjschr/DomoView`
3. Category: **Dashboard**
4. **Add**, then find **DomoView** in HACS and install it
5. **Reload your browser fully** (Ctrl/Cmd + Shift + R)

HACS adds the dashboard resource for you.

### Manually

1. Download `domoview.js` from the
   [latest release](https://github.com/tomjschr/DomoView/releases)
2. Copy it to `/config/www/domoview/domoview.js`
3. **Settings → Dashboards → ⋮ → Resources → + Add resource**
   - URL: `/local/domoview/domoview.js`
   - Type: **JavaScript module**
4. Reload your browser fully

If `/config/www/` did not exist before, restart Home Assistant once — the
`/local/` route is registered at startup.

---

## Install a Home Pack

The card needs a pack. Packs live under `www` so the browser can fetch them:

```
/config/www/domoview/homes/<pack-id>/home.json
/config/www/domoview/homes/<pack-id>/model.glb
```

which the browser sees as `/local/domoview/homes/<pack-id>/`.

### The example pack

```bash
# in /config/www/domoview/homes/
wget https://github.com/tomjschr/DomoView/archive/refs/heads/main.zip
unzip main.zip 'DomoView-main/examples/demo-apartment/*'
mv DomoView-main/examples/demo-apartment .
rm -rf main.zip DomoView-main
```

Or just download the repository and copy `examples/demo-apartment` across with
the File Editor or Samba add-on.

### Your own pack

Build one in [DomoView Studio](https://tomjschr.github.io/DomoView/studio/)
and unpack the exported ZIP into `/config/www/domoview/homes/`. The ZIP already
contains the correctly-named folder. See
[Authoring from photos](authoring-from-photos.md).

---

## Add the card

**Edit dashboard → + Add card → search "DomoView"**, or paste YAML:

```yaml
type: custom:domoview-card
home: /local/domoview/homes/demo-apartment
```

Then open the card's visual editor and map fixtures to your entities. Nothing
is bound by default, on purpose — a pack ships without entity ids so it can be
shared, and an unbound fixture stays dark rather than guessing.

For a full-width scene, put the card alone in a **Panel** view.

---

## Running the Studio

Three ways, all the same application, none of which upload anything:

**On your own machine.** Download `domoview-studio.zip` from the
[latest release](https://github.com/tomjschr/DomoView/releases), unzip it and
run `node serve.mjs` in that folder, then open the address it prints. Needs
[Node.js](https://nodejs.org) 20 or newer. This is the one to pick if you are
going to be uploading files into Home Assistant anyway.

From a source checkout, install dependencies once and start the local Studio
with:

```console
npm install
npm run studio:local
```

This builds the browser bundle, starts the local application on
`http://127.0.0.1:8099/`, and creates a private `.domoview-workspace` beside the
command's working directory. The server binds to the loopback interface only.

**From your own Home Assistant.** A DomoView install contains its own copy:

```
/local/domoview/studio/index.html
```

available when installed via HACS, or when you copy `dist/studio/` alongside
`domoview.js`.

**Hosted.** <https://tomjschr.github.io/DomoView/studio/> — nothing to install.

> Double-clicking `index.html` does not work, whichever copy you have.
> Browsers refuse to load ES modules straight off the filesystem, which is why
> the downloadable version ships a small server that listens on localhost only.

---

## Upgrading

Via HACS: update as usual and reload the browser.

Manually: replace `domoview.js` and reload. Browsers cache `/local/`
aggressively; if a new version does not seem to take effect, append a version
to the resource URL (`/local/domoview/domoview.js?v=2`) or hard-reload.

**Packs keep working across card updates.** `pack.schema` is a compatibility
promise: a card reads every schema version it has ever supported. When a pack
needs changes, the [changelog](../CHANGELOG.md) says so explicitly.

To refresh a pack you replaced in place, add `cache_bust` to the card config —
the pack's assets are cached by the browser just as hard as the card is:

```yaml
cache_bust: '2'
```

---

## Uninstalling

1. Remove the card from your dashboards
2. HACS → DomoView → ⋮ → Remove, or delete `domoview.js` and its resource entry
3. Delete `/config/www/domoview/` if you want the packs gone too

Nothing is written outside `www` and the dashboard configuration.

---

## Verifying an install without Home Assistant

If something is not working and you want to know whether the problem is the
card or the setup, run the repository locally:

```bash
git clone https://github.com/tomjschr/DomoView
cd DomoView
npm install && npm run build
node tools/serve.mjs
```

`http://127.0.0.1:8099` renders the card against a stub Home Assistant, and
`/dist/studio/index.html` is the Studio. Drop your own pack into `examples/`
and point the demo page at it to check the pack in isolation.

---

Next: [Configuration](configuration.md) · [Troubleshooting](troubleshooting.md)
