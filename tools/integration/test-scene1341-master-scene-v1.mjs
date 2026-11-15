import assert from 'node:assert/strict';
import {validateMasterSceneDocument,mergeMasterScene} from '../../rebuild-preview/scene1341-readonly/scene1341-master-scene-v1.mjs';
const scene='SC50-1341';
const record={record_id:'SC1341-FINAL-SRC-'+'a'.repeat(32),scene_id:scene,source_final_row:230289,
 question_page:{expression:'get home',cue_zh:'到家',ipa_candidate:'/x/'},
 answer_page:{meaning_zh:'到家',example_en:'I got home.',example_zh:'我到家了。',collocations:['get home early'],usage_note:'短语'},
 release_allowed:false};
const doc={schema_version:'scene1341-master-scene/v1',scene_id:scene,record_count:1,release_allowed:false,srs_eligible:false,records:[record]};
const valid=validateMasterSceneDocument(doc,scene);
assert.equal(valid.recordCount,1);assert.equal(valid.cards[0].question.ipa,null);
assert.equal(valid.cards[0].question.ipa_status,'UNAPPROVED_CANDIDATE_HOLD');
assert.equal(valid.cards[0].answer.example_en,'I got home.');
assert.equal(valid.cards[0].answer.collocations[0],'get home early');
assert.equal(valid.cards[0].production_release_allowed,false);
const old={...valid.cards[0],answer:{meaning_zh:'old'}};
const next=mergeMasterScene([old],valid);
assert.equal(next[0].answer.meaning_zh,'到家');
const edited=structuredClone(doc);edited.records[0].answer_page.example_en='I arrived home.';
assert.equal(mergeMasterScene(next,validateMasterSceneDocument(edited,scene))[0].answer.example_en,'I arrived home.');
const drift=structuredClone(doc);drift.records[0].question_page.expression='different expression';
assert.throws(()=>mergeMasterScene(next,validateMasterSceneDocument(drift,scene)),/IDENTITY_DRIFT/);
const falseReview=structuredClone(doc);falseReview.records[0].qa_label='1审';
assert.equal(validateMasterSceneDocument(falseReview,scene).cards[0].qa_status,'DEFERRED_TEST_ONLY');
console.log('PASS: full-scene schema, source identity, dynamic answer updates, unapproved IPA and independent QA');
