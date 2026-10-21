// Run: node scripts/test-v21-historical-overlap.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const a=source.indexOf('window.rateBrowsedLearning=async('),b=source.indexOf('\n window.PAI_RELOAD_KU_AFTER_CONFLICT=',a);
assert(a>=0&&b>a,'historical rating handler missing');
const block=source.slice(a,b);
for(const fail of [false,true]){
 let settle,commits=0,failures=0;
 const pending=new Promise((resolve,reject)=>{settle=fail?()=>reject(Error('simulated quota')):()=>resolve({status:'committed',version:1})});
 const context={window:{PAI_SAVE_DEFERRED:false,PAI_KU_STORAGE_READY:true,PAI_KU_DURABLE_VERSION:0,
  PAI_KU_DURABLE_DB:{},PAI_KU_DURABLE:{commit(){commits++;return pending}},PAI_AUTOBROWSE:{restart(){}}},
  historicalCommitInProgress:false,active:true,browsedUnit:{k:'k'},
  state:{records:{k:{reps:1}},stats:{known:0,unknown:0}},newAttemptId:()=>'a1',DAY:86400000,
  PAI_TAP_FLOW:{snapshot:()=>({responseMs:100}),resumeFailedCommit(){failures++},
   clearPendingGrade(){},syncPage(){},takeHoldAfterRating:()=>true,pageState:()=> 'ANSWER',browseReady(){}},
  structuredClone,Date,Math,save(){},render(){},console:{warn(){},error(){}}};
 vm.createContext(context);vm.runInContext(block,context);
 const first=context.window.rateBrowsedLearning('good','k');
 await context.window.rateBrowsedLearning('hard','k');
 assert.equal(commits,1,'rapid correction must not create overlapping transaction');
 assert.equal(context.window.PAI_SAVE_DEFERRED,true);
 settle();await first;
 assert.equal(context.window.PAI_SAVE_DEFERRED,false,'global lock must release');
 assert.equal(context.historicalCommitInProgress,false,'history lock must release');
 assert.equal(context.state.stats.known,fail?0:1);
 assert.equal(context.state.records.k.reps,fail?1:2);
 assert.equal(failures,fail?1:0);
}
console.log('PASS: overlapping historical rating blocked; commit and failure release both locks');
