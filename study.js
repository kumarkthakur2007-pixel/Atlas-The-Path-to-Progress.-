/* ============================================================
   STUDY
   ============================================================
   Purpose:   Study Tracker — Pomodoro focus timer (25/5, 50/10,
              custom), subjects with logged hours, daily/weekly
              targets, and the 7-day study chart.
   Inputs:    Study Tracker page controls.
   Outputs:   Mutates ud.subjects / ud.studyLog / ud.studyTargets;
              re-renders the pomodoro ring and #subjectListWrap.
   Depends on: storage.js (userData, persist), modal.js
              (openModal, closeModal, showToast), utils.js
              (uid, todayStr), utils.js (safeChart), dashboard.js
              (renderDashboard).
   ============================================================ */
/* ============================================================
   STUDY TRACKER + POMODORO
   ============================================================ */
let pomo={ focus:25, brk:5, secondsLeft:25*60, running:false, mode:'Focus', interval:null };
function setPomoMode(f,b,btn){
  pomo.focus=f; pomo.brk=b; pomo.secondsLeft=f*60; pomo.mode='Focus'; pomoPause();
  document.querySelectorAll('.pomo-modes .chip').forEach(c=>c.classList.remove('active')); btn.classList.add('active');
  updatePomoDisplay();
}
function openCustomPomo(){
  openModal('Custom timer', `<div class="field-row"><div class="field"><label>Focus (min)</label><input type="number" id="cFocus" value="${pomo.focus}"></div><div class="field"><label>Break (min)</label><input type="number" id="cBreak" value="${pomo.brk}"></div></div>`,
  `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="applyCustomPomo()">Apply</button>`);
}
function applyCustomPomo(){
  const f=Number(document.getElementById('cFocus').value)||25, b=Number(document.getElementById('cBreak').value)||5;
  pomo.focus=f; pomo.brk=b; pomo.secondsLeft=f*60; pomo.mode='Focus'; pomoPause(); updatePomoDisplay(); closeModal();
}
function pomoToggle(){ pomo.running ? pomoPause() : pomoStart(); }
function pomoStart(){
  pomo.running=true; document.getElementById('pomoStartBtn').textContent='Pause';
  pomo.interval=setInterval(()=>{
    pomo.secondsLeft--;
    if(pomo.secondsLeft<=0){
      if(pomo.mode==='Focus'){
        logStudySession(pomo.focus/60);
        pomo.mode='Break'; pomo.secondsLeft=pomo.brk*60; showToast('success','Focus session complete — take a break!');
      } else {
        pomo.mode='Focus'; pomo.secondsLeft=pomo.focus*60; showToast('info','Break over — back to focus.');
      }
    }
    updatePomoDisplay();
  },1000);
}
function pomoPause(){ pomo.running=false; clearInterval(pomo.interval); const btn=document.getElementById('pomoStartBtn'); if(btn) btn.textContent='Start'; }
function pomoReset(){ pomoPause(); pomo.mode='Focus'; pomo.secondsLeft=pomo.focus*60; updatePomoDisplay(); }
function updatePomoDisplay(){
  const m=Math.floor(pomo.secondsLeft/60), s=pomo.secondsLeft%60;
  document.getElementById('pomoTime').textContent = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  document.getElementById('pomoState').textContent = pomo.mode;
  const total = (pomo.mode==='Focus'?pomo.focus:pomo.brk)*60;
  const circumference=616;
  const pct = 1-(pomo.secondsLeft/total);
  document.getElementById('pomoRing').setAttribute('stroke-dashoffset', circumference*(1-pct));
}
function logStudySession(hours){
  const ud=userData(); const k=todayStr();
  ud.studyLog[k]=(ud.studyLog[k]||0)+hours; persist();
  logActivity('Completed a '+Math.round(hours*60)+' min focus session');
  renderStudy(); renderDashboard();
  awardXP(Math.round(hours*20), 'study_session');
}
function saveStudyTargets(){
  const ud=userData();
  ud.studyTargets.daily=Number(document.getElementById('studyDailyTarget').value)||0;
  ud.studyTargets.weekly=Number(document.getElementById('studyWeeklyTarget').value)||0;
  persist(); renderStudy();
}
function openSubjectModal(){
  openModal('Add subject', `<div class="field"><label>Subject name</label><input type="text" id="sName" placeholder="Biology"></div>`,
  `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveSubject()">Add</button>`);
}
function saveSubject(){
  const ud=userData(); const name=document.getElementById('sName').value.trim(); if(!name) return;
  ud.subjects.push({id:uid(), name, hours:0}); persist(); closeModal(); renderStudy();
}
function addSubjectHours(id, delta){
  const ud=userData(); const s=ud.subjects.find(x=>x.id===id); s.hours=Math.max(0,(s.hours||0)+delta);
  const k=todayStr(); ud.studyLog[k]=(ud.studyLog[k]||0)+delta;
  persist(); renderStudy(); renderDashboard();
}
function deleteSubject(id){ const ud=userData(); ud.subjects=ud.subjects.filter(s=>s.id!==id); persist(); renderStudy(); }
let studyChartInst;
function renderStudy(){
  const ud=userData();
  document.getElementById('studyDailyTarget').value = ud.studyTargets.daily;
  document.getElementById('studyWeeklyTarget').value = ud.studyTargets.weekly;
  const todayH = ud.studyLog[todayStr()]||0;
  const pct = ud.studyTargets.daily? Math.min(100, Math.round(todayH/ud.studyTargets.daily*100)):0;
  document.getElementById('studyTargetBar').style.width=pct+'%';
  document.getElementById('studyTargetLabel').textContent = todayH.toFixed(1)+'h / '+ud.studyTargets.daily+'h today';

  const wrap=document.getElementById('subjectListWrap'); wrap.innerHTML='';
  ud.subjects.forEach(s=>{
    const row=document.createElement('div'); row.className='task-row';
    row.innerHTML=`<div class="task-body"><div class="task-title">${s.name}</div><div class="task-meta"><span>${(s.hours||0).toFixed(1)}h logged</span></div></div>
    <div class="task-actions">
      <button onclick="addSubjectHours('${s.id}',0.5)" title="Add 30 min"><i data-lucide="plus"></i></button>
      <button onclick="addSubjectHours('${s.id}',-0.5)" title="Remove 30 min"><i data-lucide="minus"></i></button>
      <button onclick="deleteSubject('${s.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
    </div>`;
    wrap.appendChild(row);
  });
  safeCreateIcons();

  const labels=[], data=[];
  for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const k=d.toISOString().slice(0,10); labels.push(d.toLocaleDateString(undefined,{weekday:'short'})); data.push(ud.studyLog[k]||0); }
  if(studyChartInst) studyChartInst.destroy();
  studyChartInst = safeChart(document.getElementById('studyChart'), {
    type:'bar', data:{labels, datasets:[{data, backgroundColor:'#6F9D24', borderRadius:8, maxBarThickness:26}]},
    options:{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, grid:{color:'rgba(111,157,36,0.08)'}}, x:{grid:{display:false}}}}
  });
}

