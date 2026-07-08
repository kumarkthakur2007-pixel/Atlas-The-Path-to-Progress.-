/* ============================================================
   BACKUP & RESTORE
   ============================================================
   Purpose:   Export the entire app database as a downloadable
              JSON file, import a previous export back in, and
              wipe the current account's data.
   Inputs:    Settings > Data card controls.
   Outputs:   A downloaded .json file; or a fully replaced DB.
   Depends on: storage.js (DB, persist — which itself routes
              through StorageManager; no direct localStorage
              access happens in this file), modal.js (showToast),
              auth.js (enterApp), storage.js (newUserData/userData).
   ============================================================ */
function exportJSON(){
  const blob = new Blob([JSON.stringify(DB,null,2)], {type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='aura-backup.json'; a.click();
  showToast('success','Backup exported.');
}
function importJSON(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{ try{ DB=JSON.parse(reader.result); persist(); showToast('success','Data restored.'); enterApp(); }catch(err){ showToast('error','Invalid backup file.'); } };
  reader.readAsText(file);
}
function resetAllData(){
  if(!confirm('This will permanently erase all your data. Continue?')) return;
  DB.perUser[DB.session]=newUserData(userData().profile.name, userData().profile.email);
  persist(); showToast('success','Your data has been reset.'); initAllModules();
}

