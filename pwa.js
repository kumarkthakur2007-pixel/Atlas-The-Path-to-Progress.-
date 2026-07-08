/* ============================================================
   PWA
   ============================================================
   Purpose:   Service worker registration, the custom "Install
              Atlas" banner (beforeinstallprompt), and the
              top-bar offline indicator badge.
   Inputs:    none (all browser-driven events).
   Outputs:   Registers service-worker.js; shows/hides
              #installBanner and #offlineBadge.
   Depends on: modal.js (showToast, indirectly via achievements
              popup styling — not a hard dependency).
   ============================================================ */
/* ============================================================
   PWA: SERVICE WORKER REGISTRATION
   ============================================================ */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(()=>{ /* offline-first install or unsupported host; ignore */ });
  });
}


/* ============================================================
   PWA: INSTALL EXPERIENCE
   ============================================================ */
let deferredInstallPrompt = null;
function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredInstallPrompt = e;
  if(!isStandalone() && localStorage.getItem('atlas_install_dismissed')!=='1'){
    document.getElementById('installBanner').style.display='block';
    safeCreateIcons();
  }
});
function triggerInstall(){
  const banner=document.getElementById('installBanner');
  if(!deferredInstallPrompt){ banner.style.display='none'; return; }
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.finally(()=>{ deferredInstallPrompt=null; banner.style.display='none'; });
}
function dismissInstallBanner(){
  document.getElementById('installBanner').style.display='none';
  localStorage.setItem('atlas_install_dismissed','1');
}
window.addEventListener('appinstalled', ()=>{
  document.getElementById('installBanner').style.display='none';
  deferredInstallPrompt=null;
  showToast('success','Atlas installed — launch it from your home screen.');
});


/* ============================================================
   PWA: OFFLINE INDICATOR
   ============================================================ */
function updateOfflineBadge(){
  const badge=document.getElementById('offlineBadge');
  if(!badge) return;
  badge.style.display = navigator.onLine ? 'none' : 'inline-flex';
}
window.addEventListener('online', updateOfflineBadge);
window.addEventListener('offline', updateOfflineBadge);
document.addEventListener('DOMContentLoaded', updateOfflineBadge);


