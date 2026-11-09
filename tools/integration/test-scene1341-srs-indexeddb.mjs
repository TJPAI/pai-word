import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene1341IndexedDbStore,SCENE1341_SRS_DB_NAME,SCENE1341_SRS_OBJECT_STORE} from '../../rebuild-preview/scene1341-srs-indexeddb.mjs';
import {createScene1341Srs,SCENE1341_SRS_SCOPE} from '../../rebuild-preview/scene1341-srs-v2.mjs';

// Minimal IndexedDB asynchronous transaction fake. It exercises the real
// creation/get/commit code paths and verifies database separation.
const records=new Map();
let openedDatabase=null,createdStore=false,aborts=0;
const database={
 objectStoreNames:{contains:name=>createdStore&&name===SCENE1341_SRS_OBJECT_STORE},
 createObjectStore(name){assert.equal(name,SCENE1341_SRS_OBJECT_STORE);createdStore=true},
 close(){},
 transaction(name,mode){
  assert.equal(name,SCENE1341_SRS_OBJECT_STORE);
  const tx={
   oncomplete:null,onabort:null,onerror:null,error:null,
   abort(){aborts++;queueMicrotask(()=>tx.onabort?.())},
   objectStore(){return {
    get(key){
     const req={result:null,onsuccess:null,onerror:null};
     queueMicrotask(()=>{req.result=records.get(key)||undefined;req.onsuccess?.();
       if(mode==='readonly')queueMicrotask(()=>tx.oncomplete?.())});
     return req;
    },
    put(value,key){
     assert.equal(mode,'readwrite');records.set(key,value);
     queueMicrotask(()=>tx.oncomplete?.());
    }
   }}
  };
  return tx;
 }
};
const mock={
 open(name,version){
  openedDatabase=name;
  assert.equal(version,1);
  const req={result:database,onsuccess:null,onerror:null,onupgradeneeded:null,onblocked:null};
  queueMicrotask(()=>{req.onupgradeneeded?.();req.onsuccess?.()});
  return req;
 }
};
const adapter=createScene1341IndexedDbStore({indexedDBApi:mock});
const srs=createScene1341Srs({store:adapter,releaseApproved:true});
assert.equal(adapter.namespace,SCENE1341_SRS_SCOPE);
assert.equal(adapter.databaseName,SCENE1341_SRS_DB_NAME);
assert.equal(openedDatabase,null);
assert.equal(await adapter.read('scene1341-v2:SC1341-KU-00001'),null);
assert.equal(openedDatabase,'pai-word-scene1341-srs-v2');
assert(createdStore);
await assert.rejects(()=>adapter.read('core20k:SC1341-KU-00001'),/KEY_OUT_OF_SCOPE/);
await assert.rejects(()=>srs.rate({kuId:'SC1341-KU-00001',grade:'good',
 now:1800000000000,attemptId:'attempt-1001',kuReleaseEligible:false}),/NOT_APPROVED/);
assert.equal(records.size,0);
const saved=await srs.rate({kuId:'SC1341-KU-00001',grade:'good',
 now:1800000000000,attemptId:'attempt-1001',kuReleaseEligible:true});
assert.equal(saved.reps,1);
assert.equal((await adapter.read(saved.storageKey)).reps,1);
assert.equal((await srs.rate({kuId:'SC1341-KU-00001',grade:'good',
 now:1800001000000,attemptId:'attempt-1001',kuReleaseEligible:true})).reps,1);
await assert.rejects(()=>adapter.commit(saved.storageKey,{...saved,lastAttemptId:'attempt-1002'},
 {expectedAttemptId:'wrong-attempt'}),/CONCURRENT_COMMIT_REJECTED/);
assert(aborts>0);
assert.equal(records.get(saved.storageKey).lastAttemptId,'attempt-1001');
assert.deepEqual([...records.keys()],['scene1341-v2:SC1341-KU-00001']);
const source=fs.readFileSync('rebuild-preview/scene1341-srs-indexeddb.mjs','utf8');
assert(!source.includes('state.records'),'must not write old SRS records');
assert(!source.includes('PAI_KU_DURABLE'),'must not share existing KU database');
console.log(JSON.stringify({status:'PASS',dbName:SCENE1341_SRS_DB_NAME,
 persistedStagingFixtureRecords:1,legacyRecordsTouched:0,atomicConflictAborted:true,
 deployed:false,approvedRealKU:0}));
