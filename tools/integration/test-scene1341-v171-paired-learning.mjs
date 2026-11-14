import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadScene1341MasterTest} from '../../rebuild-preview/scene1341-readonly/scene1341-master-preview-loader.mjs';
import {loadScene1341V128Test} from '../../rebuild-preview/scene1341-readonly/scene1341-v128-sc0011-loader.mjs';
import {loadScene1341MasterNextBatches} from '../../rebuild-preview/scene1341-readonly/scene1341-next-three-master-loader.mjs';
import {applyV153ArchivedIpaTestOverlay} from '../../rebuild-preview/scene1341-readonly/scene1341-v153-archived-ipa-overlay.mjs';
import {applyV154LocalKaikkiTestOverlay} from '../../rebuild-preview/scene1341-readonly/scene1341-v154-local-kaikki-ipa-overlay.mjs';
import {applyV171PairedMasterOverlay} from '../../rebuild-preview/scene1341-readonly/scene1341-v171-paired-master-overlay.mjs';
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert(html.includes("applyV171PairedMasterOverlay(items)"),'actual Scene1341 study boot must consume V171');
assert(html.includes("question?.ipa_test_only_v171===true"),'actual shared IPA renderer must gate V171 candidates');
assert(html.includes("card.master_paired_test_version==='V171'"),'actual shared IPA renderer must check paired card provenance');
const [qa,extra,next]=await Promise.all([loadScene1341MasterTest(),loadScene1341V128Test(),loadScene1341MasterNextBatches()]);
const v153=await applyV153ArchivedIpaTestOverlay([...qa.items,...extra.items,...next.items]);
const v154=await applyV154LocalKaikkiTestOverlay(v153.items);
const data=await applyV171PairedMasterOverlay(v154.items);
assert.equal(data.replaced,996);assert.equal(data.selectedIPA,979);assert.equal(data.missingIPA,17);
assert.equal(data.scenes,4);assert.equal(data.formalReady,0);assert.equal(data.canWriteSrs,false);
assert.equal(data.releaseAllowed,false);assert.equal(data.items.length,2873);
const selectedInMain=data.items.filter(x=>typeof x.question?.ipa==='string' && /^(?:\\/[^\\/\\]\\r\\n]+\\/|\\[[^\\/\\]\\r\\n]+\\])$/u.test(x.question.ipa.trim()) && x.question.ipa.trim().slice(1,-1).trim()).length;
assert.equal(selectedInMain,1177,'V171 979 IPA plus 198 unchanged non-paired test IPA');
assert(html.includes('MASTER_V171_MAIN_LEARNING_IPA_COUNT_DRIFT'),'main learning coverage must fail closed on source drift');
assert(html.includes('SC0011–SC0014已接入996条V171完整题目与答案配对'),'main home must reflect actual V171 content instead of obsolete V154-only status');
const paired=data.items.filter(x=>x.master_paired_test_version==='V171');
assert.equal(paired.length,996);
assert.deepEqual(['SC50-0011','SC50-0012','SC50-0013','SC50-0014'].map(scene=>
 paired.filter(x=>x.scene_id===scene).length),[255,253,245,243]);
assert.deepEqual(['SC50-0011','SC50-0012','SC50-0013','SC50-0014'].map(scene=>
 paired.filter(x=>x.scene_id===scene&&x.question.ipa!==null).length),[247,253,242,237]);
assert(paired.every(x=>x.answer?.content_complete===true&&x.answer?.example_en&&x.answer?.usage_note));
assert(paired.every(x=>x.production_release_allowed===false&&x.qa_status==='DEFERRED_TEST_ONLY'));
assert(paired.every(x=>x.question.ipa_test_only_v171===true));
assert(paired.every(x=>x.question.ipa===null||x.question.ipa_provisional===true));
const base=new Map(v154.items.map(x=>[x.master_record_id,x]));
assert(data.items.filter(x=>!x.master_paired_test_version).every(x=>x===base.get(x.master_record_id)),
 'unrelated cards must remain byte-for-byte same object');
assert.equal(new Set(data.items.map(x=>x.scene_ku_id)).size,2873);
assert.equal(new Set(data.items.map(x=>x.master_record_id)).size,2873);
assert.equal(new Set(data.items.map(x=>x.master_final_row)).size,2873);
await assert.rejects(applyV171PairedMasterOverlay(v154.items.slice(1)),/BASE_CARD_COUNT_DRIFT/);
console.log(JSON.stringify({status:'PASS',paired:996,scenes:4,ipaTest:979,ipaMissing:17,unchanged:1877,
  sourcePinned:true,formallyReady:0,srsWrites:0,scene500Writes:0}));
