import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyMasterSelectedIpaQuarantine} from '../../rebuild-preview/scene1341-readonly/scene1341-selected-ipa-quarantine.mjs';
const wrong={master_record_id:'SC1341-FINAL-SRC-a0b391ca46f5d231e41d1e8205d62ccd',master_final_row:506,
 scene_id:'SC50-0003',expression:'take off',question:{ipa:'/ˌpʊt ˈɒn/',ipa_status:'KAIKKI_EXACT_UNIQUE_HEADWORD_TEST_ONLY',master_live_ipa_test:true},
 answer:{meaning_zh:'起飞'},production_release_allowed:false};
const untouched={...wrong,master_record_id:'SC1341-FINAL-SRC-'+'1'.repeat(32),master_final_row:507,
 question:{ipa:'/teɪk/'},answer:{meaning_zh:'拿'}};
const output=applyMasterSelectedIpaQuarantine([wrong,untouched]);
assert.equal(output.suppressed,1);
assert.equal(output.items[0].question.ipa,'');
assert.equal(output.items[0].question.ipa_status,'HOLD_MASTER_V193_SELECTED_IPA_MISMATCH');
assert.equal(output.items[0].question.master_live_ipa_test,false);
assert.equal(output.items[0].question.ipa_source.qa_approved,false);
assert.equal(output.items[0].answer.meaning_zh,'起飞');
assert.strictEqual(output.items[1],untouched);
assert.equal(output.canWriteSrs,false);
assert.throws(()=>applyMasterSelectedIpaQuarantine([{...wrong,master_final_row:999}]),/IDENTITY_DRIFT/);
assert.throws(()=>applyMasterSelectedIpaQuarantine([wrong,wrong]),/DUPLICATE_RECORD/);
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const injection=html.indexOf("applyMasterSelectedIpaQuarantine(items)");
const metric=html.indexOf("const latestIPAVisible=items.filter");
assert(injection>0 && injection<metric);
assert(html.includes("scene1341-selected-ipa-quarantine.mjs"));
assert(!html.includes('question-ipa-test.html'));
console.log('PASS V193 selected IPA quarantine row506; strict record identity; old answer preserved; render suppression before IPA stats; no SRS');
