/* CG-MAIN isolated SC0011–SC0014 V171 paired Master page overlay.
 * Replaces draft question/answer fields on 996 existing cards by exact source
 * identity; never adds duplicate KUs or promotes a release / writes SRS.
 */
const PIN='29e1b9e55f20e753689289f6866a1e7bab3c7302';
const ROOT='https://raw.githubusercontent.com/TJPAI/pai-word/'+PIN+'/tools/scene1341_master/qa_reports/';
const SOURCES=Object.freeze([
 {scene:'SC50-0011',count:255,first:2380,last:2634,blob:'4361ef6e4db8d8e48c32990f3f61cff119f4188d'},
 {scene:'SC50-0012',count:253,first:2635,last:2887,blob:'2f76c93c2aa5de6f41a046ed53b5588b8e04f290'},
 {scene:'SC50-0013',count:245,first:2888,last:3132,blob:'8007466adb82311c5a7224e6c0b5aea2be52ad28'},
 {scene:'SC50-0014',count:243,first:3133,last:3375,blob:'b70377880c502284f9d5efffbed5d7b94ec25323'}
].map(v=>Object.freeze({...v,file:'CGMASTER_V171_SC'+v.scene.slice(-4)+'_PAIRED_QUESTION_ANSWER_DRAFT_20261114.json'})));
async function blobSha(raw){
 if(!globalThis.crypto?.subtle)throw Error('V171_CRYPTO_NOT_AVAILABLE');
 const bytes=new TextEncoder().encode(raw),prefix=new TextEncoder().encode('blob '+bytes.length+'\0'),input=new Uint8Array(prefix.length+bytes.length);
 input.set(prefix);input.set(bytes,prefix.length);
 const hash=await crypto.subtle.digest('SHA-1',input);
 return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
const validIpa=s=>typeof s==='string'&&/^(?:\/[^\/\]\r\n]+\/|\[[^\/\]\r\n]+\])$/u.test(s.trim())&&s.trim().slice(1,-1).trim().length>0;
export async function applyV171PairedMasterOverlay(baseCards,{fetchImpl=fetch}={}){
 if(!Array.isArray(baseCards)||baseCards.length!==2873)throw Error('V171_BASE_CARD_COUNT_DRIFT');
 const index=new Map(baseCards.map(x=>[x.master_record_id,x]));
 if(index.size!==baseCards.length)throw Error('V171_BASE_DUPLICATE_ID');
 const all=(await Promise.all(SOURCES.map(async spec=>{
  const response=await fetchImpl(ROOT+spec.file,{cache:'no-store'});
  if(!response.ok)throw Error('V171_HTTP_'+response.status+'_'+spec.scene);
  const raw=await response.text();
  if(await blobSha(raw)!==spec.blob)throw Error('V171_BLOB_DRIFT_'+spec.scene);
  const data=JSON.parse(raw);
  if(data.version!=='V171'||data.record_count!==spec.count||!Array.isArray(data.records)||data.records.length!==spec.count||data.release_allowed!==false)
   throw Error('V171_MANIFEST_DRIFT_'+spec.scene);
  const ids=new Set(),rows=new Set();
  for(const rec of data.records){
   const q=rec.question_page,a=rec.answer_page;
   const card=index.get(rec.record_id);
   if(rec.scene_id!==spec.scene||!card||card.scene_id!==spec.scene||
      card.master_final_row!==rec.source_final_row||
      card.expression!==q?.english_expression||
      !Number.isSafeInteger(rec.source_final_row)||rec.source_final_row<spec.first||rec.source_final_row>spec.last||
      ids.has(rec.record_id)||rows.has(rec.source_final_row)||
      rec.canonical_sense_id!==null||rec.release_allowed!==false||
      rec.cg_qa_status!=='DEFERRED'||rec.mu_qa_status!=='DEFERRED'||
      !q?.cue_zh?.trim()||!q?.audio_text?.trim()||
      !a?.meaning_zh?.trim()||!a?.example_en?.trim()||!a?.example_zh?.trim()||
      !Array.isArray(a.collocations)||a.collocations.length===0||!a?.usage_note?.trim()||
      a.content_complete!==true||q.content_complete!==(q.ipa!==null)||
      (q.ipa!==null&&!validIpa(q.ipa)))
    throw Error('V171_SOURCE_OR_ANSWER_INVALID_'+spec.scene+'_'+rec.source_final_row);
   ids.add(rec.record_id);rows.add(rec.source_final_row);
  }
  if(Math.min(...rows)!==spec.first||Math.max(...rows)!==spec.last)
    throw Error('V171_SOURCE_RANGE_DRIFT_'+spec.scene);
  return data.records;
 }))).flat();
 if(all.length!==996||new Set(all.map(x=>x.record_id)).size!==996)throw Error('V171_GLOBAL_DUPLICATE');
 const mapped=new Map(all.map(rec=>{
  const original=index.get(rec.record_id),q=rec.question_page,a=rec.answer_page,ipa=q.ipa;
  return [rec.record_id,{
   ...original,
   question:{...original.question,expression:q.english_expression,cue_zh:q.cue_zh,
    ipa,ipa_status:ipa===null?'MISSING_VERIFIED_KAIKKI_IPA':q.ipa_status,
    ipa_source:ipa===null?null:{source_type:'CGMASTER_V171_PAIRED_TEST',
     native_archive_sha256:rec.ipa_source?.archive_sha256||null,
     native_exact_headword_phonemic_candidates:rec.ipa_source?.native_exact_headword_phonemic_candidates||[],
     source_git_blob:SOURCES.find(x=>x.scene===rec.scene_id)?.blob},
    ipa_provisional:ipa!==null,ipa_candidates_pending:q.ipa_status?.includes('MULTIVARIANT')===true,
    ipa_test_only_v171:true},
   answer:{meaning_zh:a.meaning_zh,example_en:a.example_en,example_zh:a.example_zh,
    collocations:a.collocations,usage_note:a.usage_note,content_complete:true},
   display:{w:q.english_expression,m:a.meaning_zh},
   qa_status:'DEFERRED_TEST_ONLY',production_release_allowed:false,
   master_paired_test_version:'V171'
  }];
 }));
 const result=baseCards.map(x=>mapped.get(x.master_record_id)||x);
 const selected=all.filter(x=>validIpa(x.question_page.ipa)).length;
 if(selected!==979||all.length-selected!==17||mapped.size!==996||new Set(result.map(x=>x.master_record_id)).size!==2873)
  throw Error('V171_PAIRED_COVERAGE_DRIFT');
 return Object.freeze({items:Object.freeze(result),replaced:996,selectedIPA:979,missingIPA:17,scenes:4,
  formalReady:0,canWriteSrs:false,releaseAllowed:false,sourceCommit:PIN});
}
