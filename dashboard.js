/* ============================================================
   DASHBOARD
   ============================================================
   Purpose:   The Dashboard page — the Welcome/Progress hero,
              the 6 stat cards, This Week / Mini Calendar /
              Recent Activity / Quick Actions widgets, AND the
              widget customization system (drag-to-reorder,
              show/hide, save/reset layout). The hero itself is
              fixed and not part of the customizable widget grid
              by design (see docs/README.md).
   Inputs:    renderDashboard() — called after most user actions
              across the app, since the dashboard summarizes
              everything.
   Outputs:   Populates the dashboard DOM; mutates
              ud.dashboardLayout.
   Depends on: storage.js (userData, persist, DEFAULT_WIDGET_ORDER
              from constants.js), utils.js (fmtMoney,
              safeCreateIcons), achievements.js (checkAchievements).
   ============================================================ */
/* ============================================================
   DASHBOARD CUSTOMIZATION
   ============================================================ */
let draggedWidgetEl = null;
function applyDashboardLayout(){
  const ud=userData(); if(!ud) return;
  const grid=document.getElementById('widgetGrid'); if(!grid) return;
  const cards={};
  grid.querySelectorAll('.widget-card').forEach(c=>{ cards[c.dataset.widget]=c; });
  const order = ud.dashboardLayout.order.filter(id=>cards[id]);
  DEFAULT_WIDGET_ORDER.forEach(id=>{ if(!order.includes(id) && cards[id]) order.push(id); });
  order.forEach(id=>{ grid.appendChild(cards[id]); });
  grid.querySelectorAll('.widget-card').forEach(c=>{
    c.classList.toggle('widget-hidden', ud.dashboardLayout.hidden.includes(c.dataset.widget));
  });
}
function persistWidgetOrder(){
  const ud=userData(); if(!ud) return;
  const grid=document.getElementById('widgetGrid'); if(!grid) return;
  ud.dashboardLayout.order = Array.from(grid.children).map(c=>c.dataset.widget);
  persist();
}
function initWidgetDragAndDrop(){
  const grid=document.getElementById('widgetGrid'); if(!grid) return;
  grid.querySelectorAll('.widget-drag-handle').forEach(handle=>{
    handle.ondragstart = (e)=>{
      draggedWidgetEl = handle.closest('.widget-card');
      draggedWidgetEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    };
    handle.ondragend = ()=>{
      if(draggedWidgetEl) draggedWidgetEl.classList.remove('dragging');
      grid.querySelectorAll('.widget-card').forEach(c=>c.classList.remove('drag-target'));
      draggedWidgetEl = null;
      persistWidgetOrder();
    };
  });
  grid.querySelectorAll('.widget-card').forEach(card=>{
    card.ondragover = (e)=>{
      e.preventDefault();
      if(!draggedWidgetEl || draggedWidgetEl===card) return;
      grid.querySelectorAll('.widget-card').forEach(c=>c.classList.remove('drag-target'));
      card.classList.add('drag-target');
    };
    card.ondrop = (e)=>{
      e.preventDefault();
      if(!draggedWidgetEl || draggedWidgetEl===card) return;
      const cards = Array.from(grid.children);
      const draggedIdx = cards.indexOf(draggedWidgetEl);
      const targetIdx = cards.indexOf(card);
      if(draggedIdx < targetIdx) card.after(draggedWidgetEl); else card.before(draggedWidgetEl);
      card.classList.remove('drag-target');
    };
  });
}
function enterCustomizeMode(){
  const ud=userData();
  document.getElementById('widgetToolbar').classList.add('active');
  document.getElementById('widgetGrid').classList.add('customize-active');
  document.getElementById('customizeBtn').style.display='none';
  document.querySelectorAll('#widgetGrid .widget-card').forEach(c=>c.classList.remove('widget-hidden'));
  document.querySelectorAll('#widgetGrid .widget-hide-btn').forEach(btn=>{
    const id = btn.closest('.widget-card').dataset.widget;
    btn.innerHTML = ud.dashboardLayout.hidden.includes(id)
      ? '<i data-lucide="eye" style="width:14px;height:14px"></i>'
      : '<i data-lucide="eye-off" style="width:14px;height:14px"></i>';
  });
  initWidgetDragAndDrop();
  safeCreateIcons();
}
function exitCustomizeMode(){
  document.getElementById('widgetToolbar').classList.remove('active');
  document.getElementById('widgetGrid').classList.remove('customize-active');
  document.getElementById('customizeBtn').style.display='inline-flex';
  persistWidgetOrder();
  applyDashboardLayout();
  showToast('success','Dashboard layout saved.');
}
function toggleWidgetHidden(id){
  const ud=userData();
  const idx = ud.dashboardLayout.hidden.indexOf(id);
  if(idx>=0) ud.dashboardLayout.hidden.splice(idx,1); else ud.dashboardLayout.hidden.push(id);
  persist();
  const btn = document.querySelector('#widgetGrid .widget-card[data-widget="'+id+'"] .widget-hide-btn');
  if(btn){
    btn.innerHTML = ud.dashboardLayout.hidden.includes(id)
      ? '<i data-lucide="eye" style="width:14px;height:14px"></i>'
      : '<i data-lucide="eye-off" style="width:14px;height:14px"></i>';
    safeCreateIcons();
  }
}
function resetDashboardLayout(){
  const ud=userData();
  ud.dashboardLayout = { order: DEFAULT_WIDGET_ORDER.slice(), hidden: [] };
  persist();
  applyDashboardLayout();
  exitCustomizeMode();
  showToast('success','Dashboard reset to default layout.');
}


