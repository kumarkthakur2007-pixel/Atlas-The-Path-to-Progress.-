/* ============================================================
   THEME
   ============================================================
   Purpose:   Appearance settings only — dark/light mode, accent
              color, font size, and the animation on/off toggle.
              (Not to be confused with themes.css, which holds
              the actual [data-theme="dark"] CSS overrides this
              module switches on and off.)
   Inputs:    Settings page "Appearance" card controls.
   Outputs:   Mutates DB.settings; applies attributes/CSS vars
              to <html>/<body>.
   Depends on: storage.js (DB, persist), constants.js (ACCENTS).
   ============================================================ */
/* ============================================================
   THEME / SETTINGS
   ============================================================ */
function applySettings(){
  document.documentElement.setAttribute('data-theme', DB.settings.theme);
  document.getElementById('darkSwitch').classList.toggle('on', DB.settings.theme==='dark');
  document.getElementById('animSwitch').classList.toggle('on', DB.settings.anim);
  document.documentElement.style.setProperty('--natural-green', DB.settings.accent);
  document.documentElement.style.setProperty('--accent', DB.settings.accent);
  document.body.style.setProperty('--base-font-size', DB.settings.fontSize+'px');
  document.getElementById('fontSizeSel').value = DB.settings.fontSize;
  renderAccentSwatches();
}
function toggleTheme(){
  DB.settings.theme = DB.settings.theme==='dark'?'light':'dark';
  persist(); applySettings();
}
function toggleAnim(){ DB.settings.anim=!DB.settings.anim; persist(); applySettings(); }
function setFontSize(v){ DB.settings.fontSize=Number(v); persist(); applySettings(); }
function renderAccentSwatches(){
  const wrap = document.getElementById('accentSwatches'); wrap.innerHTML='';
  ACCENTS.forEach(c=>{
    const s=document.createElement('div');
    s.className='swatch'+(DB.settings.accent===c?' active':'');
    s.style.background=c;
    s.onclick=()=>{ DB.settings.accent=c; persist(); applySettings(); };
    wrap.appendChild(s);
  });
}
