/* ============================================================
   ISLAND RENDER
   ============================================================
   Purpose:   Builds the layered SVG scene once, then updates
              individual layers independently — unlocking a new
              flower only touches <g id="layer-flower">, it never
              re-renders sky/ocean/ground/other objects. Phase 1
              implements Sky, Sun/Moon, Cloud, Ocean, Ground,
              Grass, Flower, Tree, Decoration, and Bridge layers.
              Every later-phase layer (Building, Citizen, Bird,
              Particle, Weather, Fog, Effects) is already present
              in the SVG scaffold as an empty <g>, so those phases
              only need to populate an existing group.
   Inputs:    buildIslandScene(containerEl) — call once when the
              Island page first renders. renderUnlockedAssets(),
              refreshSkyAndSun() — called whenever state changes.
   Outputs:   DOM nodes inside #islandSvgRoot.
   Depends on: island-assets.js (ISLAND_ASSET_REGISTRY,
              getIslandAssetsSorted), island-state.js (state
              shape only — this file never mutates state).
   ============================================================ */

const ISLAND_VIEWBOX = { w: 800, h: 460 };

// Reserved for Phase 1 and every future phase — adding a new phase almost
// always means populating one of the groups already declared here, not
// adding a new one.
const ISLAND_LAYER_IDS = [
  'sky', 'weather', 'fog', 'sun-moon', 'cloud', 'ocean', 'bridge', 'ground',
  'grass', 'flower', 'tree', 'decoration', 'building', 'citizen', 'animal',
  'bird', 'particle', 'effects'
];

// Deterministic placement bands per layer, so repeated unlocks in the same
// layer spread out along the island instead of stacking on top of each other.
// (Real collision-aware placement is reserved for the future Island Store.)
const ISLAND_PLACEMENT_BANDS = {
  flower:      { y: 300, xStart: 110, xEnd: 690, spacing: 46 },
  tree:        { y: 318, xStart: 90,  xEnd: 710, spacing: 90 },
  decoration:  { y: 306, xStart: 150, xEnd: 650, spacing: 130 },
  building:    { y: 322, xStart: 130, xEnd: 670, spacing: 150 }
};
const ISLAND_FIXED_PLACEMENT = {
  bridge_1: { x: 610, y: 316 }
};

let _islandSvgEl = null;

function svgEl(tag, attrs){
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs||{}).forEach(([k,v])=> el.setAttribute(k, v));
  return el;
}

/** Builds the full layered scene once. Safe to call again — it clears and rebuilds the scaffold, then re-populates from state. */
function buildIslandScene(containerEl, state){
  containerEl.innerHTML = '';
  const svg = svgEl('svg', {
    viewBox: `0 0 ${ISLAND_VIEWBOX.w} ${ISLAND_VIEWBOX.h}`,
    class: 'island-svg', 'aria-label': 'Atlas Island'
  });

  svg.appendChild(svgEl('defs')); // reserved for gradients added by refreshSkyAndSun()

  ISLAND_LAYER_IDS.forEach(name=>{
    svg.appendChild(svgEl('g', { id: `layer-${name}`, class: `island-layer island-layer-${name}` }));
  });

  containerEl.appendChild(svg);
  _islandSvgEl = svg;

  buildStaticGroundAndOcean();
  buildClouds();
  refreshSkyAndSun(state);
  renderWeatherLayer(state);
  renderFogLayer(state);
  renderSeasonalTint(state);
  renderUnlockedAssets(state); // draw everything already unlocked, no popups
}

/** Ocean + island landmass + grass crust — static shapes, drawn once. */
function buildStaticGroundAndOcean(){
  const ocean = document.getElementById('layer-ocean');
  ocean.innerHTML = `
    <rect x="0" y="0" width="${ISLAND_VIEWBOX.w}" height="${ISLAND_VIEWBOX.h}" fill="url(#oceanGradient)"/>
    <path class="island-wave" d="M0 40 Q 40 30 80 40 T 160 40 T 240 40 T 320 40 T 400 40 T 480 40 T 560 40 T 640 40 T 720 40 T 800 40 V0 H0 Z" fill="rgba(255,255,255,0.35)"/>
  `;
  const ground = document.getElementById('layer-ground');
  ground.innerHTML = `
    <ellipse cx="400" cy="360" rx="360" ry="95" fill="var(--olive-forest)" opacity="0.9"/>
    <ellipse cx="400" cy="345" rx="345" ry="82" fill="#8a6f3f" opacity="0.35"/>
  `;
  const grass = document.getElementById('layer-grass');
  grass.innerHTML = `<ellipse cx="400" cy="320" rx="330" ry="62" fill="var(--natural-green)"/>
    <ellipse cx="400" cy="312" rx="300" ry="50" fill="var(--accent)" opacity="0.28"/>`;
}

