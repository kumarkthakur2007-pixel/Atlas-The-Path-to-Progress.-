/* ============================================================
   AUTH
   ============================================================
   Purpose:   Login, signup, OAuth-style demo buttons, guest
              login, logout, and the enterApp() bootstrap that
              runs once a session is established (wires up the
              signed-in user's profile, security settings, and
              hands off to the other render*() functions).
   Inputs:    #authForm submit, login/signup tab state.
   Outputs:   Mutates DB.session; calls enterApp()/logout().
   Depends on: storage.js (DB, persist, userData, newUserData),
              modal.js (showToast), pinlock.js (resetInactivityTimer,
              showLockScreen), profile.js (renderProfile),
              theme.js (applySettings), dashboard/tasks/etc.
              (initAllModules), router.js (goPage).
   ============================================================ */
/* ============================================================
   AUTH
   ============================================================ */
let authMode='login', remembered=false;
function setAuthMode(m){
  authMode=m;
  document.querySelectorAll('.tab-switch button').forEach(b=>b.classList.toggle('active', b.dataset.mode===m));
  document.getElementById('nameField').style.display = m==='signup'?'block':'none';
  document.getElementById('authErr').style.display='none';
}
function toggleRemember(e){
  e.preventDefault();
  remembered=!remembered;
  document.getElementById('rememberCheck').classList.toggle('on', remembered);
}
function oauthFake(provider){ showToast('info', provider+' sign-in simulated — continuing as guest.'); quickLoginGuest(); }
function quickLoginGuest(){
  const uname='guest_'+Math.floor(Math.random()*900+100);
  if(!DB.users.find(u=>u.username===uname)){
    DB.users.push({username:uname, password:'', role:'user', name:'Guest', email:''});
    DB.perUser[uname]=newUserData('Guest','');
  }
  DB.session=uname; persist(); enterApp();
}
function handleAuth(e){
  e.preventDefault();
  const user = document.getElementById('authUser').value.trim();
  const pass = document.getElementById('authPass').value;
  const errBox = document.getElementById('authErr');
  errBox.style.display='none';

  if(authMode==='signup'){
    const name = document.getElementById('authName').value.trim() || 'New User';
    if(!user || !pass){ errBox.textContent='Please fill in all fields.'; errBox.style.display='block'; return; }
    if(DB.users.find(u=>u.username===user)){ errBox.textContent='That username is already taken.'; errBox.style.display='block'; return; }
    DB.users.push({username:user, password:pass, role:'user', name, email:''});
    DB.perUser[user] = newUserData(name,'');
    DB.session = user; persist();
    showToast('success','Account created — welcome to Atlas!');
    enterApp();
    return;
  }

  const found = DB.users.find(u=>u.username===user);
  if(!found || (found.password!=='' && found.password!==pass)){
    errBox.textContent='Incorrect username or password.'; errBox.style.display='block'; return;
  }
  DB.session = user; persist();
  showToast('success','Welcome back, '+found.name+'!');
  enterApp();
}
function logout(){
  clearTimeout(inactivityTimer); clearTimeout(sessionTimeoutTimer);
  const lockEl=document.getElementById('lockScreen'); if(lockEl) lockEl.classList.add('hidden');
  DB.session=null; persist();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

function enterApp(){
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  const u = DB.users.find(x=>x.username===DB.session);
  const ud = userData();
  document.getElementById('userNameChip').textContent = u.name;
  document.getElementById('userRoleChip').textContent = u.role==='admin'?'Administrator':'Member';
  document.getElementById('userAvatar').textContent = (u.name||'A').slice(0,1).toUpperCase();
  document.getElementById('adminNav').style.display = u.role==='admin' ? 'block' : 'none';
  renderProfile();
  renderSecuritySettings();
  applySettings();
  initAllModules();

  // Restore remembered filters + search text
  taskFilter = ud.uiState.taskFilter || 'all';
  goalFilter = ud.uiState.goalFilter || 'daily';
  document.querySelectorAll('#taskFilterChips .chip').forEach(c=>c.classList.toggle('active', c.dataset.f===taskFilter));
  document.querySelectorAll('#goalFilterChips .chip').forEach(c=>c.classList.toggle('active', c.dataset.g===goalFilter));
  document.getElementById('taskSearch').value = ud.uiState.taskSearch || '';
  document.getElementById('journalSearch').value = ud.uiState.journalSearch || '';
  document.getElementById('expSearch').value = ud.uiState.expSearch || '';
  renderTasks(); renderGoals(); renderJournal(); renderExpenses();

  // Restore last page + establish the History API base state for back-button handling
  const restoredPage = resolveInitialRoute(ud.uiState.page);
  goPage(restoredPage, {replace:true});

  // Security: lock on startup + start the inactivity/auto-lock clock
  if(ud.security.pinEnabled && ud.security.lockOnStartup){ showLockScreen(); }
  resetInactivityTimer();

  safeCreateIcons();
}

