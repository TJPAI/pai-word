// V2.1 isolated preview transaction primitive. Not yet wired to the legacy rating path.
export function openPreviewDB(name='pai-word-core20k-preview-v21'){
 return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(new Error('IndexedDB unavailable'));return}
  const request=indexedDB.open(name,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('snapshot'))db.createObjectStore('snapshot');};
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>resolve(request.result);
 });
}
export async function commitSnapshot(db,{expectedVersion,nextState,attemptId}){
 if(!Number.isSafeInteger(expectedVersion)||expectedVersion<0||typeof attemptId!=='string'||!attemptId.trim())throw new Error('Invalid transaction identity');
 if(!nextState||typeof nextState!=='object'||Array.isArray(nextState)||!nextState.records||typeof nextState.records!=='object'||Array.isArray(nextState.records))throw new Error('Invalid learning state snapshot');
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('snapshot','readwrite');
  const store=tx.objectStore('snapshot');
  let outcome=null;
  const req=store.get('current');
  req.onerror=()=>{try{tx.abort()}catch{}};
  req.onsuccess=()=>{
   const previous=req.result||{version:0,state:null,committedAttempts:{}};
   if(!Number.isSafeInteger(previous.version)||previous.version<0||!previous.committedAttempts||typeof previous.committedAttempts!=='object'){outcome={status:'invalid-baseline'};tx.abort();return}
   // Idempotency takes precedence over stale-version detection: a retried
   // acknowledged attempt must report duplicate, never an unrelated conflict.
   if(previous.committedAttempts?.[attemptId]){outcome={status:'duplicate',version:previous.version};tx.abort();return}
   if(previous.version!==expectedVersion){outcome={status:'conflict',version:previous.version};tx.abort();return}
   const committedAttempts={...(previous.committedAttempts||{}),[attemptId]:true};
   const next={version:previous.version+1,state:nextState,committedAttempts};
   store.put(next,'current');outcome={status:'committed',version:next.version};
  };
  tx.oncomplete=()=>resolve(outcome);
  tx.onabort=()=>outcome?.status==='conflict'||outcome?.status==='duplicate'?resolve(outcome):reject(tx.error||new Error('Transaction aborted'));
  tx.onerror=()=>{};
 });
}
export function readSnapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('snapshot','readonly'),request=tx.objectStore('snapshot').get('current');
  request.onsuccess=()=>resolve(request.result||{version:0,state:null,committedAttempts:{}});
  request.onerror=()=>reject(request.error);
 });
}
