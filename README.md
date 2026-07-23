# Geo-Archaeo Hiking

A prototype hiking-trail website for three Aegean islands, pairing existing walking
routes with archaeological and geological waypoints:

| Island | Status |
|---|---|
| Ios (Cyclades) &mdash; *The Terraces of Skarkos* | Real waypoint content |
| Syros (Cyclades) &mdash; *Kastri & the City of the Dead* | Real waypoint content |
| Anafi (Cyclades) | **Placeholder only** &mdash; no route/waypoints yet |
| Astypalaia (Dodecanese) &mdash; *The Ships of Vathy* | Real waypoint content, kept from an earlier version, not linked from the current homepage |

**This is a starting scaffold, not a finished dataset.** Trail lines and waypoint
coordinates are approximate placeholders for prototyping &mdash; see
[Replacing the placeholder data](#replacing-the-placeholder-data) below.

## Pages

- **`index.html`** — the homepage, "Geo-Archaeo Hiking": hero → About the
  Project → Trails and Stories cards → Contact. Rebuilt to match the actual
  visual language of the free [Atlantis template](https://uicookies.com/downloads/atlantis-hotel-free-html5-template-using-bootstrap-framework/)
  (wine/maroon accent, black serif headings, gray sans body copy, sharp-cornered
  buttons, the wave-squiggle section divider) — no files from that template are
  reused, everything here is original code and content.
- **`trail-anafi.html`**, **`trail-ios.html`**, **`trail-syros.html`** — the three
  "View Trail" pages. Each has: a summary + fact strip, an interactive Leaflet
  map (pan/zoom, full route line, all waypoint markers with popups), and a
  **click-to-reveal waypoint stepper** below it — only "Waypoint 01" is visible
  at first; clicking it expands a period line, a swipeable photo gallery, and
  the description, and reveals "Waypoint 02" underneath, and so on. Clicking an
  already-open step re-collapses it (revealed steps stay revealed). Opening a
  step also pans the map to that waypoint and opens its popup.
- **`editorial.html`** — the earlier "Field Notes from the Aegean" magazine-style
  homepage, kept for reference (linked from the nav dropdown).

## Stack (100% open source)

- Plain HTML / CSS / JavaScript &mdash; no build step, no framework, no bundler
- [Leaflet](https://leafletjs.com) (BSD-2-Clause) for the map, loaded from a CDN
- [OpenStreetMap](https://www.openstreetmap.org/copyright) tiles (ODbL) for the basemap
- [Fraunces](https://fonts.google.com/specimen/Fraunces), [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4),
  [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) and
  [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) (all SIL Open Font License), via Google Fonts
- Trail data as plain [GeoJSON](https://geojson.org/) files in `/data`, one per island

No API keys, no accounts, no paid services are required to run or host this.

## Translation workflow (pre-generated)

The site now supports four UI languages with a header switcher:

- English (`en`, default)
- Greek (`el`)
- French (`fr`)
- Dutch (`nl`)

Translations are file-based (no runtime AI calls), so language switches are instant.

- Static UI copy lives in `locales/en.json`, `locales/el.json`, `locales/fr.json`, `locales/nl.json`.
- Trail metadata + waypoint copy lives in `locales/trails/el.json`, `locales/trails/fr.json`, `locales/trails/nl.json`.
- English trail content remains the source of truth in each `data/*.geojson` file.

When you change English text:

1. Update the English source (`data/*.geojson` for trail/waypoints, and/or `locales/en.json` for shared UI copy).
2. Regenerate or update the non-English locale files with your AI translation workflow.
3. Keep the same keys (`properties` names and waypoint `order` mappings) so the translator can merge reliably.

## Project structure

```
aegean-trails/
├── index.html                 # homepage ("Geo-Archaeo Hiking")
├── trail-anafi.html            # trail detail page — map + waypoint stepper
├── trail-ios.html               # trail detail page — map + waypoint stepper
├── trail-syros.html              # trail detail page — map + waypoint stepper
├── editorial.html                 # earlier magazine-style homepage (kept for reference)
├── css/style.css                   # all styling — shared tokens + homepage + trail-page styles
├── js/
│   ├── app.js                      # editorial.html's map/tile logic
│   ├── stepper.js                   # trail pages' map + progressive stepper + gallery logic
│   └── icons.js                      # petroglyph-style SVG marker icons (shared)
├── data/
│   ├── ios.geojson
│   ├── syros.geojson
│   ├── anafi.geojson                  # placeholder only — see table above
│   └── astypalea.geojson               # kept from the earlier version, used by editorial.html
├── assets/
│   ├── boat-1.png, boat-2.png, boat-3.png   # ship-sketch icons, "About the Project"
│   └── syros-kastri-trailhead-sign.jpg        # real photo, appears in the Syros trail's gallery
└── README.md
```

## Running it locally in VS Code

1. Open the `aegean-trails` folder in VS Code (`File > Open Folder...`).
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions panel.
3. Right-click `index.html` and choose **"Open with Live Server."**
4. The site opens at `http://127.0.0.1:5500` and reloads automatically on save.

Without the extension, run a local static server from the project folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly as a `file://` URL will *not* work, since the browser
blocks the `fetch()` calls that load the GeoJSON files.)

## Deploying to GitHub Pages

1. Push this folder to a new GitHub repository:
   ```bash
   cd aegean-trails
   git init
   git add .
   git commit -m "Initial trail prototype"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. On GitHub: **Settings > Pages** &rarr; **Source**: "Deploy from a branch," branch `main`, folder `/ (root)`. Save.
3. The site publishes at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

Static files, no build step &mdash; nothing else to configure.

## Replacing the placeholder data

Each island's trail lives in one GeoJSON file under `/data`: one `LineString`
feature (`"kind": "route"`) for the path, and several `Point` features
(`"kind": "waypoint"`) for the stops (`order`, `type`, `name`, `period`, `description`,
and optionally `image` / `imageCaption`).

To swap in a real, surveyed route:

1. **Get a GPX track** &mdash; export from AllTrails, a personal GPS/phone track, or your
   own fieldwork GPS points; or digitise a path in [QGIS](https://qgis.org) or
   [geojson.io](https://geojson.io) over satellite/OSM imagery.
2. **Convert GPX to GeoJSON**, e.g. with [GDAL/ogr2ogr](https://gdal.org):
   ```bash
   ogr2ogr -f GeoJSON route.geojson track.gpx tracks
   ```
   or paste the GPX into [geojson.io](https://geojson.io).
3. **Merge it in**: replace the `route` LineString's coordinates with your track,
   and reposition/add waypoint `Point` features along it.
4. `type` controls the marker icon (see `js/icons.js`: `trailhead`, `geology`,
   `archaeology`, `rock-art`, `settlement`, `path`, `artifact`, `museum`).
5. Update the file's top-level `properties` (`summary`, `distanceKm`, `elevationGainM`,
   `difficulty`, `basedOn`, `note`) to match your real track.
6. Update the matching card on `index.html` (title, meta line, description, and photo)
   to match.

## Adding real photography

`assets/` holds real, rights-cleared photos (currently one: the Syros trailhead
sign). To add more:

- **Homepage trail cards**: replace the `<div class="placeholder-img">...</div>`
  inside a card's `.trail-card__img` with `<img src="assets/your-photo.jpg" alt="...">`.
- **About the Project boat icons**: swap `assets/boat-1.png` etc. for your own images
  the same way.
- **Waypoints on a trail page**: add `"image": "assets/your-photo.jpg"` and
  `"imageCaption": "..."` to that waypoint's `properties` for a single photo, or
  `"images": [{"src": "assets/one.jpg", "alt": "..."}, {"src": "assets/two.jpg", "alt": "..."}]`
  for a full gallery — it appears automatically in the waypoint's swipeable
  gallery on the trail page (and the first image also shows in its map popup).
  Any gallery slots you don't fill are shown as placeholder photo cards, so the
  layout always works even with zero, one, or several real photos.

Only use images you hold the rights to, or that carry a license permitting this use
(and credit the source/photographer if the license requires it).

## Extending it

- **Localisation** (English / Greek / French / Flemish): move each waypoint's text
  into a small per-language dictionary and swap it via a language toggle.
- **Elevation profile**: derive one from the GPX track and render it under the map.
- **AllTrails alongside Leaflet**: `trail.html` has a placeholder note where an
  AllTrails link/embed can sit next to the Leaflet map, if you'd rather link out to
  an existing AllTrails route than fully replace it.
- **Offline field use**: Leaflet supports offline tile caching (e.g. via a service
  worker) if you want the site usable without signal on-trail.

## Data & content notes

Waypoint text is paraphrased from public archaeological/geological literature on
these sites &mdash; re-check phrasing and citations against primary sources before
using this for formal publication. Distance/difficulty figures on the Ios and Syros
trails are estimates for placeholder routes, not measurements of a real path;
replace once you have a real track. The Anafi trail is a stub with no real data yet.
