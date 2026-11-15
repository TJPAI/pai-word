/* Scene1341 fresh Kaikki Phase-1 editorial staging intake.
 * Source-only: cannot write SRS or replace playable study cards.
 * Every file is pinned to ONE immutable CG-MASTER commit and Git blob SHA1.
 */
const SHA40=/^[a-f0-9]{40}$/;
const SHA64=/^[a-f0-9]{64}$/;
const RECORD=/^SC1341-FINAL-SRC-[a-f0-9]{32}$/;
const SCENE=/^SC50-000[1-5]$/;
const BASE='https://raw.githubusercontent.com/TJPAI/pai-word/';
const DIRECTORY='tools/scene1341_master/qa_reports/';
const MANIFEST='CGMASTER_V201_PHASE1_FIRST151_EDITORIAL_COVERAGE_AND_REVIEW_HANDOFF_20261115.json';
const KAIKKI='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99';
const fail=reason=>{throw Error('PHASE1_FRESH_'+reason)};
const toHex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
async function gitBlobSha(text){
 if(typeof crypto==='undefined'||!crypto.subtle)fail('CRYPTO_UNAVAILABLE');
 const source=new TextEncoder().encode(text);
 const prefix=new TextEncoder().encode('blob '+source.length+'\0');
 const full=new Uint8Array(prefix.length+source.length);
 full.set(prefix);full.set(source,prefix.length);
 return toHex(new Uint8Array(await crypto.subtle.digest('SHA-1',full)));
}
export function validatePhase1FreshManifest(manifest){
 if(manifest?.version!=='V201'||manifest.original_associations!==1241||
    manifest.native_kaikki_raw_sha256!==KAIKKI||
    manifest.cumulative?.source_linked_editor_candidates_distinct!==151||
    manifest.cumulative?.qa_first_reviewed!==0||
    manifest.cumulative?.formal_ready!==0||manifest.cumulative?.srs_eligible!==false||
    !Array.isArray(manifest.version_batches)||manifest.version_batches.length!==3)
   fail('MANIFEST');
 const versions=['V199','V200','V201'];
 const counts=[35,55,61];
 for(let i=0;i<3;i++){
  const batch=manifest.version_batches[i];
  if(batch.version!==versions[i]||batch.records!==counts[i]||
     batch.first_reviewed!==0||!SHA40.test(batch.git_blob_sha1||'')||
     typeof batch.path!=='string'||!batch.path.startsWith(DIRECTORY)||
     !/^tools\/scene1341_master\/qa_reports\/CGMASTER_V(?:199|200|201)_PHASE1_[A-Za-z0-9_]+\.json$/.test(batch.path))
   fail('BATCH');
 }
 return Object.freeze({records:151,batches:3,firstReviewed:0});
}
export function validatePhase1DraftRows(manifest,inputs){
 validatePhase1FreshManifest(manifest);
 if(!Array.isArray(inputs)||inputs.length!==3)fail('INPUT');
 const rows=[],ids=new Set(),sourceRows=new Set(),perScene={};
 for(let i=0;i<3;i++){
  const payload=inputs[i];
  const batch=manifest.version_batches[i];
  if(payload?.version!==batch.version||payload.records?.length!==batch.records)fail('COUNT');
  for(const row of payload.records){
   const q=row?.question_page,a=row?.answer_page,s=row?.source_evidence;
   if(!RECORD.test(row?.record_id||'')||!SCENE.test(row.scene_id||'')||
      !Number.isSafeInteger(row.source_final_row)||row.source_final_row<1||row.source_final_row>1241||
      ids.has(row.record_id)||sourceRows.has(row.source_final_row)||
      !SHA64.test(row.content_sha256||'')||!q||!a||!s||
      typeof q.english_expression!=='string'||!q.english_expression.trim()||
      typeof q.cue_zh!=='string'||!q.cue_zh.trim()||
      typeof a.meaning_zh!=='string'||!a.meaning_zh.trim()||
      s.archive_sha256!==KAIKKI||
      row.qa_stage_label!=='待审'||row.qa_first_review_verdict!==null||
      row.formal_ready!==0||row.srs_eligible!==false||row.release_allowed!==false)
    fail('ROW');
   ids.add(row.record_id);sourceRows.add(row.source_final_row);
   perScene[row.scene_id]=(perScene[row.scene_id]||0)+1;
   rows.push(row);
  }
 }
 const expected={...Object.fromEntries(Object.entries(manifest.per_scene).map(([id,v])=>[id,v.editor_drafts]))};
 if(JSON.stringify(Object.keys(perScene).sort().map(x=>[x,perScene[x]]))!==
    JSON.stringify(Object.keys(expected).sort().map(x=>[x,expected[x]])))fail('SCENE_COUNTS');
 if(rows.length!==151)fail('TOTAL');
 return Object.freeze({rows,perScene:Object.freeze(perScene),formalReady:0,canWriteSrs:false});
}
export async function fetchPhase1FreshDrafts({fetchImpl=fetch,commit}={}){
 if(commit==null){
  const res=await fetchImpl('https://api.github.com/repos/TJPAI/pai-word/branches/cg-master-kaikki-evidence-intake-20261111',{cache:'no-store'});
  if(!res.ok)fail('BRANCH_HTTP_'+res.status);
  commit=(await res.json())?.commit?.sha;
 }
 if(!SHA40.test(commit||''))fail('COMMIT');
 const response=await fetchImpl(BASE+commit+'/'+DIRECTORY+MANIFEST,{cache:'no-store'});
 if(!response.ok)fail('MANIFEST_HTTP_'+response.status);
 const manifest=await response.json();
 validatePhase1FreshManifest(manifest);
 const inputs=[];
 for(const batch of manifest.version_batches){
  const res=await fetchImpl(BASE+commit+'/'+batch.path,{cache:'no-store'});
  if(!res.ok)fail('BATCH_HTTP_'+res.status);
  const raw=await res.text();
  if(await gitBlobSha(raw)!==batch.git_blob_sha1)fail('GIT_BLOB_SHA1');
  inputs.push(JSON.parse(raw));
 }
 const result=validatePhase1DraftRows(manifest,inputs);
 return Object.freeze({...result,commit,verifiedBlobCount:3,unreviewed:151,
  onlyDiagnostic:true});
}

