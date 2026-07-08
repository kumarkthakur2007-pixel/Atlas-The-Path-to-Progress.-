/* ============================================================
   SIDEBAR
   ============================================================
   Purpose:   Sidebar open/close on mobile (the hamburger button
              in the top bar). Nav-link active-state highlighting
              itself lives in router.js's goPage(), since that's
              inherently a routing concern — this file owns the
              sidebar's own visibility/interaction only.
   Inputs:    Menu button tap (mobile), any click that should
              close an open sidebar (link tap).
   Outputs:   Toggles the #sidebar.open class.
   Depends on: nothing.
   ============================================================ */
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
}
