/* Scene1341 isolated test-mode Master intake (CG-MASTER V106).
 * All content remains uncertified and non-production; no SRS/bookmark writes.
 * This adapter deliberately reads only the source-row-exact author drafts.
 * The 161 V82 ambiguous drafts and absent Master page fields stay unavailable.
 */
const COMMIT='0a1415916078a67b81b9f06bd98f6777bdac2a6e';
const FILE='tools/scene1341_master/qa_reports/CGMASTER_V106_BATCH001_V82_AUTHOR_1877_SOURCE_ROW_STAGING_20261114.json';
const EXPECTED_GIT_BLOB='e24209cbcb6d803e9d9c80b9f388165fb6e24f99';
const URL='https://raw.githubusercontent.com/TJPAI/pai-word/'+COMMIT+'/'+FILE;
async function gitBlob(text){
  if(!globalThis.crypto?.subtle)throw Error('MASTER_SHA_VERIFICATION_UNAVAILABLE');
  const enc=new TextEncoder(),body=enc.encode(text),prefix=enc.encode('blob '+body.length+'\0');
  const bytes=new Uint8Array(prefix.length+body.length);
  bytes.set(prefix);bytes.set(body,prefix.length);
  const digest=await crypto.subtle.digest('SHA-1',bytes);
  return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export async function loadScene1341MasterTest({fetchImpl=fetch}={}){
 const res=await fetchImpl(URL,{cache:'no-store'});
 if(!res.ok)throw Error('MASTER_STAGING_HTTP_'+res.status);
 const raw=await res.text();
 if(await gitBlob(raw)!==EXPECTED_GIT_BLOB)throw Error('MASTER_STAGING_BLOB_CHANGED');
 const data=JSON.parse(raw);
 if(data.version!=='V106'||data.batch!=='BATCH001'||
    data.counts?.exact_single_source_row_staging!==1877||
    data.counts?.hold!==161||!Array.isArray(data.records)||
    data.records.length!==1877||data.hold_records?.length!==161)
    throw Error('MASTER_STAGING_MANIFEST_INVALID');
 const ids=new Set(),rowIds=new Set(),items=[];
 for(const rec of data.records){
  if(!/^SC50-\d{4}$/.test(rec.scene_id)||
     !/^SC1341-KU-\d{5}$/.test(rec.ku_id)||
     !Number.isSafeInteger(rec.final_row)||rec.final_row<1||
     ids.has(rec.ku_id)||rowIds.has(rec.final_row)||
     !rec.expression||!rec.answer?.meaning_zh||
     !rec.answer?.example_en||!rec.answer?.example_zh||
     !Array.isArray(rec.answer?.collocations)||
     !rec.answer.collocations.length||!rec.answer?.usage_note||
     rec.release_allowed!==false||rec.canonical_sense_id!==null)
    throw Error('MASTER_STAGING_ROW_INVALID_'+(rec.ku_id||'?'));
  ids.add(rec.ku_id);rowIds.add(rec.final_row);
  items.push({
   scene_ku_id:rec.ku_id,scene_id:rec.scene_id,
   expression:rec.expression,source_rank:rec.final_row,
   answer:rec.answer,display:{w:rec.expression,m:rec.answer.meaning_zh},
   master_final_row:rec.final_row,qa_status:'DEFERRED_TEST_ONLY',
   production_release_allowed:false
  });
 }
 items.sort((a,b)=>a.scene_id.localeCompare(b.scene_id)||a.source_rank-b.source_rank);
 const sceneIds=new Set(items.map(x=>x.scene_id));
 if(sceneIds.size!==10)throw Error('MASTER_STAGING_SCENE_COUNT_INVALID');
 return Object.freeze({
   items:Object.freeze(items),total:items.length,scenes:sceneIds.size,
   source:'CG_MASTER_V106_1877_SOURCE_EXACT_AUTHOR_DRAFTS',
   verifiedGitBlob:EXPECTED_GIT_BLOB,excludedBlocked:161,
   formalCertification:false,productionRelease:false,canWriteSrs:false,
   testRecordsDisposable:true
 });
}
