import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {applyPhase1StudyOverlay} from '../../rebuild-preview/scene1341-readonly/scene1341-phase1-study-overlay.mjs';
import {validatePhase1FreshManifest,validatePhase1DraftRows,fetchPhase1FreshDrafts,fetchPhase1FreshDraftsLatest,fetchPhase1FreshDraftsCurrent,phase1EditorialPreview}
 from '../../rebuild-preview/scene1341-readonly/scene1341-phase1-fresh-drafts.mjs';
const V=['V199','V200','V201'],N=[35,55,61];
const counts=[79,40,13,12,7],sceneIds=counts.flatMap((n,i)=>Array(n).fill('SC50-000'+(i+1)));
const rawSource='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99';
const rows=sceneIds.map((scene_id,i)=>({record_id:'SC1341-FINAL-SRC-'+(i+1).toString(16).padStart(32,'0'),
 scene_id,source_final_row:i+1,content_sha256:'a'.repeat(64),
 question_page:{english_expression:'test expression',cue_zh:'中文'},
 answer_page:{meaning_zh:'中文'},
 source_evidence:{archive_sha256:rawSource},qa_stage_label:'待审',qa_first_review_verdict:null,
 formal_ready:0,srs_eligible:false,release_allowed:false}));
const inputs=[],version_batches=[];
for(let i=0,j=0;i<3;i++){
 const payload={version:V[i],records:rows.slice(j,j+N[i])};
 j+=N[i];inputs.push(payload);
 const raw=JSON.stringify(payload);
 const sha=createHash('sha1').update('blob '+Buffer.byteLength(raw)+'\0').update(raw).digest('hex');
 version_batches.push({version:V[i],records:N[i],first_reviewed:0,
  git_blob_sha1:sha,path:'tools/scene1341_master/qa_reports/CGMASTER_'+V[i]+'_PHASE1_TEST.json'});
}
const manifest={version:'V201',original_associations:1241,native_kaikki_raw_sha256:rawSource,
 cumulative:{source_linked_editor_candidates_distinct:151,qa_first_reviewed:0,formal_ready:0,srs_eligible:false},
 version_batches,per_scene:Object.fromEntries(counts.map((n,i)=>['SC50-000'+(i+1),{editor_drafts:n}]))};
assert.equal(validatePhase1FreshManifest(manifest).records,151);
let result=validatePhase1DraftRows(manifest,inputs);
assert.equal(result.rows.length,151);assert.equal(result.canWriteSrs,false);assert.equal(result.perScene['SC50-0005'],7);
const altered=structuredClone(inputs);altered[0].records[0].qa_stage_label='1审';
assert.throws(()=>validatePhase1DraftRows(manifest,altered),/PHASE1_FRESH_ROW/);
const dup=structuredClone(inputs);dup[2].records[0].record_id=dup[1].records[0].record_id;
assert.throws(()=>validatePhase1DraftRows(manifest,dup),/PHASE1_FRESH_ROW/);
const callResponses=[JSON.stringify(manifest),...inputs.map(x=>JSON.stringify(x))];
const commit='f'.repeat(40),urls=[];
const fetched=await fetchPhase1FreshDrafts({commit,fetchImpl:async url=>{
 urls.push(url);return new Response(callResponses[urls.length-1],{status:200});
}});
assert.equal(fetched.verifiedBlobCount,3);assert.equal(fetched.unreviewed,151);
assert.equal(fetched.commit,commit);assert.equal(urls.length,4);
assert(urls.every(x=>x.includes('/'+commit+'/')));
await assert.rejects(()=>fetchPhase1FreshDrafts({commit,fetchImpl:async url=>{
 if(url.includes('FIRST151'))return new Response(JSON.stringify({...manifest,version_batches:[{...version_batches[0],git_blob_sha1:'0'.repeat(40)},...version_batches.slice(1)]}),{status:200});
 return new Response(JSON.stringify(inputs[0]),{status:200});
}}),/PHASE1_FRESH_GIT_BLOB_SHA1/);
console.log('PASS V199/V200/V201 fresh first151 immutable Git SHA1 and phase1 rows, independent QA pending, SRS0');