/* V202 incremental staging: preserve V201 immutable three-blob validation;
 * all new rows remain diagnostic-only until an independent QA evidence index.
 */
export async function fetchPhase1FreshDraftsLatest({fetchImpl=fetch,commit}={}){
 if(commit==null){
  const r=await fetchImpl('https://api.github.com/repos/TJPAI/pai-word/branches/cg-master-kaikki-evidence-intake-20261111',{cache:'no-store'});
  if(!r.ok)fail('LATEST_BRANCH_HTTP_'+r.status);
  commit=(await r.json())?.commit?.sha;
 }
 if(!SHA40.test(commit||''))fail('LATEST_COMMIT');
 const old=await fetchPhase1FreshDrafts({fetchImpl,commit});
 const reportPath=DIRECTORY+'CGMASTER_V202_PHASE1_FIRST203_EDITORIAL_COVERAGE_AND_QA_HANDOFF_20261115.json';
 const reportResponse=await fetchImpl(BASE+commit+'/'+reportPath,{cache:'no-store'});
 if(!reportResponse.ok)fail('V202_REPORT_HTTP_'+reportResponse.status);
 const report=await reportResponse.json();
 const artifact=report?.artifacts;
 if(report.version!=='V202'||report.original_associations!==1241||
    report.source?.fresh_kaikki_english_raw_sha256!==KAIKKI||
    report.prior_editor_drafts!==151||report.new_editor_drafts!==52||
    report.distinct_editorial_drafts_total!==203||
    report.qa?.first_reviewed!==0||report.qa?.formal_ready!==0||
    report.qa?.srs_eligible!==false||
    artifact?.real_full_json_git_path!==DIRECTORY+'CGMASTER_V202_PHASE1_NEXT52_FRESH_KAIKKI_EDITOR_DRAFT_20261115.json'||
    !SHA40.test(artifact?.real_json_git_blob_sha1||''))
   fail('V202_REPORT');
 const response=await fetchImpl(BASE+commit+'/'+artifact.real_full_json_git_path,{cache:'no-store'});
 if(!response.ok)fail('V202_BATCH_HTTP_'+response.status);
 const raw=await response.text();
 if(await gitBlobSha(raw)!==artifact.real_json_git_blob_sha1)fail('V202_GIT_BLOB_SHA1');
 const payload=JSON.parse(raw);
 if(payload.version!=='V202'||payload.new_records!==52||payload.records?.length!==52||
    payload.source_associations_total!==1241)fail('V202_COUNT');
 const ids=new Set(old.rows.map(x=>x.record_id));
 const sourceRows=new Set(old.rows.map(x=>x.source_final_row));
 const perScene={...old.perScene};
 for(const row of payload.records){
  const q=row?.question_page,a=row?.answer_page,s=row?.source_evidence;
  if(!RECORD.test(row?.record_id||'')||!SCENE.test(row.scene_id||'')||
    !Number.isSafeInteger(row.source_final_row)||row.source_final_row<1||row.source_final_row>1241||
    ids.has(row.record_id)||sourceRows.has(row.source_final_row)||
    !SHA64.test(row.content_sha256||'')||
    !q?.english_expression?.trim()||!q?.cue_zh?.trim()||
    !a?.meaning_zh?.trim()||s?.archive_sha256!==KAIKKI||
    row.qa_stage_label!=='待审'||row.qa_first_review_verdict!==null||
    row.formal_ready!==0||row.srs_eligible!==false||row.release_allowed!==false)
   fail('V202_ROW');
  ids.add(row.record_id);sourceRows.add(row.source_final_row);
  perScene[row.scene_id]=(perScene[row.scene_id]||0)+1;
 }
 for(const [scene,counts] of Object.entries(report.by_scene||{})){
  if(perScene[scene]!==counts.new_editor_drafts_total)fail('V202_SCENE_COUNTS');
 }
 if(Object.keys(perScene).length!==5||ids.size!==203||sourceRows.size!==203)
  fail('V202_DISTINCT');
 return Object.freeze({rows:Object.freeze([...old.rows,...payload.records]),
  perScene:Object.freeze(perScene),commit,verifiedBlobCount:4,
  unreviewed:203,formalReady:0,canWriteSrs:false,onlyDiagnostic:true,
  version:'V202'});
}

