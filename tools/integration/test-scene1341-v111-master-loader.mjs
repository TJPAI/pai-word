import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {measureScene1341MasterCoverage} from '../../rebuild-preview/scene1341-readonly/scene1341-master-coverage.mjs';
import {applyV153ArchivedIpaTestOverlay} from '../../rebuild-preview/scene1341-readonly/scene1341-v153-archived-ipa-overlay.mjs';
import {loadScene1341MasterTest} from '../../rebuild-preview/scene1341-readonly/scene1341-master-preview-loader.mjs';
import {loadScene1341V128Test} from '../../rebuild-preview/scene1341-readonly/scene1341-v128-sc0011-loader.mjs';
import {loadScene1341MasterNextBatches,MASTER_SCENE_BATCH_MANIFEST} from '../../rebuild-preview/scene1341-readonly/scene1341-next-three-master-loader.mjs';
import {loadScene1341V118Test} from '../../rebuild-preview/scene1341-readonly/scene1341-v118-sc0011-loader.mjs';
import {loadScene1341V120Test} from '../../rebuild-preview/scene1341-readonly/scene1341-v120-sc0011-loader.mjs';
import {loadScene1341V123Test} from '../../rebuild-preview/scene1341-readonly/scene1341-v123-sc0011-loader.mjs';

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
const extra=await loadScene1341V128Test();
assert.equal(extra.total,255);
const previous130=await loadScene1341V123Test();
assert.equal(previous130.total,130);
const merged255=new Map(extra.items.map(x=>[x.master_final_row,x]));
for(const row of previous130.items){
 const updated=merged255.get(row.master_final_row);
 assert(updated,'V128 missing source row '+row.master_final_row);
 assert.equal(updated.master_record_id,row.master_record_id);
 assert.equal(updated.expression,row.expression);
 assert.deepEqual(updated.question,row.question);
 assert.deepEqual(updated.answer,row.answer);
}
const previous80=await loadScene1341V120Test();
assert.equal(previous80.total,80);
const merged130=new Map(extra.items.map(x=>[x.master_final_row,x]));
for(const row of previous80.items){
 const updated=merged130.get(row.master_final_row);
 assert(updated,'V123 missing preserved V120 row '+row.master_final_row);
 assert.equal(updated.master_record_id,row.master_record_id);
 assert.equal(updated.expression,row.expression);
 assert.deepEqual(updated.question,row.question);
 assert.deepEqual(updated.answer,row.answer);
 assert.equal(updated.production_release_allowed,false);
}
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
const next=await loadScene1341MasterNextBatches();
assert.equal(next.total,741);
assert.equal(next.scenes,3);
assert.deepEqual(MASTER_SCENE_BATCH_MANIFEST.map(x=>[x.scene,x.count]),[
 ['SC50-0012',253],['SC50-0013',245],['SC50-0014',243]
]);
assert.equal(MASTER_SCENE_BATCH_MANIFEST.reduce((n,x)=>n+x.count,0),next.total);
for(const [i,a] of MASTER_SCENE_BATCH_MANIFEST.entries()){
 assert.equal(a.last-a.first+1,a.count,'manifest FINAL rows must be contiguous');
 for(const [j,b] of MASTER_SCENE_BATCH_MANIFEST.entries())
  if(i!==j)assert(a.scene!==b.scene&&(a.last<b.first||b.last<a.first),
    'manifest batches must have unique scene IDs and non-overlapping source ranges');
}


assert.equal(next.canWriteSrs,false);
assert.equal(next.productionRelease,false);
const prior=[...snap.items,...extra.items];
const priorIds=new Set(prior.map(x=>x.master_record_id)),priorRows=new Set(prior.map(x=>x.master_final_row));
assert(next.items.every(x=>!priorIds.has(x.master_record_id)&&!priorRows.has(x.master_final_row)));
assert.equal(next.items.filter(x=>x.scene_id==='SC50-0012').length,253);
assert.equal(next.items.filter(x=>x.scene_id==='SC50-0013').length,245);
assert.equal(next.items.filter(x=>x.scene_id==='SC50-0014').length,243);
assert(next.items.every(x=>x.production_release_allowed===false));
const pageTest=next.items.filter(x=>x.question.ipa_status==='KAIKKI_POSTPROCESSED_PAGE_VERIFIED_TEST_ONLY');
assert.equal(pageTest.length,4);
assert.deepEqual(new Set(pageTest.map(x=>x.expression)),new Set(['pet','puppy','cat','kitten']));
assert(pageTest.every(x=>x.scene_id==='SC50-0014'&&x.question.ipa_provisional===true&&
 x.question.ipa_source.source_type==='KAIKKI_POSTPROCESSED_DICTIONARY_WEB_PAGE'&&
 x.question.ipa_source.native_raw_jsonl_sha256===null&&
 x.question.ipa_source.formal_sense_alignment===false&&
 x.question.ipa_source.author_review_required===true));
assert.equal(next.items.filter(x=>x.scene_id==='SC50-0014'&&x.question.ipa===null).length,239);
assert.equal(next.items.filter(x=>x.question.ipa_candidates_pending).length,2);
assert(next.items.every(x=>x.scene_id==='SC50-0014'||x.question.ipa===null));
assert.equal(next.items.filter(x=>x.scene_id==='SC50-0014').length,243,
 'pet care 243 author drafts remain source-only and uncertified');
assert(next.items.every(x=>
 x.question.ipa_status==='MISSING_VERIFIED_KAIKKI_IPA'||
 x.question.ipa_status==='KAIKKI_POSTPROCESSED_PAGE_VERIFIED_TEST_ONLY'),
 'only four explicitly unapproved webpage-source IPA may be displayed, never raw-native approved');
