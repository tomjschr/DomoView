# DomoView

**Ein interaktiver 3D-Grundriss für Home Assistant.** Die Wohnung als lebende
Puppenhaus-Ansicht: Lampen leuchten in dem Raum, in dem sie wirklich hängen,
die Sonne wandert durch die echten Fenster, und ein geschlossenes Rollo
verdunkelt tatsächlich den Raum dahinter.

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/tomjschr/interactive_floormap/actions/workflows/ci.yml/badge.svg)](https://github.com/tomjschr/interactive_floormap/actions/workflows/ci.yml)

> 🇬🇧 [English version](README.md)

![Wie DomoView zusammenhängt: aus Grundriss und Raumfotos wird im Studio ein Home Pack, das die Karte entweder live per WebGL oder aus gebackenen Bildern rendert, gesteuert von Home-Assistant-Zuständen.](https://raw.githubusercontent.com/tomjschr/interactive_floormap/main/docs/images/pipeline.svg)

---

## Was anders ist

Die meisten Grundriss-Karten sind ein Bild mit Knöpfen darauf. DomoView
rendert ein echtes 3D-Modell und steuert es aus den Entitätszuständen:

- **Lampen sind Lampen.** Helligkeit und Farbe einer `light.*`-Entität steuern
  eine echte Lichtquelle in der Szene. Nachttischlampe an → warmer Lichtkegel
  im Schlafzimmer, kein leuchtender Punkt auf einer Bitmap.
- **Die Sonne steht, wo sie steht.** Azimut und Höhe kommen aus `sun.sun`, und
  das Tageslicht fällt durch die Fenster, die du eingezeichnet hast — mit ihrer
  echten Brüstungs- und Sturzhöhe. Nachmittagssonne erreicht die Westräume, die
  Nordräume nicht.
- **Rollos sind Geometrie.** Ein `cover.*` bei 40 % ist eine echte Fläche mit
  echtem Schatten. Gekippte Lamellen lassen einen Streifen Licht durch.
- **Wetter und Mond.** Regen und Schnee fallen auf die Flächen, die du als
  außen markiert hast. Das Mondlicht wird aus Datum, Zeit und Standort
  berechnet.

Alles Wohnungsspezifische steckt in einem **Home Pack** — einer `model.glb`
plus `home.json`. Die Karte selbst weiß nichts über eine bestimmte Wohnung.
Packs lassen sich also teilen, forken und gemeinsam verbessern.

## Loslegen

### 1. Karte installieren

**Über HACS** (empfohlen)

1. HACS → ⋮ → **Benutzerdefinierte Repositories**
2. `https://github.com/tomjschr/interactive_floormap` hinzufügen,
   Kategorie **Dashboard**
3. **DomoView** installieren, Browser neu laden

**Manuell**

1. `domoview.js` aus dem [letzten Release](https://github.com/tomjschr/interactive_floormap/releases) laden
2. Nach `/config/www/domoview/domoview.js` kopieren
3. Einstellungen → Dashboards → ⋮ → **Ressourcen** → `/local/domoview/domoview.js`
   als **JavaScript-Modul** eintragen

### 2. Ein Home Pack besorgen

Erst mal das Beispiel — dafür muss nichts modelliert werden:

```bash
# aus dem Repository
cp -r examples/demo-apartment /config/www/domoview/homes/
```

Dann die Karte anlegen:

```yaml
type: custom:domoview-card
home: /local/domoview/homes/demo-apartment
```

Im visuellen Editor ein paar Leuchten auf eigene Entitäten legen. Die
Demo-Wohnung ist nicht deine, zeigt aber genau, was die Karte tut.

### 3. Ein Pack für die eigene Wohnung bauen

**[DomoView Studio](https://tomjschr.github.io/interactive_floormap/studio/)**
im Browser öffnen. Es wird nichts hochgeladen, alles läuft lokal.

```
  Grundrissbild  ──┐
                   ├──▶  Studio  ──▶  model.glb + home.json  ──▶  Karte
  Fotos je Raum  ──┘
```

1. **Plan** — Grundriss hineinziehen (PNG/JPG; eine PDF-Seite vorher als Bild
   exportieren)
2. **Maßstab** — zwei Punkte anklicken, deren echten Abstand du kennst, und die
   Meter eintippen. Ab hier ist alles maßhaltig.
3. **Wände** — Wandzüge tracen. Ecken schnappen aneinander,
   <kbd>Shift</kbd> zeichnet frei statt in 15°-Schritten.
4. **Räume** — jeden Raum umranden. Balkon und Terrasse als *outdoor* markieren.
5. **Fenster** — auf eine Wand klicken. Brüstungs- und Sturzhöhe aus einem Foto
   oder mit dem Maßband bestimmen; davon hängt ab, wo die Sonne landet.
6. **Leuchten** — anklicken, wo jede Lampe hängt, und die Höhe setzen.
   <kbd>Shift</kbd>-Klick fügt derselben Leuchte eine weitere Birne hinzu —
   für einen Dreifachstrahler oder einen LED-Streifen.
7. **Möbel** — Rechtecke über die großen Stücke ziehen. Sie werden Geometrie
   und werfen Schatten.
8. **Fotos** — Fotos je Raum anhängen und anklicken, um Wand- und Bodenfarben
   abzunehmen. Fotos bleiben in der Projektdatei; nur ausdrücklich angehakte
   landen in einem exportierten Pack.
9. **Vorschau** — der Renderer der Karte, auf deinem Modell. Tageszeit
   durchschieben und Rollos schließen, bevor Home Assistant überhaupt
   angefasst wird.
10. **Export** — ZIP herunterladen, nach
    `/config/www/domoview/homes/<dein-pack>/` entpacken.

Das Studio läuft nach der Installation auch offline aus der eigenen Instanz:
`/local/domoview/studio/index.html`.

## Konfiguration

Minimal:

```yaml
type: custom:domoview-card
home: /local/domoview/homes/meine-wohnung
```

Alles andere hat sinnvolle Vorgaben, und der visuelle Editor erzeugt seine
Felder aus dem Pack — kommt eine Lampe ins Pack, erscheint eine Zeile dafür.

```yaml
type: custom:domoview-card
home: /local/domoview/homes/meine-wohnung
renderer: auto          # auto | live3d | baked
quality: medium         # low | medium | high
camera: iso_sw          # eine Kamera-ID aus dem Pack
variant: base           # z. B. christmas, wenn das Pack Varianten definiert

entities:               # Leuchten-ID -> Entität
  living_ceiling_spots: light.wohnzimmer_spots
  bedside_lamp_left: light.nachttisch_tom

covers:                 # Fenster-ID -> Rollo-Entität
  living_room_west: cover.wohnzimmer_rollo_west

window_sensors:         # Fenster-ID -> Fensterkontakt
  bedroom_east: binary_sensor.schlafzimmer_fenster

rooms:                  # Raum-ID -> Klimasensoren
  bedroom:
    temperature: sensor.schlafzimmer_temperatur
    humidity: sensor.schlafzimmer_luftfeuchtigkeit

weather_entity: weather.home
irradiance_entity: sensor.sonneneinstrahlung   # optional, besser als Wolkenschätzung
```

Vollständige Referenz: **[docs/configuration.md](docs/configuration.md)**

## Zwei Renderer, ein Pack

| | `live3d` | `baked` |
|---|---|---|
| Wie | three.js rendert die GLB pro Frame | vorgerenderte Bilder pro Zustand komponiert |
| Kamera | frei drehbar, mehrere Presets | fest auf die Bake-Kamera |
| Qualität | gutes Echtzeit-PBR | so gut wie der Offline-Renderer |
| Kosten | braucht WebGL, GPU hilft | günstig, läuft auf altem Wandtablet |
| Aufwand | keiner | braucht einen Blender-Bake |

`renderer: auto` nimmt `live3d` und fällt nur dort auf `baked` zurück, wo WebGL
fehlt. Backen ist optional, siehe
**[tools/bake/README.md](tools/bake/README.md)**.

## Ein Pack teilen

Darum geht es bei dem Format. Ein Pack ist ein Ordner, den jeder in seine eigene
Instanz legen kann:

```
meine-wohnung/
├── home.json     Räume, Wände, Fenster, Leuchten, Kameras
├── model.glb     die Geometrie
├── baked/        optional vorgerenderte Bilder
└── README.txt
```

`home.json` enthält **keine Entity-IDs** — wer es installiert, ordnet die
eigenen zu.

Wenn du ein Pack veröffentlichst: im Studio eine Lizenz wählen (CC0 oder CC BY
sind beides gute Optionen) und bedenken, dass ein Grundriss etwas darüber
aussagt, wo du wohnst. Siehe **[docs/sharing-packs.md](docs/sharing-packs.md)**.

## Dokumentation

Die Dokumentation ist auf Englisch, damit möglichst viele mitarbeiten können:

| | |
|---|---|
| [Installation](docs/installation.md) | HACS, manuell, Upgrade |
| [Configuration](docs/configuration.md) | alle Kartenoptionen |
| [Home Pack format](docs/home-pack-format.md) | `home.json`-Referenz |
| [GLB conventions](docs/glb-conventions.md) | Node-Namen, eigenes Modell mitbringen |
| [Authoring from photos](docs/authoring-from-photos.md) | echte Maße aus Plan und Handyfoto |
| [Baking a pack](tools/bake/README.md) | der Blender-Weg |
| [Architecture](docs/architecture.md) | wie die Teile zusammenspielen |
| [Troubleshooting](docs/troubleshooting.md) | wenn die Wohnung schwarz bleibt |

## Mitmachen

Packs, Fehlerberichte und Code sind alle willkommen — siehe
[CONTRIBUTING.md](CONTRIBUTING.md). Entwicklungsumgebung:

```bash
npm install
npm run build        # dist/domoview.js und dist/studio/
npm test             # Kernmathematik, Pack-Format, Export-Pipeline
node tools/serve.mjs # http://127.0.0.1:8099 — Karten-Demo und Studio, ohne HA
```

## Credits

DomoView ist aus einer handgebauten Lichtkarte für eine einzelne Wohnung
entstanden und so verallgemeinert, dass sie für jedes Zuhause funktioniert.
Enthalten sind [three.js](https://threejs.org) (MIT) und einige
[Material-Design-Icons](https://pictogrammers.com/library/mdi/)-Pfade
(Apache-2.0); siehe [NOTICE](NOTICE).

Kein offizielles Home-Assistant-Projekt.