/* Deliberately read-only editorial inspector. Never map these candidates onto
 * canonical study records, SRS, verified IPA, or authenticated review badges.
 */
export function phase1EditorialPreview(row){
 if(!RECORD.test(row?.record_id||'')||!SCENE.test(row?.scene_id||'')||
    row?.qa_stage_label!=='待审'||row?.qa_first_review_verdict!==null||
    row?.formal_ready!==0||row?.srs_eligible!==false||
    row?.release_allowed!==false||!SHA64.test(row?.content_sha256||'')||
    row?.source_evidence?.archive_sha256!==KAIKKI)fail('PREVIEW_SOURCE');
 const q=row.question_page,a=row.answer_page;
 if(!q?.english_expression?.trim()||!q?.cue_zh?.trim()||
    !a?.meaning_zh?.trim()||!a?.gloss_en?.trim())fail('PREVIEW_FIELDS');
 const candidates=Array.isArray(q.ipa_native_all_phonemic_candidates)
  ? q.ipa_native_all_phonemic_candidates.filter(x=>typeof x==='string'&&x.trim()):[];
 const selected=q.ipa_source_status==='NATIVE_EXACT_PHONEMIC_SINGLE_UNREVIEWED'&&
  candidates.length===1&&q.ipa===candidates[0]?q.ipa:null;
 const examples=Array.isArray(a.examples)?a.examples.filter(e=>
  e?.source==='CG_MASTER_NEW_EDITOR_ORIGINAL_NOT_KAIKKI_ATTESTATION'&&
  e?.qa_status==='待审'&&typeof e.example_en==='string'&&
  typeof e.example_zh==='string').map(e=>({en:e.example_en,zh:e.example_zh})):[];
 return Object.freeze({
  recordId:row.record_id,sceneId:row.scene_id,contentSha:row.content_sha256,
  expression:q.english_expression,cue:q.cue_zh,meaning:a.meaning_zh,
  gloss:a.gloss_en,pos:String(a.pos||''),usage:String(a.usage_note||''),
  ipaCandidate:selected,ipaStatus:q.ipa_source_status||'HOLD',
  examples:Object.freeze(examples),stage:'待审',verdict:'未审',
  warning:'仅供研发检查：释义与例句尚未独立审查，音标仅为未审来源候选；不能计入正式教学或SRS。'
 });
}

