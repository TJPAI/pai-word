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
assert(snap.items.every(x=>x.production_release_allowed!==true));
for(const x of snap.items){
 const before=prior.get(x.master_record_id);
 assert.equal(x.scene_id,before.scene_id);
 assert.equal(x.expression,before.expression);
 assert.equal(x.master_final_row,before.master_final_row);
 assert.deepEqual(x.question,before.question,'master author answer delta must never replace IPA/question');
 assert.equal(x.answer.meaning_zh,before.answer.meaning_zh,'old Chinese meaning must stay unchanged');
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
 matched:snap.exact,held:snap.held,enriched:snap.enriched,examplesAdded:snap.examplesAdded,
 learnerCards:snap.items.length,scene500Writes:0,srsWrites:0,formalReady:0}));
