// Run: node scripts/test-v21-historical-backup-failure.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const a=source.indexOf('window.rateBrowsedLearning=async('),b=source.indexOf('\n window.PAI_RELOAD_KU_AFTER_CONFLICT=',a);
assert(a>=0&&b>a,'historical rating implementation missing');
const implementation=source.slice(a,b);
let commits=0,failed=0,backupAttempts=0,held=0;
const original={records:{k:{reps:1,interval:86400000}},stats:{known:0,unknown:0}};
const context={state:original,historicalCommitInProgress:false,active:true,browsedUnit:{k:'k'},
 newAttemptId:()=> 'history-attempt-1',DAY:86400000,
 PAI_TAP_FLOW:{snapshot:()=>({responseMs:400}),resumeFailedCommit(){failed++},clearPendingGrade(){},syncPage(){},takeHoldAfterRating:()=>true,pageState:()=> 'ANSWER',browseReady(){held++}},
 window:{PAI_SAVE_DEFERRED:false,PAI_KU_STORAGE_READY:true,PAI_KU_DURABLE_VERSION:0,
 PAI_KU_DURABLE_DB:{},PAI_KU_DURABLE:{async commit(){commits++;return {status:'committed',version:commits}}},
 PAI_AUTOBROWSE:{restart(){}}},render(){},save(){backupAttempts++;throw Error('localStorage quota')},
 structuredClone,console:{error(){},warn(){}},Date,Math};
vm.createContext(context);vm.runInContext(implementation,context);
await context.window.rateBrowsedLearning('good','k');
assert.equal(commits,1);
assert.equal(backupAttempts,1);
assert.equal(failed,0,'committed historical rating must not be rolled back on backup failure');
assert.equal(context.state.stats.known,1);
assert.equal(context.state.records.k.reps,2);
assert.equal(context.window.PAI_KU_DURABLE_VERSION,1);
assert.equal(context.historicalCommitInProgress,false);
assert.equal(held,1);
console.log('PASS: historical rating remains committed when optional local backup fails');
