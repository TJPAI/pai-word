import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {validateMasterSceneDocument,mergeMasterScene,resolveMasterSceneIndex,masterReleaseView} from '../../rebuild-preview/scene1341-readonly/scene1341-master-scene-v1.mjs';
const scene='SC50-1341';
const record={record_id:'SC1341-FINAL-SRC-'+'a'.repeat(32),scene_id:scene,source_final_row:230289,
 question_page:{expression:'get home',cue_zh:'到家',ipa_candidate:'/x/'},
 content_sha256:'b'.repeat(64),
 answer_page:{meaning_zh:'v. 到家',pos:'v.',example_en:'I got home.',example_zh:'我到家了。',collocations:['get home early'],usage_note:'短语'},
 release_allowed:false};
const doc={schema_version:'scene1341-master-scene/v1',scene_id:scene,record_count:1,release_allowed:false,srs_eligible:false,records:[record]};
const valid=validateMasterSceneDocument(doc,scene);
const v247=structuredClone(doc);
v247.records[0].record_id=null;
v247.records[0].answer_page.meaning_zh=null;
const sourceRowCard=validateMasterSceneDocument(v247,scene).cards[0];
assert.equal(sourceRowCard.master_record_id,'SC1341-FINAL-ROW-230289');
assert.equal(sourceRowCard.answer.meaning_zh,'到家');
assert.equal(sourceRowCard.production_release_allowed,false);
assert.equal(sourceRowCard.question.ipa,'/x/');
assert.equal(sourceRowCard.qa_status,'DEFERRED_TEST_ONLY');
const absentIPA=structuredClone(v247);
absentIPA.records[0].question_page.ipa_candidate=null;
assert.equal(validateMasterSceneDocument(absentIPA,scene).cards[0].question.ipa,null);
const recentIPA=structuredClone(v247);
recentIPA.records[0].question_page.ipa_candidate='/ˌweɪk ˈʌp/';
assert.equal(validateMasterSceneDocument(recentIPA,scene).cards[0].question.ipa,'/ˌweɪk ˈʌp/');
const whitespacePrimaryIPA=structuredClone(recentIPA);
whitespacePrimaryIPA.records[0].question_page.ipa='   ';
assert.equal(validateMasterSceneDocument(whitespacePrimaryIPA,scene).cards[0].question.ipa,'/ˌweɪk ˈʌp/');
const v265Ambiguous=structuredClone(absentIPA);
v265Ambiguous.records[0].kaikki_full_native_evidence={
 schema:'scene1341-kaikki-full-native/v1',source_final_row:230289,
 expression_exact:'get home',native_sense_selection:'UNRESOLVED',
 qa_stage:'待审',first_review:false,release_allowed:false,
 candidates:[{source_line:5,source_word:'get home',pos:'verb',
  ipa_candidates:['/one/','/two/'],senses:[{source_sense_index:0,glosses:['Native candidate only.'],native_example_count:1}]}]
};
const ambiguousCard=validateMasterSceneDocument(v265Ambiguous,scene).cards[0];
assert.equal(ambiguousCard.question.ipa,null,'unresolved V265 native IPA variants must not be promoted');
assert.equal(ambiguousCard.answer.gloss_en,'','unresolved Kaikki sense must not become approved English gloss');
assert.equal(ambiguousCard.qa_status,'DEFERRED_TEST_ONLY');
assert.equal(ambiguousCard.production_release_allowed,false);

