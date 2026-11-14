/* CG-MAIN V154 TEST-ONLY intake of CG-MASTER's local Kaikki archive overlay.
 * Never overwrite a selected IPA, adjudicate variants, change an answer, or release to SRS.
 */
const COMMIT='fbf8a8d0d95c3c5b8ddb310b2a04dce99ddd0102';
const FILE='tools/scene1341_master/qa_reports/CGMASTER_V154_SC0011_0014_91_SINGLE_PHONEMIC_IPA_TEST_OVERLAY_20261114.json';
const BLOB='34ca67677001f58abb3f3d55d88d2256d36c5637';
const ARCHIVE_SHA='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99';
const URL='https://raw.githubusercontent.com/TJPAI/pai-word/'+COMMIT+'/'+FILE;
async function gitBlob(raw){
 if(!globalThis.crypto?.subtle)throw Error('V154_CRYPTO_UNAVAILABLE');
 const e=new TextEncoder(),body=e.encode(raw),head=e.encode('blob '+body.length+'\0');
 const bytes=new Uint8Array(head.length+body.length);bytes.set(head);bytes.set(body,head.length);
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function applyV154LocalKaikkiTestOverlay(cards,{fetchImpl=fetch}={}){
 if(!Array.isArray(cards)||cards.length!==2873)throw Error('V154_EXPECTS_2873_CARDS');
 const byId=new Map(cards.map(c=>[c.master_record_id,c]));
 if(byId.size!==cards.length)throw Error('V154_DUPLICATE_MASTER_ID');
 const response=await fetchImpl(URL,{cache:'no-store'});
 if(!response.ok)throw Error('V154_SOURCE_HTTP_'+response.status);
 const raw=await response.text();
 if(await gitBlob(raw)!==BLOB)throw Error('V154_SOURCE_BLOB_DRIFT');
 const data=JSON.parse(raw);
 if(data.version!=='V154'||data.type!=='SCENE1341_LOCAL_DOWNLOADED_KAIKKI_IPA_TEST_OVERLAY'||
  data.source_full_sha256!==ARCHIVE_SHA||!Array.isArray(data.records)||data.records.length!==91)
  throw Error('V154_MANIFEST_INVALID');
 const ids=new Set(),rows=new Set(),updates=new Map();
 let retainedSelected=0,variantBlocked=0,newlySelected=0;
 for(const rec of data.records){
  const old=byId.get(rec.record_id),q=old?.question;
  if(!old||!q||!['SC50-0011','SC50-0012','SC50-0013','SC50-0014'].includes(rec.scene_id)||
     old.scene_id!==rec.scene_id||old.master_final_row!==rec.source_final_row||
     old.expression!==rec.expression||q.expression!==rec.expression||
     ids.has(rec.record_id)||rows.has(rec.source_final_row)||
     rec.canonical_sense_id!==null||rec.release_allowed!==false||
     rec.kaikki_compressed_sha256!==ARCHIVE_SHA||
     rec.ipa_status!=='FULL_LOCAL_KAIKKI_SINGLE_PHONEMIC_TEST_ONLY'||
     !/^\/[^/]+\/$/.test(rec.ipa)||
     !Array.isArray(rec.candidate_entry_lines)||!rec.candidate_entry_lines.length||
     !rec.candidate_entry_lines.every(x=>Number.isSafeInteger(x)&&x>0)||
     old.production_release_allowed!==false)
   throw Error('V154_IDENTITY_OR_PROVENANCE_INVALID_'+(rec.source_final_row||'?'));
  ids.add(rec.record_id);rows.add(rec.source_final_row);
  // Never replace prior source-backed IPA or auto-adjudicate existing variant evidence.
  if(q.ipa!==null){retainedSelected++;continue;}
  if(q.ipa_candidates_pending===true){variantBlocked++;continue;}
  if(q.ipa_status!=='MISSING_VERIFIED_KAIKKI_IPA')
   throw Error('V154_UNEXPECTED_MISSING_STATUS_'+rec.source_final_row);
  updates.set(rec.record_id,{ipa:rec.ipa,
   ipa_status:'FULL_LOCAL_KAIKKI_SINGLE_PHONEMIC_TEST_ONLY',
   ipa_provisional:true,
   ipa_candidates_pending:false,
   ipa_source:{source_type:'CGMASTER_LOCAL_KAIKKI_ARCHIVE_TEST',
    original_kaikki_compressed_sha256:ARCHIVE_SHA,
    candidate_entry_lines:[...rec.candidate_entry_lines],
    sense_match_approved:false,qa_approved:false}});
  newlySelected++;
 }
 if(ids.size!==91||retainedSelected+variantBlocked+newlySelected!==91)
  throw Error('V154_COVERAGE_INVALID');
 const items=cards.map(c=>updates.has(c.master_record_id)?
  {...c,question:{...c.question,...updates.get(c.master_record_id)}}:c);
 return Object.freeze({items:Object.freeze(items),sourceCandidates:91,newlySelected,
   retainedSelected,variantBlocked,formalCertification:false,productionRelease:false,canWriteSrs:false,
   sourceGitBlob:BLOB});
}
