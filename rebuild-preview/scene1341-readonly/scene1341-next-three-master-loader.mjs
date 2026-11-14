/* CG-MAIN source-pinned, disposable consumers for three CG-MASTER batches.
 * No Scene500/ENLEX fallbacks, guessed Sense/IPA, or production SRS release.
 */
const PIN='81074812751a88efe6958996a332fc2bf9319ff6';
const ROOT='https://raw.githubusercontent.com/TJPAI/pai-word/'+PIN+'/tools/scene1341_master/qa_reports/';
const SOURCE='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986';
const V105='5b50ad4fbe1c2134552b91f5dbaa4d205a4c93185cdd5817daf92fd19922837a';
const BATCHES=[
 {version:'V134',scene:'SC50-0012',file:'CGMASTER_V134_SC0012_ALL253_BILINGUAL_DRAFT_20261114.json',blob:'0e9c3cdfffa4688be9ff865fd510c12e8bee477c',first:2635,last:2887,count:253},
 {version:'V142',scene:'SC50-0013',file:'CGMASTER_V142_SC0013_ALL245_BILINGUAL_DRAFT_20261114.json',blob:'c1d48fd5df4e7b2b2084e66b0e73649ccc3d852d',first:2888,last:3132,count:245},
 {version:'V144',scene:'SC50-0014',file:'CGMASTER_V144_SC0014_FIRST100_BILINGUAL_DRAFT_20261114.json',blob:'117a39a513862996e401d4dbbda37fed663cf976',first:3133,last:3232,count:100}
];
async function gitBlob(raw){
 if(!globalThis.crypto?.subtle)throw Error('MASTER_BATCH_HASH_UNAVAILABLE');
 const enc=new TextEncoder(),body=enc.encode(raw),prefix=enc.encode('blob '+body.length+'\0');
 const bytes=new Uint8Array(prefix.length+body.length);bytes.set(prefix);bytes.set(body,prefix.length);
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function loadScene1341MasterNextBatches({fetchImpl=fetch}={}){
 const groups=await Promise.all(BATCHES.map(async spec=>{
  const response=await fetchImpl(ROOT+spec.file,{cache:'no-store'});
  if(!response.ok)throw Error('MASTER_'+spec.version+'_HTTP_'+response.status);
  const raw=await response.text();
  if(await gitBlob(raw)!==spec.blob)throw Error('MASTER_'+spec.version+'_BLOB_DRIFT');
  const data=JSON.parse(raw);
  if(data.version!==spec.version||data.scene_id!==spec.scene||
     !Array.isArray(data.records)||data.records.length!==spec.count||
     data.release_allowed===true)throw Error('MASTER_'+spec.version+'_MANIFEST_INVALID');
  const ids=new Set(),rows=new Set(),items=[];
  for(const rec of data.records){
   const q=rec.question_page,a=rec.answer_page,source=rec.source;
   if(rec.scene_id!==spec.scene||
      !/^SC1341-FINAL-SRC-[a-f0-9]{32}$/.test(rec.record_id)||
      !Number.isSafeInteger(rec.source_final_row)||rec.source_final_row<spec.first||rec.source_final_row>spec.last||
      rows.has(rec.source_final_row)||ids.has(rec.record_id)||
      !q?.english_expression?.trim()||!q?.cue_zh?.trim()||
      q.ipa!==null||q.ipa_status!=='AWAIT_NATIVE_KAIKKI_SOURCE'||q.content_complete!==false||
      !a?.meaning_zh||a.meaning_zh!==q.cue_zh||!a.example_en?.trim()||!a.example_zh?.trim()||
      !Array.isArray(a.collocations)||a.collocations.length<2||!a.usage_note?.trim()||a.content_complete!==true||
      source?.original_final_master_sha256!==SOURCE||source?.v105_staging_sha256!==V105||
      source.source_final_row!==rec.source_final_row||
      rec.canonical_sense_id!==null||rec.cg_qa_status!=='DEFERRED'||rec.mu_qa_status!=='DEFERRED'||
      rec.release_allowed!==false)throw Error('MASTER_'+spec.version+'_ROW_INVALID_'+rec.source_final_row);
   rows.add(rec.source_final_row);ids.add(rec.record_id);
   items.push({
    scene_ku_id:rec.record_id,scene_id:rec.scene_id,
    master_record_id:rec.record_id,master_final_row:rec.source_final_row,
    expression:q.english_expression,source_rank:rec.source_final_row,
    question:{expression:q.english_expression,cue_zh:q.cue_zh,ipa:null,
      ipa_status:'MISSING_VERIFIED_KAIKKI_IPA',ipa_source:null,ipa_provisional:false,ipa_candidates_pending:false},
    answer:a,display:{w:q.english_expression,m:a.meaning_zh},
    qa_status:'DEFERRED_TEST_ONLY',production_release_allowed:false
   });
  }
  if(ids.size!==spec.count||rows.size!==spec.count||
     Math.min(...rows)!==spec.first||Math.max(...rows)!==spec.last)
     throw Error('MASTER_'+spec.version+'_COVERAGE_INVALID');
  return items.sort((a,b)=>a.source_rank-b.source_rank);
 }));
 const items=groups.flat();
 if(items.length!==598||new Set(items.map(x=>x.master_record_id)).size!==598)
  throw Error('MASTER_BATCH_GLOBAL_DUPLICATE');
 return Object.freeze({items:Object.freeze(items),scenes:3,total:598,source:'CG_MASTER_V134_V142_V144_AUTHOR_DRAFT',
  formalCertification:false,productionRelease:false,canWriteSrs:false,testRecordsDisposable:true,
  batches:BATCHES.map(x=>({scene:x.scene,count:x.count,sourceGitBlob:x.blob}))});
}