const newRows=Array.from({length:52},(_,i)=>({
 ...structuredClone(rows[0]),
 record_id:'SC1341-FINAL-SRC-'+(i+152).toString(16).padStart(32,'0'),
 source_final_row:i+152,scene_id:i<25?'SC50-0004':'SC50-0005'
}));
const latestPayload={version:'V202',source_associations_total:1241,new_records:52,records:newRows};
const latestText=JSON.stringify(latestPayload);
const latestBlob=createHash('sha1').update('blob '+Buffer.byteLength(latestText)+'\0').update(latestText).digest('hex');
const latestReport={version:'V202',original_associations:1241,prior_editor_drafts:151,new_editor_drafts:52,
 distinct_editorial_drafts_total:203,source:{fresh_kaikki_english_raw_sha256:rawSource},
 qa:{first_reviewed:0,formal_ready:0,srs_eligible:false},
 by_scene:Object.fromEntries([79,40,13,37,34].map((n,i)=>['SC50-000'+(i+1),{new_editor_drafts_total:n}])),
 artifacts:{real_full_json_git_path:'tools/scene1341_master/qa_reports/CGMASTER_V202_PHASE1_NEXT52_FRESH_KAIKKI_EDITOR_DRAFT_20261115.json',real_json_git_blob_sha1:latestBlob}};
const serveLatest=async url=>{
 if(url.includes('FIRST151'))return new Response(JSON.stringify(manifest));
 if(url.includes('FIRST203'))return new Response(JSON.stringify(latestReport));
 if(url.includes('NEXT52_FRESH'))return new Response(latestText);
 for(let i=0;i<3;i++)if(url.includes('CGMASTER_'+V[i]+'_PHASE1_TEST.json'))
  return new Response(JSON.stringify(inputs[i]));
 return new Response('not found',{status:404});
};
const latest=await fetchPhase1FreshDraftsLatest({commit,fetchImpl:serveLatest});
assert.equal(latest.rows.length,203);assert.equal(latest.verifiedBlobCount,4);
assert.equal(latest.perScene['SC50-0004'],37);assert.equal(latest.perScene['SC50-0005'],34);
assert.equal(latest.canWriteSrs,false);assert.equal(latest.onlyDiagnostic,true);
const modified=structuredClone(latestReport);modified.artifacts.real_json_git_blob_sha1='0'.repeat(40);
await assert.rejects(()=>fetchPhase1FreshDraftsLatest({commit,fetchImpl:async url=>
 url.includes('FIRST203')?new Response(JSON.stringify(modified)):serveLatest(url)
}),/PHASE1_FRESH_V202_GIT_BLOB_SHA1/);
console.log('PASS V202 incremental 203/1241, four SHA-pinned Git blobs, no review promotion or SRS');

const sample=structuredClone(newRows[0]);
sample.question_page={...sample.question_page,english_expression:'clear out',cue_zh:'清空',
 ipa:'/tɛst/',ipa_native_all_phonemic_candidates:['/tɛst/'],
 ipa_source_status:'NATIVE_EXACT_PHONEMIC_SINGLE_UNREVIEWED'};
sample.answer_page={meaning_zh:'清空',gloss_en:'To empty',pos:'verb',
 examples:[{example_en:'Clear the shelf.',example_zh:'清空架子。',
 source:'CG_MASTER_NEW_EDITOR_ORIGINAL_NOT_KAIKKI_ATTESTATION',qa_status:'待审'}],usage_note:'用于清理'};
const shown=phase1EditorialPreview(sample);
assert.equal(shown.stage,'待审');assert.equal(shown.ipaCandidate,'/tɛst/');
assert.equal(shown.examples.length,1);assert.equal(shown.verdict,'未审');
const held=structuredClone(sample);
held.question_page.ipa_source_status='NATIVE_MULTIVARIANT_HOLD';
assert.equal(phase1EditorialPreview(held).ipaCandidate,null);
const forged=structuredClone(sample);forged.qa_stage_label='1审';
assert.throws(()=>phase1EditorialPreview(forged),/PHASE1_FRESH_PREVIEW_SOURCE/);
const injected=structuredClone(sample);injected.srs_eligible=true;
assert.throws(()=>phase1EditorialPreview(injected),/PHASE1_FRESH_PREVIEW_SOURCE/);
console.log('PASS phase1 diagnostic only: IPA ambiguity blocked, QA forgery blocked, SRS blocked');

