# Changelog

All notable changes to Atlas are documented here.

## [2.3.0] — Atlas Island, Phase 3

Seasons, Photo Mode, and the next building on the XP ladder.

**Added**
- Seasons — Spring, Summer, Monsoon, Autumn, Winter, tied to the real calendar month (not randomized, so it feels intentional). Re-tints grass and trees; winter also dims flowers to a dormant look. Ground shape itself never changes, only color — consistent with "objects appear gradually, nothing suddenly changes."
- Photo Mode — a "Photo" button on the Island page exports the current island as a PNG. Uses the Web Share API when available (falls back to a plain download otherwise)
- Community Park unlock at 8,000 XP — third Building-layer object
- Season HUD chip next to Weather/Level

**Changed**
- `island-assets.js` — `park_1` registry entry + its `render()` function; `ISLAND_SEASON_MONTHS` mapping
- `island-render.js` — `pickCurrentSeason()`, `ISLAND_SEASON_TINTS`, `renderSeasonalTint()`, hooked into `buildIslandScene()`
- `island.js` — season assignment (mirrors the weather/day-night pattern), season HUD label, `takeIslandPhoto()` — which inlines the app's CSS custom properties as literal hex values into a cloned SVG before export, since `var(--x)` references don't resolve in the isolated document a data-URL image parses in
- `index.html` — season chip, Photo button
- `service-worker.js` — version bumped to `atlas-v2.3.0`

**Verified before ship** — same full sweep as Phases 1 and 2: zero JS syntax errors, all 41 `onclick` handlers resolve, all `getElementById()` calls resolve (including confirming `layer-flower`/`layer-tree` were already part of Phase 1's reserved layer scaffold), CSS brace-balanced, HTML section tags balanced (16/16).

## [2.2.0] — Atlas Island, Phase 2

Weather, two new buildings, and a visible history — all built on Phase 1's foundation without changing its core logic.

**Added**
- Weather system — Sunny, Cloudy, Rain, Storm, Snow, Fog, Rainbow, weighted-random and stable per day (changes daily, not on every render)
- Populated the `weather` and `fog` layers left empty and reserved since Phase 1 — rain/snow particles, a lightning flash for storms, a rainbow arc, a drifting fog veil
- Two new unlocks continuing the XP ladder exactly as specified: Cozy House (2,000 XP), Little Library (5,000 XP) — first assets in the `building` layer, also reserved since Phase 1
- Timeline card on the Island page — renders `islandState.timeline`, which has been recording every unlock since Phase 1 with no UI until now
- Weather HUD chip next to the Level/XP chip

**Changed**
- `island-assets.js` — 2 new registry entries + their `render()` functions; new `ISLAND_WEATHER_TYPES` weighted list
- `island-render.js` — new `building` placement band; `renderWeatherLayer()`, `renderFogLayer()`, `pickDailyWeather()`; both hooked into `buildIslandScene()`
- `island.js` — daily weather assignment (mirrors the existing day/night check pattern), weather HUD, `renderIslandTimeline()`
- `island.css` — rain/snow/lightning/fog-drift keyframes, all transform/opacity only
- `service-worker.js` — version bumped to `atlas-v2.2.0` (no new files this phase, existing ones changed)

**Verified before ship** — same full sweep as Phase 1: zero JS syntax errors, every `getElementById()` call resolves (including the two new dynamic layer ids, `layer-weather`/`layer-fog`, which were already reserved in Phase 1's scaffold), CSS brace-balanced, HTML section tags balanced.

## [2.1.0] — Atlas Island, Phase 1

The flagship feature: a living, layered SVG island that grows with real productivity instead of a checklist.

**Added**
- `island-assets.js` — the Asset Registry (single source of truth for every unlockable object)
- `island-state.js` — versioned island state (`ISLAND_STATE_VERSION`) with a migration hook for future schema changes
- `island-engine.js` — the generic, registry-driven unlock engine + `awardXP()`
- `island-render.js` — modular SVG layer renderer (Sky, Sun/Moon, Cloud, Ocean, Ground, Grass, Flower, Tree, Decoration, Bridge — plus empty reserved layers for Building/Citizen/Bird/Weather/Fog/Effects/Animal/Particle for future phases)
- `island.js` — the Island page (HUD, unlock popup, day/night clock)
- `island.css` — layout + all CSS-driven animations (cloud drift, wave shimmer, sun glow, star twinkle, unlock reveal)
- New "Atlas Island" nav link, placed directly under Dashboard
- XP hooks wired into: task completion (+10), habit check-ins (+15), completed Pomodoro sessions (+20/hr), goal completion (+50), journal entries (+10), expense logging (+5), health logging (+5)
- First 4 unlocks live: Wildflower (100 XP), Sapling (300 XP), Garden Bench (600 XP), Stone Bridge (1000 XP)

**Changed**
- `storage.js` — `newUserData()`/`userData()` now create and migrate an `island` field per account
- `router.js` — added the `island` → `#/island` route
- `service-worker.js` — cache list regenerated to include all 6 new island files; version bumped to `atlas-v2.1.0`

**Verified before ship** (see project checklist)
- Zero JS syntax errors across all 39 JS files + service worker
- Every inline `onclick`/`onchange` handler in `index.html` resolves to a real function (48 checked)
- Every literal `getElementById()` call resolves to either a static HTML id or a dynamically-created one with correct creation-before-query ordering (183 checked)
- Every CSS class referenced from island JS exists in the stylesheets
- `manifest.json` has all Chrome install-required fields; all 8 referenced icon files exist on disk
- Full XP → unlock → `persist()` data path traced; island state contains no function values, so it survives the JSON round-trip through `StorageManager`
- Router `ROUTES` map has no duplicate hash values (back/forward stays unambiguous)
- No backup/temp/scratch files in the project

## [2.0.1] — Flat structure fix

Adapted the entire project (all path references in `index.html`, `manifest.json`, `service-worker.js`) to a flat file layout — no `css/`/`js/`/`assets/` subfolders — after discovering mobile GitHub uploads don't reliably preserve folder structure. See `docs/README.md` for details.

## [2.0.0] — Modular architecture rebuild

Converted the original single-file `index.html` into a 47-file modular project (14 CSS files, 33 JS files) with zero visual/functional changes, verified via automated diff against the original monolith (135 functions, 27 variables, all accounted for exactly once). Added a hash-based router (`#/home`, `#/profile`, etc.), a `StorageManager` wrapping all `localStorage` access, and an `AtlasDB` IndexedDB wrapper for future large-file features.

## Earlier

- PWA conversion (manifest, service worker, offline page, install banner)
- Phase 2: Achievement system (8 milestones) + Dashboard widget customization (drag/hide/reorder)
- Phase 1: PIN lock + full Profile page
- Cinematic launch splash screen
- About Atlas / About Developer page
- Dashboard redesign (40/60 Welcome/Progress layout)
- Initial premium Glassmorphism self-management app (Tasks, Planner, Study Tracker, Goals, Expenses, Habits, Health, Journal, Analytics, Settings, Admin Panel)