function renderDashboard(){
  const ud=userData(); const u=DB.users.find(x=>x.username===DB.session);
  const hour=new Date().getHours();
  document.getElementById('heroGreet').innerHTML = (hour<12?'Good morning':hour<18?'Good afternoon':'Good evening')+' <span aria-hidden="true">👋</span>';
  document.getElementById('heroName').textContent = ud.profile.name || u.name;
  const now=new Date();
  document.getElementById('heroDayNum').textContent = String(now.getDate()).padStart(2,'0');
  document.getElementById('heroWeekday').textContent = now.toLocaleDateString(undefined,{weekday:'long'});
  document.getElementById('heroMonthYear').textContent = now.toLocaleDateString(undefined,{month:'long', year:'numeric'});
  document.getElementById('heroQuote').textContent = '"'+QUOTES[now.getDate()%QUOTES.length]+'"';
  updateHeroClock();

  const todays = ud.tasks.filter(t=>t.due===todayStr() && !t.archived);
  const done = todays.filter(t=>t.completed).length;
  document.getElementById('statTasks').textContent = done+'/'+todays.length;
  document.getElementById('tasksDelta').textContent = todays.length? Math.round(done/todays.length*100)+'%':'';

  // Today's focus (welcome card foot)
  const pending = todays.filter(t=>!t.completed);
  document.getElementById('heroFocus').textContent = pending.length ? (pending.length===1? pending[0].title : pending.length+' tasks left') : 'All clear';

  const studyToday = (ud.studyLog[todayStr()]||0);
  document.getElementById('statStudy').textContent = studyToday.toFixed(1)+'h';

  const waterToday = (ud.health[todayStr()]?.water)||0;
  document.getElementById('statWater').textContent = waterToday;
  document.getElementById('statMood').textContent = ud.mood[todayStr()] || '—';

  // Goals stat (avg % progress across all goals)
  const goalPct = ud.goals.length ? Math.round(ud.goals.reduce((a,g)=>a+(g.progress/g.target*100),0)/ud.goals.length) : 0;
  document.getElementById('statGoals').textContent = goalPct+'%';
  document.getElementById('goalsDelta').textContent = ud.goals.length ? ud.goals.length+' active' : '';

  // Expenses stat (today's spend)
  const expToday = ud.expenses.filter(e=>e.type==='expense' && e.date===todayStr()).reduce((a,b)=>a+b.amount,0);
  document.getElementById('statExpenses').textContent = fmtMoney(expToday);

  // Overall progress ring: weighted average of tasks / study / habits / water / goals
  const taskPct = todays.length? (done/todays.length*100) : 0;
  const studyPct = ud.studyTargets.daily? Math.min(100, studyToday/ud.studyTargets.daily*100) : 0;
  const habitPct = ud.habits.length ? Math.round(ud.habits.filter(h=>h.days[todayStr()]).length/ud.habits.length*100) : 0;
  const waterPct = Math.min(100, waterToday/8*100);
  const pct = Math.round((taskPct+studyPct+habitPct+waterPct+goalPct)/5);
  const ring=document.getElementById('dashRing');
  const circumference=414.7;
  ring.setAttribute('stroke-dashoffset', circumference - (circumference*pct/100));
  document.getElementById('dashRingPct').textContent = pct+'%';
  document.getElementById('dashRingLabel').textContent = pct>=80?'Excellent momentum':pct>=50?'Good progress today':pct>0?'Just getting started':"Let's get started";

  // streak: consecutive days with >=1 completed task
  const streak = computeStreak(ud);
  document.getElementById('dashStreak').textContent = '🔥 '+streak+' day streak';

  // Progress card mini stat rows
  document.getElementById('prTasksVal').textContent = done+'/'+todays.length;
  document.getElementById('prTasksBar').style.width = taskPct+'%';
  document.getElementById('prStudyVal').textContent = studyToday.toFixed(1)+'h / '+ud.studyTargets.daily+'h';
  document.getElementById('prStudyBar').style.width = studyPct+'%';
  document.getElementById('prHabitVal').textContent = habitPct+'%';
  document.getElementById('prHabitBar').style.width = habitPct+'%';
  document.getElementById('prWaterVal').textContent = waterToday+'/8';
  document.getElementById('prWaterBar').style.width = waterPct+'%';
  document.getElementById('prStreakVal').textContent = streak+' days';
  document.getElementById('prStreakBar').style.width = Math.min(100, streak/30*100)+'%';
  document.getElementById('prGoalVal').textContent = goalPct+'%';
  document.getElementById('prGoalBar').style.width = goalPct+'%';

  // week summary bars
  const wrap=document.getElementById('weekSummaryBars'); wrap.innerHTML='';
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const monday=new Date(); monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
  days.forEach((day,i)=>{
    const dt=new Date(monday); dt.setDate(monday.getDate()+i);
    const key=dt.toISOString().slice(0,10);
    const cnt = ud.tasks.filter(t=>t.completedOn===key).length;
    const pctw = Math.min(100, cnt*25);
    const row=document.createElement('div');
    row.style.marginBottom='10px';
    row.innerHTML=`<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-2);margin-bottom:4px;"><span>${day}</span><span>${cnt} done</span></div><div class="bar-track"><div class="bar-fill" style="width:${pctw}%"></div></div>`;
    wrap.appendChild(row);
  });

  // mini calendar
  const cal=document.getElementById('miniCal'); cal.innerHTML='';
  ['S','M','T','W','T','F','S'].forEach(d=>{ const e=document.createElement('div'); e.className='dow'; e.textContent=d; cal.appendChild(e); });
  const first=new Date(now.getFullYear(),now.getMonth(),1);
  const startDow=first.getDay();
  const daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  for(let i=0;i<startDow;i++){ const b=document.createElement('div'); b.className='cell blank'; cal.appendChild(b); }
  for(let d1=1; d1<=daysInMonth; d1++){
    const c=document.createElement('div'); c.className='cell'+(d1===now.getDate()?' today':'');
    c.textContent=d1; cal.appendChild(c);
  }

  // activity feed
  const feed=document.getElementById('activityFeed'); feed.innerHTML='';
  if(!ud.activity.length){ feed.innerHTML='<div class="empty-state"><div class="es-title">No activity yet</div>Start by adding a task or logging a habit.</div>'; }
  ud.activity.slice(0,6).forEach(a=>{
    const el=document.createElement('div'); el.className='activity-item';
    el.innerHTML=`<div class="act-dot" style="background:var(--natural-green)"></div><div><div class="act-text">${a.text}</div><div class="act-time">${timeAgo(a.time)}</div></div>`;
    feed.appendChild(el);
  });
  safeCreateIcons();
  checkAchievements();
}
function updateHeroClock(){
  const el=document.getElementById('heroClock');
  if(!el) return;
  el.textContent = new Date().toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'});
}
setInterval(()=>{ if(document.getElementById('page-dashboard')?.classList.contains('active')) updateHeroClock(); }, 30000);
