// Safari-first durable KU state, separate from replaceable lexicon caches.
// This layer does not delete localStorage or other databases.
(function(){
 'use strict';
 const NAME='pai-word-preview-ku-durable-v2';
 window.PAI_KU_DURABLE_DB_NAME=NAME;
 const KEY='current';
 function open(){
  return new Promise((resolve,reject)=>{
   if(!window.indexedDB)return reject(Error('IndexedDB unavailable'));
   const r=indexedDB.open(NAME,3);let blocked=false;
   r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('state'))db.createObjectStore('state');if(!db.objectStoreNames.contains('attempts'))db.createObjectStore('attempts');if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings');if(!db.objectStoreNames.contains('home'))db.createObjectStore('home')};
   r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();if(window.PAI_KU_DURABLE_DB===db){window.PAI_KU_STORAGE_READY=false;window.PAI_KU_STORAGE_FATAL=true}};if(blocked){db.close();return}resolve(db)};
   r.onblocked=()=>{blocked=true;reject(Error('IndexedDB upgrade blocked by another tab'))};
   r.onerror=()=>reject(r.error||Error('IndexedDB open failed'));
  });
 }
 function read(db){return new Promise((resolve,reject)=>{const tx=db.transaction('state','readonly'),req=tx.objectStore('state').get(KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error||Error('Read failed'))})}
 function initialize(db,initial){return new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite'),store=tx.objectStore('state');let result=null;
  const req=store.get(KEY);req.onsuccess=()=>{if(req.result){result=req.result;return}result={version:0,snapshot:structuredClone(initial),updatedAt:Date.now()};store.put(result,KEY)};
  tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error||Error('Migration aborted'));tx.onerror=()=>{};
 })}
 function commit(db,{snapshot,attemptId,expectedVersion}){
  if(!attemptId||typeof attemptId!=='string'||!snapshot?.records||!Number.isSafeInteger(expectedVersion)) return Promise.reject(Error('Invalid durable KU write'));
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(['state','attempts'],'readwrite'),states=tx.objectStore('state'),attempts=tx.objectStore('attempts');
   let result=null;
   const duplicate=attempts.get(attemptId);
   duplicate.onsuccess=()=>{
    if(duplicate.result){result={status:'duplicate'};return}
    const req=states.get(KEY);
    req.onsuccess=()=>{
     const previous=req.result||{version:0};
     if(previous.version!==expectedVersion){result={status:'conflict',version:previous.version};return}
     const version=previous.version+1;
     states.put({version,snapshot:structuredClone(snapshot),updatedAt:Date.now()},KEY);
     attempts.put({at:Date.now()},attemptId);
     result={status:'committed',version};
    };
   };
   tx.oncomplete=()=>resolve(result);
   tx.onabort=()=>reject(tx.error||Error('KU transaction aborted'));
   tx.onerror=()=>{};
  });
 }
 function readSettings(db){return new Promise((resolve,reject)=>{const tx=db.transaction('settings','readonly'),req=tx.objectStore('settings').get('current');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}
 function writeSettings(db,settings){return new Promise((resolve,reject)=>{const tx=db.transaction('settings','readwrite');tx.objectStore('settings').put(settings,'current');tx.oncomplete=()=>resolve(true);tx.onabort=()=>reject(tx.error||Error('Settings write aborted'))})}
 function readHome(db){return new Promise((resolve,reject)=>{const tx=db.transaction('home','readonly'),req=tx.objectStore('home').get('current');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}
 function writeHome(db,home){return new Promise((resolve,reject)=>{const tx=db.transaction('home','readwrite');tx.objectStore('home').put(home,'current');tx.oncomplete=()=>resolve(true);tx.onabort=()=>reject(tx.error||Error('Home state write aborted'))})}
 window.PAI_KU_DURABLE={open,read,initialize,commit,readSettings,writeSettings,readHome,writeHome};
})();
