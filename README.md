# Atlas — Architecture

This is the modular, production-structured rebuild of Atlas. **The UI, colors, typography, animations, and every feature are pixel-for-pixel identical to the single-file version** — only the underlying code organization changed.

## A key engineering decision: classic scripts, not ES modules

The spec this was built from didn't mandate ES modules, and true `<script type="module">` files **cannot load over `file://`** — the same restriction that already applies to Service Workers. Using them would have broken opening `index.html` directly and complicated simple static hosting (GitHub Pages, etc.), which this project already relies on.

Instead, JS is split into 33 classic `<script defer>` files — genuinely one responsibility per file, loaded in a deliberate dependency order — sharing the global scope the same way the original single file did. This gets the real win (find-ability, maintainability, no more 3,300-line blob) without the module-loading restriction. If you later add a real build step (Vite, esbuild, etc.), converting these to ES modules is a mechanical follow-up — each file's own header comment already documents its dependencies.

## Project structure

**Actual deployed layout — everything flat**, one directory, no subfolders (see the note further down for why):

```
Atlas/
├── index.html                — the only HTML file; every screen renders inside it
├── manifest.json              — PWA manifest
├── service-worker.js          — offline caching + app-shell precache
├── offline.html               — shown when a page was never cached and the network is down
├── favicon.ico
├── style.css + 14 more .css   — 15 files total, one per concern (see below)
├── app.js + 38 more .js       — 39 files total, one per feature (see below)
├── atlas-logo.png / .webp     — source logo
├── icon-72.png … icon-512.png — PWA icon set
├── default.json / seed.json   — reference data shapes (see files)
└── docs/
    └── README.md               — this file
```

## CSS (`css/`)

`style.css` is the only file `index.html` links to — it `@import`s the other 13 in the correct cascade order (tokens → primitives → features → responsive-last). Split via an automated, verified script (every rule accounted for — zero loss, zero duplication against the original):

| File | Contents |
|---|---|
| `variables.css` | Design tokens (`:root`), dark-mode token overrides |
| `animations.css` | Every `@keyframes` in the app |
| `components.css` | Shared primitives — glass, buttons, pills, cards, modal, toast, inputs, chips, task rows, journal entries, about-page components |
| `sidebar.css` | Sidebar, top bar, global search dropdown |
| `auth.css` | Login screen, PIN lock screen |
| `dashboard.css` | Hero, widgets, widget customization, achievements |
| `profile.css` | Profile page |
| `admin.css` | Empty by design — Admin Panel reuses shared components; this is the extension point for admin-only styles later |
| `study.css` | Pomodoro timer |
| `calendar.css` | Daily Planner timeline |
| `settings.css` | Settings rows, toggle switches, color swatches |
| `themes.css` | Scattered `[data-theme="dark"]` component overrides (the root token swap lives in `variables.css`) |
| `responsive.css` | All `@media` queries |

## JavaScript (`js/`)