const rollingPath='tools/scene1341_master/qa_reports/CGMASTER_V203_PHASE1_NATIVE_SINGLE_SENSE_55_UNREVIEWED_20261115.json';
const rollingCounts=[85,46,35,46,46];
const v203Rows=Array.from({length:55},(_,i)=>{
 const r=structuredClone(newRows[0]);
 r.record_id='SC1341-FINAL-SRC-'+(i+204).toString(16).padStart(32,'0');
 r.source_final_row=i+204;
 r.scene_id=i<6?'SC50-0001':i<12?'SC50-0002':i<34?'SC50-0003':i<43?'SC50-0004':'SC50-0005';
 r.source_evidence={archive_sha256:rawSource,kaikki_lemma:'test expression',
  kaikki_pos:'verb',native_gloss:'Native gloss',kaikki_exact_raw_line:i+1,sense_index_zero_based:0};
 r.question_page={english_expression:'test expression',cue_zh:'提示',ipa:null,
  ipa_source_status:'NATIVE_EXACT_PHONEMIC_AMBIGUOUS_OR_ABSENT_HOLD',
  ipa_native_all_phonemic_candidates:[]};
 r.answer_page={meaning_zh:'含义',gloss_en:'Native gloss',pos:'verb',examples:[],usage_note:null};
 return r;
});
const rollingDoc={version:'V203_NATIVE_ONLY_UNREVIEWED',source_associations_total:1241,
 prior_editorial_records:203,new_records:55,cumulative_distinct_records:258,
 qa_status:'待审',formal_ready:0,records:v203Rows};
const rollingText=JSON.stringify(rollingDoc);
const rollingBlob=createHash('sha1').update('blob '+Buffer.byteLength(rollingText)+'\0').update(rollingText).digest('hex');
const rollingState={schema:'cgmaster-current-state/v1',role:'CG-MASTER',
 branch:'cg-master-kaikki-evidence-intake-20261111',version:'V205',
 sources:{raw_kaikki_archive_sha256:rawSource},phase1:{
 original_source_associations:1241,fresh_editorial_drafts:258,
 remaining_without_fresh_editorial_draft:983,
 editorial_artifacts:['tools/scene1341_master/qa_reports/CGMASTER_V199_PHASE1_35_SOURCE_LINKED_EDITOR_QUESTION_ANSWER_DRAFT_20261115.json','tools/scene1341_master/qa_reports/CGMASTER_V200_PHASE1_NEXT55_SOURCE_LINKED_EDITOR_QUESTION_ANSWER_DRAFT_20261115.json','tools/scene1341_master/qa_reports/CGMASTER_V201_PHASE1_NEXT61_SOURCE_LINKED_EDITOR_QUESTION_ANSWER_DRAFT_20261115.json',
 latestReport.artifacts.real_full_json_git_path,rollingPath,
 'tools/scene1341_master/qa_reports/CGMASTER_V204_PHASE1_REMAINING983_TRIAGE_SUMMARY_20261115.json'],
 by_scene:Object.fromEntries(rollingCounts.map((n,i)=>['SC50-000'+(i+1),
  {drafts:n,total:[294,206,237,245,259][i],
   remaining:[294,206,237,245,259][i]-n}]))
}};
const serveRolling=async url=>{
 if(url.includes('CGMASTER_CURRENT_STATE'))return new Response(JSON.stringify(rollingState));
 if(url.includes('/contents/'+rollingPath))return new Response(JSON.stringify({
  type:'file',path:rollingPath,sha:rollingBlob,size:rollingText.length}));
 if(url.includes('V203_PHASE1_NATIVE_SINGLE'))return new Response(rollingText);
 return serveLatest(url);
};
const rolling=await fetchPhase1FreshDraftsCurrent({commit,fetchImpl:serveRolling});
assert.equal(rolling.rows.length,258);
assert.equal(rolling.unreviewed,258);
assert.equal(rolling.perScene['SC50-0003'],35);
assert.equal(rolling.verifiedBlobCount,5);
assert.equal(rolling.version,'V205');
assert.equal(rolling.canWriteSrs,false);
const wrongState=structuredClone(rollingState);
wrongState.phase1.fresh_editorial_drafts=259;
await assert.rejects(()=>fetchPhase1FreshDraftsCurrent({commit,fetchImpl:url=>
 url.includes('CGMASTER_CURRENT_STATE')?new Response(JSON.stringify(wrongState)):serveRolling(url)
}),/PHASE1_FRESH_ROLLING_TOTAL/);
const badMeta=async url=>url.includes('/contents/'+rollingPath)?
 new Response(JSON.stringify({type:'file',path:rollingPath,sha:'0'.repeat(40),size:rollingText.length})):
 serveRolling(url);
