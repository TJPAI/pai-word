// Run: node scripts/test-v21-rating-transaction.mjs
// Execute the CURRENT asynchronous rating code under an injected durable store.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const start=source.indexOf('window.rateLearning=async(');
const end=source.indexOf("\n function top(title",start);
assert(start>=0&&end>start,'current async rating implementation missing');
const implementation=source.slice(start,end);
async function run(mode){
 let writes=0,shown=0,failed=0,held=0;
 const initial={view:'learning',revealed:false,records:{},stats:{known:0,unknown:0},
  learningSession:{kind:'scene',queue:['ku1'],completed:[],seen:{},attempts:0,
   currentAttempt:{attemptId:'a1',kuId:'ku1',committed:false}},daily:{}};
 const context={state:initial,active:true,loading:false,error:'',browsedUnit:null,
  unit:()=>({k:'ku1'}),ensureAttempt:()=>context.state.learningSession.currentAttempt,
  markDailyNewComplete(){},rebuildDailyAssignments(){},startedAt:Date.now(),DAY:86400000,
  previousUnit:null,browseIndex:null,cycleKeys:()=>['ku1'],render(){},showCurrent(){shown++},save(){if(mode==='backupFailure')throw Error('localStorage quota')},
  PAI_TAP_FLOW:{
   snapshot:()=>({phase:'committing',responseMs:250}),syncPage(){},resumeFailedCommit(){failed++},
   clearPendingGrade(){},takeHoldAfterRating:()=>true,pageState:()=> 'QUESTION',browseReady(){held++},
   takeSwipeDirection:()=>0
  },
  window:{PAI_SAVE_DEFERRED:false,PAI_KU_STORAGE_READY:true,PAI_KU_DURABLE_VERSION:0,PAI_KU_DURABLE_DB:{},
   PAI_KU_DURABLE:{async commit(){
    writes++;if(mode==='failure'&&writes===1)throw Error('quota');
    return {status:'committed',version:writes};
   }},
   PAI_MEMORY_SCHEDULERS:{review(_,{grade}){return {lastGrade:grade}}},
   PAI_AUTOBROWSE:{restart(){}}
  },
  structuredClone:globalThis.structuredClone,console:{error(){}},Date,Math
 };
 vm.createContext(context);
 // VM global bindings allow the real rating implementation to update its live 'state'.
 vm.runInContext(implementation,context);
 await context.window.rateLearning('good','ku1');
 if(mode==='success'||mode==='backupFailure'){
  await context.window.rateLearning('good','ku1');
  assert.equal(writes,1,'committed attempt cannot be saved twice');
  assert.equal(context.state.learningSession.attempts,1);
  assert.equal(context.state.stats.known,1);
  assert.equal(held,1,'successful blank-triggered rating stays on current card');
  assert.equal(shown,0,'no automatic navigation after blank commit');
 }else{
  assert.equal(context.state,initial,'failed write restores original state');
  assert.equal(context.state.learningSession.attempts,0);
  assert.equal(Object.keys(context.state.records).length,0);
  assert.equal(held,0,'failure must not switch card');
  assert.equal(shown,0);
  assert.equal(failed,1);
  await context.window.rateLearning('good','ku1');
  assert.equal(writes,2,'failure allows a subsequent retry');
  assert.equal(context.state.learningSession.attempts,1,'successful retry counts exactly once');
  assert.equal(context.state.stats.known,1,'successful retry increases known exactly once');
  assert.equal(Object.keys(context.state.records).length,1,'successful retry persists a single KU');
  assert.equal(held,1,'successful retry retains current card');
 }
}
await run('success');
await run('backupFailure');
await run('failure');
console.log('PASS: async IndexedDB commit idempotency, hold-current-card, failure rollback and retry');
