/* ============================================================
   DATABASE (IndexedDB)
   ============================================================
   Purpose:   Storage for anything too large or binary for
              localStorage — PDFs, images, study materials,
              downloads. Nothing in the current feature set uses
              this yet (Study Material Manager / Downloads are
              future phases), but the wrapper is fully functional
              today so those features can plug straight in later
              without touching this file.
   Inputs:    store name + record objects (each record must have
              an `id` field, used as the IndexedDB key).
   Outputs:   AtlasDB {put, get, getAll, delete, clear} — all
              return Promises.
   Depends on: nothing (self-contained; safe to load anywhere).
   ============================================================ */

const ATLAS_DB_NAME = 'atlas-files-db';
const ATLAS_DB_VERSION = 1;
const ATLAS_DB_STORES = ['files']; // one generic store today; add more (e.g. 'downloads') by bumping ATLAS_DB_VERSION

let _atlasDbPromise = null;

function _openAtlasDb(){
  if(_atlasDbPromise) return _atlasDbPromise;
  _atlasDbPromise = new Promise((resolve, reject)=>{
    if(!('indexedDB' in window)){ reject(new Error('IndexedDB not supported in this browser')); return; }
    const req = indexedDB.open(ATLAS_DB_NAME, ATLAS_DB_VERSION);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      ATLAS_DB_STORES.forEach(storeName=>{
        if(!db.objectStoreNames.contains(storeName)){
          db.createObjectStore(storeName, { keyPath:'id' });
        }
      });
    };
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
  return _atlasDbPromise;
}

const AtlasDB = {
  /** Insert or update a record. `record` must include an `id`. */
  async put(storeName, record){
    try{
      const db = await _openAtlasDb();
      return await new Promise((resolve, reject)=>{
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(record);
        tx.oncomplete = ()=> resolve(record);
        tx.onerror = ()=> reject(tx.error);
      });
    }catch(e){ console.warn('AtlasDB.put failed', e); return null; }
  },
  /** Fetch a single record by id. */
  async get(storeName, id){
    try{
      const db = await _openAtlasDb();
      return await new Promise((resolve, reject)=>{
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(id);
        req.onsuccess = ()=> resolve(req.result || null);
        req.onerror = ()=> reject(req.error);
      });
    }catch(e){ console.warn('AtlasDB.get failed', e); return null; }
  },
  /** Fetch every record in a store. */
  async getAll(storeName){
    try{
      const db = await _openAtlasDb();
      return await new Promise((resolve, reject)=>{
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = ()=> resolve(req.result || []);
        req.onerror = ()=> reject(req.error);
      });
    }catch(e){ console.warn('AtlasDB.getAll failed', e); return []; }
  },
  /** Delete a single record by id. */
  async delete(storeName, id){
    try{
      const db = await _openAtlasDb();
      return await new Promise((resolve, reject)=>{
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(id);
        tx.oncomplete = ()=> resolve(true);
        tx.onerror = ()=> reject(tx.error);
      });
    }catch(e){ console.warn('AtlasDB.delete failed', e); return false; }
  },
  /** Wipe every record in a store. */
  async clear(storeName){
    try{
      const db = await _openAtlasDb();
      return await new Promise((resolve, reject)=>{
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        tx.oncomplete = ()=> resolve(true);
        tx.onerror = ()=> reject(tx.error);
      });
    }catch(e){ console.warn('AtlasDB.clear failed', e); return false; }
  }
};
