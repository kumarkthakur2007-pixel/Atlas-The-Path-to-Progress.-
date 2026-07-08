/* ============================================================
   UTILS
   ============================================================
   Purpose:   Small, dependency-free helper functions used across
              every feature module — safe wrappers around the
              Chart.js/Lucide CDNs, id/date/currency formatting,
              HTML escaping, and relative-time display.
   Inputs:    varies per function (see each function below).
   Outputs:   safeChart(), safeCreateIcons(), uid(), todayStr(),
              fmtMoney(), escapeHtml(), timeAgo() — all global.
   Depends on: constants.js (none directly, but loaded after it
              by convention).
   ============================================================ */
function safeChart(canvasEl, config){
  try{
    if(typeof Chart === 'undefined') { console.warn('Atlas: Chart.js not loaded — chart skipped'); return null; }
    return new Chart(canvasEl, config);
  } catch(e){ console.warn('Atlas: chart render skipped', e); return null; }
}


let __lucideRetries = 0;
function safeCreateIcons(){
  try{
    if(typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function'){
      lucide.createIcons();
    } else if(__lucideRetries < 20){
      __lucideRetries++;
      setTimeout(safeCreateIcons, 250); // CDN may still be loading; try again briefly
    }
  } catch(e){ console.warn('Atlas: icon render skipped', e); }
}


function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function fmtMoney(n){ return '₹'+Number(n||0).toLocaleString('en-IN'); }

function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function timeAgo(iso){
  const s=(Date.now()-new Date(iso).getTime())/1000;
  if(s<60) return 'just now';
  if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}
