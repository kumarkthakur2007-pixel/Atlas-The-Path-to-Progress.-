/* ============================================================
   ISLAND STATE
   ============================================================
   Purpose:   Defines the shape of a user's island — XP, level,
              coins, unlocked assets, world conditions, and a
              permanent timeline — as one versioned, structured
              object. Versioning exists so future phases (coins
              economy, seasons, placements, population stats)
              can migrate an existing save forward without ever
              losing or corrupting a user's progress.
   Inputs:    none (createDefaultIslandState); a possibly-stale
              state object (migrateIslandState).
   Outputs:   A fresh or migrated islandState object, always at
              ISLAND_STATE_VERSION.
   Depends on: nothing.
   ============================================================ */

const ISLAND_STATE_VERSION = 1;

/** A brand-new island, exactly as a fresh account should start. */
function createDefaultIslandState(){
  return {
    version: ISLAND_STATE_VERSION,
    xp: 0,
    level: 1,
    coins: 0,
    unlocked: [],        // array of asset IDs, in the order they were unlocked
    placements: {},       // assetId -> {x,y} — reserved for the future Island Store's drag-to-place
    world: {
      timeOfDay: 'day',    // 'day' | 'night' — Phase 1 follows the device clock
      weather: 'sunny',     // reserved for the future Weather phase
      season: 'spring'      // reserved for the future Seasons phase
    },
    timeline: [],          // [{assetId, unlockedAt}] — permanent history, oldest first
    stats: {
      totalXPEarned: 0      // reserved for the future Level System's lifetime stats
    }
  };
}

/**
 * Brings a possibly-older island state up to ISLAND_STATE_VERSION,
 * filling in any fields introduced by later phases with safe defaults.
 * Add one `if(state.version < N)` block per future version bump —
 * never rewrite earlier blocks, so the migration chain stays honest.
 */
function migrateIslandState(state){
  if(!state || typeof state !== 'object'){ return createDefaultIslandState(); }

  // Pre-versioning safety net: fill anything missing from a partial/corrupted object.
  const fallback = createDefaultIslandState();
  state.version    = state.version    ?? fallback.version;
  state.xp         = state.xp         ?? fallback.xp;
  state.level      = state.level      ?? fallback.level;
  state.coins      = state.coins      ?? fallback.coins;
  state.unlocked   = state.unlocked   ?? fallback.unlocked;
  state.placements = state.placements ?? fallback.placements;
  state.world      = state.world      ?? fallback.world;
  state.timeline   = state.timeline   ?? fallback.timeline;
  state.stats      = state.stats      ?? fallback.stats;

  // if(state.version < 2){ /* future migration step goes here */ state.version = 2; }

  return state;
}
