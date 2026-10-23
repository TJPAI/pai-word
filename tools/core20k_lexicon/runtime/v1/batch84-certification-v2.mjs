// L2 Content Certified is per-KU; L3 Production Ready is pack-level.
// Review receipts require identity, evidence, reviewer, date and scoped approval.
export const CERT_SCHEMA='pai-core20k-content-certification-v2';
const gates=['frozen_identity','sense_alignment','bilingual_semantics','pos_specific_us_ipa','teaching_objective','answer_quality','type_specific_source','editorial_signoff'];
export function assessL2(row,receipts={}){
 const blockers=[];
 if(!row?.ku_id||!row?.sense_id||!Number.isInteger(row?.rank)||row.rank<1||row.rank>20000||row.headword_id!=='core20k:rank:'+row.rank)blockers.push('IDENTITY');
 for(const gate of gates){const a=receipts[gate];if(!a||a.ku_id!==row.ku_id||a.result!=='PASS'||!a.evidence_ref||!a.reviewer||!a.reviewed_at||!a.scope)blockers.push('RECEIPT_'+gate);}
 for(const f of ['teaching_objective','prompt','correct_answer','explanation_zh','example_en','example_zh','gloss_en','gloss_zh','us_ipa'])if(!row?.[f]?.trim())blockers.push('FIELD_'+f);
 return {ku_id:row?.ku_id,status:blockers.length?'L1_REVIEW_REQUIRED':'L2_CONTENT_CERTIFIED',blockers};
}
export function buildL2(rows,receiptsByKU={}){
 const ids=new Set(),certified=[],blocked=[];
 for(const r of rows){if(ids.has(r.ku_id))throw Error('DUPLICATE_KU_ID');ids.add(r.ku_id);const result=assessL2(r,receiptsByKU[r.ku_id]);(result.blockers.length?blocked:certified).push({...r,certification:result});}
 return {certified,blocked};
}
export function assessL3(pack,qa={}){
 const reasons=[];if(!pack||!Array.isArray(pack.records)||!pack.records.length)reasons.push('EMPTY_PACK');
 if(pack?.records?.some(r=>r.certification?.status!=='L2_CONTENT_CERTIFIED'))reasons.push('UNCERTIFIED_KU');
 for(const f of ['byte_sha256','schema_validation','identity_crosswalk','srs_compatibility','scene_mapping','runtime_e2e'])if(qa[f]?.result!=='PASS'||!qa[f]?.evidence_ref)reasons.push('PACK_QA_'+f);
 return {release_eligible:reasons.length===0,reasons};
}