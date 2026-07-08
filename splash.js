/* ============================================================
   SPLASH
   ============================================================
   Purpose:   The cinematic ~3.1s launch animation — ambient
              particles, logo reveal, light sweep, wordmark,
              tagline, loader — shown once per browser session
              (gated by sessionStorage), with a hard 4s failsafe
              so it can never get stuck on screen regardless of
              errors elsewhere in startup.
   Inputs:    none.
   Outputs:   Removes #splashScreen from the DOM when done.
   Depends on: nothing (deliberately self-contained and
              defensive — see runLaunchSplash()'s try/catch).
   ============================================================ */
/* ============================================================
   LAUNCH SPLASH
   ============================================================ */
function dismissSplash(){
  const splash = document.getElementById('splashScreen');
  if(!splash) return;
  splash.classList.add('splash-exit');
  try{ sessionStorage.setItem('atlas_splash_shown','1'); }catch(e){ /* storage may be blocked in sandboxed previews */ }
  setTimeout(()=>{ try{ splash.remove(); }catch(e){} }, 520);
}
function runLaunchSplash(){
  try{
    const splash = document.getElementById('splashScreen');
    if(!splash || splash.style.display==='none') return; // already shown this session — skip entirely, no flash

    // Absolute failsafe: no matter what else happens (errors, slow devices, blocked APIs),
    // the splash is force-dismissed after 4s so it can never get stuck on screen.
    setTimeout(dismissSplash, 4000);

    // Ambient floating particles
    const host = document.getElementById('splashParticles');
    const colors = ['rgba(111,157,36,0.35)','rgba(143,214,92,0.35)','rgba(47,95,103,0.25)'];
    if(host){
      for(let i=0;i<18;i++){
        const p=document.createElement('div');
        p.className='splash-particle';
        const size = 2 + Math.random()*3;
        p.style.width = size+'px'; p.style.height = size+'px';
        p.style.left = Math.random()*100+'%';
        p.style.top = 20 + Math.random()*60+'%';
        p.style.background = colors[i%colors.length];
        p.style.animationDuration = (4+Math.random()*3)+'s';
        p.style.animationDelay = (Math.random()*3)+'s';
        host.appendChild(p);
      }
    }

    // Normal path: sequence finishes ~2.6s in, then a 500ms exit fade — ~3.1s total.
    setTimeout(dismissSplash, 2650);
  }catch(e){
    console.warn('Atlas: splash init failed, dismissing immediately', e);
    dismissSplash();
  }
}

