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
  decoration:  { y: 306, xStart: 150, xEnd: 650, spacing: 130 }
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
