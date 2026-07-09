# Changelog

All notable changes to Atlas are documented here.

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
