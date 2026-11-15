import assert from 'node:assert/strict';
import {validateV234FullCoverage,applyV234Phase1TestOverlay}
 from '../../rebuild-preview/scene1341-readonly/scene1341-v234-phase1-test-overlay.mjs';
const scenes=Object.fromEntries([294,206,237,245,259].map((n,i)=>['SC50-'+String(i+1).padStart(4,'0'),n]));
const records={};let row=0;
for(const [scene,n] of Object.entries(scenes)){
 records[scene]=Array.from({length:n},()=>{
  row++;return {record_id:'SC1341-FINAL-SRC-'+row.toString(16).padStart(32,'0'),
    source_final_row:row,scene_id:scene,
    question_page:{expression:'item '+row,ipa_candidate:null,ipa_candidates:['/bad/'],ipa_approved:false,qa_label:'待审'},
    answer_page:{meaning_display:'v. 中文'+row,gloss_en:'native gloss',qa_label:'待审'},
    complete:false,formal_ready:0,release_allowed:false,coverage_level:row<=258?'L2_KAIKKI_NATIVE_CANDIDATE':'L1_SOURCE_CUE_ONLY',
    qa_stage:'待审'};
 });
}
const doc={version:'V234',purpose:'FULL_SC0001_0005_ALL1241_SOURCE_ROW_TEST_COVERAGE',
 stats:{total:1241,enhanced:258,baseline:983,ipa_candidates:374,by_scene:scenes},
 release_allowed:false,qa_stage:'待审',scenes:records};
const validated=validateV234FullCoverage(doc);
assert.equal(validated.byId.size,1241);
const base=Object.values(records).flat().map((r,i)=>({
 master_record_id:r.record_id,master_final_row:r.source_final_row,
 scene_id:r.scene_id,expression:r.question_page.expression,
 question:{ipa:'/legacy/'},answer:{meaning_zh:'旧'},
 ...(i<258?{master_phase1_source:'KAIKKI_FRESH_EDITOR_TEST'}:{})
}));
const result=applyV234Phase1TestOverlay(base,{rows:validated.byId,commit:'f'.repeat(40),
 onlyTest:true,formalReady:0,canWriteSrs:false});
assert.equal(result.matched,1241);assert.equal(result.preserved,258);
assert.equal(result.baseline,983);assert.equal(result.held,0);
assert.equal(result.items[0].question.ipa,'/legacy/');
assert.equal(result.items[258].question.ipa,null);
assert.equal(result.items[258].answer.meaning_zh,'v. 中文259');
assert.equal(result.items[258].production_release_allowed,false);
assert.equal(result.canWriteSrs,false);
const wrong=structuredClone(doc);wrong.scenes['SC50-0001'][0].question_page.ipa_approved=true;
assert.throws(()=>validateV234FullCoverage(wrong),/V234_PHASE1_SOURCE_ROW/);
const bad=structuredClone(base);bad[258].expression='DIFFERENT SENSE';
const held=applyV234Phase1TestOverlay(bad,{rows:validated.byId,commit:'f'.repeat(40),
 onlyTest:true,formalReady:0,canWriteSrs:false});
assert.equal(held.held,1);assert.equal(held.baseline,982);
assert.equal(held.items[258].expression,'DIFFERENT SENSE');
console.log('PASS V234 1241 L1/L2 test overlay; 258 authored preserved; IPA HOLD; QA/SRS0');
