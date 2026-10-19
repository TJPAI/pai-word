import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
// Dependency-free simulation of the IndexedDB request/transaction callbacks.
// This validates the actual transaction code's decision order, not browser IndexedDB.
const source=readFileSync(new URL('../rebuild-preview/transaction-store.mjs',import.meta.url),'utf8').replace(/export (async )?function /g,(_,a)=>(a||'')+'function ');
async function exercise(initial,args){
 let current=structuredClone(initial),tx;
 const db={transaction(){
  const q=[];
  tx={error:null,aborted:false,objectStore(){return {
    get(){const req={result:structuredClone(current),onsuccess:null,onerror:null};q.push(()=>req.onsuccess?.());return req},
    put(value){current=structuredClone(value)}
  }},abort(){this.aborted=true;queueMicrotask(()=>this.onabort?.())}};
  queueMicrotask(()=>q.splice(0).forEach(fn=>fn()));
  // IndexedDB only completes after requests have executed.
  queueMicrotask(()=>queueMicrotask(()=>{if(!tx.aborted)tx.oncomplete?.()}));
  return tx;
 }};
 const ctx=vm.createContext({db,Promise,queueMicrotask});
 vm.runInContext(source+'; globalThis.run=(args)=>commitSnapshot(db,args)',ctx);
 const result=await ctx.run(args);
 return {result,current};
}
const initial={version:4,state:{value:'old'},committedAttempts:{'a1':true}};
let x=await exercise(initial,{expectedVersion:3,attemptId:'a1',nextState:{records:{},value:'bad'}});
assert.equal(x.result.status,'duplicate');assert.deepEqual(x.current,initial);
x=await exercise(initial,{expectedVersion:3,attemptId:'a2',nextState:{records:{},value:'bad'}});
assert.equal(x.result.status,'conflict');assert.deepEqual(x.current,initial);
x=await exercise(initial,{expectedVersion:4,attemptId:'a2',nextState:{records:{},value:'new'}});
assert.equal(x.result.status,'committed');assert.equal(x.current.version,5);assert.equal(x.current.state.value,'new');assert.equal(x.current.committedAttempts.a2,true);
await assert.rejects(()=>exercise(initial,{expectedVersion:4,attemptId:'a3',nextState:null}),/Invalid learning state snapshot/);
console.log('PASS: duplicate, conflict, commit and empty-state rejection in simulated transactions');
