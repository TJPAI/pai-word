// Run: node scripts/test-v21-historical-write-lock.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const a=source.indexOf('window.rateBrowsedLearning=async('),b=source.indexOf('\n window.PAI_RELOAD_KU_AFTER_CONFLICT=',a);
assert(a>=0&&b>a,'historical rating handler missing');
let commits=0;
const context={
 window:{PAI_SAVE_DEFERRED:true},historicalCommitInProgress:false,
 active:true,browsedUnit:{k:'k'},state:{records:{k:{reps:1}},stats:{known:0,unknown:0}},
 newAttemptId:()=>{throw Error('Must not create attempt during another write')},
 structuredClone:()=>{throw Error('Must not clone state during another write')},
 PAI_TAP_FLOW:{},Date,Math
};
vm.createContext(context);vm.runInContext(source.slice(a,b),context);
await context.window.rateBrowsedLearning('good','k');
assert.equal(commits,0);
assert.equal(context.historicalCommitInProgress,false);
assert.equal(context.state.stats.known,0);
assert.equal(context.state.records.k.reps,1);
console.log('PASS: historical grading does not start during an outstanding KU commit');