assert.equal(valid.recordCount,1);assert.equal(valid.cards[0].question.ipa,'/x/');
assert.equal(valid.cards[0].question.ipa_status,'MASTER_PROVIDED_UNREVIEWED');
assert.equal(valid.cards[0].answer.example_en,'I got home.');
assert.equal(valid.cards[0].answer.pos,'');
assert.equal(valid.cards[0].master_content_sha256,'b'.repeat(64));
assert.equal(valid.cards[0].answer.collocations[0],'get home early');
const teachingDoc=structuredClone(doc);
teachingDoc.records[0].answer_page.grammar_note='Use as a phrasal verb.';
teachingDoc.records[0].answer_page.common_mistakes='Do not confuse get home with go home.';
teachingDoc.records[0].answer_page.register_note='Neutral register.';
teachingDoc.records[0].answer_page.synonyms=['arrive home'];
teachingDoc.records[0].answer_page.synonyms_status='VERIFIED';
teachingDoc.records[0].answer_page.sense_disambiguation={status:'VERIFIED',note_zh:'与 go home 不同'};
const projected=validateMasterSceneDocument(teachingDoc,scene).cards[0];
assert.equal(projected.answer.grammar_note,'Use as a phrasal verb.');
assert.equal(projected.answer.common_mistakes,'Do not confuse get home with go home.');
assert.equal(projected.answer.register_note,'Neutral register.');
assert.equal(projected.answer.synonyms_status,'VERIFIED');
assert.deepEqual(projected.answer.synonyms,['arrive home']);
assert.equal(projected.answer.sense_disambiguation.note_zh,'与 go home 不同');

assert.equal(valid.cards[0].production_release_allowed,false);
const old={...valid.cards[0],answer:{meaning_zh:'old'}};
const next=mergeMasterScene([old],valid);
assert.equal(next[0].answer.meaning_zh,'v. 到家');
const edited=structuredClone(doc);edited.records[0].answer_page.example_en='I arrived home.';
assert.equal(mergeMasterScene(next,validateMasterSceneDocument(edited,scene))[0].answer.example_en,'I arrived home.');
const legacy={...valid.cards[0],answer:{...valid.cards[0].answer,
 meaning_zh:'v. 到家',example_en:'Rich author example.',
 collocations:['arrive home safely'],usage_note:'Author reviewed usage',content_complete:true}};
const enriched=mergeMasterScene([legacy],valid)[0];
assert.equal(enriched.answer.example_en,'I got home.'); // Master supplied value wins.
assert.equal(enriched.answer.usage_note,'短语'); // Master supplied value wins.
const sparse=structuredClone(doc);
sparse.records[0].answer_page.example_en=null;
sparse.records[0].answer_page.usage_note=null;
sparse.records[0].answer_page.collocations=[];
const enrichedSparse=mergeMasterScene([legacy],validateMasterSceneDocument(sparse,scene))[0];
assert.equal(enrichedSparse.answer.example_en,'Rich author example.');
assert.equal(enrichedSparse.answer.collocations[0],'arrive home safely');
assert.equal(enrichedSparse.answer.content_complete,true);
const spacedMeaning=structuredClone(sparse);
spacedMeaning.records[0].answer_page.meaning_zh='v.   到家';
const normalizedMerge=mergeMasterScene([legacy],validateMasterSceneDocument(spacedMeaning,scene))[0];
assert.equal(normalizedMerge.answer.example_en,'Rich author example.');
assert.equal(normalizedMerge.answer.content_complete,true);
const posChanged=structuredClone(sparse);
posChanged.records[0].answer_page.meaning_zh='到家';
assert.equal(mergeMasterScene([legacy],validateMasterSceneDocument(posChanged,scene))[0].answer.example_en,'Rich author example.');
assert.equal(enrichedSparse.question.ipa,'/x/');
assert.equal(enrichedSparse.qa_status,'DEFERRED_TEST_ONLY');
const changedMeaning=structuredClone(sparse);
changedMeaning.records[0].answer_page.meaning_zh='不同意思';
assert.equal(mergeMasterScene([legacy],validateMasterSceneDocument(changedMeaning,scene))[0].answer.example_en,'');
const v247Legacy={...legacy,master_record_id:'SC1341-FINAL-SRC-'+'a'.repeat(32)};
assert.equal(mergeMasterScene([v247Legacy],validateMasterSceneDocument(v247,scene))[0].master_record_id,'SC1341-FINAL-ROW-230289');
const drift=structuredClone(doc);drift.records[0].question_page.expression='different expression';
assert.throws(()=>mergeMasterScene(next,validateMasterSceneDocument(drift,scene)),/IDENTITY_DRIFT/);
const falseReview=structuredClone(doc);falseReview.records[0].qa_label='1审';
assert.equal(validateMasterSceneDocument(falseReview,scene).cards[0].qa_status,'DEFERRED_TEST_ONLY');
console.log('PASS: full-scene schema, source identity, dynamic answer updates, unapproved IPA and independent QA');

