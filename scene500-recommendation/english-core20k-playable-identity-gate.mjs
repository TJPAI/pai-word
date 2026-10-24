// Read-only English Core20K publication identity gate for Scene500 host integration.
// NOT a recommender and NOT a substitute for independent semantic certification.
export function validatePlayableKuIdentity(records,{headwords,senses,kus}={}){
 const errors=[],eligible=[],seen=new Set();
 if(!Array.isArray(records)||!(headwords instanceof Map)||!(senses instanceof Map)||!(kus instanceof Map))
  return {ok:false,errors:[{code:'INVALID_INPUT_OR_REGISTRY'}],eligible:[],total:0};
 for(const [index,r] of records.entries()){
  const issues=[];
  if(!r||typeof r!=='object'||Array.isArray(r)){errors.push({index,code:'INVALID_RECORD'});continue;}
  const h=headwords.get(r.headword_id),s=senses.get(r.sense_id),k=kus.get(r.ku_id);
  if(!h)issues.push('UNKNOWN_HEADWORD');
  if(!s)issues.push('UNKNOWN_SENSE');
  if(!k)issues.push('UNKNOWN_KU');
  if(s&&s.headword_id!==r.headword_id)issues.push('SENSE_HEADWORD_MISMATCH');
  if(k&&k.sense_id!==r.sense_id)issues.push('KU_SENSE_MISMATCH');
  if(k&&k.headword_id!=null&&k.headword_id!==r.headword_id)issues.push('KU_HEADWORD_MISMATCH');
  if(seen.has(r.ku_id))issues.push('DUPLICATE_KU');
  seen.add(r.ku_id);
  // Fail closed. Certification must be authoritative production metadata,
  // never a claim copied from an untrusted staging candidate.
  if(k?.independent_semantic_certification!=='PASS')issues.push('NOT_INDEPENDENTLY_CERTIFIED');
  if(k?.release_eligible!==true||k?.production_status!=='PRODUCTION_READY')issues.push('NOT_PRODUCTION_ELIGIBLE');
  if(r.staging===true||r.test_only===true)issues.push('STAGING_OR_TEST_ONLY');
  if(issues.length)for(const code of issues)errors.push({index,ku_id:r.ku_id,code});
  else eligible.push(r);
 }
 return {ok:errors.length===0,errors,eligible,total:records.length};
}