await assert.rejects(()=>fetchPhase1FreshDraftsCurrent({commit,fetchImpl:badMeta}),
 /PHASE1_FRESH_ROLLING_BLOB_SHA1/);
const tamperedDoc=structuredClone(rollingDoc);tamperedDoc.records[0].qa_stage_label='1审';
const tamperedText=JSON.stringify(tamperedDoc);
const tamperedSha=createHash('sha1').update('blob '+Buffer.byteLength(tamperedText)+'\0').update(tamperedText).digest('hex');
await assert.rejects(()=>fetchPhase1FreshDraftsCurrent({commit,fetchImpl:url=>{
 if(url.includes('/contents/'+rollingPath))return new Response(JSON.stringify({
  type:'file',path:rollingPath,sha:tamperedSha,size:tamperedText.length}));
 if(url.includes('V203_PHASE1_NATIVE_SINGLE'))return new Response(tamperedText);
 return serveRolling(url);
}}),/PHASE1_FRESH_ROLLING_ROW/);
console.log('PASS rolling V203+V205 state 258 distinct, immutable Git metadata, forged QA and count mismatch blocked');

/* P0 regression: wake up in the ACTUAL Scene1341 study queue must use
 * source-exact fresh Kaikki question+answer, not historical V116/V190 content.
 * An IPA-HOLD entry must not inherit stale selected IPA from legacy cards.
 */
const sourceCards=[...rows,...newRows].map(x=>structuredClone(x));
sourceCards[0].record_id='SC1341-FINAL-SRC-f80790f4252d2220527cf7c9b5df8b62';
sourceCards[0].source_final_row=1;
sourceCards[0].question_page={english_expression:'wake up',cue_zh:'醒来',ipa:'/ˌweɪk ˈʌp/',
 ipa_source_status:'NATIVE_EXACT_PHONEMIC_SINGLE_UNREVIEWED',
 ipa_native_all_phonemic_candidates:['/ˌweɪk ˈʌp/']};
sourceCards[0].answer_page={meaning_zh:'醒来',gloss_en:'To stop sleeping; to awake.',pos:'verb',
 examples:[{example_en:'I wake up at seven every day.',example_zh:'我每天七点醒来。',
 source:'CG_MASTER_NEW_EDITOR_ORIGINAL_NOT_KAIKKI_ATTESTATION',qa_status:'待审'}],
 collocations:[],usage_note:'不及物 wake up 表示醒来；wake somebody up 表示叫醒别人。',
 answer_complete:false};
sourceCards[0].source_evidence={archive_sha256:rawSource,kaikki_lemma:'wake up',
 kaikki_pos:'verb',native_gloss:'To stop sleeping; to awake.',kaikki_exact_raw_line:50969};
sourceCards[1].question_page={english_expression:'get up',cue_zh:'起床',ipa:null,
 ipa_source_status:'NATIVE_EXACT_PHONEMIC_AMBIGUOUS_OR_ABSENT_HOLD',
 ipa_native_all_phonemic_candidates:[]};
sourceCards[1].answer_page={meaning_zh:'起床',gloss_en:'To rise from bed.',pos:'verb',
 examples:[],collocations:[],usage_note:null,answer_complete:false};
