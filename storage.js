/* ============================================================
   STORAGE
   ============================================================
   Purpose:   The ONLY module allowed to touch localStorage
              directly. Every other file must go through
              StorageManager (or the persist()/userData() helpers
              below, which themselves route through it) — never
              call localStorage.setItem()/getItem() from anywhere
              else in the codebase.
   Inputs:    key/value pairs, or updater functions for update().
   Outputs:   StorageManager {save, load, update, delete, clear,
              backup, restore}; DB (the in-memory app database,
              hydrated from storage on load); persist(),
              currentUser(), userData(), logActivity() — the
              existing app-wide data-access API, unchanged for
              every other module that already calls them.
   Depends on: constants.js (DB_KEY), utils.js (uid).
   ============================================================ */

const StorageManager = {
  save(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch(e){ console.warn('Atlas storage: save failed for', key, e); return false; }
  },
  load(key, fallback=null){
    try{
      const raw = localStorage.getItem(key);
      return raw==null ? fallback : JSON.parse(raw);
    }catch(e){ console.warn('Atlas storage: load failed for', key, e); return fallback; }
  },
  update(key, updater, fallback=null){
    const current = this.load(key, fallback);
    const next = updater(current);
    this.save(key, next);
    return next;
  },
  delete(key){
    try{ localStorage.removeItem(key); return true; }
    catch(e){ console.warn('Atlas storage: delete failed for', key, e); return false; }
  },
  clear(){
    try{ localStorage.clear(); return true; }
    catch(e){ console.warn('Atlas storage: clear failed', e); return false; }
  },
  // Returns the raw stored object for a key, ready for the caller to serialize (used by backup.js export).
  backup(key){ return this.load(key, null); },
  // Restores a previously-exported object back into a key (used by backup.js import).
  restore(key, data){ return this.save(key, data); }
};

function defaultDB(){
  return {
    users:[
      {username:'admin', password:'admin123', role:'admin', name:'Admin', email:'admin@aura.app'},
    ],
    session:null,
    settings:{ theme:'light', anim:true, accent:'#8FD65C', fontSize:16 },
    perUser:{}
  };
}
function newUserData(name,email){
  return {
    profile:{name:name||'New User', email:email||'', mobile:'', bio:'', photo:'', joinDate:new Date().toISOString()},
    security:{ pinHash:null, pinEnabled:false, autoLockMinutes:5, sessionTimeoutMinutes:30, lockOnStartup:false },
    tasks:[], events:[], goals:[], subjects:[
      {id:uid(), name:'Physics', hours:0}, {id:uid(), name:'Chemistry', hours:0}, {id:uid(), name:'English', hours:0}
    ],
    studyLog:{}, studyTargets:{daily:2, weekly:14},
    expenses:[], habits:[
      {id:uid(), name:'Workout', icon:'dumbbell', days:{}}, {id:uid(), name:'Reading', icon:'book', days:{}}, {id:uid(), name:'Meditation', icon:'flower-2', days:{}}
    ],
    health:{}, journal:[], mood:{}, activity:[],
    uiState:{ page:'dashboard', taskFilter:'all', goalFilter:'daily', taskSearch:'', journalSearch:'', expSearch:'' },
    achievements:{ unlocked:{} },
    dashboardLayout:{ order: DEFAULT_WIDGET_ORDER.slice(), hidden: [] }
  };
}


let DB = StorageManager.load(DB_KEY, null) || defaultDB();
function persist(){ StorageManager.save(DB_KEY, DB); }
function currentUser(){ return DB.session; }
function userData(){
  if(!DB.session) return null;
  if(!DB.perUser[DB.session]) DB.perUser[DB.session] = newUserData();
  const ud = DB.perUser[DB.session];
  if(!ud.uiState) ud.uiState = { page:'dashboard', taskFilter:'all', goalFilter:'daily', taskSearch:'', journalSearch:'', expSearch:'' };
  if(!ud.security) ud.security = { pinHash:null, pinEnabled:false, autoLockMinutes:5, sessionTimeoutMinutes:30, lockOnStartup:false };
  if(ud.profile){
    if(ud.profile.mobile===undefined) ud.profile.mobile='';
    if(ud.profile.bio===undefined) ud.profile.bio='';
    if(ud.profile.photo===undefined) ud.profile.photo='';
    if(!ud.profile.joinDate) ud.profile.joinDate=new Date().toISOString();
  }
  if(!ud.achievements) ud.achievements = { unlocked:{} };
  if(!ud.dashboardLayout) ud.dashboardLayout = { order: DEFAULT_WIDGET_ORDER.slice(), hidden: [] };
  else {
    // keep layout in sync if new widgets were introduced after this account was created
    DEFAULT_WIDGET_ORDER.forEach(w=>{ if(!ud.dashboardLayout.order.includes(w)) ud.dashboardLayout.order.push(w); });
  }
  return ud;
}
function logActivity(text){
  const ud = userData(); if(!ud) return;
  ud.activity.unshift({text, time:new Date().toISOString()});
  ud.activity = ud.activity.slice(0,30);
  persist();
}

/* ---------------- Toasts ---------------- */
