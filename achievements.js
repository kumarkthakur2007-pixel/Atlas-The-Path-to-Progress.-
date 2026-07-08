/* ============================================================
   ACHIEVEMENTS
   ============================================================
   Purpose:   The 8 auto-unlocking milestones — definitions,
              the check that runs after relevant user actions,
              the unlock popup, and the Achievements page render.
   Inputs:    checkAchievements() — called from dashboard.js
              (every render) and goals.js (bumpGoal) so unlocks
              are detected promptly.
   Outputs:   Mutates ud.achievements.unlocked; shows the popup;
              populates #achievementsWrap.
   Depends on: storage.js (userData, persist), utils.js
              (escapeHtml, safeCreateIcons), animation.js
              (spawnConfetti).
   ============================================================ */
/* ============================================================
   ACHIEVEMENTS
   ============================================================ */
function computeStreak(ud){
  let streak=0; let d=new Date();
  for(let i=0;i<365;i++){
    const key=d.toISOString().slice(0,10);
    const anyDone = ud.tasks.some(t=>t.completedOn===key);
    if(anyDone){ streak++; d.setDate(d.getDate()-1); } else break;
  }
  return streak;
}
const ACHIEVEMENTS = [
  {id:'first_login', title:'Welcome to Atlas', desc:'Signed in for the first time.', icon:'sparkles', check:()=>true},
  {id:'first_task', title:'Getting Started', desc:'Completed your first task.', icon:'check-square', check:(ud)=>ud.tasks.some(t=>t.completed)},
  {id:'streak_7', title:'Week Warrior', desc:'Reached a 7-day streak.', icon:'flame', check:(ud)=>computeStreak(ud)>=7},
  {id:'streak_30', title:'Monthly Master', desc:'Reached a 30-day streak.', icon:'flame', check:(ud)=>computeStreak(ud)>=30},
  {id:'consistency_master', title:'Consistency Master', desc:'Reached a 60-day streak.', icon:'award', check:(ud)=>computeStreak(ud)>=60},
  {id:'first_goal', title:'Goal Getter', desc:'Completed your first goal.', icon:'target', check:(ud)=>ud.goals.some(g=>g.target>0 && g.progress>=g.target)},
  {id:'tasks_100', title:'Centurion', desc:'Completed 100 tasks in total.', icon:'trophy', check:(ud)=>ud.tasks.filter(t=>t.completed).length>=100},
  {id:'study_50', title:'Scholar', desc:'Logged 50 hours of study.', icon:'book-open', check:(ud)=>Object.values(ud.studyLog).reduce((a,b)=>a+b,0)>=50},
];
let achievementQueue = [];
let achievementPopupShowing = false;
function checkAchievements(){
  const ud=userData(); if(!ud) return;
  ACHIEVEMENTS.forEach(a=>{
    if(ud.achievements.unlocked[a.id]) return;
    try{
      if(a.check(ud)){
        ud.achievements.unlocked[a.id] = new Date().toISOString();
        persist();
        achievementQueue.push(a);
      }
    }catch(e){ /* never let a bad check crash the app */ }
  });
  if(achievementQueue.length && !achievementPopupShowing) showNextAchievementPopup();
}
function showNextAchievementPopup(){
  if(!achievementQueue.length){ achievementPopupShowing=false; return; }
  achievementPopupShowing = true;
  const a = achievementQueue.shift();
  const overlay=document.createElement('div');
  overlay.className='achievement-overlay';
  overlay.innerHTML = `<div class="achievement-popup glass">
      <div class="achievement-confetti" id="achConfetti"></div>
      <div class="achievement-badge"><i data-lucide="${a.icon}"></i></div>
      <div class="achievement-unlocked-tag">Achievement Unlocked</div>
      <div class="achievement-title">${escapeHtml(a.title)}</div>
      <div class="achievement-desc">${escapeHtml(a.desc)}</div>
      <button class="btn btn-primary" style="width:100%;margin-top:22px;" onclick="dismissAchievementPopup()">Nice!</button>
    </div>`;
  document.body.appendChild(overlay);
  safeCreateIcons();
  spawnConfetti(document.getElementById('achConfetti'));
}
function dismissAchievementPopup(){
  const el=document.querySelector('.achievement-overlay');
  if(el){ el.style.opacity='0'; setTimeout(()=>el.remove(), 250); }
  setTimeout(showNextAchievementPopup, 300);
}

function renderAchievements(){
  const ud=userData(); if(!ud) return;
  const wrap=document.getElementById('achievementsWrap'); if(!wrap) return;
  const unlockedCount = ACHIEVEMENTS.filter(a=>ud.achievements.unlocked[a.id]).length;
  document.getElementById('achProgressLabel').textContent = unlockedCount+' / '+ACHIEVEMENTS.length+' unlocked';
  document.getElementById('achProgressBar').style.width = Math.round(unlockedCount/ACHIEVEMENTS.length*100)+'%';
  wrap.innerHTML='';
  ACHIEVEMENTS.forEach(a=>{
    const unlockedAt = ud.achievements.unlocked[a.id];
    const card=document.createElement('div');
    card.className='card glass achievement-card'+(unlockedAt?'':' locked');
    card.innerHTML = `<div class="ach-icon">${unlockedAt? `<i data-lucide="${a.icon}"></i>` : `<i data-lucide="lock"></i>`}</div>
      <div class="ach-title">${escapeHtml(a.title)}</div>
      <div class="ach-desc">${escapeHtml(a.desc)}</div>
      <div class="ach-status">${unlockedAt? 'Unlocked '+new Date(unlockedAt).toLocaleDateString() : 'Locked'}</div>`;
    wrap.appendChild(card);
  });
  safeCreateIcons();
}

