/* CG-MAIN read-only consumer for CG-MASTER V111.
 * CG-MASTER alone owns Sense/Scene identity, question, answer and Kaikki IPA.
 * Snapshot pinned to immutable commit and exact Git blob. No Core20K fallback.
 * All records are uncertified, disposable preview-only, never production SRS.
 */
const COMMIT='b9dcf68073a59c70add997d548ff08b2ae118982';
const FILE='tools/scene1341_master/qa_reports/CGMASTER_V111_BATCH001_1877_V110_PLUS_3_KAIKKI_IPA_20261114.json';
const EXPECTED_GIT_BLOB='847c5a9432999426d0f7db807367720616bf1a57';
const URL='https://raw.githubusercontent.com/TJPAI/pai-word/'+COMMIT+'/'+FILE;
async function gitBlob(raw){
 if(!globalThis.crypto?.subtle)throw Error('MASTER_SHA_VERIFICATION_UNAVAILABLE');
 const enc=new TextEncoder(),body=enc.encode(raw),prefix=enc.encode('blob '+body.length+'\0');
 const bytes=new Uint8Array(prefix.length+body.length);
 bytes.set(prefix);bytes.set(body,prefix.length);
 const digest=await crypto.subtle.digest('SHA-1',bytes);
 return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export async function loadScene1341MasterTest({fetchImpl=fetch}={}){
 const response=await fetchImpl(URL,{cache:'no-store'});
 if(!response.ok)throw Error('MASTER_STAGING_HTTP_'+response.status);
 const raw=await response.text();
 if(await gitBlob(raw)!==EXPECTED_GIT_BLOB)throw Error('MASTER_STAGING_BLOB_CHANGED');
 const data=JSON.parse(raw);
 if(data.version!=='V111'||data.batch!=='BATCH001'||data.release_allowed!==false||
    data.counts?.exact_author_content_rows!==1877||
    data.counts?.held_source_author_rows!==161||
    data.counts?.question_pages_verified_ipa!==3||
    data.counts?.ipa_missing!==1874||
    !Array.isArray(data.records)||data.records.length!==1877)
    throw Error('MASTER_V111_MANIFEST_INVALID');
 const ids=new Set(),records=new Set(),rows=new Set(),items=[];let ipaCount=0;
 for(const rec of data.records){
  const question=rec.question_page,answer=rec.answer_page,hasIpa=typeof question?.ipa==='string'&&question.ipa.length>0;
  if(!/^SC50-\d{4}$/.test(rec.scene_id)||!/^SC1341-KU-\d{5}$/.test(rec.ku_id)||
     !/^SC1341-FINAL-SRC-[a-f0-9]{32}$/.test(rec.record_id)||
     !Number.isSafeInteger(rec.source_final_row)||rec.source_final_row<1||
     ids.has(rec.ku_id)||records.has(rec.record_id)||rows.has(rec.source_final_row)||
     question?.english_expression?.trim().length===0||!question?.english_expression||
     !question?.cue_zh||!answer?.meaning_zh||!answer?.example_en||!answer?.example_zh||
     !Array.isArray(answer?.collocations)||answer.collocations.length===0||
     !answer?.usage_note||answer.content_complete!==true||
     rec.source_identity_join!=='EXACT_SCENE_EXPRESSION_CHINESE_AND_FINAL_ROW'||
     rec.release_allowed!==false||rec.qa_status!=='DEFERRED'||
     (hasIpa&&(!question?.ipa_source?.url?.startsWith('https://kaikki.org/dictionary/English/')||
               question.ipa_status!=='VERIFIED_NATIVE_KAIKKI_EXACT_ENTRY_TEST_ONLY'||
               question.ipa_source.headword!==question.english_expression||
               question.content_complete!==true))||
     (!hasIpa&&(question.ipa!==null||question.ipa_status!=='MISSING_VERIFIED_KAIKKI_IPA'||
                question.content_complete!==false)))
    throw Error('MASTER_V111_ROW_INVALID_'+(rec.ku_id||'?'));
  ids.add(rec.ku_id);records.add(rec.record_id);rows.add(rec.source_final_row);
  if(hasIpa)ipaCount++;
  items.push({
   scene_ku_id:rec.ku_id,scene_id:rec.scene_id,
   master_record_id:rec.record_id,master_final_row:rec.source_final_row,
   expression:question.english_expression,source_rank:rec.source_final_row,
   question:{expression:question.english_expression,cue_zh:question.cue_zh,
     ipa:question.ipa,ipa_status:question.ipa_status,
     ipa_source:hasIpa?question.ipa_source:null},
   answer,display:{w:question.english_expression,m:answer.meaning_zh},
   qa_status:'DEFERRED_TEST_ONLY',production_release_allowed:false
  });
 }
 const scenes=new Set(items.map(v=>v.scene_id));
 if(scenes.size!==10||ipaCount!==3)throw Error('MASTER_V111_COVERAGE_INVALID');
 items.sort((a,b)=>a.scene_id.localeCompare(b.scene_id)||a.source_rank-b.source_rank);
 return Object.freeze({items:Object.freeze(items),total:items.length,scenes:scenes.size,
  source:'CG_MASTER_V111_SOURCE_IDENTITY_VERIFIED_PAGES_AND_KAIKKI_IPA',
  verifiedGitBlob:EXPECTED_GIT_BLOB,excludedBlocked:161,verifiedNativeIpa:ipaCount,
  formalCertification:false,productionRelease:false,canWriteSrs:false,testRecordsDisposable:true});
}
