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

const ISLAND_WEATHER_LABELS = {
  sunny: '☀️ Sunny', cloudy: '☁️ Cloudy', rain: '🌧️ Rain', storm: '⛈️ Storm',
  snow: '❄️ Snow', fog: '🌫️ Fog', rainbow: '🌈 Rainbow'
};
const ISLAND_SEASON_LABELS = {
  spring: '🌸 Spring', summer: '☀️ Summer', monsoon: '🌧️ Monsoon', autumn: '🍂 Autumn', winter: '❄️ Winter'
};

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

  const todayWeather = pickDailyWeather();
  if(ud.island.world.weather !== todayWeather){ ud.island.world.weather = todayWeather; persist(); }

  const currentSeason = pickCurrentSeason();
  if(ud.island.world.season !== currentSeason){ ud.island.world.season = currentSeason; persist(); }

  const container = document.getElementById('islandSvgRoot');
  if(container) buildIslandScene(container, ud.island);

  renderIslandHud(ud.island);
  renderIslandTimeline(ud.island);

  clearInterval(_islandDayNightTimer);
  _islandDayNightTimer = setInterval(()=>{
    const ud2 = userData(); if(!ud2 || !ud2.island) return;
    const t = getIslandTimeOfDay();
    const w = pickDailyWeather();
    let changed = false;
    if(ud2.island.world.timeOfDay !== t){ ud2.island.world.timeOfDay = t; changed = true; }
    if(ud2.island.world.weather !== w){ ud2.island.world.weather = w; changed = true; }
    if(changed){
      persist();
      refreshSkyAndSun(ud2.island);
      renderWeatherLayer(ud2.island);
      renderFogLayer(ud2.island);
      renderIslandHud(ud2.island);
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
  const weatherEl = document.getElementById('islandWeatherLabel');
  const seasonEl = document.getElementById('islandSeasonLabel');
  if(levelEl) levelEl.textContent = 'Level ' + state.level;
  if(xpEl) xpEl.textContent = state.xp + ' XP';
  if(barEl) barEl.style.width = xpBarPct + '%';
  if(countEl) countEl.textContent = state.unlocked.length + ' / ' + getIslandAssetsSorted().length + ' unlocked';
  if(weatherEl) weatherEl.textContent = ISLAND_WEATHER_LABELS[state.world.weather] || '☀️ Sunny';
  if(seasonEl) seasonEl.textContent = ISLAND_SEASON_LABELS[state.world.season] || '🌸 Spring';
  if(nextEl){
    nextEl.textContent = next
      ? `Next: ${next.name} at ${next.unlock.value} XP (${Math.max(0, next.unlock.value - state.xp)} to go)`
      : 'Every current object unlocked — more arrive in a future update.';
  }
}

/** Renders the permanent unlock history recorded in islandState.timeline (newest first). Purely additive — the data has been collected since Phase 1. */
function renderIslandTimeline(state){
  const wrap = document.getElementById('islandTimelineWrap');
  if(!wrap) return;
  if(!state.timeline.length){
    wrap.innerHTML = '<div class="empty-state" style="padding:24px 12px;"><div class="es-title">Your island\'s story starts now</div>Keep going — your first unlock is on its way.</div>';
    return;
  }
  const rows = state.timeline.slice().reverse().map(entry=>{
    const asset = ISLAND_ASSET_REGISTRY[entry.assetId];
    if(!asset) return '';
    const when = new Date(entry.unlockedAt);
    return `<div class="activity-item">
      <div class="act-dot" style="background:var(--natural-green)"></div>
      <div><div class="act-text">${escapeHtml(asset.name)} joined your island</div><div class="act-time">${when.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</div></div>
    </div>`;
  }).join('');
  wrap.innerHTML = rows;
}

/** Serializes the live SVG to a PNG and offers Share (if supported) or Save. CSS custom properties don't resolve in the isolated document a data-URL image parses in, so their resolved hex values get inlined into the clone first. */
function takeIslandPhoto(){
  if(!_islandSvgEl){ showToast('error','Open your island first.'); return; }
  const clone = _islandSvgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `svg{ --frost-white:#F8F9F7; --natural-green:#6F9D24; --deep-teal:#2F5F67; --olive-forest:#4A5632; --accent:#8FD65C; --danger:#E85B5B; --warning:#F5B942; --soft-lime:#D6E34B; --text-1:#1C2418; }`;
  clone.insertBefore(styleEl, clone.firstChild);

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = ()=>{
    const canvas = document.createElement('canvas');
    canvas.width = ISLAND_VIEWBOX.w * 2; // 2x for a crisp export
    canvas.height = ISLAND_VIEWBOX.h * 2;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    canvas.toBlob(async (blob)=>{
      if(!blob){ showToast('error','Could not create the image.'); return; }
      const fileName = 'atlas-island-' + todayStr() + '.png';
      const file = new File([blob], fileName, { type: 'image/png' });

      if(navigator.canShare && navigator.canShare({ files:[file] })){
        try{
          await navigator.share({ files:[file], title:'My Atlas Island', text:'My Atlas Island — Level ' + (userData()?.island?.level || 1) });
          return;
        }catch(e){ /* user cancelled, or share failed — fall through to a plain download */ }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      showToast('success','Photo saved.');
    }, 'image/png');
  };
  img.onerror = ()=>{ showToast('error','Could not capture your island.'); URL.revokeObjectURL(url); };
  img.src = url;
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