const indexScenes={};
for(let n=1;n<=1341;n++){
 const id='SC50-'+String(n).padStart(4,'0');
 indexScenes[id]={path:'tools/scene1341_master/production/scenes/'+id+'.json',
  records:n===1?228949:1,git_blob_sha1:'a'.repeat(40)};
}
const index={schema_version:'scene1341-master-index/v1',scene_count:1341,
 source_associations:230289,
 source_master_sha256:'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986',
 release_allowed:false,srs_eligible:false,scenes:indexScenes};
const calls=[];
const fetchImpl=async url=>{
 calls.push(url);
 if(url.includes('api.github.com'))return {ok:false,status:403};
 return {ok:true,json:async()=>index};
};
const fallback=await resolveMasterSceneIndex({fetchImpl});
assert.equal(fallback.branchFallback,true);
assert.equal(fallback.index.scene_count,1341);
assert.equal(fallback.commit,'cg-master-kaikki-evidence-intake-20261111');
assert.equal(calls.length,2);
assert.match(calls[1],/raw.githubusercontent.com.*SCENE1341_LIVE_INDEX.json/);
console.log('PASS: GitHub API 403 falls back to raw branch while preserving per-scene blob verification');

const releaseIndex={...index,master_release:{
 metadata_schema:'scene1341-master-release/v1',version:'V256',
 published_date:'2026-11-16',release_allowed:false,srs_eligible:false,
 headline:'新增38条Kaikki单义项证据对应的场景化双语例句',
 changed_scene_ids:['SC50-0001','SC50-0005'],
 changes:[{category:'bilingual_examples',count:38}]
}};
const release=masterReleaseView(releaseIndex);
assert.equal(release.label,'Master V256 · 2026-11-16');
assert.equal(release.changed.has('SC50-0005'),true);
assert.equal(release.changed.has('SC50-0015'),false);
assert.equal(release.changes[0].count,38);
assert.equal(masterReleaseView(index),null);
assert.equal(masterReleaseView({...releaseIndex,master_release:{...releaseIndex.master_release,release_allowed:true}}),null);
assert.equal(masterReleaseView({...releaseIndex,master_release:{...releaseIndex.master_release,version:'INVALID'}}),null);
console.log('PASS Master V256 metadata display, optional older index and release fail-closed');

// Exercise the exact HTML formatter rather than an independently copied POS mapping.
const uiSource=readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const formatterSource=uiSource.match(/function formatMeaningWithPos\(answer\)\{[\s\S]*?\n\}\nfunction renderCard\(/)?.[0];
assert.ok(formatterSource,'real answer-page POS formatter present');
const formatter=runInNewContext(formatterSource.replace(/\nfunction renderCard\($/,'')+'\nformatMeaningWithPos');
assert.equal(formatter({meaning_zh:'醒来',pos:'verb'}),'v. 醒来');
assert.equal(formatter({meaning_zh:'v. 醒来',pos:'verb'}),'v. 醒来');
assert.equal(formatter({meaning_zh:'adj. 困倦的',pos:'adjective'}),'adj. 困倦的');
assert.equal(formatter({meaning_zh:'phr. v. 起床',pos:'phrasal verb'}),'phr. v. 起床');
assert.equal(formatter({meaning_zh:'醒来',pos:''}),'醒来');
console.log('PASS: real Scene1341 answer POS inline, no duplicate prefixes');