sourceCards[1].source_evidence={archive_sha256:rawSource,kaikki_lemma:'get up',
 kaikki_pos:'verb',native_gloss:'To rise from bed.',kaikki_exact_raw_line:1234};
const oldStudy=[
 {scene_ku_id:'SC1341-KU-00001',scene_id:'SC50-0001',
  master_record_id:sourceCards[0].record_id,master_final_row:1,expression:'wake up',
  question:{cue_zh:'醒来',ipa:null},answer:{meaning_zh:'醒来',
   collocations:['OLD INCORRECT COLLOCATION'],usage_note:'OLD ANSWER'}},
 {scene_ku_id:'SC1341-KU-00002',scene_id:'SC50-0001',
  master_record_id:sourceCards[1].record_id,master_final_row:2,expression:'get up',
  question:{cue_zh:'起床',ipa:'/old-wrong/'},answer:{meaning_zh:'起床',
   collocations:['OLD COLLOCATION'],usage_note:'OLD USAGE'}}
];
const newStudy=applyPhase1StudyOverlay(oldStudy,{rows:sourceCards,
 onlyDiagnostic:true,canWriteSrs:false,formalReady:0,version:'V202',commit});
assert.equal(newStudy.matched,2);
assert.equal(newStudy.canWriteSrs,false);
assert.equal(newStudy.formalReady,0);
assert.equal(newStudy.items[0].scene_ku_id,oldStudy[0].scene_ku_id);
assert.equal(newStudy.items[0].question.ipa,'/ˌweɪk ˈʌp/');
assert.equal(newStudy.items[0].question.ipa_status,'PHASE1_KAIKKI_NATIVE_SINGLE_UNREVIEWED');
assert.equal(newStudy.items[0].answer.gloss_en,'To stop sleeping; to awake.');
assert.equal(newStudy.items[0].answer.examples[0].example_zh,'我每天七点醒来。');
assert.equal(newStudy.items[0].answer.collocations.length,0);
assert(!JSON.stringify(newStudy.items[0]).includes('OLD ANSWER'));
assert.equal(newStudy.items[1].question.ipa,null);
assert.equal(newStudy.items[1].question.ipa_status,'PHASE1_KAIKKI_IPA_HOLD');
assert.equal(newStudy.items[1].answer.usage_note,'');
const legacyChinese=structuredClone(oldStudy);
legacyChinese[0].question.cue_zh='历史提示未更新';
legacyChinese[0].answer.meaning_zh='历史释义未更新';
const corrected=applyPhase1StudyOverlay(legacyChinese,{rows:sourceCards,
 onlyDiagnostic:true,canWriteSrs:false,formalReady:0,version:'V202',commit});
assert.equal(corrected.items[0].question.cue_zh,'醒来');
assert.equal(corrected.items[0].answer.meaning_zh,'醒来');
assert.equal(corrected.items[0].master_content_sha256,sourceCards[0].content_sha256);
const edited=structuredClone(sourceCards);
edited[0].qa_stage_label='1审';
assert.throws(()=>applyPhase1StudyOverlay(oldStudy,{rows:edited,
 onlyDiagnostic:true,canWriteSrs:false,formalReady:0}),/PHASE1_STUDY_EDITOR_ROW/);
const wrongSource=structuredClone(sourceCards);
wrongSource[0].source_evidence.archive_sha256='0'.repeat(64);
assert.throws(()=>applyPhase1StudyOverlay(oldStudy,{rows:wrongSource,
 onlyDiagnostic:true,canWriteSrs:false,formalReady:0}),/PHASE1_STUDY_EDITOR_ROW/);
const cardDrift=structuredClone(oldStudy);cardDrift[0].master_final_row=56;
const partial=applyPhase1StudyOverlay(cardDrift,{rows:sourceCards,
 onlyDiagnostic:true,canWriteSrs:false,formalReady:0});
assert.equal(partial.matched,1);
assert.equal(partial.items[0].answer.usage_note,'OLD ANSWER');
console.log('PASS actual SC0001 wake up new Master answer/Kaikki IPA and get up HOLD; no legacy field leakage or SRS');
