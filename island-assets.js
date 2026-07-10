/* ============================================================
   ISLAND ASSET REGISTRY
   ============================================================
   Purpose:   The single source of truth for every unlockable
              Atlas Island object — flowers, trees, decorations,
              buildings, animals, effects, everything. Adding a
              new asset in any future phase means adding ONE
              entry here. Nothing else in the engine, renderer,
              or unlock logic should ever need to change.

   Asset shape:
     id          unique string, also used as the DOM element id
                 prefix and the key stored in islandState.unlocked
     name        display name (unlock toast, timeline, tooltip)
     description short flavor line shown when it unlocks
     category    'decoration' | 'tree' | 'structure' | 'building'
                 | 'animal' | 'effect'  (drives default styling
                 and future store grouping)
     layer       which <g id="layer-*"> in the SVG this renders
                 into — layers are declared in island-render.js
     unlock      generic condition object. Phase 1 only uses
                 {type:'xp', value:N}, but the engine dispatches
                 on `type`, so {type:'coins', value:N} or
                 {type:'challenge', id:'...'} can be added later
                 without touching island-engine.js.
     footprint   {w,h} — reserved for future collision-aware
                 placement (the Island Store's drag-and-place).
     render(x,y) returns an SVG markup string for this asset at
                 a given position. Kept in this same file, next
                 to the entry that uses it, so a whole asset can
                 be added/removed by touching one contiguous block.

   Depends on: nothing (pure data + pure rendering functions,
              no DOM access, no state access).
   ============================================================ */

function svgFlower(x, y){
  return `<g class="island-asset" transform="translate(${x},${y})">
    <line x1="0" y1="0" x2="0" y2="-14" stroke="var(--natural-green)" stroke-width="2" stroke-linecap="round"/>
    <g transform="translate(0,-18)">
      <circle cx="0" cy="0" r="3.2" fill="#F5B942"/>
      <ellipse cx="0" cy="-5.5" rx="3" ry="4.5" fill="var(--accent)" opacity="0.9"/>
      <ellipse cx="5.2" cy="-1.7" rx="3" ry="4.5" fill="var(--accent)" opacity="0.9" transform="rotate(72 5.2 -1.7)"/>
      <ellipse cx="3.2" cy="4.4" rx="3" ry="4.5" fill="var(--accent)" opacity="0.9" transform="rotate(144 3.2 4.4)"/>
      <ellipse cx="-3.2" cy="4.4" rx="3" ry="4.5" fill="var(--accent)" opacity="0.9" transform="rotate(216 -3.2 4.4)"/>
      <ellipse cx="-5.2" cy="-1.7" rx="3" ry="4.5" fill="var(--accent)" opacity="0.9" transform="rotate(288 -5.2 -1.7)"/>
    </g>
  </g>`;
}

function svgSapling(x, y){
  return `<g class="island-asset" transform="translate(${x},${y})">
    <rect x="-1.6" y="-18" width="3.2" height="18" rx="1.4" fill="var(--olive-forest)"/>
    <ellipse cx="0" cy="-26" rx="13" ry="15" fill="var(--natural-green)"/>
    <ellipse cx="-4" cy="-30" rx="7" ry="8" fill="var(--accent)" opacity="0.55"/>
  </g>`;
}

function svgBench(x, y){
  return `<g class="island-asset" transform="translate(${x},${y})">
    <rect x="-14" y="-10" width="28" height="3" rx="1.4" fill="var(--olive-forest)"/>
    <rect x="-14" y="-18" width="28" height="2.4" rx="1.2" fill="var(--olive-forest)" opacity="0.85"/>
    <rect x="-12" y="-7" width="2.4" height="7" fill="var(--olive-forest)"/>
    <rect x="9.6" y="-7" width="2.4" height="7" fill="var(--olive-forest)"/>
    <rect x="-12" y="-18" width="2" height="8" fill="var(--olive-forest)" opacity="0.85"/>
    <rect x="10" y="-18" width="2" height="8" fill="var(--olive-forest)" opacity="0.85"/>
  </g>`;
}

function svgBridge(x, y){
  return `<g class="island-asset" transform="translate(${x},${y})">
    <path d="M -34 0 Q 0 -30 34 0" stroke="var(--frost-white)" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M -34 0 Q 0 -30 34 0" stroke="var(--deep-teal)" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.18" stroke-dasharray="2 6"/>
    <line x1="-34" y1="0" x2="-34" y2="7" stroke="var(--deep-teal)" stroke-width="3"/>
    <line x1="34" y1="0" x2="34" y2="7" stroke="var(--deep-teal)" stroke-width="3"/>
  </g>`;
}

