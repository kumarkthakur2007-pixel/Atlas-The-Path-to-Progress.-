/* ============================================================
   APP (entry point)
   ============================================================
   Purpose:   Boots the application. Loaded last, after every
              other module, so everything it calls already
              exists. Runs the launch splash first and wraps the
              rest of startup in a try/catch so a failure
              anywhere else can never block the splash from
              dismissing (see splash.js).
   Inputs:    none — runs on DOMContentLoaded.
   Outputs:   Calls enterApp() if a session exists; renders every
              page once; starts scroll-reveal observers.
   Depends on: every other module (this file is intentionally
              the last <script> tag in index.html).
   ============================================================ */
function initAllModules(){
  renderDashboard(); renderTasks(); renderPlanner(); renderStudy(); renderGoals();
  renderExpenses(); renderHabits(); renderHealth(); renderJournal();
  updatePomoDisplay();
  applyDashboardLayout();
}

document.addEventListener('DOMContentLoaded', ()=>{
  runLaunchSplash(); // always run first — must never be blocked by errors elsewhere in init
  try{
    safeCreateIcons();
    document.querySelectorAll('.atlas-logo-img').forEach(img=>{ img.src = ATLAS_LOGO_SRC; });
    if(DB.session){ enterApp(); }
    initScrollReveal();
  }catch(e){ console.warn('Atlas: startup init error (splash dismissal is unaffected)', e); }
});
