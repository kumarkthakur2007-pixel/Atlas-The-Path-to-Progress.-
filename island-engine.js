/* ============================================================
   ISLAND ENGINE
   ============================================================
   Purpose:   The only place that decides when something unlocks.
              Evaluates ISLAND_ASSET_REGISTRY against the current
              islandState generically — adding a new asset to the
              registry is enough for it to start unlocking; this
              file never needs an if/else per asset.
   Inputs:    awardXP(amount, reason) — called from every feature
              file that should grant island progress.
   Outputs:   Mutates ud.island; returns newly-unlocked assets so
              the renderer/popup can react.
   Depends on: storage.js (userData, persist), island-state.js
              (createDefaultIslandState, migrateIslandState),
              island-assets.js (ISLAND_ASSET_REGISTRY).
   ============================================================ */

/** Dispatches on unlock.type — the only place that needs to grow when a new unlock TYPE (not asset) is introduced. */
function isIslandUnlockConditionMet(asset, state){
  const cond = asset.unlock;
  switch(cond.type){
    case 'xp':    return state.xp >= cond.value;
    case 'coins': return state.coins >= cond.value; // reserved for the future Island Store
    default:      return false;
  }
}

/** Scans the whole registry once; unlocks and timestamps anything newly eligible. Returns the list of newly-unlocked assets. */
function evaluateIslandUnlocks(state){
  const newlyUnlocked = [];
  getIslandAssetsSorted().forEach(asset=>{
    if(state.unlocked.includes(asset.id)) return;
    if(isIslandUnlockConditionMet(asset, state)){
      state.unlocked.push(asset.id);
      state.timeline.push({ assetId: asset.id, unlockedAt: new Date().toISOString() });
      newlyUnlocked.push(asset);
    }
  });
  return newlyUnlocked;
}

/** Simple, centralized, replaceable — every future "how does leveling work" tweak happens in this one function. */
function calcIslandLevel(xp){
  return Math.max(1, Math.floor(xp / 500) + 1);
}

/** The single entry point every feature module calls to grant island progress. */
function awardXP(amount, reason){
  if(!amount || amount <= 0) return;
  const ud = userData(); if(!ud) return;
  if(!ud.island) ud.island = createDefaultIslandState();
  ud.island = migrateIslandState(ud.island);

  ud.island.xp += amount;
  ud.island.stats.totalXPEarned += amount;
  ud.island.level = calcIslandLevel(ud.island.xp);

  const newlyUnlocked = evaluateIslandUnlocks(ud.island);
  persist();

  if(typeof onIslandXPChanged === 'function') onIslandXPChanged(amount, reason, newlyUnlocked);
}

/** Returns the next locked asset the user is closest to earning (for the HUD's "next unlock" preview). */
function getNextIslandUnlock(state){
  const locked = getIslandAssetsSorted().filter(a => !state.unlocked.includes(a.id) && a.unlock.type === 'xp');
  return locked.length ? locked[0] : null;
}
