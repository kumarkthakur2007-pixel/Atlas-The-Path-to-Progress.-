/* ============================================================
   TASKS
   ============================================================
   Purpose:   Task Manager — full CRUD, priority, due date/time,
              category, notes, recurring flag, pin, archive,
              search/sort/filter.
   Inputs:    Task Manager page controls; the "Add task" modal.
   Outputs:   Mutates ud.tasks; re-renders #taskListWrap and the
              dashboard (task counts feed several widgets).
   Depends on: storage.js (userData, persist), modal.js
              (openModal, closeModal, showToast), utils.js
              (uid), dashboard.js (renderDashboard).
   ============================================================ */
/* ============================================================
   TASKS
   ============================================================ */
let taskFilter='all';
function setTaskFilter(f){ taskFilter=f; const ud=userData(); if(ud){ ud.uiState.taskFilter=f; persist(); } document.querySelectorAll('#taskFilterChips .chip').forEach(c=>c.classList.toggle('active', c.dataset.f===f)); renderTasks(); }
function openTaskModal(id){
  const ud=userData();
  const t = id ? ud.tasks.find(x=>x.id===id) : {id:null, title:'', priority:'Medium', due:todayStr(), time:'', category:'General', notes:'', completed:false, pinned:false, archived:false, recurring:'none'};
  openModal(id?'Edit task':'Add task', `
    <div class="field"><label>Title</label><input type="text" id="mTitle" value="${t.title||''}" placeholder="Finish design review"></div>
    <div class="field-row">
      <div class="field"><label>Priority</label><select id="mPriority"><option ${t.priority==='Low'?'selected':''}>Low</option><option ${t.priority==='Medium'?'selected':''}>Medium</option><option ${t.priority==='High'?'selected':''}>High</option></select></div>
      <div class="field"><label>Category</label><input type="text" id="mCategory" value="${t.category||'General'}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Due date</label><input type="date" id="mDue" value="${t.due||''}"></div>
      <div class="field"><label>Due time</label><input type="time" id="mTime" value="${t.time||''}"></div>
    </div>
    <div class="field"><label>Recurring</label><select id="mRecurring"><option value="none" ${t.recurring==='none'?'selected':''}>None</option><option value="daily" ${t.recurring==='daily'?'selected':''}>Daily</option><option value="weekly" ${t.recurring==='weekly'?'selected':''}>Weekly</option></select></div>
    <div class="field"><label>Notes</label><textarea id="mNotes" placeholder="Add details…">${t.notes||''}</textarea></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveTask('${id||''}')">Save task</button>`);
}
function saveTask(id){
  const ud=userData();
  const title=document.getElementById('mTitle').value.trim();
  if(!title){ showToast('error','Task title is required.'); return; }
  const data={
    title, priority:document.getElementById('mPriority').value, category:document.getElementById('mCategory').value||'General',
    due:document.getElementById('mDue').value, time:document.getElementById('mTime').value, notes:document.getElementById('mNotes').value,
    recurring:document.getElementById('mRecurring').value
  };
  if(id){ Object.assign(ud.tasks.find(x=>x.id===id), data); showToast('success','Task updated.'); }
  else{ ud.tasks.unshift({id:uid(), completed:false, pinned:false, archived:false, createdAt:Date.now(), ...data}); showToast('success','Task added.'); logActivity('Added task “'+title+'”'); }
  persist(); closeModal(); renderTasks(); renderDashboard();
}
function toggleTaskDone(id){
  const ud=userData(); const t=ud.tasks.find(x=>x.id===id);
  t.completed=!t.completed; t.completedOn = t.completed? todayStr() : null;
  persist(); if(t.completed){ logActivity('Completed “'+t.title+'”'); awardXP(10, 'task_completed'); }
  renderTasks(); renderDashboard();
}
function togglePin(id){ const ud=userData(); const t=ud.tasks.find(x=>x.id===id); t.pinned=!t.pinned; persist(); renderTasks(); }
function toggleArchive(id){ const ud=userData(); const t=ud.tasks.find(x=>x.id===id); t.archived=!t.archived; persist(); renderTasks(); }
function deleteTask(id){ if(!confirm('Delete this task?')) return; const ud=userData(); ud.tasks=ud.tasks.filter(x=>x.id!==id); persist(); renderTasks(); renderDashboard(); }
function renderTasks(){
  const ud=userData(); const q=(document.getElementById('taskSearch').value||'').trim().toLowerCase();
  ud.uiState.taskSearch=q; persist();
  const sort=document.getElementById('taskSort').value;
  let list=ud.tasks.filter(t=> !q || t.title.toLowerCase().includes(q) || (t.notes||'').toLowerCase().includes(q) || (t.category||'').toLowerCase().includes(q));
  if(taskFilter==='pending') list=list.filter(t=>!t.completed && !t.archived);
  else if(taskFilter==='completed') list=list.filter(t=>t.completed);
  else if(taskFilter==='pinned') list=list.filter(t=>t.pinned);
  else if(taskFilter==='archived') list=list.filter(t=>t.archived);
  else list=list.filter(t=>!t.archived);

  const prioRank={High:0,Medium:1,Low:2};
  if(sort==='priority') list.sort((a,b)=>prioRank[a.priority]-prioRank[b.priority]);
  else if(sort==='created') list.sort((a,b)=>b.createdAt-a.createdAt);
  else list.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  list.sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));

  const wrap=document.getElementById('taskListWrap');
  if(!list.length){ wrap.innerHTML='<div class="empty-state"><svg data-lucide="check-square" style="width:44px;height:44px;margin:0 auto 14px;opacity:.5"></svg><div class="es-title">No tasks here</div>Add one to get moving.</div>'; safeCreateIcons(); return; }
  wrap.innerHTML='';
  list.forEach(t=>{
    const row=document.createElement('div'); row.className='task-row';
    row.innerHTML=`
      <div class="task-check ${t.completed?'done':''}" onclick="toggleTaskDone('${t.id}')">${t.completed?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>':''}</div>
      <div class="task-body">
        <div class="task-title ${t.completed?'done':''}">${t.pinned?'<i data-lucide="pin" style="width:12px;height:12px" class="pinned-flag"></i> ':''}${t.title}</div>
        <div class="task-meta">
          <span class="pill pill-${t.priority.toLowerCase()}">${t.priority}</span>
          <span><i data-lucide="calendar"></i>${t.due||'No date'} ${t.time||''}</span>
          <span><i data-lucide="tag"></i>${t.category}</span>
          ${t.recurring!=='none'?`<span><i data-lucide="repeat"></i>${t.recurring}</span>`:''}
        </div>
      </div>
      <div class="task-actions">
        <button onclick="togglePin('${t.id}')" title="Pin"><i data-lucide="pin"></i></button>
        <button onclick="openTaskModal('${t.id}')" title="Edit"><i data-lucide="pencil"></i></button>
        <button onclick="toggleArchive('${t.id}')" title="Archive"><i data-lucide="archive"></i></button>
        <button onclick="deleteTask('${t.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>`;
    wrap.appendChild(row);
  });
  safeCreateIcons();
}