Loaded in this order in `index.html` (documented in each file's own header comment too):

```
constants → utils → storage → database → modal → theme → sidebar → animation →
router → search → achievements → auth → profile → pinlock → backup → settings →
dashboard → tasks → planner → study → goals → expenses → habits → health →
journal → analytics → admin → splash → pwa → downloads → notifications → api → app
```

`app.js` is deliberately last — it's the only file that assumes everything else already exists.

**Storage discipline:** `storage.js` is the *only* file that calls `localStorage` — everything else goes through `StorageManager.save/load/update/delete/clear/backup/restore()`, or the pre-existing `persist()`/`userData()` helpers (kept unchanged so none of the other 32 files needed to change how they read/write data).

**Large files:** `database.js` wraps IndexedDB (`AtlasDB.put/get/getAll/delete/clear`) for anything too big for localStorage. Nothing uses it yet — it's ready for the Study Material Manager / Downloads features.

**Router:** `router.js` uses real hash routes (`#/home`, `#/profile`, `#/study`, `#/calendar`, `#/settings`, `#/about`, etc.) via `history.pushState`/`popstate`. `goPage(pageId)` is still the single public function every `onclick` in the HTML calls — internally it now updates the hash instead of a query string. Opening a direct link with a hash (e.g. `yoursite.com/#/profile`) lands on that page. Back/Forward work correctly; pressing Back on the Dashboard shows "Press back again to exit Atlas" and only exits on a second press within 2 seconds.

**Reserved routes:** `#/downloads` is mapped in `ROUTES` but has no page yet — `js/downloads.js` documents exactly what to add when the Study Material Manager is built.

**Stub modules:** `downloads.js`, `notifications.js`, and `api.js` are documented placeholders for features on the public roadmap (Study Materials, Local Notifications, Cloud Sync) that don't exist yet. They're empty on purpose, not missing by accident.

## Verifying the split

Every function and every top-level `let`/`const` from the original single file was mechanically diffed against the new 33-file split before this was shipped — 135 functions, 27 variables, all present exactly once. One accidental duplication (`updateHeroClock`) was caught this way and fixed. Re-run the same check anytime with a simple regex scan comparing `_extracted.js` (the old monolith) against a concatenation of all 33 files in load order — see the commit history / build notes if you keep this project under version control.

## Adding a new feature

1. Add its data shape to `newUserData()` in `storage.js`, with a backward-compatible default in `userData()` for existing accounts.
2. Add a new `js/yourfeature.js` with the standard header comment (Purpose/Inputs/Outputs/Depends on).
3. Add its `<script src="js/yourfeature.js" defer></script>` tag to `index.html`, positioned after anything it depends on.
4. Add a `#page-yourfeature` section to `index.html`, a nav link, and a `ROUTES` entry in `router.js`.
5. Add `css/yourfeature.css` if it needs unique styling, and an `@import` line in `style.css`.
6. Add its file(s) to `CORE_ASSETS` in `service-worker.js` so it's cached offline.

**A note on the actual deployed structure:** this project is served **flat** — every CSS, JS, and image file sits directly alongside `index.html`, with no `css/`/`js/`/`assets/` subfolders. That's a deliberate adaptation, not the original plan: mobile GitHub uploads don't reliably preserve folder structure, and rather than fight that repeatedly, the whole project (and every file reference inside it) was flattened to match how it actually gets deployed. `style.css`'s `@import` statements and every `<script src="...">` tag in `index.html` all use bare filenames for exactly this reason.

## Atlas Island (Phase 1 + Phase 2)

The flagship feature — a living, layered SVG world that grows as the user is productive, instead of a checklist. Built across 6 dedicated files, each with a single, strict responsibility:

| File | Responsibility |
|---|---|
| `island-assets.js` | The **Asset Registry** — the only place a new unlockable object (flower, tree, building, animal, effect...) gets defined. Adding a future asset means adding one entry here; nothing else changes. |
| `island-state.js` | The **versioned state shape** (`ISLAND_STATE_VERSION`) — XP, level, coins, unlocked list, world conditions, permanent timeline. `migrateIslandState()` is the one place future phases add a migration step, so old saves never break. |
| `island-engine.js` | The **unlock engine** — generically evaluates the registry against state (`evaluateIslandUnlocks`), completely data-driven. No asset-specific if/else anywhere. Also owns `awardXP()`, the single entry point every feature module calls to grant progress. |
| `island-render.js` | The **modular SVG renderer** — builds the scene once, then updates each layer (`<g id="layer-sky">`, `layer-cloud`, `layer-flower`, etc.) independently. Unlocking one flower only appends one SVG node into one layer group; nothing else re-renders. Every future-phase layer (building, citizen, bird, weather, fog, effects...) already exists as an empty group, ready to be populated. |
| `island.js` | The **page orchestrator** — HUD (XP bar, level, next-unlock preview), the unlock celebration popup, and the day/night clock. The only island file that touches page-level DOM outside the SVG itself. |
| `island.css` | Layout, HUD styling, and every animation (cloud drift, wave shimmer, sun glow, star twinkle, unlock reveal) — all CSS `transform`/`opacity` only, GPU-accelerated, no per-frame JS. |

**XP sources:** completing a task (+10), checking a habit (+15), a completed Pomodoro session (+20/hour), completing a goal (+50), a journal entry (+10), logging an expense (+5), logging health data (+5/save).

**Unlocks so far (exactly as specified):** 100 XP → Wildflower, 300 XP → Sapling, 600 XP → Garden Bench, 1000 XP → Stone Bridge, 2000 XP → Cozy House, 5000 XP → Little Library.

**Phase 2 added:** the Weather system (Sunny/Cloudy/Rain/Storm/Snow/Fog/Rainbow, weighted-random per day) populating the previously-empty `weather`/`fog` layers, the first two Building-layer unlocks, and a Timeline card surfacing the unlock history that's been recorded since Phase 1.

**What's deliberately NOT in yet** (each already has a slot reserved in the architecture, so building it later is additive, not a rewrite): Seasons, coins/Island Store, more buildings (Park, School, Town Hall, Temple, Harbor, Airport, Civilization), citizens, pets, and photo mode.
