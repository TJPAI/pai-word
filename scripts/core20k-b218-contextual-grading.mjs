// B218: contextual answer policy for six non-release teaching KUs.
// This function is only for an isolated typed-answer exercise; never writes SRS.
export const B218_STATUS='CONDITIONAL_PASS_STAGING_ONLY';
export const B218_RUNTIME_SHA='e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b';
export const B218_PACK_SHA='21d831519abdda34fadef88a601655373750ddf3385ea98d27370cfe2b1eec15';
export const B218_ACCEPTED=Object.freeze({
 'w_0266_person_ku01':['一个人','人','个人'],
 'w_0049_time_ku01':['时间','时长','一段时间'],
 'w_0041_know_ku01':['知道','了解'],
 'w_0057_people_ku01':['人们','许多人','人'],
 'w_0139_talk_ku01':['交谈','说话'],
 'w_0099_here_ku01':['这里','到这里','在这里']
});
export const normalizeB218Answer=value=>String(value??'').normalize('NFKC').replace(/[\s\u3000，。！？；：、,.!?;:（）()\[\]「」『』]/g,'').trim();
export function scoreB218Context({ku_id,answer,context_ku_id,mode='STAGING_ONLY'}={}){
 if(mode!=='STAGING_ONLY'||!B218_ACCEPTED[ku_id]||ku_id!==context_ku_id)return {graded:false,correct:false,reason:'context_or_mode_mismatch'};
 const normalized=normalizeB218Answer(answer);
 const correct=normalized.length>0&&B218_ACCEPTED[ku_id].some(x=>normalizeB218Answer(x)===normalized);
 return {graded:true,correct,reason:correct?'accepted':'not_in_context_allowlist'};
}
export function validateB218Binding({registered,review,verifiedRuntimeSha,verifiedPackSha,runtimeByKU}={}){
 const deny=reason=>({valid:false,reason});
 if(verifiedRuntimeSha!==B218_RUNTIME_SHA||verifiedPackSha!==B218_PACK_SHA)return deny('sha_mismatch');
 if(registered?.schema!=='pai-core20k-b217-registered-crosswalk-v1'||registered.registration_status_overall!=='APPROVED_BINDING_REGISTRATION_ONLY'||registered.registered_count!==6)return deny('registration_missing');
 if(review?.schema!=='pai-core20k-b218-teaching-review-v1'||review.certification_status!=='CONDITIONAL_PASS_PENDING_GRADING_IMPLEMENTATION_AND_SOURCE_ATTESTATION')return deny('review_missing');
 if(!Array.isArray(registered.records)||registered.records.length!==6||!Array.isArray(review.records)||review.records.length!==6||!(runtimeByKU instanceof Map))return deny('records_missing');
 const seen=new Set();
 for(const row of registered.records){
  const id=row.ku_id,unit=runtimeByKU.get(id),audit=review.records.find(x=>x.ku_id===id);
  if(!B218_ACCEPTED[id]||seen.has(id)||row.binding_kind!=='KU_ANCHORED_SENSE'||row.anchor_ku_id!==id||row.official_sense_id!==null||row.registration_status!=='APPROVED'||row.release_eligible!==false||row.production_ready!==false)return deny('identity_or_release_boundary');
  if(!unit||unit.w?.w!==row.lemma||unit.w?.rank!==row.rank||String(unit.w?.pos).trim()!==row.pos||unit.s?.kuType!=='sense'||unit.s?.ku_id!==id||unit.s?.m!==row.runtime_gloss_zh)return deny('runtime_identity_or_gloss_drift');
  if(!audit||audit.semantic_review!=='PASS'||audit.example_translation_review!=='PASS'||JSON.stringify(audit.answer_policy)!==JSON.stringify(B218_ACCEPTED[id]))return deny('review_or_policy_drift');
  seen.add(id);
 }
 return {valid:true,reason:'B218_STAGING_BINDING_VERIFIED',ku_ids:[...seen]};
}
