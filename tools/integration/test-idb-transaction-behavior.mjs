import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync('rebuild-preview/ku-durable-store.js','utf8');
function makeDb({fail=false}={}){
 const state=new Map([['current',{version:0,snapshot:{records:{}}}]]), attempts=new Map();
 let count=0;
 function transaction(stores,mode){
  assert.deepEqual(Array.from(stores),['state','attempts']);
  assert.equal(mode,'readwrite');
  const writes=[];
  const tx={error:fail?Error('AbortError'):null,objectStore(name){const map=name==='state'?state:attempts;return {
    get(key){const req={};queueMicrotask(()=>{req.result=map.get(key);req.onsuccess?.()});return req},
    put(value,key){writes.push(()=>map.set(key,value))}
  }}};
  // Await chained get callbacks before completing the transaction.
  queueMicrotask(()=>queueMicrotask(()=>queueMicrotask(()=>{
    if(fail){tx.onabort?.();return}
    for(const write of writes)write();count++;tx.oncomplete?.();
  })));
  return tx;
 }
 return {db:{transaction},state,attempts,get count(){return count}};
}
const window={indexedDB:{},PAI_KU_DURABLE:null};
const ctx={window,location:{pathname:'/pai-word-preview/v22-integration/rebuild-preview/'},indexedDB:{},structuredClone,Date,Promise,Number,Error};
vm.runInNewContext(src,ctx);
const commit=window.PAI_KU_DURABLE.commit;
{
 const x=makeDb();const d={records:{k:{grade:'good'}}};
 const first=await commit(x.db,{snapshot:d,attemptId:'a',expectedVersion:0});
 assert.equal(first.status,'committed');assert.equal(first.version,1);
 assert.equal(x.state.get('current').version,1);assert.equal(x.attempts.size,1);
 const dup=await commit(x.db,{snapshot:d,attemptId:'a',expectedVersion:1});
 assert.equal(dup.status,'duplicate');assert.equal(x.state.get('current').version,1);
 const conflict=await commit(x.db,{snapshot:d,attemptId:'b',expectedVersion:0});
 assert.equal(conflict.status,'conflict');assert.equal(x.attempts.has('b'),false);
}
{
 const x=makeDb({fail:true});await assert.rejects(commit(x.db,{snapshot:{records:{}},attemptId:'x',expectedVersion:0}),/AbortError/);
 assert.equal(x.attempts.size,0);assert.equal(x.state.get('current').version,0);
}
await assert.rejects(commit(makeDb().db,{snapshot:{records:{}},attemptId:'',expectedVersion:0}),/Invalid durable/);
console.log('PASS actual IndexedDB transaction implementation: commit, duplicate, stale writer, abort, invalid request');
