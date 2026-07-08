/* ============================================================
   HABITS
   ============================================================
   Purpose:   Habit Tracker — daily check-ins, streaks, the
              30-day heatmap.
   Inputs:    Habit Tracker page controls; the "Add habit" modal.
   Outputs:   Mutates ud.habits; re-renders #habitListWrap and
              #habitHeatmap.
   Depends on: storage.js (userData, persist), modal.js
              (openModal, closeModal), utils.js (uid),
              dashboard.js (renderDashboard).
   ============================================================ */
/* ============================================================
   HABIT TRACKER
   ============================================================ */
const HABIT_ICONS=['dumbbell','book','flower-2','droplets','moon','code','footprints','pencil'];
function openHabitModal(){
  openModal('Add habit', `<div class="field"><label>Habit name</label><input type="text" id="hName" placeholder="Drink water"></div>
  <div class="field"><label>Icon</label><select id="hIcon">${HABIT_ICONS.map(i=>`<option value="${i}">${i}</option>`).join('')}</select></div>`,
  `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveHabit()">Add</button>`);
}
function saveHabit(){
  const ud=userData(); const name=document.getElementById('hName').value.trim(); if(!name) return;
  ud.habits.push({id:uid(), name, icon:document.getElementById('hIcon').value, days:{}});
  persist(); closeModal(); renderHabits();
}
function toggleHabitDay(id, offset){
  const ud=userData(); const h=ud.habits.find(x=>x.id===id);
  const d=new Date(); d.setDate(d.getDate()-offset); const key=d.toISOString().slice(0,10);
  h.days[key]=!h.days[key]; persist(); renderHabits(); renderDashboard();
}
function deleteHabit(id){ const ud=userData(); ud.habits=ud.habits.filter(h=>h.id!==id); persist(); renderHabits(); }
function habitStreak(h){
  let streak=0; let d=new Date();
  for(let i=0;i<365;i++){ const key=d.toISOString().slice(0,10); if(h.days[key]){ streak++; d.setDate(d.getDate()-1); } else break; }
  return streak;
}
function renderHabits(){
  const ud=userData(); const wrap=document.getElementById('habitListWrap'); wrap.innerHTML='';
  if(!ud.habits.length){ wrap.innerHTML='<div class="empty-state"><div class="es-title">No habits yet</div>Add one above to start your streak.</div>'; }
  ud.habits.forEach(h=>{
    const row=document.createElement('div'); row.className='habit-row';
    let daysHtml='';
    for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const key=d.toISOString().slice(0,10); const on=!!h.days[key];
      daysHtml+=`<div class="hd ${on?'on':''}" onclick="toggleHabitDay('${h.id}',${i})">${d.toLocaleDateString(undefined,{weekday:'narrow'})}</div>`; }
    row.innerHTML=`<div class="habit-icon" style="background:rgba(111,157,36,0.15)"><i data-lucide="${h.icon}" style="color:var(--natural-green)"></i></div>
    <div class="habit-name-block"><div style="font-weight:700;font-size:14px;">${h.name}</div><div class="stat-label">🔥 ${habitStreak(h)} day streak</div></div>
    <div class="habit-days">${daysHtml}</div>
    <button onclick="deleteHabit('${h.id}')" style="color:var(--text-3); margin-left:10px;"><i data-lucide="trash-2" style="width:15px;height:15px"></i></button>`;
    wrap.appendChild(row);
  });
  const heat=document.getElementById('habitHeatmap'); heat.innerHTML='';
  for(let i=29;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i); const key=d.toISOString().slice(0,10);
    const count=ud.habits.filter(h=>h.days[key]).length;
    let cls='heat-cell'; if(count>=3) cls+=' l3'; else if(count===2) cls+=' l2'; else if(count===1) cls+=' l1';
    const c=document.createElement('div'); c.className=cls; c.title=key+': '+count+' habits'; heat.appendChild(c);
  }
  safeCreateIcons();
}

