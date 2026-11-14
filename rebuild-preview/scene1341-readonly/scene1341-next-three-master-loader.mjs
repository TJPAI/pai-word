/* CG-MAIN source-pinned, disposable consumers for three CG-MASTER batches.
 * No Scene500/ENLEX fallbacks, guessed Sense/IPA, or production SRS release.
 */
const PIN='8271d36e31b46713456628b4ea25779fa8d298cc';
const ROOT='https://raw.githubusercontent.com/TJPAI/pai-word/'+PIN+'/tools/scene1341_master/qa_reports/';
const SOURCE='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986';
const V105='5b50ad4fbe1c2134552b91f5dbaa4d205a4c93185cdd5817daf92fd19922837a';
export const MASTER_SCENE_BATCH_MANIFEST=Object.freeze([
 {version:'V134',scene:'SC50-0012',file:'CGMASTER_V134_SC0012_ALL253_BILINGUAL_DRAFT_20261114.json',blob:'0e9c3cdfffa4688be9ff865fd510c12e8bee477c',first:2635,last:2887,count:253},
 {version:'V142',scene:'SC50-0013',file:'CGMASTER_V142_SC0013_ALL245_BILINGUAL_DRAFT_20261114.json',blob:'c1d48fd5df4e7b2b2084e66b0e73649ccc3d852d',first:2888,last:3132,count:245},
 {version:'V150',scene:'SC50-0014',file:'CGMASTER_V150_SC0014_243_WITH_4_KAIKKI_PAGE_IPA_TEST_20261114.json',blob:'3e1042efe58480e38ae90631c595f872622cd748',first:3133,last:3375,count:243}
].map(spec=>Object.freeze(spec)));
// A new author batch is added by one manifest entry, never by hardcoded totals.
for(let i=0;i<MASTER_SCENE_BATCH_MANIFEST.length;i++){
 const item=MASTER_SCENE_BATCH_MANIFEST[i];
 if(!/^SC50-\d{4}$/.test(item.scene)||item.last-item.first+1!==item.count||
    !/^[a-f0-9]{40}$/.test(item.blob)||
    MASTER_SCENE_BATCH_MANIFEST.some((other,j)=>i!==j&&
      (item.scene===other.scene||
       (item.first<=other.last&&other.first<=item.last))))
   throw Error('MASTER_BATCH_MANIFEST_ID_OR_RANGE_CONFLICT');
}
async function gitBlob(raw){
 if(!globalThis.crypto?.subtle)throw Error('MASTER_BATCH_HASH_UNAVAILABLE');
 const enc=new TextEncoder(),body=enc.encode(raw),prefix=enc.encode('blob '+body.length+'\0');
 const bytes=new Uint8Array(prefix.length+body.length);bytes.set(prefix);bytes.set(body,prefix.length);
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function loadScene1341MasterNextBatches({fetchImpl=fetch}={}){
 const groups=await Promise.all(MASTER_SCENE_BATCH_MANIFEST.map(async spec=>{
  const response=await fetchImpl(ROOT+spec.file,{cache:'no-store'});
  if(!response.ok)throw Error('MASTER_'+spec.version+'_HTTP_'+response.status);
  const raw=await response.text();
  if(await gitBlob(raw)!==spec.blob)throw Error('MASTER_'+spec.version+'_BLOB_DRIFT');
  const data=JSON.parse(raw);
  if(data.version!==spec.version||data.scene_id!==spec.scene||
     !Array.isArray(data.records)||data.records.length!==spec.count||
     data.release_allowed===true)throw Error('MASTER_'+spec.version+'_MANIFEST_INVALID');
  const ids=new Set(),rows=new Set(),items=[];let pageIpa=0,withheldVariants=0;
  for(const rec of data.records){
   const q=rec.question_page,a=rec.answer_page,source=rec.source;
   if(rec.scene_id!==spec.scene||
      !/^SC1341-FINAL-SRC-[a-f0-9]{32}$/.test(rec.record_id)||
      !Number.isSafeInteger(rec.source_final_row)||rec.source_final_row<spec.first||rec.source_final_row>spec.last||
      rows.has(rec.source_final_row)||ids.has(rec.record_id)||
      !q?.english_expression?.trim()||!q?.cue_zh?.trim()||
      (spec.version!=='V150'?(q.ipa!==null||q.ipa_status!=='AWAIT_NATIVE_KAIKKI_SOURCE'||q.content_complete!==false):
       (q.ipa===null?
        (q.content_complete!==false||!['AWAIT_NATIVE_KAIKKI_SOURCE','MULTIPLE_ATTESTED_IPA_VARIANTS_UNSELECTED'].includes(q.ipa_status)||
         (q.ipa_status==='MULTIPLE_ATTESTED_IPA_VARIANTS_UNSELECTED'&&
          (!Array.isArray(q.ipa_candidates)||q.ipa_candidates.length<2))):
        (q.ipa_status!=='KAIKKI_POSTPROCESSED_PAGE_VERIFIED_TEST_ONLY'||q.content_complete!==true||
         !q.ipa.startsWith('/')||!q.ipa.endsWith('/')||
         q.ipa_evidence?.source_type!=='KAIKKI_POSTPROCESSED_DICTIONARY_WEB_PAGE'||
         !q.ipa_evidence?.source_url?.startsWith('https://kaikki.org/dictionary/English/')||
         q.ipa_evidence.native_raw_jsonl_sha256!==null||
         q.ipa_evidence.formal_sense_alignment!==false||q.ipa_evidence.author_review_required!==true)))||
      !a?.meaning_zh||a.meaning_zh!==q.cue_zh||!a.example_en?.trim()||!a.example_zh?.trim()||
      !Array.isArray(a.collocations)||a.collocations.length<2||!a.usage_note?.trim()||a.content_complete!==true||
      source?.original_final_master_sha256!==SOURCE||source?.v105_staging_sha256!==V105||
      source.source_final_row!==rec.source_final_row||
      rec.canonical_sense_id!==null||rec.cg_qa_status!=='DEFERRED'||rec.mu_qa_status!=='DEFERRED'||
      rec.release_allowed!==false)throw Error('MASTER_'+spec.version+'_ROW_INVALID_'+rec.source_final_row);
   rows.add(rec.source_final_row);ids.add(rec.record_id);
   if(q.ipa!==null)pageIpa++;
   if(q.ipa_status==='MULTIPLE_ATTESTED_IPA_VARIANTS_UNSELECTED')withheldVariants++;
   items.push({
    scene_ku_id:rec.record_id,scene_id:rec.scene_id,
    master_record_id:rec.record_id,master_final_row:rec.source_final_row,
    expression:q.english_expression,source_rank:rec.source_final_row,
    question:{expression:q.english_expression,cue_zh:q.cue_zh,ipa:q.ipa,
      ipa_status:q.ipa===null?'MISSING_VERIFIED_KAIKKI_IPA':q.ipa_status,
      ipa_source:q.ipa===null?null:q.ipa_evidence,
      ipa_provisional:q.ipa!==null,
      ipa_candidates_pending:q.ipa_status==='MULTIPLE_ATTESTED_IPA_VARIANTS_UNSELECTED'},
    answer:a,display:{w:q.english_expression,m:a.meaning_zh},
    qa_status:'DEFERRED_TEST_ONLY',production_release_allowed:false
   });
  }
  if(ids.size!==spec.count||rows.size!==spec.count||
     Math.min(...rows)!==spec.first||Math.max(...rows)!==spec.last)
     throw Error('MASTER_'+spec.version+'_COVERAGE_INVALID');
  if(spec.version==='V150'&&(pageIpa!==4||withheldVariants!==2))
   throw Error('MASTER_V150_IPA_TEST_COUNTS_MISMATCH');
  if(spec.version!=='V150'&&(pageIpa!==0||withheldVariants!==0))
   throw Error('MASTER_EARLIER_SCENE_IPA_SOURCE_DRIFT');
  return items.sort((a,b)=>a.source_rank-b.source_rank);
 }));
 const items=groups.flat();
 const expected=MASTER_SCENE_BATCH_MANIFEST.reduce((n,x)=>n+x.count,0);
 if(items.length!==expected||new Set(items.map(x=>x.master_record_id)).size!==expected)
  throw Error('MASTER_BATCH_GLOBAL_DUPLICATE');
 return Object.freeze({items:Object.freeze(items),scenes:MASTER_SCENE_BATCH_MANIFEST.length,total:expected,source:'CG_MASTER_MANIFEST_PINNED_AUTHOR_DRAFT',
  formalCertification:false,productionRelease:false,canWriteSrs:false,testRecordsDisposable:true,
  batches:MASTER_SCENE_BATCH_MANIFEST.map(x=>({scene:x.scene,count:x.count,sourceGitBlob:x.blob}))});
}
