import assert from 'node:assert/strict';
import {loadScene1341MasterTest} from '../../rebuild-preview/scene1341-readonly/scene1341-master-preview-loader.mjs';
import {loadScene1341V120Test} from '../../rebuild-preview/scene1341-readonly/scene1341-v120-sc0011-loader.mjs';
import {loadScene1341V118Test} from '../../rebuild-preview/scene1341-readonly/scene1341-v118-sc0011-loader.mjs';

const snap=await loadScene1341MasterTest();
assert.equal(snap.total,1877);
assert.equal(snap.scenes,10);
assert.equal(snap.excludedBlocked,161);
assert.equal(snap.verifiedNativeIpa,3);
assert.equal(snap.provisionalNativeIpa,195);
assert.equal(snap.ipaPendingAdjudication,410);
assert.equal(snap.canWriteSrs,false);
assert.equal(snap.productionRelease,false);
assert.equal(snap.formalCertification,false);
assert.equal(snap.testRecordsDisposable,true);
const checked=snap.items.filter(x=>x.question.ipa!==null);
assert.equal(checked.length,198);
assert.deepEqual(new Set(checked.filter(x=>!x.question.ipa_provisional).map(x=>x.expression)),new Set(['wake up','alarm','night owl']));
for(const card of snap.items){
 assert.equal(card.production_release_allowed,false);
 assert.match(card.master_record_id,/^SC1341-FINAL-SRC-[a-f0-9]{32}$/);
 assert.equal(card.question.expression,card.expression);
 assert.equal(card.question.cue_zh,card.answer.meaning_zh);
 if(card.question.ipa!==null){
  if(card.question.ipa_provisional){
   assert.equal(card.question.ipa_status,'NATIVE_KAIKKI_SINGLE_PHONEMIC_VARIANT_PROVISIONAL');
   assert(card.question.ipa_source.source_sha256);
  }else{
   assert.equal(card.question.ipa_status,'VERIFIED_NATIVE_KAIKKI_EXACT_ENTRY_TEST_ONLY');
   assert.equal(card.question.ipa_source.headword,card.expression);
   assert(card.question.ipa_source.url.startsWith('https://kaikki.org/dictionary/English/'));
  }
 }else{
  assert.equal(card.question.ipa_status,'MISSING_VERIFIED_KAIKKI_IPA');
  assert.equal(card.question.ipa_source,null);
 }
}
const extra=await loadScene1341V120Test();
assert.equal(extra.total,80);
const original30=await loadScene1341V118Test();
assert.equal(original30.total,30);
const mergedByRow=new Map(extra.items.map(r=>[r.master_final_row,r]));
for(const row of original30.items){
 const merged=mergedByRow.get(row.master_final_row);
 assert(merged,'V120 must preserve V118 original FINAL row '+row.master_final_row);
 assert.equal(merged.master_record_id,row.master_record_id);
 assert.equal(merged.expression,row.expression);
 assert.deepEqual(merged.question,row.question);
 assert.deepEqual(merged.answer,row.answer);
 assert.equal(merged.production_release_allowed,false);
}

assert.equal(extra.scenes,1);
assert.equal(extra.formalCertification,false);
assert.equal(extra.productionRelease,false);
assert.equal(extra.canWriteSrs,false);
const oldIds=new Set(snap.items.map(x=>x.master_record_id));
const oldRows=new Set(snap.items.map(x=>x.master_final_row));
for(const row of extra.items){
 assert.equal(row.scene_id,'SC50-0011');
 assert(!oldIds.has(row.master_record_id));
 assert(!oldRows.has(row.master_final_row));
 assert.equal(row.scene_ku_id,row.master_record_id);
 assert.equal(row.production_release_allowed,false);
 assert.equal(row.question.ipa,null);
 assert.equal(row.question.ipa_status,'MISSING_VERIFIED_KAIKKI_IPA');
 assert.equal(row.question.cue_zh,row.answer.meaning_zh);
}
assert.equal(snap.total+extra.total,1957);
assert.equal(snap.scenes+extra.scenes,11);
console.log(JSON.stringify({status:'PASS',source:snap.source,records:snap.total,scenes:snap.scenes,ipaVerified:snap.verifiedNativeIpa,ipaProvisional:snap.provisionalNativeIpa,ipaPending:snap.ipaPendingAdjudication,ipaMissing:snap.total-checked.length,blocked:snap.excludedBlocked,v118NewDrafts:extra.total,combinedTestScenes:11,combinedTestCards:1957,productionRelease:snap.productionRelease}));
