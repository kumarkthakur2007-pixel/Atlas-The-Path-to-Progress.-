/* ============================================================
   PLANNER
   ============================================================
   Purpose:   Daily Planner — 24-hour timeline, add/delete
              color-coded events.
   Inputs:    Daily Planner page controls; the "Add event" modal.
   Outputs:   Mutates ud.events; re-renders #timelineWrap.
   Depends on: storage.js (userData, persist), modal.js
              (openModal, closeModal, showToast), utils.js
              (uid, todayStr).
   ============================================================ */
/* ============================================================
   PLANNER
   ============================================================ */
const CATCOLORS={Meeting:'#2F5F67', Study:'#6F9D24', Exercise:'#F5B942', Break:'#8FD65C', Other:'#4A5632'};
function openEventModal(){
  openModal('Add event', `
    <div class="field"><label>Title</label><input type="text" id="eTitle" placeholder="Team sync"></div>
    <div class="field-row">
      <div class="field"><label>Start time</label><input type="time" id="eStart" value="09:00"></div>
      <div class="field"><label>End time</label><input type="time" id="eEnd" value="10:00"></div>
    </div>
    <div class="field"><label>Category</label><select id="eCat"><option>Meeting</option><option>Study</option><option>Exercise</option><option>Break</option><option>Other</option></select></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveEvent()">Save event</button>`);
}
function saveEvent(){
  const ud=userData();
  const title=document.getElementById('eTitle').value.trim(); if(!title){ showToast('error','Event title required.'); return; }
  ud.events.push({id:uid(), title, start:document.getElementById('eStart').value, end:document.getElementById('eEnd').value, cat:document.getElementById('eCat').value, date:todayStr()});
  persist(); closeModal(); renderPlanner(); showToast('success','Event added.');
}
function deleteEvent(id){ const ud=userData(); ud.events=ud.events.filter(e=>e.id!==id); persist(); renderPlanner(); }
function setPlannerView(v,btn){ document.querySelectorAll('#page-planner .chip').forEach(c=>c.classList.remove('active')); btn.classList.add('active'); renderPlanner(); }
function renderPlanner(){
  const ud=userData();
  const wrap=document.getElementById('timelineWrap'); wrap.innerHTML='';
  for(let h=6; h<=22; h++){
    const row=document.createElement('div'); row.className='tl-row';
    const label=(h%12===0?12:h%12)+(h<12?' AM':' PM');
    row.innerHTML=`<div class="tl-hour">${label}</div><div class="tl-slot" id="slot-${h}"></div>`;
    wrap.appendChild(row);
  }
  ud.events.filter(e=>e.date===todayStr()).forEach(e=>{
    const h=Number((e.start||'09:00').split(':')[0]);
    const slot=document.getElementById('slot-'+h);
    if(slot){
      const el=document.createElement('div'); el.className='tl-event';
      el.style.background=CATCOLORS[e.cat]||'#6F9D24';
      el.innerHTML=`${e.title} <span style="opacity:.8;font-weight:600">(${e.start}–${e.end})</span> <button style="background:none;border:none;color:#fff;float:right;cursor:pointer" onclick="deleteEvent('${e.id}')">✕</button>`;
      slot.appendChild(el);
    }
  });
}

