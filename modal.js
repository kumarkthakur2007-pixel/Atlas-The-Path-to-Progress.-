/* ============================================================
   MODAL & TOAST COMPONENTS
   ============================================================
   Purpose:   The two shared UI primitives every feature module
              uses to talk to the user — dismissible toast
              notifications and the generic glass modal dialog
              (used for task/goal/expense/PIN forms, etc.).
   Inputs:    showToast(type, message); openModal(title, bodyHTML,
              footerHTML); closeModal().
   Outputs:   DOM nodes appended to #toastHost / document.body.
   Depends on: utils.js (safeCreateIcons).
   ============================================================ */

/* ---------------- Toasts ---------------- */
function showToast(type,msg){
  const host = document.getElementById('toastHost');
  const icons = {success:'check-circle', error:'x-circle', info:'info'};
  const el = document.createElement('div');
  el.className = 'toast glass '+type;
  el.innerHTML = `<i data-lucide="${icons[type]||'info'}"></i><span>${msg}</span>`;
  host.appendChild(el);
  safeCreateIcons();
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateX(30px)'; setTimeout(()=>el.remove(),300); }, 3200);
}


function openModal(title, bodyHTML, footHTML){
  const existing=document.getElementById('dynModal'); if(existing) existing.remove();
  const overlay=document.createElement('div');
  overlay.className='modal-overlay'; overlay.id='dynModal';
  overlay.onclick=(e)=>{ if(e.target===overlay) closeModal(); };
  overlay.innerHTML=`<div class="modal-box glass">
    <div class="modal-head"><div class="modal-title">${title}</div><button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button></div>
    <div id="modalBody">${bodyHTML}</div>
    <div class="modal-foot">${footHTML||''}</div>
  </div>`;
  document.body.appendChild(overlay);
  safeCreateIcons();
}
function closeModal(){ const m=document.getElementById('dynModal'); if(m) m.remove(); }