function svgHouse(x, y){
  return `<g class="island-asset" transform="translate(${x},${y})">
    <rect x="-18" y="-24" width="36" height="26" fill="var(--frost-white)" stroke="var(--olive-forest)" stroke-width="1.2"/>
    <path d="M -22 -24 L 0 -42 L 22 -24 Z" fill="var(--deep-teal)"/>
    <rect x="-5" y="-10" width="10" height="10" fill="var(--olive-forest)"/>
    <rect x="-14" y="-19" width="7" height="7" fill="var(--accent)" opacity="0.85"/>
    <rect x="7" y="-19" width="7" height="7" fill="var(--accent)" opacity="0.85"/>
    <rect x="-2" y="-45" width="3" height="8" fill="var(--olive-forest)"/>
  </g>`;
}

function svgLibrary(x, y){
  return `<g class="island-asset" transform="translate(${x},${y})">
    <rect x="-24" y="-28" width="48" height="28" fill="var(--frost-white)" stroke="var(--deep-teal)" stroke-width="1.2"/>
    <path d="M -28 -28 L 0 -44 L 28 -28 Z" fill="var(--olive-forest)"/>
    <rect x="-19" y="-24" width="4" height="24" fill="var(--deep-teal)" opacity="0.8"/>
    <rect x="-10" y="-24" width="4" height="24" fill="var(--deep-teal)" opacity="0.8"/>
    <rect x="-1" y="-24" width="4" height="24" fill="var(--deep-teal)" opacity="0.8"/>
    <rect x="8" y="-24" width="4" height="24" fill="var(--deep-teal)" opacity="0.8"/>
    <rect x="17" y="-24" width="4" height="24" fill="var(--deep-teal)" opacity="0.8"/>
  </g>`;
}

const ISLAND_ASSET_REGISTRY = {
  flower_1: {
    id: 'flower_1', name: 'Wildflower', category: 'decoration', layer: 'flower',
    unlock: { type: 'xp', value: 100 }, footprint: { w: 12, h: 20 },
    description: 'Blooms as your journey begins.', render: svgFlower
  },
  tree_1: {
    id: 'tree_1', name: 'Sapling', category: 'tree', layer: 'tree',
    unlock: { type: 'xp', value: 300 }, footprint: { w: 26, h: 44 },
    description: 'Your first tree takes root.', render: svgSapling
  },
  bench_1: {
    id: 'bench_1', name: 'Garden Bench', category: 'decoration', layer: 'decoration',
    unlock: { type: 'xp', value: 600 }, footprint: { w: 28, h: 18 },
    description: 'A place to pause and reflect.', render: svgBench
  },
  bridge_1: {
    id: 'bridge_1', name: 'Stone Bridge', category: 'structure', layer: 'bridge',
    unlock: { type: 'xp', value: 1000 }, footprint: { w: 70, h: 30 },
    description: 'Connecting new paths on your island.', render: svgBridge
  },
  house_1: {
    id: 'house_1', name: 'Cozy House', category: 'building', layer: 'building',
    unlock: { type: 'xp', value: 2000 }, footprint: { w: 44, h: 50 },
    description: 'A home takes shape on your island.', render: svgHouse
  },
  library_1: {
    id: 'library_1', name: 'Little Library', category: 'building', layer: 'building',
    unlock: { type: 'xp', value: 5000 }, footprint: { w: 56, h: 55 },
    description: 'Knowledge finds a home here.', render: svgLibrary
  }
  // Phase 3+: park_1, school_1, town_hall_1, temple_1, harbor_1, airport_1,
  // civilization_1 — plus animals/effects — all get added here, each with
  // its own render() function above. The engine, renderer, and unlock
  // logic never need to change.
};

/** Weather types available for random daily generation. Not part of the unlock
    registry — weather is a world condition, not something the user earns. */
const ISLAND_WEATHER_TYPES = [
  { id: 'sunny',   weight: 5 },
  { id: 'cloudy',  weight: 3 },
  { id: 'rain',    weight: 2 },
  { id: 'fog',     weight: 1 },
  { id: 'storm',   weight: 1 },
  { id: 'snow',    weight: 1 },
  { id: 'rainbow', weight: 1 }
];

/** Registry entries in ascending unlock-value order (used by the engine and the HUD's "next unlock" preview). */
function getIslandAssetsSorted(){
  return Object.values(ISLAND_ASSET_REGISTRY).sort((a,b)=>(a.unlock.value||0) - (b.unlock.value||0));
}
