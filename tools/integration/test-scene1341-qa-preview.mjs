import assert from 'node:assert/strict';
import fs from 'node:fs';
import {attachScene1341QaPreviewStatus} from '../../rebuild-preview/scene1341-qa-preview.mjs';
const base='tools/integration/scene1341-teaching/';
const files=['enteach-v51-first20-answer-only-v2.json',
 'scene1341-v51-sc0001-answer-only-021-050.v2.json',
 'scene1341-v51-sc0001-answer-only-051-100.v2.json',
 'scene1341-v51-sc0001-answer-only-101-130.v2.json',
 'scene1341-v51-sc0001-answer-only-131-180.v2.json',
 'scene1341-v51-sc0001-answer-only-181-234.v2.json',
 'scene1341-v51-sc0002-answer-only-001-020.v2.json',
 'scene1341-v51-sc0002-answer-only-021-070.v2.json'];
const items=files.flatMap(p=>JSON.parse(fs.readFileSync(base+p,'utf8')).records
 .map(r=>({id:r.scene_ku_id,sceneId:r.scene_id,rank:r.source_rank,expression:r.expression})));
const ledger=JSON.parse(fs.readFileSync(base+'qa-304-status-staging.v1.json','utf8'));
const annotated=attachScene1341QaPreviewStatus(items,ledger);
assert.equal(annotated.length,304);
assert.equal(ledger.source_blob,'02f9d62efc3570e0b573987d6fad8873cc717b97');
assert.equal(annotated.filter(x=>x.qaPreview.cgVerdict==='PASS').length,277);
assert.equal(annotated.filter(x=>x.qaPreview.cgVerdict==='CONDITIONAL').length,18);
assert.equal(annotated.filter(x=>x.qaPreview.cgVerdict==='REVISE').length,9);
assert.equal(annotated.filter(x=>x.qaPreview.needsReview).length,27);
assert.equal(annotated.filter(x=>x.qaPreview.dispute).length,7);
assert(annotated.every(x=>x.qaPreview.releaseEligible===false));
assert(annotated.find(x=>x.id==='SC1341-KU-00006').qaPreview.issue.includes('闹钟'));
assert.throws(()=>attachScene1341QaPreviewStatus(items,{...ledger,counts:{...ledger.counts,release_approved:1}}),/LEDGER_INVALID/);
assert.throws(()=>attachScene1341QaPreviewStatus(items,{...ledger,flags:[...ledger.flags,ledger.flags[0]]}),/DUPLICATE_FLAG/);
assert.throws(()=>attachScene1341QaPreviewStatus(items,{...ledger,flags:[{...ledger.flags[0],rank:999},...ledger.flags.slice(1)]}),/IDENTITY_MISMATCH/);
assert.throws(()=>attachScene1341QaPreviewStatus(items,{...ledger,counts:{...ledger.counts,cg_pass:278}}),/COUNT_MISMATCH/);
console.log(JSON.stringify({status:'PASS',authored:304,cgPass:277,conditional:18,revise:9,disputes:7,releaseApproved:0,questionFields:0}));
