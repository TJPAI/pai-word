/* CG-MAIN: source-pinned V223+ preview payload inspection ONLY.
 * Independent of study queue, Scene500 controllers, formal QA and SRS.
 */
const API='https://api.github.com/repos/TJPAI/pai-word/';
const RAW='https://raw.githubusercontent.com/TJPAI/pai-word/';
const BRANCH='cg-master-kaikki-evidence-intake-20261111';
const STATE='tools/scene1341_master/CGMASTER_CURRENT_STATE.json';
const RE=/^tools\/scene1341_master\/qa_reports\/CGMASTER_V([0-9]{3,})_([0-9]+)_PREVIEW_QUESTION_ANSWER_PAGE_PAYLOADS_20[0-9]{6}\.json$/;
const SHA40=/^[a-f0-9]{40}$/;
const SCENE=/^SC50-000[1-5]$/;
const RECORD=/^SC1341-FINAL-SRC-[a-f0-9]{32}$/;
const fail=code=>{throw Error('MASTER_PREVIEW_'+code)};
export function selectPreviewPayloadArtifact(state){
 if(state?.schema!=='cgmaster-current-state/v1'||state?.role!=='CG-MASTER'||
  state?.branch!==BRANCH||state?.phase1?.original_source_associations!==1241||
  !Array.isArray(state?.phase1?.editorial_artifacts))fail('STATE');
 const all=state.phase1.editorial_artifacts.map(path=>{
  const match=typeof path==='string'?path.match(RE):null;
  return match?{path,version:Number(match[1]),expected:Number(match[2])}:null;
 }).filter(Boolean).sort((a,b)=>b.version-a.version);
 return all[0]||null;
}
export function validatePreviewPayload(doc,expected){
 if(doc?.version!=='V'+expected.version||doc?.scope!=='SC50-0001..0005'||
  doc?.total!==expected.expected||!Array.isArray(doc.records)||
  doc.records.length!==doc.total||doc.question_pages!==doc.total||
  doc.answer_pages!==doc.total||doc.complete_question_pages!==0||
  doc.complete_answer_pages!==0||doc.ipa_approved_count!==0||
  doc.release_allowed!==false||doc.qa_stage!=='待审')fail('CONTRACT');
 const ids=new Set(),rows=new Set();let exampleRecords=0;
 for(const r of doc.records){
  const q=r?.question_page,a=r?.answer_page;
  if(!RECORD.test(r?.record_id||'')||!SCENE.test(r?.scene_id||'')||
   !Number.isSafeInteger(r.source_final_row)||r.source_final_row<1||
   r.source_final_row>1241||ids.has(r.record_id)||rows.has(r.source_final_row)||
   !q||!a||!q.expression?.trim()||a.expression!==q.expression||
   typeof a.meaning_zh!=='string'||!a.meaning_zh.trim()||
   typeof a.gloss_en!=='string'||!a.gloss_en.trim()||
   q.complete!==false||a.complete!==false||q.ipa!==null||
   a.ipa!==null||q.qa_label!=='待审'||a.qa_label!=='待审'||
   r.qa_stage!=='待审'||(r.qa_label!==undefined&&r.qa_label!=='待审')||
   r.formal_ready!==0||r.release_allowed!==false||
   !Number.isSafeInteger(r.native_source_line)||r.native_source_line<1||
   !Array.isArray(q.ipa_candidates)||!Array.isArray(a.examples)||
   a.examples.length>3||
   a.examples.some(e=>!e.en?.trim()||!e.zh?.trim()||
    !['KAIKKI_NATIVE_EXAMPLE_WITH_EDITORIAL_TRANSLATION',
     'CGMASTER_ORIGINAL_EDITORIAL_EXAMPLE_NOT_KAIKKI'].includes(e.origin)))
   fail('ROW');
  ids.add(r.record_id);rows.add(r.source_final_row);
  if(a.examples.length)exampleRecords++;
 }
 if(exampleRecords!==doc.answer_pages_with_examples)fail('EXAMPLE_COUNT');
 return Object.freeze({total:doc.total,exampleRecords,unapproved:true,formalReady:0,canWriteSrs:false});
}
export function previewV223Row(row){
 const q=row.question_page,a=row.answer_page;
 const hold=row.content_status==='HOLD'||row.sense_source_status==='ERRATA_PENDING_QA';
 return Object.freeze({scene:row.scene_id,recordId:row.record_id,sourceRow:row.source_final_row,
  word:q.expression,meaning:a.meaning_display||a.meaning_zh,gloss:a.gloss_en,
  examples:a.examples.map(e=>({en:e.en,zh:e.zh,native:e.origin==='KAIKKI_NATIVE_EXAMPLE_WITH_EDITORIAL_TRANSLATION'})),
  hold,ipa:'音标待核验',stage:'待审',canWriteSrs:false,formalReady:0});
}
export async function fetchCurrentPreviewPayload({fetchImpl=fetch,commit}={}){
 if(commit==null){
  const response=await fetchImpl(API+'branches/'+BRANCH,{cache:'no-store'});
  if(!response.ok)fail('BRANCH_HTTP_'+response.status);
  commit=(await response.json())?.commit?.sha;
 }
 if(!SHA40.test(commit||''))fail('COMMIT');
 const stateResp=await fetchImpl(RAW+commit+'/'+STATE,{cache:'no-store'});
 if(!stateResp.ok)fail('STATE_HTTP_'+stateResp.status);
 const artifact=selectPreviewPayloadArtifact(await stateResp.json());
 if(!artifact) return Object.freeze({rows:[],notPublished:true,commit,canWriteSrs:false});
 const metaResp=await fetchImpl(API+'contents/'+artifact.path+'?ref='+commit,{cache:'no-store'});
 if(!metaResp.ok)fail('META_HTTP_'+metaResp.status);
 const meta=await metaResp.json();
 if(meta.path!==artifact.path||meta.type!=='file'||!SHA40.test(meta.sha||'')||
  meta.size>2000000||meta.size<20)fail('META');
 const response=await fetchImpl(RAW+commit+'/'+artifact.path,{cache:'no-store'});
 if(!response.ok)fail('SOURCE_HTTP_'+response.status);
 const raw=await response.text();
 if(!globalThis.crypto?.subtle)fail('CRYPTO_UNAVAILABLE');
 const bytes=new TextEncoder().encode(raw);
 const hdr=new TextEncoder().encode('blob '+bytes.length+String.fromCharCode(0));
 const buffer=new Uint8Array(hdr.length+bytes.length);
 buffer.set(hdr);buffer.set(bytes,hdr.length);
 const digest=await globalThis.crypto.subtle.digest('SHA-1',buffer);
 const sha=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 if(sha!==meta.sha)fail('BLOB_SHA');
 const doc=JSON.parse(raw);
 const coverage=validatePreviewPayload(doc,artifact);
 return Object.freeze({rows:Object.freeze(doc.records),coverage,sourceCommit:commit,
  version:doc.version,sourceBlob:sha,canWriteSrs:false,formalReady:0});
}
