/* Read-only CG-MASTER V123 SC50-0011 (first 30 of 255 FINAL rows).
 * Draft pages are owned by CG-MASTER. No invented KU, audio, IPA, approval.
 * Source pinned to immutable Git commit and exact blob hash.
 */
const COMMIT='eb9fb2c89f05926ae22e5edc5ce255d119d29f88';
const FILE='tools/scene1341_master/qa_reports/CGMASTER_V123_SC0011_FIRST130_BILINGUAL_20261114.json';
const EXPECTED_BLOB='b50195b86be67880ff4c5b21cd53b330c19e5446';
const URL='https://raw.githubusercontent.com/TJPAI/pai-word/'+COMMIT+'/'+FILE;
async function exactGitBlob(raw){
 if(!globalThis.crypto?.subtle)throw Error('MASTER_V123_SHA_VERIFICATION_UNAVAILABLE');
 const enc=new TextEncoder(),payload=enc.encode(raw),prefix=enc.encode('blob '+payload.length+'\0');
 const bytes=new Uint8Array(payload.length+prefix.length);bytes.set(prefix);bytes.set(payload,prefix.length);
 const hash=await crypto.subtle.digest('SHA-1',bytes);
 return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function loadScene1341V123Test({fetchImpl=fetch}={}){
 const res=await fetchImpl(URL,{cache:'no-store'});
 if(!res.ok)throw Error('MASTER_V123_HTTP_'+res.status);
 const raw=await res.text();
 if(await exactGitBlob(raw)!==EXPECTED_BLOB)throw Error('MASTER_V123_SOURCE_BLOB_CHANGED');
 const data=JSON.parse(raw);
 if(data.version!=='V123'||data.scene_id!=='SC50-0011'||data.status!=='AUTHOR_DRAFT_NOT_CERTIFIED'||
    !Array.isArray(data.records)||data.records.length!==130||data.counts?.author_drafts!==130||data.counts?.native_ipa_approved!==0||data.counts?.certified!==0)
  throw Error('MASTER_V123_MANIFEST_INVALID');
 const ids=new Set(),rows=new Set(),items=[];
 for(const rec of data.records){
  const q=rec.question_page,a=rec.answer_page;
  if(!/^SC1341-FINAL-SRC-[a-f0-9]{32}$/.test(rec.record_id)||
     rec.scene_id!=='SC50-0011'||rec.scene_name!=='看电视与流媒体'||
     !Number.isSafeInteger(rec.source_final_row)||rec.source_final_row<2380||rec.source_final_row>2509||
     ids.has(rec.record_id)||rows.has(rec.source_final_row)||
     !q?.english_expression||!q?.cue_zh||q.ipa!==null||
     q.ipa_status!=='AWAIT_NATIVE_KAIKKI_SOURCE'||q.content_complete!==false||
     !a?.meaning_zh||a.meaning_zh!==q.cue_zh||!a.example_en||!a.example_zh||
     !Array.isArray(a.collocations)||a.collocations.length<2||!a.usage_note||a.content_complete!==true||
     rec.source?.source_final_row!==rec.source_final_row||
     rec.source?.original_final_master_sha256!=='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986'||
     rec.canonical_sense_id!==null||rec.cg_qa_status!=='DEFERRED'||
     rec.mu_qa_status!=='DEFERRED'||rec.release_allowed!==false)
   throw Error('MASTER_V123_ROW_INVALID_'+(rec.record_id||'?'));
  ids.add(rec.record_id);rows.add(rec.source_final_row);
  items.push({
   // The original FINAL Master record ID is used directly: no artificial identity.
   scene_ku_id:rec.record_id,scene_id:rec.scene_id,master_record_id:rec.record_id,
   master_final_row:rec.source_final_row,expression:q.english_expression,source_rank:rec.source_final_row,
   question:{expression:q.english_expression,cue_zh:q.cue_zh,ipa:null,
    ipa_status:'MISSING_VERIFIED_KAIKKI_IPA',ipa_source:null,
    ipa_provisional:false,ipa_candidates_pending:false},
   answer:a,display:{w:q.english_expression,m:a.meaning_zh},
   qa_status:'DEFERRED_TEST_ONLY',production_release_allowed:false
  });
 }
 if(ids.size!==130||rows.size!==130||Math.min(...rows)!==2380||Math.max(...rows)!==2509)
  throw Error('MASTER_V123_COVERAGE_INVALID');
 items.sort((a,b)=>a.source_rank-b.source_rank);
 return Object.freeze({items:Object.freeze(items),total:130,scenes:1,source:'CG_MASTER_V123_SC0011_FIRST130_AUTHOR_DRAFT',
  verifiedGitBlob:EXPECTED_BLOB,formalCertification:false,productionRelease:false,canWriteSrs:false,
  testRecordsDisposable:true});
}
