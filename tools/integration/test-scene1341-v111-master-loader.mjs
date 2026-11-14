import assert from 'node:assert/strict';
import {loadScene1341MasterTest} from '../../rebuild-preview/scene1341-readonly/scene1341-master-preview-loader.mjs';

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
console.log(JSON.stringify({status:'PASS',source:snap.source,records:snap.total,scenes:snap.scenes,ipaVerified:snap.verifiedNativeIpa,ipaProvisional:snap.provisionalNativeIpa,ipaPending:snap.ipaPendingAdjudication,ipaMissing:snap.total-checked.length,blocked:snap.excludedBlocked,productionRelease:snap.productionRelease}));