const joined=[...prior,...next.items];
assert.equal(new Set(joined.map(x=>x.scene_ku_id)).size,2873,'cross-batch KU identities must not collide');
assert.equal(new Set(joined.map(x=>x.master_record_id)).size,2873,'source Master identity must be globally unique');
assert.equal(new Set(joined.map(x=>x.master_final_row)).size,2873,'original FINAL source rows must never be duplicated');
assert.equal(new Set(joined.map(x=>x.scene_id)).size,14,'no un-authored scene must be declared playable');
const v153=await applyV153ArchivedIpaTestOverlay(joined);
assert.equal(v153.total,2873);assert.equal(v153.matched,996);
assert.equal(v153.archivedSingleTestIpa,8);
assert.equal(v153.archivedVariantsUnselected,25);
assert.equal(v153.retainedWebTestIpa,4);
assert.equal(v153.productionRelease,false);
assert.equal(v153.canWriteSrs,false);
const after=v153.items;
assert.deepEqual(after.map(x=>x.master_record_id),joined.map(x=>x.master_record_id));
for(let i=0;i<after.length;i++){
 assert.equal(after[i].master_final_row,joined[i].master_final_row);
 assert.deepEqual(after[i].answer,joined[i].answer);
}
assert.deepEqual(new Set(after.filter(x=>x.question.ipa_status==='ARCHIVED_KAIKKI_SINGLE_PHONEMIC_TEST_ONLY').map(x=>x.expression)),
 new Set(['living room','stressed','bib','drowsy','sleepy','dizzy','rash','itchy']));
const coverage=measureScene1341MasterCoverage(after);
assert.equal(coverage.authorDrafts,2873);
assert.equal(coverage.sceneCount,14);
assert.equal(coverage.selectedTestIpa,210);
assert.equal(coverage.sourceVerifiedTestIpa,3);
assert.equal(coverage.nativeSingleProvisional,195);
assert.equal(coverage.webPageProvisional,4);
assert.equal(coverage.archivedKaikkiProvisional,8);
assert.equal(coverage.missingSelectedIpa,2663);
assert.equal(coverage.unselectedVariants,437);
assert.equal(coverage.formallyReady,0);
assert.equal(coverage.formallyCertified,0);
assert.equal(coverage.byScene.find(x=>x.scene_id==='SC50-0014').webPageProvisional,4);
assert.equal(coverage.byScene.find(x=>x.scene_id==='SC50-0014').missingSelectedIpa,238);
assert.equal(coverage.byScene.reduce((n,x)=>n+x.authorDrafts,0),2873);
assert.equal(coverage.byScene.reduce((n,x)=>n+x.selectedTestIpa,0),210);
assert.equal(coverage.byScene.reduce((n,x)=>n+x.missingSelectedIpa,0),2663);
assert.equal(coverage.byScene.reduce((n,x)=>n+x.unselectedVariants,0),437);
assert.deepEqual(coverage.byScene.filter(x=>x.scene_id>='SC50-0011').map(x=>[
 x.scene_id,x.authorDrafts,x.selectedTestIpa
]),[
 ['SC50-0011',255,0],['SC50-0012',253,2],
 ['SC50-0013',245,5],['SC50-0014',243,5]
]);

assert.throws(()=>measureScene1341MasterCoverage([...after,after[0]]),/IDENTITY|CONFLICT/);

assert(joined.every(x=>x.production_release_allowed===false),'no source draft may enter formal release');
assert.equal(snap.total+extra.total+next.total,2873);
assert.equal(next.batches[2].sourceGitBlob,'3e1042efe58480e38ae90631c595f872622cd748');
const oldURL='https://raw.githubusercontent.com/TJPAI/pai-word/3b77d762caf257e322894731bac69cb92775fed7/tools/scene1341_master/qa_reports/CGMASTER_V147_SC0014_ALL243_BILINGUAL_DRAFT_20261114.json';
const oldResponse=await fetch(oldURL,{cache:'no-store'});
assert(oldResponse.ok,'pinned V147 source must remain independently fetchable');
const oldRaw=await oldResponse.text();
const oldBlob=createHash('sha1').update('blob '+Buffer.byteLength(oldRaw)+'\0').update(oldRaw).digest('hex');
assert.equal(oldBlob,'e8589c6c6bc68f93d4183064e2f5a87845552da2');
const oldV147=JSON.parse(oldRaw).records;
assert.equal(oldV147.length,243);
const newV150=new Map(next.items.filter(x=>x.scene_id==='SC50-0014').map(x=>[x.master_final_row,x]));
for(const old of oldV147){
 const now=newV150.get(old.source_final_row);
 assert(now,'V150 must preserve all V147 source rows');
 assert.equal(now.master_record_id,old.record_id);
 assert.equal(now.expression,old.question_page.english_expression);
 assert.equal(now.question.cue_zh,old.question_page.cue_zh);
 assert.deepEqual(now.answer,old.answer_page,'V150 may not silently rewrite CG-MASTER answer pages');
 assert.equal(now.production_release_allowed,false);
}

assert.equal(snap.scenes+extra.scenes,11);
console.log(JSON.stringify({status:'PASS',source:snap.source,records:snap.total,scenes:snap.scenes,ipaVerified:snap.verifiedNativeIpa,ipaProvisional:snap.provisionalNativeIpa,ipaPending:snap.ipaPendingAdjudication,ipaMissing:snap.total-checked.length,blocked:snap.excludedBlocked,v118NewDrafts:extra.total,combinedTestScenes:14,combinedTestCards:2873,v150WebPageIpa:4,v150UnselectedVariant:2,productionRelease:snap.productionRelease}));
