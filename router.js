/* ============================================================
   ROUTER
   ============================================================
   Purpose:   Client-side routing for the single-page app using
              the History API — hash routes (#/home, #/profile,
              #/study, #/calendar, #/settings, #/about, etc.),
              proper Back/Forward support, a direct-URL entry
              point (opening a link with a hash lands on that
              page), and the "press Back again to exit Atlas"
              confirmation on the Home page.
   Inputs:    goPage(pageId, opts) — the single public entry
              point every onclick="goPage('x')" in the HTML
              already calls; opts.replace / opts.fromHistory are
              internal flags used by this file only.
   Outputs:   Shows/hides .page sections; updates the URL hash;
              persists the current page to ud.uiState.page.
   Depends on: storage.js (userData, persist), sidebar.js
              (closeSidebar), and, indirectly, every render*()
              function each page hands off to (dashboard.js,
              tasks.js, profile.js, etc. — router.js doesn't
              import them, it just calls them by name, same as
              the rest of the app's classic-script model).
   ============================================================ */

// Page id -> hash segment. Anything not listed falls back to its own name.
const ROUTES = {
  dashboard:    'home',
  island:       'island',
  profile:      'profile',
  tasks:        'tasks',
  planner:      'calendar',
  study:        'study',
  goals:        'goals',
  expenses:     'expenses',
  habits:       'habits',
  health:       'health',
  journal:      'journal',
  achievements: 'achievements',
  analytics:    'analytics',
  settings:     'settings',
  about:        'about',
  admin:        'admin'
  // 'downloads' is reserved for the future Study Material Manager page —
  // add it here once that page exists (see docs/README.md).
};
const REVERSE_ROUTES = Object.fromEntries(Object.entries(ROUTES).map(([pageId, hash])=>[hash, pageId]));

function routeToHash(pageId){ return '#/' + (ROUTES[pageId] || pageId); }
function hashToRoute(hash){
  const clean = (hash || '').replace(/^#\/?/, '');
  return REVERSE_ROUTES[clean] || null;
}
/** Used once, at boot: prefer a route already in the URL (direct link / refresh) over the persisted last page. */
function resolveInitialRoute(fallbackPageId){
  return hashToRoute(location.hash) || fallbackPageId || 'dashboard';
}

let exitArmed = false, exitArmTime = 0;

function goPage(name, opts){
  opts = opts || {};
  const target = document.getElementById('page-'+name);
  if(!target) return;

  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  target.classList.add('active');
  document.querySelectorAll('.navlink').forEach(l=>l.classList.toggle('active', l.dataset.page===name));
  closeSidebar();

  if(name==='analytics') renderAnalytics();
  if(name==='admin') renderAdmin();
  if(name==='profile') renderProfile();
  if(name==='achievements') renderAchievements();
  if(name==='island') renderIslandPage();
  window.scrollTo({top:0, behavior:'smooth'});

  const ud = userData();
  if(ud){ ud.uiState.page = name; persist(); }

  if(!opts.fromHistory){
    exitArmed = false;
    const state = {atlasPage:name};
    const hash = routeToHash(name);
    if(opts.replace || !history.state){ history.replaceState(state, '', hash); }
    else if(history.state.atlasPage !== name){ history.pushState(state, '', hash); }
  }
}

window.addEventListener('popstate', (e)=>{
  const state = e.state;
  if(state && state.atlasPage){
    goPage(state.atlasPage, {fromHistory:true});
    return;
  }
  // No Atlas state on this entry — could be a hand-typed/bookmarked hash, or the user leaving the app.
  const hashRoute = hashToRoute(location.hash);
  if(hashRoute){
    history.replaceState({atlasPage:hashRoute}, '', location.hash);
    goPage(hashRoute, {fromHistory:true});
    return;
  }
  const activeEl = document.querySelector('.page.active');
  const activePage = activeEl ? activeEl.id.replace('page-','') : 'dashboard';
  if(activePage !== 'dashboard'){
    history.pushState({atlasPage:'dashboard'}, '', routeToHash('dashboard'));
    goPage('dashboard', {fromHistory:true});
    return;
  }
  const now = Date.now();
  if(exitArmed && (now-exitArmTime) < 2000){
    exitArmed = false; // second Back within the window — let the app actually exit
    return;
  }
  exitArmed = true; exitArmTime = now;
  showToast('info', 'Press back again to exit Atlas.');
  history.pushState({atlasPage:'dashboard'}, '', routeToHash('dashboard'));
});
