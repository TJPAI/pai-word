// Run: node scripts/test-v21-rating-transaction.mjs
// Exercises the actual current rating function without a browser or external dependencies.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const start=source.indexOf(' window.rateLearning=(grade,targetKey=null)=>{');
const end=source.indexOf("\n function top(title,progress='')",start);
assert(start>=0 && end>start,'rating function must exist');
const extracted=source.slice(start,end);
const cases=['duplicate','save-failure','requeue'];
for(const scenario of cases){
 let writes=0,shown=0;
 const original={revealed:true,records:{},stats:{known:0,unknown:0},learningSession:{kind:'scene',queue:['ku1'],completed:[],seen:{},attempts:0,currentAttempt:{attemptId:'attempt1',kuId:'ku1',committed:false}},daily:{}};
 const context={
   state:original,previousUnit:null,active:true,loading:false,error:'',browsedUnit:null,startedAt:Date.now()-1000,DAY:86400000,
   unit:()=>({k:'ku1'}),ensureAttempt:()=>original.learningSession.currentAttempt,
   markDailyNewComplete:()=>{},rebuildDailyAssignments:()=>{},
   PAI_TAP_FLOW:{clearPendingGrade(){},resumeFailedCommit(){},snapshot:()=>({responseMs:1000})},
   persist:()=>{writes++;if(scenario==='save-failure')throw Error('injected save error')},
   render:()=>{},showCurrent:()=>{shown++},
   window:{},console:{error:()=>{}},structuredClone:obj=>JSON.parse(JSON.stringify(obj)),
   Date,Math
 };
 vm.createContext(context);
 vm.runInContext(extracted,context);
 context.window.rateLearning(scenario==='requeue'?'again':'good','ku1');
 if(scenario==='save-failure'){
   assert.equal(context.state,original,'failed commit must restore original state reference');
   assert.equal(context.state.records.ku1,undefined,'failed commit must not write SRS');
   assert.equal(shown,0,'failed commit must not advance');
   continue;
 }
 assert.equal(writes,1,'one durable write per rating');
 assert.equal(context.state.records.ku1.reps,1);
 assert.equal(shown,1);
 if(scenario==='requeue')assert(context.state.learningSession.queue.includes('ku1'));
 context.window.rateLearning('good','ku1');
 assert.equal(writes,1,'duplicate rating must not write again');
}
console.log('PASS: duplicate rating, storage failure rollback, wrong-answer reinsertion');
