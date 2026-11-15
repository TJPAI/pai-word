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
