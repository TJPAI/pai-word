import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveFirstReviewLabel} from '../../rebuild-preview/scene1341-readonly/scene1341-first-review-stage.mjs';
const record='SC1341-FINAL-SRC-'+'a'.repeat(32);
const sha='b'.repeat(64);
const example={scene_id:'SC50-0001',master_record_id:record,master_content_sha256:sha,
 qa_stage_label:'1审'};
assert.equal(resolveFirstReviewLabel(example).label,'待审','self-declared label does not establish actual review');
const proof={reviewer:'CG-QA',record_id:record,content_sha256:sha,
 evidence_commit:'c'.repeat(40),evidence_path:'tools/qa/first-review.json',reviewed_at:'2026-11-15',verdict:'REVISE'};
assert.deepEqual(resolveFirstReviewLabel({...example,qa_first_review:proof}),{
 visible:true,label:'1审',verdict:'REVISE',reviewed:true});
assert.equal(resolveFirstReviewLabel({...example,qa_first_review:{...proof,content_sha256:'d'.repeat(64)}}).label,'待审');
assert.equal(resolveFirstReviewLabel({...example,master_content_sha256:'e'.repeat(64),qa_first_review:proof}).label,'待审');
assert.equal(resolveFirstReviewLabel({...example,qa_first_review:{...proof,reviewer:'CG-MASTER'}}).label,'待审');
assert.equal(resolveFirstReviewLabel({...example,qa_first_review:{...proof,evidence_commit:'invalid'}}).label,'待审');
assert.equal(resolveFirstReviewLabel({...example,qa_first_review:{...proof,verdict:'PASS_FROM_WRITER'}}).label,'待审');
assert.equal(resolveFirstReviewLabel({...example,scene_id:'SC50-0006',qa_first_review:proof}).visible,false);
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert(html.includes('id="first-review-stage"'));
assert(html.includes("stageNode.textContent=qaStage.label"));
assert(html.includes("import('./scene1341-first-review-stage.mjs')"));
assert(html.includes('不代表正式批准'));
assert(html.includes('data-srs-write="disabled"'));
console.log('PASS exact content SHA stage 1 review; no fake first review or approval, changed content pending; 5-scene UI scope');
