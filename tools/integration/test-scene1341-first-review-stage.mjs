import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveFirstReviewLabel,createTrustedFirstReviewIndex,fetchIndependentFirstReviews} from '../../rebuild-preview/scene1341-readonly/scene1341-first-review-stage.mjs';
const record='SC1341-FINAL-SRC-'+'a'.repeat(32),sha='b'.repeat(64),commit='c'.repeat(40);
const card={scene_id:'SC50-0001',master_record_id:record,master_content_sha256:sha,qa_stage_label:'1审',
 qa_first_review:{reviewer:'CG-QA',record_id:record,content_sha256:sha,evidence_commit:commit,evidence_path:'tools/qa/forged.json',reviewed_at:'2026-11-15',verdict:'PASS'}};
assert.equal(resolveFirstReviewLabel(card).label,'待审','Master-embedded proof MUST NOT authorize QA first-review badge');
const proof={scene_id:'SC50-0001',reviewer:'CG-QA',record_id:record,content_sha256:sha,evidence_commit:commit,
 evidence_path:'tools/core20k_lexicon/qa/evidence.json',reviewed_at:'2026-11-15',verdict:'REVISE'};
const report={schema:'scene1341-phase1-independent-first-review/v1',reviewer:'CG-QA',formal_ready:0,srs_eligible:false,reviews:[proof]};
const trusted=createTrustedFirstReviewIndex(report,{commit});
assert.deepEqual(resolveFirstReviewLabel(card,trusted),{visible:true,label:'1审',verdict:'REVISE',reviewed:true});
assert.equal(resolveFirstReviewLabel({...card,master_content_sha256:'e'.repeat(64)},trusted).label,'待审');
assert.equal(resolveFirstReviewLabel({...card,master_record_id:'SC1341-FINAL-SRC-'+'d'.repeat(32)},trusted).label,'待审');
assert.equal(resolveFirstReviewLabel({...card,scene_id:'SC50-0002'},trusted).label,'待审');
assert.equal(resolveFirstReviewLabel({...card,scene_id:'SC50-0006'},trusted).visible,false);
assert.throws(()=>createTrustedFirstReviewIndex({...report,reviews:[proof,proof]},{commit}),/DUPLICATE/);
assert.throws(()=>createTrustedFirstReviewIndex({...report,reviews:[{...proof,reviewer:'CG-MASTER'}]},{commit}),/PROOF/);
assert.doesNotThrow(()=>createTrustedFirstReviewIndex({...report,reviews:[{...proof,evidence_commit:'d'.repeat(40)}]},{commit}),'actual review evidence may predate the QA index commit');
assert.throws(()=>createTrustedFirstReviewIndex({...report,reviews:[{...proof,evidence_commit:'wrong'}]},{commit}),/PROOF/);
assert.throws(()=>createTrustedFirstReviewIndex({...report,formal_ready:1},{commit}),/REPORT/);
const calls=[];
const fetched=await fetchIndependentFirstReviews({fetchImpl:async(url,opts)=>{
 calls.push(url);assert.equal(opts.cache,'no-store');
 return new Response(JSON.stringify(calls.length===1?{commit:{sha:commit}}:report),{status:200});
}});
assert.equal(fetched.commit,commit);assert.equal(fetched.index.size,1);assert(calls[1].includes('/'+commit+'/'));
await assert.rejects(()=>fetchIndependentFirstReviews({fetchImpl:async()=>new Response('Not found',{status:404})}),/BRANCH_HTTP_404/);
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert(html.includes('id="first-review-stage"'));
assert(html.includes('id="phase1-review-source-status"'));
assert(html.includes('qaModule.fetchIndependentFirstReviews()'));
assert(html.includes('resolveQaStage(r,independentQaReviews)'));
assert(html.includes('不代表正式批准')&&html.includes('data-srs-write="disabled"'));
console.log('PASS true independent CG-QA SHA-pinned report, author-forged review ignored, content edits reset 待审; first-reviewed REVISE displays 1审, SRS0');