/** 3 soft drifting clouds — pure CSS animation (GPU-accelerated transform), no per-frame JS. */
function buildClouds(){
  const layer = document.getElementById('layer-cloud');
  const cloudDefs = [
    { cx: 120, cy: 70,  scale: 1.0, dur: '70s', delay: '0s'  },
    { cx: 420, cy: 45,  scale: 0.75, dur: '95s', delay: '-20s' },
    { cx: 650, cy: 90,  scale: 1.15, dur: '80s', delay: '-45s' }
  ];
  layer.innerHTML = cloudDefs.map((c,i)=>`
    <g class="island-cloud" style="animation-duration:${c.dur}; animation-delay:${c.delay};" transform="translate(${c.cx},${c.cy}) scale(${c.scale})">
      <ellipse cx="0" cy="0" rx="34" ry="14" fill="#fff" opacity="0.85"/>
      <ellipse cx="-20" cy="4" rx="20" ry="11" fill="#fff" opacity="0.8"/>
      <ellipse cx="22" cy="5" rx="24" ry="12" fill="#fff" opacity="0.8"/>
    </g>`).join('');
}

/** Sky gradient + sun/moon — the only two things that change with time of day. */
function refreshSkyAndSun(state){
  const defs = _islandSvgEl.querySelector('defs');
  const isNight = state.world.timeOfDay === 'night';

  defs.innerHTML = `
    <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
      ${isNight
        ? '<stop offset="0%" stop-color="#1B2A2E"/><stop offset="100%" stop-color="#2F5F67"/>'
        : '<stop offset="0%" stop-color="#CFEFE0"/><stop offset="100%" stop-color="#EAF6E3"/>'}
    </linearGradient>
    <linearGradient id="oceanGradient" x1="0" y1="0" x2="0" y2="1">
      ${isNight
        ? '<stop offset="0%" stop-color="#16323A"/><stop offset="100%" stop-color="#0F2327"/>'
        : '<stop offset="0%" stop-color="#8FD6D0"/><stop offset="100%" stop-color="#3AAAC0"/>'}
    </linearGradient>
  `;

  const sky = document.getElementById('layer-sky');
  sky.innerHTML = `<rect x="0" y="0" width="${ISLAND_VIEWBOX.w}" height="${ISLAND_VIEWBOX.h}" fill="url(#skyGradient)"/>`;
  if(isNight){
    let stars = '';
    for(let i=0;i<26;i++){
      const sx = (i*37 % ISLAND_VIEWBOX.w), sy = (i*53 % 180) + 10;
      stars += `<circle cx="${sx}" cy="${sy}" r="${(i%3===0)?1.6:1}" fill="#fff" class="island-star" style="animation-delay:${(i%5)*0.6}s;"/>`;
    }
    sky.innerHTML += stars;
  }

  const sunMoon = document.getElementById('layer-sun-moon');
  sunMoon.innerHTML = isNight
    ? `<circle cx="660" cy="70" r="26" fill="#F4F1E8"/><circle cx="670" cy="62" r="26" fill="url(#skyGradient)"/>`
    : `<circle cx="140" cy="75" r="34" fill="#F5D76E" class="island-sun"/>`;
}

