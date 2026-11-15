import assert from 'node:assert/strict';
import {validateScene25Documents,applyScene25TestFeed}
 from '../../rebuild-preview/scene1341-readonly/scene1341-v238-v239-scene25-feed.mjs';
const spec=[
 ['V239',6,214],['V239',7,244],['V239',8,227],['V239',9,226],
 ['V239',10,227],['V239',15,250],['V239',16,298],
 ['V238',17,232],['V238',18,234],['V238',19,221],['V238',20,248],
 ['V238',21,247],['V238',22,272],['V238',23,324],['V238',24,240],['V238',25,238]
];
let pointer=1242;
const docs=spec.map(([version,n,count])=>{
 const scene='SC50-'+String(n).padStart(4,'0');
 const records=Array.from({length:count},()=>{
  const source_final_row=pointer++;
  return {record_id:'SC1341-FINAL-SRC-'+source_final_row.toString(16).padStart(32,'0'),
   source_final_row,scene_id:scene,
   question_page:{expression:'item '+source_final_row,ipa_candidate:'/CMU/',ipa_approved:false,qa_label:'待审'},
   answer_page:{meaning_zh:'中文 '+source_final_row,examples:[],qa_label:'待审'},
   coverage_level:'L1_SOURCE_CUE_WITH_TEST_IPA',complete:false,formal_ready:0,release_allowed:false};
 });
 return {version,scene_id:scene,record_count:count,qa_stage:'待审',release_allowed:false,records};
});
assert.equal(pointer,6180);
const v=validateScene25Documents(docs);
assert.equal(v.sourceCount,3942);
const original=docs.slice(0,5).flatMap(d=>d.records).slice(0,636).map(r=>({
 master_record_id:r.record_id,master_final_row:r.source_final_row,scene_id:r.scene_id,
 expression:r.question_page.expression,question:{ipa:'/legacy/',expression:r.question_page.expression},
 answer:{meaning_zh:'原版完整教材',content_complete:true},source_rank:r.source_final_row
}));
assert.equal(original.length,636);
const merged=applyScene25TestFeed(original,{rows:v.rows,commit:'f'.repeat(40),
 onlyTest:true,canWriteSrs:false,formalReady:0});
assert.equal(merged.matched,636);assert.equal(merged.appended,3306);
assert.equal(merged.items.length,3942);assert.equal(merged.canWriteSrs,false);
assert.equal(merged.items.find(x=>x.master_final_row===1242).answer.meaning_zh,'原版完整教材');
const newCard=merged.items.find(x=>x.master_final_row===3376);
assert.equal(newCard.scene_id,'SC50-0015');
assert.equal(newCard.question.ipa,null);assert.equal(newCard.question.ipa_provisional,false);
assert.equal(newCard.question.ipa_status,'CMU_TEST_IPA_HOLD_NOT_NATIVE');
assert.equal(newCard.production_release_allowed,false);
assert.equal(newCard.answer.content_complete,false);
const forged=structuredClone(docs);forged[0].records[0].question_page.ipa_approved=true;
assert.throws(()=>validateScene25Documents(forged),/SCENE25_TEST_ROW/);
const wrong=[{...original[0],expression:'another Sense'},...original.slice(1)];
assert.throws(()=>applyScene25TestFeed(wrong,{rows:v.rows,commit:'f'.repeat(40),
 onlyTest:true,canWriteSrs:false,formalReady:0}),/SCENE25_TEST_BASE_IDENTITY/);
console.log('PASS Scene25 V238/V239: 3942 source rows, 636 legacy preserved, 3306 L1 appended, IPA HOLD, SRS0');
