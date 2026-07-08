/* ============================================================
   ADMIN
   ============================================================
   Purpose:   Admin Panel — visible only to the admin role.
              User management (reset/delete), storage usage,
              global activity log across all accounts.
   Inputs:    Admin Panel page controls.
   Outputs:   Mutates DB.users / DB.perUser.
   Depends on: storage.js (DB, persist, newUserData), utils.js
              (safeCreateIcons).
   ============================================================ */
/* ============================================================
   ADMIN PANEL
   ============================================================ */
function renderAdmin(){
  document.getElementById('adminUsers').textContent = DB.users.length;
  document.getElementById('adminStorage').textContent = Math.round(JSON.stringify(DB).length/1024)+' KB';
  const allTasks = Object.values(DB.perUser).reduce((a,u)=>a+(u.tasks?.length||0),0);
  document.getElementById('adminTasks').textContent = allTasks;

  const wrap=document.getElementById('adminUserList'); wrap.innerHTML='';
  DB.users.forEach(u=>{
    const row=document.createElement('div'); row.className='task-row';
    row.innerHTML=`<div class="avatar" style="margin-right:4px;">${u.name.slice(0,1).toUpperCase()}</div>
    <div class="task-body"><div class="task-title">${u.name} <span class="stat-label">@${u.username}</span></div><div class="task-meta"><span class="pill ${u.role==='admin'?'pill-high':'pill-low'}">${u.role}</span></div></div>
    <div class="task-actions">
      <button onclick="adminResetUser('${u.username}')" title="Reset data"><i data-lucide="rotate-ccw"></i></button>
      ${u.username!=='admin'?`<button onclick="adminDeleteUser('${u.username}')" title="Delete"><i data-lucide="trash-2"></i></button>`:''}
    </div>`;
    wrap.appendChild(row);
  });
  const log=document.getElementById('adminActivityLog'); log.innerHTML='';
  const allActivity=[];
  Object.entries(DB.perUser).forEach(([uname,ud])=>{ (ud.activity||[]).forEach(a=>allActivity.push({...a, user:uname})); });
  allActivity.sort((a,b)=>new Date(b.time)-new Date(a.time));
  if(!allActivity.length){ log.innerHTML='<div class="empty-state">No activity recorded yet.</div>'; }
  allActivity.slice(0,20).forEach(a=>{
    const el=document.createElement('div'); el.className='activity-item';
    el.innerHTML=`<div class="act-dot" style="background:var(--deep-teal)"></div><div><div class="act-text">${a.user}: ${a.text}</div><div class="act-time">${timeAgo(a.time)}</div></div>`;
    log.appendChild(el);
  });
  safeCreateIcons();
}
function adminResetUser(uname){ if(!confirm('Reset all data for '+uname+'?')) return; DB.perUser[uname]=newUserData(); persist(); renderAdmin(); showToast('success','User data reset.'); }
function adminDeleteUser(uname){ if(!confirm('Delete user '+uname+'?')) return; DB.users=DB.users.filter(u=>u.username!==uname); delete DB.perUser[uname]; persist(); renderAdmin(); showToast('success','User deleted.'); }

