/* CG-MASTER V153 immutable IPA-only TEST overlay for Scene1341.
 * This may never mutate answer pages, canonical sense IDs, or publication.
 * Archived Kaikki candidates are source evidence, NOT POS/Sense certification.
 */
const ROOT='https://raw.githubusercontent.com/TJPAI/pai-word/490541430237f24efa9dc96fa2bbc91e36919e71/tools/scene1341_master/qa_reports/';
const ARCHIVE='3fe3513bc4c313c3ae22282c6cf1fd4caee6ccd9';
const SOURCE='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986';
const V105='5b50ad4fbe1c2134552b91f5dbaa4d205a4c93185cdd5817daf92fd19922837a';
const SPECS=Object.freeze([
 {scene:'SC50-0011',file:'CGMASTER_V153_SC0011_ARCHIVED_KAIKKI_IPA_TEST_20261114.json',blob:'073ddf47e19ed97d45f733973fdc633da09abadc',count:255,first:2380,last:2634,ipa:0},
 {scene:'SC50-0012',file:'CGMASTER_V153_SC0012_ARCHIVED_KAIKKI_IPA_TEST_20261114.json',blob:'2d4fb0dda8dd26625496679fccd46685e17aa641',count:253,first:2635,last:2887,ipa:2},
 {scene:'SC50-0013',file:'CGMASTER_V153_SC0013_ARCHIVED_KAIKKI_IPA_TEST_20261114.json',blob:'2c52c4d8ff6e46549b3f27fad5789454c89ec1f9',count:245,first:2888,last:3132,ipa:5},
 {scene:'SC50-0014',file:'CGMASTER_V153_SC0014_ARCHIVED_KAIKKI_IPA_TEST_20261114.json',blob:'3678f1e1781e652b6757c48363f7eed5c78f5a8b',count:243,first:3133,last:3375,ipa:5}
].map(x=>Object.freeze(x)));
async function gitBlob(raw){
 if(!globalThis.crypto?.subtle)throw Error('MASTER_V153_HASH_UNAVAILABLE');
 const encoder=new TextEncoder(),payload=encoder.encode(raw),prefix=encoder.encode('blob '+payload.length+'\0');
 const bytes=new Uint8Array(prefix.length+payload.length);bytes.set(prefix);bytes.set(payload,prefix.length);
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function applyV153ArchivedIpaTestOverlay(baseCards,{fetchImpl=fetch}={}){
 if(!Array.isArray(baseCards)||baseCards.length!==2873)throw Error('MASTER_V153_EXPECTS_2873_BASE');
 const byId=new Map(baseCards.map(x=>[x.master_record_id,x]));
 if(byId.size!==2873)throw Error('MASTER_V153_DUPLICATE_BASE_ID');
 let newlySelected=0,retainedWeb=0,archivedUnselected=0,matched=0;
 const patches=await Promise.all(SPECS.map(async spec=>{
  const response=await fetchImpl(ROOT+spec.file,{cache:'no-store'});
  if(!response.ok)throw Error('MASTER_V153_HTTP_'+response.status);
  const raw=await response.text();
  if(await gitBlob(raw)!==spec.blob)throw Error('MASTER_V153_BLOB_DRIFT_'+spec.scene);
  const data=JSON.parse(raw);
  if(data.version!=='V153'||data.scene_id!==spec.scene||!Array.isArray(data.records)||
     data.records.length!==spec.count||data.release_allowed===true)
   throw Error('MASTER_V153_MANIFEST_DRIFT_'+spec.scene);
  let selected=0;
  const ids=new Set(),rows=new Set(),patches=[];
  for(const rec of data.records){
   const old=byId.get(rec.record_id),q=rec.question_page,e=q?.ipa_evidence;
   if(!old||old.scene_id!==spec.scene||old.master_final_row!==rec.source_final_row||
      rec.source_final_row<spec.first||rec.source_final_row>spec.last||
      ids.has(rec.record_id)||rows.has(rec.source_final_row)||rec.release_allowed!==false||
      rec.source?.original_final_master_sha256!==SOURCE||
      rec.source?.v105_staging_sha256!==V105||
      rec.source?.source_final_row!==rec.source_final_row||
      rec.cg_qa_status!=='DEFERRED'||rec.mu_qa_status!=='DEFERRED'||
      rec.canonical_sense_id!==null||
      old.expression!==q?.english_expression||old.question.cue_zh!==q.cue_zh||
      JSON.stringify(old.answer)!==JSON.stringify(rec.answer_page))
    throw Error('MASTER_V153_ANSWER_OR_IDENTITY_DRIFT_'+rec.source_final_row);
   ids.add(rec.record_id);rows.add(rec.source_final_row);matched++;
   let patch=null;
   if(q.ipa_status==='ARCHIVED_KAIKKI_SINGLE_PHONEMIC_TEST_ONLY'){
    if(old.question.ipa!==null||!/^\/[^/]+\/$/.test(q.ipa)||
       !e||e.archive_git_blob!==ARCHIVE||
       !Array.isArray(e.source_sha256)||!e.source_sha256.length||
       !e.source_sha256.every(x=>/^[a-f0-9]{64}$/.test(x))||
       !Array.isArray(e.source_lines)||!e.source_lines.length||
       !e.source_lines.every(Number.isSafeInteger)||
       e.ipa_candidates?.length!==1||e.ipa_candidates[0]!==q.ipa||
       e.sense_match_approved!==false||e.qa_approved!==false)
     throw Error('MASTER_V153_UNAPPROVED_ARCHIVE_IPA_'+rec.source_final_row);
    selected++;newlySelected++;
    patch={ipa:q.ipa,ipa_status:q.ipa_status,ipa_provisional:true,ipa_source:e,ipa_candidates_pending:false};
   }else if(q.ipa_status==='KAIKKI_POSTPROCESSED_PAGE_VERIFIED_TEST_ONLY'){
    if(old.question.ipa!==q.ipa||old.question.ipa_status!==q.ipa_status||
       old.question.ipa_source?.source_url!==e?.source_url||
       e?.native_raw_jsonl_sha256!==null)
      throw Error('MASTER_V153_WEB_IPA_CHANGED_'+rec.source_final_row);
    selected++;retainedWeb++;
   }else if(q.ipa===null&&old.question.ipa===null){
    if(q.ipa_status==='ARCHIVED_KAIKKI_VARIANTS_UNSELECTED'){
     if(q.archived_kaikki_ipa_evidence?.archive_git_blob!==ARCHIVE||
        !Array.isArray(q.archived_kaikki_ipa_evidence.ipa_candidates)||
        q.archived_kaikki_ipa_evidence.ipa_candidates.length<2||
        q.archived_kaikki_ipa_evidence.sense_match_approved!==false||
        q.archived_kaikki_ipa_evidence.qa_approved!==false)
      throw Error('MASTER_V153_UNSELECTED_VARIANT_EVIDENCE_'+rec.source_final_row);
     patch={ipa:null,ipa_status:'MISSING_VERIFIED_KAIKKI_IPA',ipa_provisional:false,ipa_source:null,ipa_candidates_pending:true};
     archivedUnselected++;
    }else if(q.ipa_status==='MULTIPLE_ATTESTED_IPA_VARIANTS_UNSELECTED'){
     if(!old.question.ipa_candidates_pending)throw Error('MASTER_V153_PREEXISTING_VARIANT_CHANGED');
    }else if(q.ipa_status!=='AWAIT_NATIVE_KAIKKI_SOURCE')
     throw Error('MASTER_V153_UNKNOWN_MISSING_IPA_'+rec.source_final_row);
   }else throw Error('MASTER_V153_UNEXPECTED_IPA_EDIT_'+rec.source_final_row);
   if(patch)patches.push({id:rec.record_id,patch});
  }
  if(ids.size!==spec.count||rows.size!==spec.count||
     Math.min(...rows)!==spec.first||Math.max(...rows)!==spec.last||selected!==spec.ipa)
    throw Error('MASTER_V153_SCENE_COUNTS_DRIFT_'+spec.scene);
  return patches;
 }));
 if(matched!==996||newlySelected!==8||retainedWeb!==4||archivedUnselected!==25)
  throw Error('MASTER_V153_OVERLAY_COUNTS_DRIFT');
 const updates=new Map(patches.flat().map(x=>[x.id,x.patch]));
 const items=baseCards.map(card=>{
  const patch=updates.get(card.master_record_id);
  if(!patch)return card;
  return {...card,question:{...card.question,...patch}};
 });
 return Object.freeze({items:Object.freeze(items),total:2873,matched,archivedSingleTestIpa:8,
  retainedWebTestIpa:4,archivedVariantsUnselected:25,
  formalCertification:false,productionRelease:false,canWriteSrs:false});
}
