/* ============================================================
   PIN LOCK
   ============================================================
   Purpose:   App PIN lock — set/change/disable PIN, forgot-PIN
              recovery via login password, lock-on-startup,
              inactivity auto-lock, and session-timeout logout.
   Inputs:    Settings > Security card controls; the lock screen
              keypad.
   Outputs:   Mutates ud.security; shows/hides #lockScreen.
   Depends on: storage.js (userData, persist, DB), utils.js
              (safeCreateIcons), modal.js (openModal, closeModal,
              showToast).
   ============================================================ */
/* ============================================================
   SECURITY: PIN LOCK
   ============================================================ */
async function sha256Hex(str){
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
const PIN_LENGTH = 4;
let pinBuffer = '';
let inactivityTimer = null, sessionTimeoutTimer = null;

function renderSecuritySettings(){
  const ud=userData(); if(!ud) return;
  document.getElementById('pinEnableSwitch').classList.toggle('on', ud.security.pinEnabled);
  document.getElementById('pinManageRows').style.opacity = ud.security.pinEnabled ? '1' : '.45';
  document.getElementById('pinManageRows').style.pointerEvents = ud.security.pinEnabled ? 'auto' : 'none';
  document.getElementById('lockOnStartupSwitch').classList.toggle('on', ud.security.lockOnStartup);
  document.getElementById('autoLockSel').value = String(ud.security.autoLockMinutes);
  document.getElementById('sessionTimeoutSel').value = String(ud.security.sessionTimeoutMinutes);
}
function togglePinLock(){
  const ud=userData();
  if(!ud.security.pinEnabled) openSetPinModal(false);
  else openDisablePinModal();
}
function openSetPinModal(isChange){
  openModal(isChange?'Change PIN':'Set up a PIN', `
    ${isChange? '<div class="field"><label>Current PIN</label><input type="password" id="curPin" maxlength="4" inputmode="numeric" placeholder="••••"></div>' : ''}
    <div class="field"><label>New PIN (4 digits)</label><input type="password" id="newPin1" maxlength="4" inputmode="numeric" placeholder="••••"></div>
    <div class="field"><label>Confirm new PIN</label><input type="password" id="newPin2" maxlength="4" inputmode="numeric" placeholder="••••"></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitPinSetup(${!!isChange})">Save PIN</button>`);
}
async function submitPinSetup(isChange){
  const ud=userData();
  if(isChange){
    const cur=document.getElementById('curPin').value;
    const curHash=await sha256Hex(cur);
    if(curHash!==ud.security.pinHash){ showToast('error','Current PIN is incorrect.'); return; }
  }
  const p1=document.getElementById('newPin1').value, p2=document.getElementById('newPin2').value;
  if(!/^\d{4}$/.test(p1)){ showToast('error','PIN must be exactly 4 digits.'); return; }
  if(p1!==p2){ showToast('error',"PINs don't match."); return; }
  ud.security.pinHash = await sha256Hex(p1);
  ud.security.pinEnabled = true;
  persist();
  closeModal();
  renderSecuritySettings();
  resetInactivityTimer();
  showToast('success', isChange?'PIN changed.':'PIN lock enabled.');
}
function openChangePinModal(){
  const ud=userData();
  if(!ud.security.pinEnabled){ showToast('info','Enable PIN lock first.'); return; }
  openSetPinModal(true);
}
function openDisablePinModal(){
  openModal('Disable PIN lock', '<div class="field"><label>Enter current PIN to confirm</label><input type="password" id="disablePinInput" maxlength="4" inputmode="numeric" placeholder="••••"></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="submitDisablePin()">Disable</button>');
}
async function submitDisablePin(){
  const ud=userData();
  const val=document.getElementById('disablePinInput').value;
  const hash=await sha256Hex(val);
  if(hash!==ud.security.pinHash){ showToast('error','Incorrect PIN.'); return; }
  ud.security.pinEnabled=false; ud.security.lockOnStartup=false;
  persist(); closeModal(); renderSecuritySettings(); resetInactivityTimer();
  showToast('success','PIN lock disabled.');
}
function toggleLockOnStartup(){
  const ud=userData();
  if(!ud.security.pinEnabled){ showToast('info','Enable PIN lock first.'); return; }
  ud.security.lockOnStartup = !ud.security.lockOnStartup;
  persist(); renderSecuritySettings();
}
function setAutoLockMinutes(v){ const ud=userData(); ud.security.autoLockMinutes=Number(v); persist(); resetInactivityTimer(); }
function setSessionTimeoutMinutes(v){ const ud=userData(); ud.security.sessionTimeoutMinutes=Number(v); persist(); }

function renderPinDots(){
  const wrap=document.getElementById('pinDots'); if(!wrap) return;
  wrap.innerHTML='';
  for(let i=0;i<PIN_LENGTH;i++){
    const d=document.createElement('div'); d.className='pin-dot'+(i<pinBuffer.length?' filled':'');
    wrap.appendChild(d);
  }
}
function buildPinKeypad(){
  const wrap=document.getElementById('pinKeypad'); if(!wrap) return;
  wrap.innerHTML='';
  const keys=['1','2','3','4','5','6','7','8','9','','0','back'];
  keys.forEach(k=>{
    const btn=document.createElement('button');
    if(k===''){ btn.className='pin-key ghost'; }
    else if(k==='back'){ btn.className='pin-key'; btn.innerHTML='<i data-lucide="delete" style="width:18px;height:18px"></i>'; btn.onclick=()=>pinKeyPress('back'); }
    else { btn.className='pin-key'; btn.textContent=k; btn.onclick=()=>pinKeyPress(k); }
    wrap.appendChild(btn);
  });
  safeCreateIcons();
}
function pinKeyPress(val){
  if(val==='back'){ pinBuffer = pinBuffer.slice(0,-1); }
  else if(pinBuffer.length < PIN_LENGTH){ pinBuffer += val; }
  renderPinDots();
  if(pinBuffer.length === PIN_LENGTH) verifyPin();
}
async function verifyPin(){
  const ud=userData();
  const hash = await sha256Hex(pinBuffer);
  if(hash === ud.security.pinHash){ pinBuffer=''; unlockApp(); }
  else {
    showPinError();
    pinBuffer='';
    setTimeout(renderPinDots, 350);
  }
}
function showPinError(){
  const card=document.querySelector('#lockScreen .lock-card');
  const err=document.getElementById('pinError');
  err.classList.add('show');
  card.classList.add('shake');
  renderPinDots();
  setTimeout(()=>{ card.classList.remove('shake'); }, 400);
  setTimeout(()=>{ err.classList.remove('show'); }, 1800);
}
function showLockScreen(){
  const ud=userData(); if(!ud) return;
  document.getElementById('lockGreet').textContent = 'Welcome back, '+(ud.profile.name||'').split(' ')[0];
  pinBuffer='';
  renderPinDots();
  buildPinKeypad();
  document.getElementById('lockScreen').classList.remove('hidden');
  safeCreateIcons();
}
function unlockApp(){
  document.getElementById('lockScreen').classList.add('hidden');
  resetInactivityTimer();
}
function logoutFromLock(){
  document.getElementById('lockScreen').classList.add('hidden');
  logout();
}
function forgotPin(){
  openModal('Forgot PIN', '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px;">Enter your login password to reset your PIN.</p><div class="field"><label>Login password</label><input type="password" id="forgotPassInput" placeholder="••••••••"></div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitForgotPin()">Verify</button>');
}
function submitForgotPin(){
  const u=DB.users.find(x=>x.username===DB.session);
  const val=document.getElementById('forgotPassInput').value;
  if(u.password!=='' && u.password!==val){ showToast('error','Incorrect password.'); return; }
  closeModal();
  document.getElementById('lockScreen').classList.add('hidden');
  openSetPinModal(false);
}
function resetInactivityTimer(){
  clearTimeout(inactivityTimer); clearTimeout(sessionTimeoutTimer);
  const ud=userData();
  if(!ud || !ud.security.pinEnabled) return;
  inactivityTimer=setTimeout(()=>{
    if(document.getElementById('lockScreen').classList.contains('hidden')){
      showLockScreen();
      startSessionTimeoutTimer();
    }
  }, ud.security.autoLockMinutes*60*1000);
}
function startSessionTimeoutTimer(){
  const ud=userData(); if(!ud) return;
  clearTimeout(sessionTimeoutTimer);
  sessionTimeoutTimer=setTimeout(()=>{
    document.getElementById('lockScreen').classList.add('hidden');
    showToast('info','Session expired — please sign in again.');
    logout();
  }, ud.security.sessionTimeoutMinutes*60*1000);
}
['mousemove','keydown','click','touchstart','scroll'].forEach(evt=>{
  document.addEventListener(evt, ()=>{
    if(document.getElementById('lockScreen') && document.getElementById('lockScreen').classList.contains('hidden')){
      resetInactivityTimer();
    }
  }, {passive:true});
});
