// Run: node scripts/test-v21-duplicate-attempt-recovery.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const start=source.indexOf('window.rateLearning=async('),end=source.indexOf('\n function top(title',start);
assert(start>=0&&end>start,'rating implementation missing');
const implementation=source.slice(start,end);
for(const resultStatus of ['duplicate','conflict']){
 let reloads=0,failures=0;
 const initial={view:'learning',revealed:true,records:{},stats:{known:0,unknown:0},
 learningSession:{kind:'scene',queue:['ku1'],completed:[],seen:{},
 attempts:0,currentAttempt:{attemptId:'a1',kuId:'ku1',committed:false}},daily:{}};
 const context={state:initial,active:true,loading:false,error:'',browsedUnit:null,
  unit:()=>({k:'ku1'}),ensureAttempt:()=>context.state.learningSession.currentAttempt,
  markDailyNewComplete(){},rebuildDailyAssignments(){},startedAt:Date.now(),DAY:86400000,
  PAI_TAP_FLOW:{snapshot:()=>({phase:'committing',responseMs:250}),syncPage(){},
   resumeFailedCommit(){failures++},clearPendingGrade(){},
   takeHoldAfterRating:()=>true,pageState:()=> 'QUESTION',
   browseReady(){},takeSwipeDirection:()=>0},
  window:{PAI_SAVE_DEFERRED:false,PAI_KU_STORAGE_READY:true,PAI_KU_DURABLE_VERSION:0,
   PAI_KU_DURABLE_DB:{},PAI_KU_DURABLE:{async commit(){return {status:resultStatus,version:1}}},
   PAI_MEMORY_SCHEDULERS:{review(_,{grade}){return {lastGrade:grade}}},
   PAI_RELOAD_KU_AFTER_CONFLICT(){reloads++}},
  structuredClone,console:{error(){}},Date,Math,render(){},save(){}};
 vm.createContext(context);vm.runInContext(implementation,context);
 await context.window.rateLearning('good','ku1');
 assert.equal(reloads,1,resultStatus+' must reload authoritative state');
 assert.equal(failures,1);
 assert.equal(context.state,initial,'failed local write restores original snapshot');
 assert.equal(context.window.PAI_SAVE_DEFERRED,false);
}
console.log('PASS: both duplicate and conflict commits trigger authoritative state recovery');
