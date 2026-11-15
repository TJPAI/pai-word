import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadScene1341MasterTest} from '../../rebuild-preview/scene1341-readonly/scene1341-master-preview-loader.mjs';
import {loadScene1341V128Test} from '../../rebuild-preview/scene1341-readonly/scene1341-v128-sc0011-loader.mjs';
import {loadScene1341MasterNextBatches} from '../../rebuild-preview/scene1341-readonly/scene1341-next-three-master-loader.mjs';
import {applyV153ArchivedIpaTestOverlay} from '../../rebuild-preview/scene1341-readonly/scene1341-v153-archived-ipa-overlay.mjs';
import {applyV154LocalKaikkiTestOverlay} from '../../rebuild-preview/scene1341-readonly/scene1341-v154-local-kaikki-ipa-overlay.mjs';
import {applyV171PairedMasterOverlay} from '../../rebuild-preview/scene1341-readonly/scene1341-v171-paired-master-overlay.mjs';
import {applyV190MasterAnswerIntake} from '../../rebuild-preview/scene1341-readonly/scene1341-v190-master-answer-intake.mjs';
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert(html.includes('applyV190MasterAnswerIntake(items)'), 'latest V190 must be in actual main study boot');
assert(!html.includes('question-ipa-test.html'),'no standalone IPA page return');
const [qa,extra,next]=await Promise.all([loadScene1341MasterTest(),loadScene1341V128Test(),loadScene1341MasterNextBatches()]);
const v153=await applyV153ArchivedIpaTestOverlay([...qa.items,...extra.items,...next.items]);
const v154=await applyV154LocalKaikkiTestOverlay(v153.items);
const v171=await applyV171PairedMasterOverlay(v154.items);
const snap=await applyV190MasterAnswerIntake(v171.items);
assert.equal(snap.sourceRows,3000);assert.equal(snap.items.length,2873);
assert.equal(snap.formalReady,0);assert.equal(snap.canWriteSrs,false);assert.equal(snap.releaseAllowed,false);
const prior=new Map(v171.items.map(x=>[x.master_record_id,x]));
assert.equal(new Set(snap.items.map(x=>x.master_record_id)).size,2873);
assert.equal(new Set(snap.items.map(x=>x.master_final_row)).size,2873);
assert.equal(new Set(snap.items.map(x=>x.scene_ku_id)).size,2873);
assert(snap.exact>0,'must really match existing Master records');
assert(snap.enriched>0,'must actually add V190 author fields');
assert.equal(snap.exact,2498);
assert.equal(snap.held,0);
assert(snap.enriched>=314,'new source-native IPA may extend the number of updated question cards');
assert(snap.liveIPATest>=0 && snap.ipaUpdated>=0);
assert.equal(snap.examplesAdded,0);
assert.equal(snap.unmatchedSourceRows,502,'V190 source cannot be inflated into unready live cards');
assert.equal(snap.legacyOutsideBatch,375,'legacy cards outside V190 first 3000 stay intact');
assert.equal(Object.values(snap.perScene).reduce((n,v)=>n+v.matched,0),2498);
assert.equal(Object.values(snap.perScene).reduce((n,v)=>n+v.enriched,0),snap.enriched);
assert(html.includes('id="master-v190-gloss-section"')&&!html.includes('id="master-v190-pos-section"'),'English gloss stays separate; POS must be inline before Chinese meaning');
assert(html.includes('英文释义（待核验）')&&html.includes('function formatMeaningWithPos(answer){')&&html.includes("set('meaning',formatMeaningWithPos(r.answer))"),'V190 gloss stays unverified and POS is abbreviated inline before Chinese meaning');
assert(snap.items.every(x=>x.production_release_allowed!==true));
for(const x of snap.items){
 const before=prior.get(x.master_record_id);
 assert.equal(x.scene_id,before.scene_id);
 assert.equal(x.expression,before.expression);
 assert.equal(x.master_final_row,before.master_final_row);
 if(x.question.master_live_ipa_test===true){
  assert(['KAIKKI_EXACT_UNIQUE_HEADWORD_TEST_ONLY','CMUDICT113_EXACT_ARPABET_CONVERTED_TEST_ONLY'].includes(
   x.question.master_live_ipa_source_status),'only unambiguous source candidates can update the question IPA');
  assert.equal(x.question.master_previous_ipa_test,before.question.ipa||null);
  assert.equal(x.question.ipa_source?.sense_match_approved,false);
  assert.equal(x.question.ipa_source?.qa_approved,false);
  assert.equal(x.question.ipa_provisional,true);
  assert.equal(x.question.master_live_ipa_source_commit,snap.sourceCommit);
 }else{
  assert.deepEqual(x.question,before.question,'ambiguous/HOLD question IPA must remain unchanged');
 }
 assert.equal(x.answer.meaning_zh,before.answer.meaning_zh,'old Chinese meaning must stay unchanged');
 for(const f of ['synonyms','antonyms','sense_disambiguation','synonyms_status','antonyms_status','content_complete']){
  if(Object.prototype.hasOwnProperty.call(before.answer,f))
   assert.deepEqual(x.answer[f],before.answer[f],'existing semantic annotation must not be erased by V190: '+f);
 }
 for(const f of ['example_en','example_zh','usage_note']){
  if(typeof before.answer?.[f]==='string'&&before.answer[f].trim())
   assert.equal(x.answer[f],before.answer[f],'do not overwrite existing author field '+f);
 }
 if(x.master_latest_answer_source==='V190_TEST_ONLY'){
  assert.equal(x.production_release_allowed,false);
  assert.equal(x.answer.synonyms_status,'UNVERIFIED');
  assert.equal(x.answer.antonyms_status,'UNVERIFIED');
 }
}
console.log(JSON.stringify({status:'PASS',version:'V190',sourceRows:snap.sourceRows,
 matched:snap.exact,held:snap.held,enriched:snap.enriched,examplesAdded:snap.examplesAdded,liveIPATest:snap.liveIPATest,ipaUpdated:snap.ipaUpdated,
 learnerCards:snap.items.length,unmatchedSourceRows:snap.unmatchedSourceRows,legacyOutsideBatch:snap.legacyOutsideBatch,scene500Writes:0,srsWrites:0,formalReady:0}));
