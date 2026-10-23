// Run: node scripts/qa-v22-rating-contract.mjs
// Non-destructive source-contract regression checks; NOT a Safari/IndexedDB E2E test.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const runtime=read('rebuild-preview/learning-runtime.js');
const durable=read('rebuild-preview/ku-durable-store.js');
const boot=read('rebuild-preview/bootstrap.js');
const html=read('rebuild-preview/index.html');
for(const [name,source] of [['learning-runtime',runtime],['ku-durable-store',durable],['bootstrap',boot]]) {
 new Script(source,{filename:name+'.js'});
 console.log('PASS syntax:',name);
}
const learning=runtime.slice(runtime.indexOf('window.rateLearning=async'));
const app=runtime.slice(runtime.indexOf('window.PAI_CHANGE_BATCH=async'));
assert(!learning.includes('dayKey(')&&!learning.includes('findUnitByKey('),'No cross-IIFE helper references in rating path');
assert(learning.includes('await commitRatedDraft(draft,attempt.attemptId)'),'Queue rating awaits durable commit');
assert(learning.indexOf('await commitRatedDraft(draft,attempt.attemptId)')<learning.indexOf('PAI_TAP_FLOW.clearPendingGrade(k)'),'Queue clears pending grade only after commit');
assert(runtime.includes('await commitRatedDraft(draft,attemptId)'),'Historical rating awaits durable commit');
assert(durable.includes("db.transaction(['state','attempts'],'readwrite')"),'State and attempt ID share a transaction');
assert(durable.includes("if(duplicate.result){result={status:'duplicate'}"),'Duplicate attempt is rejected');
assert(durable.includes("if(previous.version!==expectedVersion)"),'Stale writer is rejected');
assert(app.includes('pendingRatedBatchDirection=direction')&&app.includes('PAI_TAP_FLOW.commitEarly(1)'),'Rated batch waits for commit');
assert(learning.includes('browsedUnit=u;state.revealed=ratedFace;PAI_TAP_FLOW.browseReady(k,null,ratedFace);const moved=await window.PAI_CHANGE_BATCH(ratedBatch)'),'Rated batch starts from rated KU');
assert(learning.includes('if(!moved)await showCurrent()'),'Failed batch navigation restores queue');
assert(learning.includes('takePendingRatedBatch();PAI_TAP_FLOW.resumeFailedCommit()'),'Failure clears pending batch');
const token=/core20k-v22-[a-z0-9-]+-20261024/g;
const bootToken=boot.match(token)?.[0];
assert(bootToken&&html.includes(bootToken),'Preview cache tokens agree');
console.log('PASS rating contract: scope, commit ordering, duplicate/version guards, batch recovery, cache token');
console.log('LIMITATION: source contracts only; execute Safari and two-tab scenarios separately.');

const previewDB=durable.match(/const NAME='([^']+)'/)?.[1];
assert.equal(previewDB,'pai-word-preview-ku-durable-v2','Preview DB must have isolated name');
assert(boot.includes("key.startsWith('pai-word-preview-v2-')"),'Reset must be scoped to preview');
assert(!boot.includes("key.startsWith('pai-word-')"),'Reset must not clear all origin-wide PAI keys');
console.log('PASS preview database namespace and scoped reset');
