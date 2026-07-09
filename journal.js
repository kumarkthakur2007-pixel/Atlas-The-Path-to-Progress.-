/* ============================================================
   JOURNAL
   ============================================================
   Purpose:   Journal — diary/gratitude entries with mood and
              tags, search.
   Inputs:    Journal page controls; the "New entry" modal.
   Outputs:   Mutates ud.journal / ud.mood; re-renders
              #journalWrap.
   Depends on: storage.js (userData, persist), modal.js
              (openModal, closeModal, showToast), utils.js (uid),
              dashboard.js (renderDashboard — today's mood shows
              on the dashboard).
   ============================================================ */
/* ============================================================
   JOURNAL
   ============================================================ */
const MOODS=['😄','🙂','😐','😔','😢'];
function openJournalModal(){
  openModal('New journal entry', `
    <div class="field"><label>Mood</label><div style="display:flex;gap:8px;">${MOODS.map(m=>`<button type="button" onclick="selectMood('${m}',this)" style="font-size:22px;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.4)" class="mood-btn">${m}</button>`).join('')}</div></div>
    <div class="field"><label>Entry</label><textarea id="jText" rows="6" placeholder="What's on your mind today?"></textarea></div>
    <div class="field"><label>Tags (comma separated)</label><input type="text" id="jTags" placeholder="gratitude, work, reflection"></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveJournal()">Save entry</button>`);
  window.selectedMood='🙂';
}
function selectMood(m,btn){ window.selectedMood=m; document.querySelectorAll('.mood-btn').forEach(b=>b.style.background='rgba(255,255,255,.4)'); btn.style.background='rgba(111,157,36,0.25)'; }
function saveJournal(){
  const ud=userData(); const text=document.getElementById('jText').value.trim(); if(!text){ showToast('error','Write something first.'); return; }
  ud.journal.unshift({id:uid(), text, mood:window.selectedMood||'🙂', tags:(document.getElementById('jTags').value||'').split(',').map(t=>t.trim()).filter(Boolean), date:new Date().toISOString()});
  ud.mood[todayStr()]=window.selectedMood;
  persist(); closeModal(); renderJournal(); showToast('success','Entry saved.'); renderDashboard();
  awardXP(10, 'journal_entry');
}
function deleteJournal(id){ const ud=userData(); ud.journal=ud.journal.filter(j=>j.id!==id); persist(); renderJournal(); }
function renderJournal(){
  const ud=userData(); const q=(document.getElementById('journalSearch').value||'').trim().toLowerCase();
  ud.uiState.journalSearch=q; persist();
  const wrap=document.getElementById('journalWrap');
  const list=ud.journal.filter(j=>j.text.toLowerCase().includes(q) || j.tags.some(t=>t.toLowerCase().includes(q)));
  if(!list.length){ wrap.innerHTML='<div class="card glass empty-state"><div class="es-title">Your journal is empty</div>Write your first entry today.</div>'; return; }
  wrap.innerHTML='';
  list.forEach(j=>{
    const el=document.createElement('div'); el.className='journal-entry glass card';
    el.innerHTML=`<div class="journal-head"><span class="journal-date">${new Date(j.date).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}</span><span class="mood-tag">${j.mood}</span></div>
    <div class="journal-text">${j.text.replace(/</g,'&lt;')}</div>
    <div class="tag-row">${j.tags.map(t=>`<span class="tag-chip">#${t}</span>`).join('')}</div>
    <div style="text-align:right;margin-top:10px;"><button onclick="deleteJournal('${j.id}')" style="color:var(--text-3)"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button></div>`;
    wrap.appendChild(el);
  });
  safeCreateIcons();
}

