/* ============================================================
   GOALS
   ============================================================
   Purpose:   Goals — daily/weekly/monthly/yearly targets with
              progress bars.
   Inputs:    Goals page controls; the "Add goal" modal.
   Outputs:   Mutates ud.goals; re-renders #goalsWrap.
   Depends on: storage.js (userData, persist), modal.js
              (openModal, closeModal, showToast), utils.js (uid),
              achievements.js (checkAchievements — a completed
              goal can unlock "Goal Getter" immediately).
   ============================================================ */
/* ============================================================
   GOALS
   ============================================================ */
let goalFilter='daily';
function setGoalFilter(g){ goalFilter=g; const ud=userData(); if(ud){ ud.uiState.goalFilter=g; persist(); } document.querySelectorAll('#goalFilterChips .chip').forEach(c=>c.classList.toggle('active', c.dataset.g===g)); renderGoals(); }
function openGoalModal(){
  openModal('Add goal', `
    <div class="field"><label>Goal title</label><input type="text" id="gTitle" placeholder="Read 12 books"></div>
    <div class="field-row">
      <div class="field"><label>Type</label><select id="gType"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
      <div class="field"><label>Category</label><input type="text" id="gCategory" value="Personal"></div>
    </div>
    <div class="field"><label>Target (units, e.g. 12)</label><input type="number" id="gTarget" value="1" min="1"></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveGoal()">Save</button>`);
}
function saveGoal(){
  const ud=userData(); const title=document.getElementById('gTitle').value.trim(); if(!title){ showToast('error','Title required'); return; }
  ud.goals.push({id:uid(), title, type:document.getElementById('gType').value, category:document.getElementById('gCategory').value, target:Number(document.getElementById('gTarget').value)||1, progress:0});
  persist(); closeModal(); renderGoals(); showToast('success','Goal added.');
}
function bumpGoal(id, delta){
  const ud=userData(); const g=ud.goals.find(x=>x.id===id); g.progress=Math.max(0, Math.min(g.target, g.progress+delta)); persist(); renderGoals(); checkAchievements();
}
function deleteGoal(id){ const ud=userData(); ud.goals=ud.goals.filter(g=>g.id!==id); persist(); renderGoals(); }
function renderGoals(){
  const ud=userData(); const wrap=document.getElementById('goalsWrap'); wrap.innerHTML='';
  const list=ud.goals.filter(g=>g.type===goalFilter);
  if(!list.length){ wrap.innerHTML='<div class="card glass empty-state" style="grid-column:1/-1"><div class="es-title">No '+goalFilter+' goals yet</div>Add one to start tracking.</div>'; return; }
  list.forEach(g=>{
    const pct=Math.round(g.progress/g.target*100);
    const card=document.createElement('div'); card.className='card glass';
    card.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div><div style="font-weight:700;font-size:15px;">${g.title}</div><div class="stat-label" style="margin-top:2px;">${g.category}</div></div>
      <button onclick="deleteGoal('${g.id}')" style="color:var(--text-3)"><i data-lucide="trash-2" style="width:15px;height:15px"></i></button>
    </div>
    <div class="bar-track" style="margin:16px 0 8px;"><div class="bar-fill" style="width:${pct}%"></div></div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="stat-label">${g.progress}/${g.target} (${pct}%)</span>
      <div style="display:flex;gap:6px;"><button class="btn-icon" style="width:30px;height:30px" onclick="bumpGoal('${g.id}',-1)"><i data-lucide="minus" style="width:14px;height:14px"></i></button><button class="btn-icon" style="width:30px;height:30px" onclick="bumpGoal('${g.id}',1)"><i data-lucide="plus" style="width:14px;height:14px"></i></button></div>
    </div>`;
    wrap.appendChild(card);
  });
  safeCreateIcons();
}

