// Producer-side additive multi-KU contract validator.
// Does not grant Production Ready; only validates already signed-off content.
// Existing consumer still admits Sense only: coordinate six-type playback before release.
export const SIX_KU_TYPES = Object.freeze(['Sense','Grammar','Collocation','Contrast','Pronunciation','Usage/Risk']);
const base = new Set(SIX_KU_TYPES);
export function validateMultiKURecord(r,{eligibleForPlayback=false}={}){
 const err=[];
 for(const k of ['headword_id','headword','rank','sense_id','ku_id','ku_type','teaching_objective','prompt','correct_answer','explanation_zh','example_en','example_zh','difficulty','quality_status','evidence_status','source_attribution']){
  if(r?.[k]===undefined||r[k]===null||r[k]==='')err.push('MISSING_'+k.toUpperCase());
 }
 if(!base.has(r?.ku_type))err.push('UNKNOWN_KU_TYPE');
 if(!Number.isInteger(r?.rank)||r.rank<1||r.rank>20000)err.push('INVALID_RANK');
 if(!Array.isArray(r?.related_ku_ids))err.push('RELATED_KU_IDS_NOT_ARRAY');
 if(!Array.isArray(r?.source_attribution)||!r.source_attribution.length)err.push('MISSING_SOURCE_ATTRIBUTION');
 if(r?.quality_status!=='PRODUCTION_READY'||r?.evidence_status!=='PRODUCTION_READY')err.push('NOT_CERTIFIED');
 if(!r?.gloss_en?.trim()||!r?.gloss_zh?.trim()||!r?.us_ipa?.trim())err.push('V1_COMPATIBILITY_FIELDS');
 if(r?.ku_type==='Collocation'&&(!r.collocation?.expression||!r.collocation?.usage_context))err.push('COLLOCATION_DETAILS');
 if(r?.ku_type==='Grammar'&&(!r.grammar?.pattern||!r.grammar?.usage_conditions))err.push('GRAMMAR_DETAILS');
 if(r?.ku_type==='Contrast'&&(!r.contrast?.target||!r.contrast?.comparison||!r.contrast?.distinguishing_rule))err.push('CONTRAST_DETAILS');
 if(r?.ku_type==='Pronunciation'&&(!r.pronunciation?.test_target||!r.pronunciation?.ipa_us))err.push('PRONUNCIATION_DETAILS');
 if(r?.ku_type==='Usage/Risk'&&(!r.usage_risk?.incorrect_form||!r.usage_risk?.correct_form))err.push('USAGE_RISK_DETAILS');
 if(eligibleForPlayback && r?.ku_type!=='Sense')err.push('CONSUMER_CURRENTLY_SENSE_ONLY');
 return {valid:err.length===0,errors:err};
}
export function auditMultiKUPack(records,opts={}){
 const seen=new Set(),out=[];
 for(const r of records){
  const v=validateMultiKURecord(r,opts);
  if(seen.has(r?.ku_id))v.errors.push('DUPLICATE_KU_ID');
  seen.add(r?.ku_id);
  out.push({ku_id:r?.ku_id,valid:v.errors.length===0,errors:v.errors});
 }
 return {records:out,valid_count:out.filter(x=>x.valid).length,blocked_count:out.filter(x=>!x.valid).length};
}
