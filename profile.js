/* ============================================================
   PROFILE
   ============================================================
   Purpose:   The dedicated Profile page — render, edit-mode
              toggle, save, and photo upload.
   Inputs:    Profile page form fields, photo file input.
   Outputs:   Mutates ud.profile; updates sidebar user chip.
   Depends on: storage.js (userData, persist, DB), utils.js
              (safeCreateIcons), modal.js (showToast).
   ============================================================ */
/* ============================================================
   PROFILE PAGE
   ============================================================ */
function renderProfile(){
  const ud=userData(); if(!ud) return;
  const u=DB.users.find(x=>x.username===DB.session);
  document.getElementById('profileNameDisplay').textContent = ud.profile.name || u.name;
  document.getElementById('profileUsernameDisplay').textContent = u.username;
  document.getElementById('profileAccountType').textContent = u.role==='admin' ? 'Administrator' : 'Member';
  document.getElementById('profileAccountType').className = 'pill '+(u.role==='admin'?'pill-high':'pill-low');
  document.getElementById('profileJoinDate').textContent = new Date(ud.profile.joinDate).toLocaleDateString(undefined,{month:'long', year:'numeric'});
  document.getElementById('profileNameInput').value = ud.profile.name || '';
  document.getElementById('profileUsernameInput').value = u.username;
  document.getElementById('profileEmailInput').value = ud.profile.email || '';
  document.getElementById('profileMobileInput').value = ud.profile.mobile || '';
  document.getElementById('profileBioInput').value = ud.profile.bio || '';
  const img=document.getElementById('profilePhotoImg'), fallback=document.getElementById('profilePhotoFallback');
  if(ud.profile.photo){ img.src=ud.profile.photo; img.style.display='block'; fallback.style.display='none'; }
  else { img.style.display='none'; fallback.style.display='flex'; fallback.textContent=(ud.profile.name||u.name||'A').slice(0,1).toUpperCase(); }
}
function toggleProfileEdit(){
  const editing = document.getElementById('profileSaveRow').style.display!=='none';
  if(editing){ cancelProfileEdit(); return; }
  ['profileNameInput','profileEmailInput','profileMobileInput','profileBioInput'].forEach(id=>document.getElementById(id).disabled=false);
  document.getElementById('profileSaveRow').style.display='flex';
  document.getElementById('profileEditBtn').innerHTML='<i data-lucide="x" style="width:15px;height:15px"></i> Cancel';
  safeCreateIcons();
}
function cancelProfileEdit(){
  renderProfile();
  ['profileNameInput','profileEmailInput','profileMobileInput','profileBioInput'].forEach(id=>document.getElementById(id).disabled=true);
  document.getElementById('profileSaveRow').style.display='none';
  document.getElementById('profileEditBtn').innerHTML='<i data-lucide="pencil" style="width:15px;height:15px"></i> Edit profile';
  safeCreateIcons();
}
function saveProfileFull(){
  const ud=userData();
  ud.profile.name = document.getElementById('profileNameInput').value.trim() || ud.profile.name;
  ud.profile.email = document.getElementById('profileEmailInput').value.trim();
  ud.profile.mobile = document.getElementById('profileMobileInput').value.trim();
  ud.profile.bio = document.getElementById('profileBioInput').value.trim();
  persist();
  const u=DB.users.find(x=>x.username===DB.session); u.name=ud.profile.name;
  document.getElementById('userNameChip').textContent=u.name;
  document.getElementById('userAvatar').textContent=(u.name||'A').slice(0,1).toUpperCase();
  cancelProfileEdit();
  showToast('success','Profile updated.');
}
function handleProfilePhoto(e){
  const file=e.target.files[0]; if(!file) return;
  if(!file.type.startsWith('image/')){ showToast('error','Please choose an image file.'); return; }
  if(file.size > 3*1024*1024){ showToast('error','Please choose an image under 3MB.'); return; }
  const reader=new FileReader();
  reader.onload=()=>{ const ud=userData(); ud.profile.photo=reader.result; persist(); renderProfile(); showToast('success','Photo updated.'); };
  reader.readAsDataURL(file);
}

