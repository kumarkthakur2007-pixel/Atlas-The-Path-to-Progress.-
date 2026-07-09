/* ============================================================
   ISLAND (page orchestrator)
   ============================================================
   Purpose:   Wires the engine + renderer into the Atlas Island
              page — the HUD (XP bar, level, next-unlock preview),
              the unlock celebration popup, and the day/night
              clock. This is the only island file that touches
              page-level DOM outside the SVG itself.
   Inputs:    renderIslandPage() — called by router.js when the
              user navigates to #/island.
   Outputs:   Populates #page-island; shows the unlock popup.
   Depends on: storage.js (userData, persist), island-state.js,
              island-engine.js (awardXP, calcIslandLevel,
              getNextIslandUnlock), island-render.js
              (buildIslandScene, renderUnlockedAssets,
              refreshSkyAndSun), utils.js (safeCreateIcons,
              escapeHtml), animation.js (spawnConfetti).
   ============================================================ */

let _islandDayNightTimer = null;

function getIslandTimeOfDay(){
  const h = new Date().getHours();
  return (h >= 6 && h < 19) ? 'day' : 'night';
}

/** Called by router.js's goPage() when navigating to the Island page. */
function renderIslandPage(){
  const ud = userData(); if(!ud) return;
  if(!ud.island) ud.island = createDefaultIslandState();
  ud.island = migrateIslandState(ud.island);

  const liveTimeOfDay = getIslandTimeOfDay();
  if(ud.island.world.timeOfDay !== liveTimeOfDay){ ud.island.world.timeOfDay = liveTimeOfDay; persist(); }

  const container = document.getElementById('islandSvgRoot');
  if(container) buildIslandScene(container, ud.island);

  renderIslandHud(ud.island);

  clearInterval(_islandDayNightTimer);
  _islandDayNightTimer = setInterval(()=>{
    const ud2 = userData(); if(!ud2 || !ud2.island) return;
    const t = getIslandTimeOfDay();
    if(ud2.island.world.timeOfDay !== t){
      ud2.island.world.timeOfDay = t; persist();
      refreshSkyAndSun(ud2.island);
    }
  }, 5 * 60 * 1000);
}

function renderIslandHud(state){
  const xpIntoLevel = state.xp % 500;
  const xpBarPct = Math.round((xpIntoLevel / 500) * 100);
  const next = getNextIslandUnlock(state);

  const levelEl = document.getElementById('islandLevel');
  const xpEl = document.getElementById('islandXpLabel');
  const barEl = document.getElementById('islandXpBar');
  const nextEl = document.getElementById('islandNextUnlock');
  const countEl = document.getElementById('islandUnlockedCount');
  if(levelEl) levelEl.textContent = 'Level ' + state.level;
  if(xpEl) xpEl.textContent = state.xp + ' XP';
  if(barEl) barEl.style.width = xpBarPct + '%';
  if(countEl) countEl.textContent = state.unlocked.length + ' / ' + getIslandAssetsSorted().length + ' unlocked';
  if(nextEl){
    nextEl.textContent = next
      ? `Next: ${next.name} at ${next.unlock.value} XP (${Math.max(0, next.unlock.value - state.xp)} to go)`
      : 'Every Phase 1 object unlocked — more arrive in a future update.';
  }
}

/** The reaction hook island-engine.js calls after awardXP() changes state. Kept out of island-engine.js so that file stays DOM-free. */
function onIslandXPChanged(amount, reason, newlyUnlocked){
  const ud = userData(); if(!ud || !ud.island) return;

  const onIslandPage = document.getElementById('page-island')?.classList.contains('active');
  if(onIslandPage){
    renderUnlockedAssets(ud.island);
    renderIslandHud(ud.island);
  }

  newlyUnlocked.forEach(asset=> showIslandUnlockPopup(asset));
}

function showIslandUnlockPopup(asset){
  const overlay = document.createElement('div');
  overlay.className = 'achievement-overlay island-unlock-overlay';
  overlay.innerHTML = `<div class="achievement-popup glass">
      <div class="achievement-confetti" id="islandConfetti"></div>
      <div class="achievement-badge" style="background:linear-gradient(135deg,var(--natural-green),var(--accent));">
        <svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15" fill="none" stroke="#0F1A0C" stroke-width="2" opacity="0.25"/></svg>
      </div>
      <div class="achievement-unlocked-tag">Atlas Island</div>
      <div class="achievement-title">${escapeHtml(asset.name)}</div>
      <div class="achievement-desc">${escapeHtml(asset.description)}</div>
      <button class="btn btn-primary" style="width:100%;margin-top:22px;" onclick="dismissIslandUnlockPopup()">See my island</button>
    </div>`;
  document.body.appendChild(overlay);
  spawnConfetti(document.getElementById('islandConfetti'));
}
function dismissIslandUnlockPopup(){
  const el = document.querySelector('.island-unlock-overlay');
  if(el) el.remove();
  goPage('island');
}
