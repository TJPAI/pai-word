import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {resolveFirstReviewLabel,resolveEditorialFirstReview,createTrustedFirstReviewIndex,fetchIndependentFirstReviews} from '../../rebuild-preview/scene1341-readonly/scene1341-first-review-stage.mjs';
const record='SC1341-FINAL-SRC-'+'a'.repeat(32),sha='b'.repeat(64),commit='c'.repeat(40);
const card={scene_id:'SC50-0001',master_record_id:record,master_content_sha256:sha,qa_stage_label:'1审',
 qa_first_review:{reviewer:'CG-QA',record_id:record,content_sha256:sha,evidence_commit:commit,evidence_path:'tools/qa/forged.json',reviewed_at:'2026-11-15',verdict:'PASS'}};
assert.equal(resolveFirstReviewLabel(card).label,'待审','Master-embedded proof MUST NOT authorize QA first-review badge');
const proof={scene_id:'SC50-0001',reviewer:'CG-QA',record_id:record,content_sha256:sha,evidence_commit:commit,
 evidence_path:'tools/core20k_lexicon/qa/evidence.json',reviewed_at:'2026-11-15',verdict:'REVISE'};
const report={schema:'scene1341-phase1-independent-first-review/v1',reviewer:'CG-QA',formal_ready:0,srs_eligible:false,reviews:[proof]};
const trusted=createTrustedFirstReviewIndex(report,{commit});
assert.deepEqual(resolveFirstReviewLabel(card,trusted),{visible:true,label:'1审',verdict:'REVISE',reviewed:true});
const editor={record_id:record,scene_id:'SC50-0001',content_sha256:sha,
 qa_stage_label:'1审',qa_first_review:{...proof,verdict:'PASS'}};
assert.deepEqual(resolveEditorialFirstReview(editor,trusted),
 {stage:'1审',verdict:'REVISE',firstReviewed:true,formalReady:false,srsEligible:false});
assert.equal(resolveEditorialFirstReview({...editor,content_sha256:'e'.repeat(64)},trusted).stage,'待审');
assert.equal(resolveEditorialFirstReview(editor,new Map()).stage,'待审');

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
assert(!html.includes('id="answer-review-stage"'), 'answer bottom review marker must not exist');
assert(!/<div class="study-top"[^>]*>[\\s\\S]*?id="first-review-stage"/.test(html),
 'review text must not appear in top title/progress bar');
assert(/class="ipa-line"[^>]*>[^\n]*id="ipa"[^\n]*id="first-review-stage"/.test(html),
 'one common status label must be next to IPA on both faces');
assert(html.includes("const reviewText=qaStage.visible?(qaStage.reviewed?'1审':'待审'):''"));
assert(html.includes("questionStage.hidden=!reviewText;"));
assert(!html.includes("revealed .phase-review-text")&&!html.includes("answerStage.textContent"),
 'neither face may hide or duplicate the shared IPA-adjacent review label');
assert(html.includes("if($('ipa')&&questionStage.parentElement!==$('ipa').parentElement)$('ipa').after(questionStage)"));
assert(!html.includes("Kaikki来源候选·待审")&&!html.includes("编辑草稿·待审"),
 'other learner-facing locations cannot contain extra review labels');

assert(html.includes('id="phase1-review-source-status"'));
assert(html.includes('qaModule.fetchIndependentFirstReviews()'));
assert(html.includes('qaModule.resolveEditorialFirstReview(row,independentQaReviews)'));
assert(html.includes('data.qaResolve(row,independentQaReviews)'));
assert(html.includes('resolveQaStage(r,independentQaReviews)'));
assert(html.includes('data-srs-write="disabled"')&&html.includes("const reviewText=qaStage.visible?(qaStage.reviewed?'1审':'待审'):''"), 'review status is only simple standalone text; release stays disabled');
console.log('PASS true independent CG-QA SHA-pinned report, author-forged review ignored, content edits reset 待审; first-reviewed REVISE displays 1审, SRS0');

const source=html.slice(html.indexOf("const P0_PACK_LUNCH_RECORD='"),html.indexOf('// Same two-stage cycle'));
assert(source.includes('eligiblePreviewCard(card)')&&source.includes('const subset=')&&source.includes('const available='),
 'same preview eligibility must apply to manual/auto batch navigation and scene counts');
const riskId='SC1341-FINAL-SRC-c11130a3098680db35fc444573431858';
const normal={scene_id:'SC50-0001',master_record_id:record,master_content_sha256:sha};
const risky={scene_id:'SC50-0001',master_record_id:riskId,
 master_content_sha256:'8d99489f579f6640e6c5050717e6814a385c4ab122a2f99a71cf1be8723cf014'};
const ctx={items:[normal,risky],sceneId:'SC50-0001',independentQaReviews:new Map(),
 resolveQaStage:(card,reviews)=>card.master_record_id===riskId
   ?({reviewed:reviews.get('pack')==='PASS',verdict:reviews.get('pack')||null})
   :({reviewed:false,verdict:null})};
vm.runInNewContext(source+'\nthis.eligiblePreviewCard=eligiblePreviewCard;this.subset=subset;this.available=available;',ctx);
assert.equal(ctx.eligiblePreviewCard(risky),false,'P0 HOLD must be excluded if QA network unavailable');
assert.equal(ctx.subset().length,1);
assert.equal(ctx.available('SC50-0001'),1);
ctx.independentQaReviews.set('pack','HOLD');
assert.equal(ctx.subset().length,1,'independent QA HOLD must NOT unblock P0');
ctx.independentQaReviews.set('pack','CONDITIONAL');
assert.equal(ctx.subset().length,1,'conditional is NOT independent PASS');
ctx.independentQaReviews.set('pack','PASS');
assert.equal(ctx.subset().length,2,'future exact-content PASS can restore read-only preview');
assert.equal(ctx.available('SC50-0001'),2);
console.log('PASS CG-QA P0 pack lunch source sense quarantined from real preview queue, QA fail-closed');