/* Rolling, SHA-pinned Master intake. No new front-end build for later Master
 * batches conforming to the recorded source contract. Unknown schema fails
 * closed. Git contents metadata supplies the immutable blob SHA for each batch.
 */
const STATE_PATH='tools/scene1341_master/CGMASTER_CURRENT_STATE.json';
const FIRST_FOUR=[
 'CGMASTER_V199_PHASE1_35_SOURCE_LINKED_EDITOR_QUESTION_ANSWER_DRAFT_20261115.json',
 'CGMASTER_V200_PHASE1_NEXT55_SOURCE_LINKED_EDITOR_QUESTION_ANSWER_DRAFT_20261115.json',
 'CGMASTER_V201_PHASE1_NEXT61_SOURCE_LINKED_EDITOR_QUESTION_ANSWER_DRAFT_20261115.json',
 'CGMASTER_V202_PHASE1_NEXT52_FRESH_KAIKKI_EDITOR_DRAFT_20261115.json'
].map(x=>DIRECTORY+x);
export async function fetchPhase1FreshDraftsCurrent({fetchImpl=fetch,commit}={}){
 if(commit==null){
  const res=await fetchImpl('https://api.github.com/repos/TJPAI/pai-word/branches/cg-master-kaikki-evidence-intake-20261111',{cache:'no-store'});
  if(!res.ok)fail('ROLLING_BRANCH_HTTP_'+res.status);
  commit=(await res.json())?.commit?.sha;
 }
 if(!SHA40.test(commit||''))fail('ROLLING_COMMIT');
 const stateRes=await fetchImpl(BASE+commit+'/'+STATE_PATH,{cache:'no-store'});
 if(!stateRes.ok)fail('ROLLING_STATE_HTTP_'+stateRes.status);
 const state=await stateRes.json();
 const phase=state?.phase1;
 if(state?.schema!=='cgmaster-current-state/v1'||
    state?.role!=='CG-MASTER'||state?.branch!=='cg-master-kaikki-evidence-intake-20261111'||
    state?.sources?.raw_kaikki_archive_sha256!==KAIKKI||
    phase?.original_source_associations!==1241||
    !Array.isArray(phase.editorial_artifacts))fail('ROLLING_STATE');
 const expected=FIRST_FOUR;
 if(expected.some((p,i)=>phase.editorial_artifacts[i]!==p))fail('ROLLING_BASE_FILES');
 const extraPaths=phase.editorial_artifacts.slice(4).filter(p=>
  /^tools\/scene1341_master\/qa_reports\/CGMASTER_V2[0-9]{2}_PHASE1_[A-Z0-9_]+(?:DRAFT|UNREVIEWED)_20261115\.json$/.test(p));
 if(extraPaths.length>24||new Set(extraPaths).size!==extraPaths.length)fail('ROLLING_EXTRA_FILES');
 // The first 203 records already have their own immutable manifest and hash chain.
 const base=await fetchPhase1FreshDraftsLatest({fetchImpl,commit});
 const merged=[...base.rows];
 const ids=new Set(merged.map(x=>x.record_id));
 const sourceRows=new Set(merged.map(x=>x.source_final_row));
 const perScene={...base.perScene};
 for(const path of extraPaths){
  const metaRes=await fetchImpl(
    'https://api.github.com/repos/TJPAI/pai-word/contents/'+path+'?ref='+commit,{cache:'no-store'});
  if(!metaRes.ok)fail('ROLLING_META_HTTP_'+metaRes.status);
  const meta=await metaRes.json();
  if(meta.type!=='file'||meta.path!==path||!SHA40.test(meta.sha||'')||
     meta.size>2000000||meta.size<10)fail('ROLLING_META');
  const dataRes=await fetchImpl(BASE+commit+'/'+path,{cache:'no-store'});
  if(!dataRes.ok)fail('ROLLING_DATA_HTTP_'+dataRes.status);
  const raw=await dataRes.text();
  if(await gitBlobSha(raw)!==meta.sha)fail('ROLLING_BLOB_SHA1');
  const doc=JSON.parse(raw);
  const version=path.match(/CGMASTER_(V2[0-9]{2})_PHASE1_/)[1];
  if(!String(doc.version||'').startsWith(version+'_')||
     doc.source_associations_total!==1241||
     !Array.isArray(doc.records)||doc.records.length!==doc.new_records||
     doc.new_records<1||doc.new_records>500||
     doc.prior_editorial_records!==merged.length||
     doc.cumulative_distinct_records!==merged.length+doc.records.length||
     doc.formal_ready!==0||doc.qa_status!=='待审')fail('ROLLING_BATCH');
  for(const row of doc.records){
   const q=row?.question_page,a=row?.answer_page,e=row?.source_evidence;
   if(!RECORD.test(row?.record_id||'')||!SCENE.test(row?.scene_id||'')||
      !Number.isSafeInteger(row.source_final_row)||row.source_final_row<1||
      row.source_final_row>1241||ids.has(row.record_id)||
      sourceRows.has(row.source_final_row)||!SHA64.test(row.content_sha256||'')||
      !q?.english_expression?.trim()||!q?.cue_zh?.trim()||
      !a?.meaning_zh?.trim()||!a?.gloss_en?.trim()||
      e?.archive_sha256!==KAIKKI||
      e.kaikki_lemma!==q.english_expression||
      e.kaikki_pos!==a.pos||e.native_gloss!==a.gloss_en||
      !Number.isSafeInteger(e.kaikki_exact_raw_line)||e.kaikki_exact_raw_line<1||
      !Number.isSafeInteger(e.sense_index_zero_based)||e.sense_index_zero_based<0||
      row.qa_stage_label!=='待审'||row.qa_first_review_verdict!==null||
      row.formal_ready!==0||row.srs_eligible!==false||row.release_allowed!==false)
    fail('ROLLING_ROW');
   ids.add(row.record_id);sourceRows.add(row.source_final_row);
   perScene[row.scene_id]=(perScene[row.scene_id]||0)+1;
   merged.push(row);
  }
 }
 if(merged.length!==phase.fresh_editorial_drafts||
    merged.length+phase.remaining_without_fresh_editorial_draft!==1241||
    ids.size!==merged.length||sourceRows.size!==merged.length||
    Object.keys(phase.by_scene||{}).length!==5)fail('ROLLING_TOTAL');
 for(const [scene,stats] of Object.entries(phase.by_scene)){
  if(!SCENE.test(scene)||perScene[scene]!==stats.drafts||
     stats.drafts+stats.remaining!==stats.total)fail('ROLLING_SCENE');
 }
 return Object.freeze({rows:Object.freeze(merged),perScene:Object.freeze(perScene),
  commit,verifiedBlobCount:4+extraPaths.length,unreviewed:merged.length,
  onlyDiagnostic:true,canWriteSrs:false,formalReady:0,version:state.version,
  pendingReview:true});
}
