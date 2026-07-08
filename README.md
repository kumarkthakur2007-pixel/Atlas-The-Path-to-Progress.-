# Atlas — Architecture

This is the modular, production-structured rebuild of Atlas. **The UI, colors, typography, animations, and every feature are pixel-for-pixel identical to the single-file version** — only the underlying code organization changed.

## A key engineering decision: classic scripts, not ES modules

The spec this was built from didn't mandate ES modules, and true `<script type="module">` files **cannot load over `file://`** — the same restriction that already applies to Service Workers. Using them would have broken opening `index.html` directly and complicated simple static hosting (GitHub Pages, etc.), which this project already relies on.

Instead, JS is split into 33 classic `<script defer>` files — genuinely one responsibility per file, loaded in a deliberate dependency order — sharing the global scope the same way the original single file did. This gets the real win (find-ability, maintainability, no more 3,300-line blob) without the module-loading restriction. If you later add a real build step (Vite, esbuild, etc.), converting these to ES modules is a mechanical follow-up — each file's own header comment already documents its dependencies.

## Project structure

```
Atlas/
├── index.html              — the only HTML file; every screen renders inside it
├── manifest.json            — PWA manifest
├── service-worker.js        — offline caching + app-shell precache
├── offline.html             — shown when a page was never cached and the network is down
├── favicon.ico
├── css/                     — 14 files, one per concern (see below)
├── js/                      — 33 files, one per feature (see below)
├── assets/
│   ├── logo/                — source logo (PNG + WebP)
│   └── icons/                — PWA icon set, 72–512px
├── data/
│   ├── default.json         — documents the default data shape (reference only — see file)
│   └── seed.json             — example demo data (reference only — see file)
└── docs/
    └── README.md             — this file
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

That's the whole loop — no build step, no bundler, no config to touch.
