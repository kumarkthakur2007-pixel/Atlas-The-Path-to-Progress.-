/* ============================================================
   SEARCH
   ============================================================
   Purpose:   The one universal search engine for the app — the
              top bar's live dropdown, searching across tasks,
              journal, habits, goals, study subjects, and
              expenses simultaneously. (Each page's own inline
              search box, e.g. taskSearch/expSearch/journalSearch,
              lives in that feature's own file since it only
              filters that one page's list — this file is
              specifically the cross-module global search.)
   Inputs:    #globalSearch input value.
   Outputs:   Populates #globalSearchResults with grouped,
              clickable hits.
   Depends on: storage.js (userData), utils.js (escapeHtml,
              fmtMoney, safeCreateIcons), router.js (goPage),
              tasks.js/journal.js/goals.js/expenses.js (their
              render*() functions, called when a result is
              clicked).
   ============================================================ */
function globalSearchHandler(v){
  const box = document.getElementById('globalSearchResults');
  const q = (v||'').trim().toLowerCase();
  if(!q){ box.style.display='none'; box.innerHTML=''; return; }
  const ud = userData(); if(!ud){ box.style.display='none'; return; }

  const groups = [];

  const taskHits = ud.tasks.filter(t=>t.title.toLowerCase().includes(q) || (t.notes||'').toLowerCase().includes(q));
  if(taskHits.length) groups.push({label:'Tasks', icon:'check-square', items:taskHits.slice(0,5).map(t=>({title:t.title, sub:t.due||'No date', action:()=>{ goPage('tasks'); document.getElementById('taskSearch').value=v; renderTasks(); }}))});

  const journalHits = ud.journal.filter(j=>j.text.toLowerCase().includes(q) || j.tags.some(tg=>tg.toLowerCase().includes(q)));
  if(journalHits.length) groups.push({label:'Journal', icon:'notebook-pen', items:journalHits.slice(0,5).map(j=>({title:j.text.slice(0,44)+(j.text.length>44?'…':''), sub:new Date(j.date).toLocaleDateString(), action:()=>{ goPage('journal'); document.getElementById('journalSearch').value=v; renderJournal(); }}))});

  const habitHits = ud.habits.filter(h=>h.name.toLowerCase().includes(q));
  if(habitHits.length) groups.push({label:'Habits', icon:'repeat', items:habitHits.slice(0,5).map(h=>({title:h.name, sub:'Habit', action:()=>{ goPage('habits'); }}))});

  const goalHits = ud.goals.filter(g=>g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q));
  if(goalHits.length) groups.push({label:'Goals', icon:'target', items:goalHits.slice(0,5).map(g=>({title:g.title, sub:g.type, action:()=>{ goPage('goals'); setGoalFilter(g.type); }}))});

  const subjectHits = ud.subjects.filter(s=>s.name.toLowerCase().includes(q));
  if(subjectHits.length) groups.push({label:'Study', icon:'book-open', items:subjectHits.slice(0,5).map(s=>({title:s.name, sub:(s.hours||0)+'h logged', action:()=>{ goPage('study'); }}))});

  const expenseHits = ud.expenses.filter(e=>e.category.toLowerCase().includes(q) || (e.note||'').toLowerCase().includes(q));
  if(expenseHits.length) groups.push({label:'Expenses', icon:'wallet', items:expenseHits.slice(0,5).map(e=>({title:e.category+(e.note?' · '+e.note:''), sub:fmtMoney(e.amount), action:()=>{ goPage('expenses'); document.getElementById('expSearch').value=v; renderExpenses(); }}))});

  window.__gsrActions = [];
  let html='';
  if(!groups.length){
    html = `<div class="gsr-empty">No results for "${escapeHtml(v)}"</div>`;
  } else {
    groups.forEach(g=>{
      html += `<div class="gsr-group">${g.label}</div>`;
      g.items.forEach(item=>{
        const idx = window.__gsrActions.length;
        window.__gsrActions.push(item.action);
        html += `<div class="gsr-item" onclick="window.__gsrActions[${idx}](); document.getElementById('globalSearchResults').style.display='none';">
          <i data-lucide="${g.icon}"></i>
          <div style="min-width:0;flex:1;"><div class="gsr-title">${escapeHtml(item.title||'Untitled')}</div><div class="gsr-sub">${escapeHtml(item.sub||'')}</div></div>
        </div>`;
      });
    });
  }
  box.innerHTML = html;
  box.style.display = 'block';
  safeCreateIcons();
}

document.addEventListener('click', (e)=>{
  const wrap = document.getElementById('globalSearchWrap');
  if(wrap && !wrap.contains(e.target)){ const box=document.getElementById('globalSearchResults'); if(box) box.style.display='none'; }
});
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){ const box=document.getElementById('globalSearchResults'); if(box) box.style.display='none'; }
});
