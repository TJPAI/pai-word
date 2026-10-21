// Safari-first durable KU state, separate from replaceable lexicon caches.
// This layer does not delete localStorage or other databases.
(function(){
 'use strict';
 const NAME='pai-word-ku-durable-v1';
 const KEY='current';
 function open(){
  return new Promise((resolve,reject)=>{
   if(!window.indexedDB)return reject(Error('IndexedDB unavailable'));
   const r=indexedDB.open(NAME,1);
   r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('state'))db.createObjectStore('state');if(!db.objectStoreNames.contains('attempts'))db.createObjectStore('attempts')};
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('IndexedDB open failed'));
  });
 }
 function read(db){return new Promise((resolve,reject)=>{const tx=db.transaction('state','readonly'),req=tx.objectStore('state').get(KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error||Error('Read failed'))})}
 function initialize(db,initial){return new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite'),store=tx.objectStore('state');let result=null;
  const req=store.get(KEY);req.onsuccess=()=>{if(req.result){result=req.result;return}result={version:0,snapshot:structuredClone(initial),updatedAt:Date.now()};store.put(result,KEY)};
  tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error||Error('Migration aborted'));tx.onerror=()=>{};
 })}
 function commit(db,{snapshot,attemptId}){
  if(!attemptId||typeof attemptId!=='string'||!snapshot?.records) return Promise.reject(Error('Invalid durable KU write'));
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(['state','attempts'],'readwrite'),states=tx.objectStore('state'),attempts=tx.objectStore('attempts');
   let result=null;
   const duplicate=attempts.get(attemptId);
   duplicate.onsuccess=()=>{
    if(duplicate.result){result={status:'duplicate'};return}
    const req=states.get(KEY);
    req.onsuccess=()=>{
     const previous=req.result||{version:0};
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
 window.PAI_KU_DURABLE={open,read,initialize,commit};
})();