/** Deterministic-per-day weighted random pick, so weather feels natural (stable within a day, changes daily) rather than flickering on every render. */
function pickDailyWeather(){
  const seedStr = new Date().toDateString();
  let seed = 0;
  for(let i=0;i<seedStr.length;i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;

  const totalWeight = ISLAND_WEATHER_TYPES.reduce((sum,w)=>sum+w.weight, 0);
  let roll = seed % totalWeight;
  for(const w of ISLAND_WEATHER_TYPES){
    if(roll < w.weight) return w.id;
    roll -= w.weight;
  }
  return 'sunny';
}

/** Populates <g id="layer-weather"> — rain/snow/storm/rainbow. Sunny/cloudy/fog render nothing here (cloudy = more clouds via buildClouds; fog = layer-fog below). */
function renderWeatherLayer(state){
  const layer = document.getElementById('layer-weather');
  if(!layer) return;
  const w = state.world.weather;
  layer.innerHTML = '';

  if(w === 'rain' || w === 'storm'){
    let drops = '';
    for(let i=0;i<40;i++){
      const x = (i * 53) % ISLAND_VIEWBOX.w;
      const delay = (i % 10) * 0.12;
      drops += `<line class="island-raindrop" x1="${x}" y1="0" x2="${x-6}" y2="18" stroke="rgba(255,255,255,0.55)" stroke-width="2" style="animation-delay:${delay}s;"/>`;
    }
    layer.innerHTML = drops;
    if(w === 'storm'){
      layer.innerHTML += `<rect class="island-lightning" x="0" y="0" width="${ISLAND_VIEWBOX.w}" height="${ISLAND_VIEWBOX.h}" fill="#fff" opacity="0"/>`;
    }
  } else if(w === 'snow'){
    let flakes = '';
    for(let i=0;i<34;i++){
      const x = (i * 61) % ISLAND_VIEWBOX.w;
      const delay = (i % 12) * 0.35;
      const size = 2 + (i % 3);
      flakes += `<circle class="island-snowflake" cx="${x}" cy="-10" r="${size}" fill="#fff" opacity="0.85" style="animation-delay:${delay}s;"/>`;
    }
    layer.innerHTML = flakes;
  } else if(w === 'rainbow'){
    layer.innerHTML = `<path d="M 60 300 A 300 300 0 0 1 740 300" fill="none" stroke-width="8" opacity="0.55"
      stroke="url(#rainbowGradient)"/>`;
    const defs = _islandSvgEl.querySelector('defs');
    defs.innerHTML += `<linearGradient id="rainbowGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E85B5B"/><stop offset="20%" stop-color="#F5B942"/>
      <stop offset="40%" stop-color="#D6E34B"/><stop offset="60%" stop-color="#6F9D24"/>
      <stop offset="80%" stop-color="#2F5F67"/><stop offset="100%" stop-color="#8FD65C"/>
    </linearGradient>`;
  }
}

/** Populates <g id="layer-fog"> — a slow-drifting translucent veil, only visible when weather is 'fog'. */
function renderFogLayer(state){
  const layer = document.getElementById('layer-fog');
  if(!layer) return;
  layer.innerHTML = state.world.weather === 'fog'
    ? `<rect class="island-fog-veil" x="-100" y="220" width="${ISLAND_VIEWBOX.w + 200}" height="140" fill="rgba(240,245,240,0.55)"/>`
    : '';
}


/** Ties the island's season to the real calendar month — intentional, not randomized. */
function pickCurrentSeason(){
  const month = new Date().getMonth();
  for(const [season, months] of Object.entries(ISLAND_SEASON_MONTHS)){
    if(months.includes(month)) return season;
  }
  return 'spring';
}

/** Per-season color tokens applied to the ground/grass/tree layers. Sky/ocean gradients are handled separately in refreshSkyAndSun so they can also account for day/night. */
const ISLAND_SEASON_TINTS = {
  spring:  { grass: 'var(--natural-green)', grassTop: 'var(--accent)',      treeFilter: 'none' },
  summer:  { grass: 'var(--natural-green)', grassTop: '#B8E86B',            treeFilter: 'saturate(1.1)' },
  monsoon: { grass: '#4C7A22',              grassTop: '#6F9D24',            treeFilter: 'saturate(0.9) brightness(0.95)' },
  autumn:  { grass: '#8A8F4A',              grassTop: '#C7B25A',            treeFilter: 'sepia(0.35) saturate(1.2)' },
  winter:  { grass: '#9FB59A',              grassTop: '#C9DCC4',            treeFilter: 'saturate(0.55) brightness(1.05)' }
};

/** Re-tints grass + trees for the current season. Ground shape itself never changes — only color, matching "objects appear gradually, nothing suddenly changes." */
function renderSeasonalTint(state){
  const season = state.world.season || 'spring';
  const tint = ISLAND_SEASON_TINTS[season] || ISLAND_SEASON_TINTS.spring;

  const grass = document.getElementById('layer-grass');
  if(grass){
    const base = grass.querySelector('ellipse:first-child');
    const top = grass.querySelector('ellipse:last-child');
    if(base) base.setAttribute('fill', tint.grass);
    if(top) top.setAttribute('fill', tint.grassTop);
  }
  const treeLayer = document.getElementById('layer-tree');
  if(treeLayer) treeLayer.style.filter = tint.treeFilter;
  const flowerLayer = document.getElementById('layer-flower');
  if(flowerLayer) flowerLayer.style.opacity = (season === 'winter') ? '0.45' : '1';
}


/** Draws every unlocked asset that isn't already in the DOM — the incremental part. Safe to call repeatedly. */
function renderUnlockedAssets(state){
  const slotCounts = {};
  getIslandAssetsSorted().forEach(asset=>{
    if(!state.unlocked.includes(asset.id)) return;
    if(document.getElementById(`island-obj-${asset.id}`)) return; // already drawn

    const layer = document.getElementById(`layer-${asset.layer}`);
    if(!layer) return;

    let pos = ISLAND_FIXED_PLACEMENT[asset.id];
    if(!pos){
      const band = ISLAND_PLACEMENT_BANDS[asset.layer] || { y: 300, xStart: 200, xEnd: 600, spacing: 60 };
      const slot = slotCounts[asset.layer] || 0;
      slotCounts[asset.layer] = slot + 1;
      const usableWidth = band.xEnd - band.xStart;
      const perRow = Math.max(1, Math.floor(usableWidth / band.spacing));
      const x = band.xStart + (slot % perRow) * band.spacing;
      const y = band.y - Math.floor(slot / perRow) * 26;
      pos = { x, y };
    }

    const wrapper = svgEl('g', { id: `island-obj-${asset.id}`, class: 'island-object-enter' });
    wrapper.innerHTML = asset.render(pos.x, pos.y);
    layer.appendChild(wrapper);
    requestAnimationFrame(()=> wrapper.classList.add('island-object-in'));
  });
}
