// Batch76: independent fail-closed certification gate, supporting all six KU types.
// The candidate is never promoted by source links or pre-existing status strings alone.
export const CERT_SCHEMA='pai-core20k-certification-gate-v1';
export function assessCertification(record,attestation={}){
 const tests={
  frozen_identity:Number.isInteger(record?.rank)&&record.rank>0&&record.rank<=20000&&record.headword_id==='core20k:rank:'+record.rank,
  legacy_identity_verified:!!attestation.legacy_identity_verified,
  sense_identity_verified:!!record?.sense_id&&!!attestation.sense_identity_verified,
  independent_bilingual_verified:!!attestation.independent_bilingual_verified,
  pos_specific_us_ipa_verified:!!attestation.pos_specific_us_ipa_verified,
  teaching_objective_verified:!!attestation.teaching_objective_verified,
  answer_uniqueness_verified:!!attestation.answer_uniqueness_verified,
  type_specific_external_evidence_verified:!!attestation.type_specific_external_evidence_verified,
  independent_editorial_signoff:!!attestation.independent_editorial_signoff,
  runtime_e2e_verified:!!attestation.runtime_e2e_verified,
 };
 return {ku_id:record?.ku_id,production_ready:Object.values(tests).every(Boolean),
  blockers:Object.keys(tests).filter(k=>!tests[k]),tests};
}
export function gateCertifiedRecords(records,attestations={}){
 const seen=new Set(),results=[];
 for(const r of records){
  if(seen.has(r.ku_id))throw Error('DUPLICATE_KU_ID:'+r.ku_id);
  seen.add(r.ku_id);
  results.push(assessCertification(r,attestations[r.ku_id]));
 }
 return {eligible:records.filter((r,i)=>results[i].production_ready),
   rejected:results.filter(x=>!x.production_ready),results};
}
