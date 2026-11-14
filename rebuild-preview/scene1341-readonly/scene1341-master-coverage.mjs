/* Scene1341 read-only Master completeness, never a publication or SRS gate.
 * Counts are derived from loaded source-pinned question pages, not a static
 * assumption that an authored answer implies a completed learning card.
 */
const DIRECT='VERIFIED_NATIVE_KAIKKI_EXACT_ENTRY_TEST_ONLY';
const SINGLE='NATIVE_KAIKKI_SINGLE_PHONEMIC_VARIANT_PROVISIONAL';
const WEB='KAIKKI_POSTPROCESSED_PAGE_VERIFIED_TEST_ONLY';
const ARCHIVED='ARCHIVED_KAIKKI_SINGLE_PHONEMIC_TEST_ONLY';
const LOCAL='FULL_LOCAL_KAIKKI_SINGLE_PHONEMIC_TEST_ONLY';
export function measureScene1341MasterCoverage(items){
 if(!Array.isArray(items))throw Error('MASTER_COVERAGE_RECORDS_REQUIRED');
 const ids=new Set(),sourceRows=new Set(),byScene=new Map();
 const summary={authorDrafts:0,sceneCount:0,sourceVerifiedTestIpa:0,nativeSingleProvisional:0,
   webPageProvisional:0,archivedKaikkiProvisional:0,localArchiveProvisional:0,selectedTestIpa:0,missingSelectedIpa:0,unselectedVariants:0,
   formallyCertified:0,formallyReady:0};
 for(const card of items){
  const q=card?.question,scene=card?.scene_id,id=card?.master_record_id,row=card?.master_final_row;
  if(!/^SC50-\d{4}$/.test(scene)||!/^SC1341-FINAL-SRC-[a-f0-9]{32}$/.test(id)||
     !Number.isSafeInteger(row)||ids.has(id)||sourceRows.has(row)||
     card.production_release_allowed!==false||!q||!card.answer?.meaning_zh||
     q.expression!==card.expression||q.cue_zh!==card.answer.meaning_zh)
   throw Error('MASTER_COVERAGE_ID_OR_UNCERTIFIED_SOURCE_CONFLICT');
  ids.add(id);sourceRows.add(row);
  if(!byScene.has(scene))byScene.set(scene,{scene_id:scene,authorDrafts:0,
    sourceVerifiedTestIpa:0,nativeSingleProvisional:0,webPageProvisional:0,archivedKaikkiProvisional:0,localArchiveProvisional:0,
    selectedTestIpa:0,missingSelectedIpa:0,unselectedVariants:0,
    formallyCertified:0,formallyReady:0});
  const perScene=byScene.get(scene);
  for(const counter of [summary,perScene])counter.authorDrafts++;
  const ipa=q.ipa,status=q.ipa_status;
  let bucket=null;
  if(status===DIRECT&&typeof ipa==='string'&&
     q.ipa_source?.url?.startsWith('https://kaikki.org/dictionary/English/')&&
     q.ipa_source?.headword===card.expression&&!q.ipa_provisional)
    bucket='sourceVerifiedTestIpa';
  else if(status===SINGLE&&typeof ipa==='string'&&q.ipa_provisional===true&&
          q.ipa_source?.source_sha256)
    bucket='nativeSingleProvisional';
  else if(status===WEB&&typeof ipa==='string'&&q.ipa_provisional===true&&
          q.ipa_source?.source_type==='KAIKKI_POSTPROCESSED_DICTIONARY_WEB_PAGE'&&
          q.ipa_source?.native_raw_jsonl_sha256===null&&
          q.ipa_source?.formal_sense_alignment===false&&
          q.ipa_source?.author_review_required===true)
    bucket='webPageProvisional';
  else if(status===ARCHIVED&&typeof ipa==='string'&&q.ipa_provisional===true&&
          q.ipa_source?.archive_git_blob==='3fe3513bc4c313c3ae22282c6cf1fd4caee6ccd9'&&
          q.ipa_source?.ipa_candidates?.length===1&&
          q.ipa_source?.ipa_candidates[0]===ipa&&
          q.ipa_source?.sense_match_approved===false&&
          q.ipa_source?.qa_approved===false)
    bucket='archivedKaikkiProvisional';
  else if(status===LOCAL&&typeof ipa==='string'&&q.ipa_provisional===true&&
          q.ipa_source?.source_type==='CGMASTER_LOCAL_KAIKKI_ARCHIVE_TEST'&&
          q.ipa_source?.original_kaikki_compressed_sha256==='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99'&&
          Array.isArray(q.ipa_source?.candidate_entry_lines)&&q.ipa_source.candidate_entry_lines.length>0&&
          q.ipa_source.sense_match_approved===false&&q.ipa_source.qa_approved===false)
    bucket='localArchiveProvisional';
  else if(ipa!==null)
    throw Error('MASTER_COVERAGE_UNAPPROVED_IPA_STATUS');
  else if(status!=='MISSING_VERIFIED_KAIKKI_IPA')
    throw Error('MASTER_COVERAGE_NULL_IPA_STATUS_DRIFT');
  for(const counter of [summary,perScene]){
   if(bucket){counter[bucket]++;counter.selectedTestIpa++;}
   else counter.missingSelectedIpa++;
   if(q.ipa_candidates_pending===true)counter.unselectedVariants++;
  }
  if(q.ipa_candidates_pending===true&&ipa!==null)
   throw Error('MASTER_COVERAGE_AUTO_SELECTED_VARIANT');
 }
 summary.sceneCount=byScene.size;
 if(summary.authorDrafts!==summary.selectedTestIpa+summary.missingSelectedIpa)
  throw Error('MASTER_COVERAGE_TOTAL_MISMATCH');
 return Object.freeze({...summary,byScene:Object.freeze([...byScene.values()]
   .sort((a,b)=>a.scene_id.localeCompare(b.scene_id))
   .map(x=>Object.freeze(x)))});
}
