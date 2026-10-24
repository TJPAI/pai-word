// B184 standalone, read-only recognition fixture contract v1.
// This module deliberately has no SRS, storage, Core20K, or application imports.
export const SCHEMA='pai-core20k-b184-recognition-preview-v1';
export const CASE_POLICY='NOT_APPLICABLE_SELF_RATING';
export function validatePack(pack){
 const errors=[];
 if(pack?.schema_version!==SCHEMA||pack?.test_only!==true||pack?.release_eligible!==false||
    pack?.srs_write_allowed!==false||!Array.isArray(pack.records))throw Error('UNSAFE_PACK');
 const ids=new Set();
 const records=pack.records.map((r,i)=>{
   const fail=m=>errors.push(i+':'+m);
   if(!r||r.render_kind!=='structure_recognition'||r.ku_type!=='collocation')fail('KIND');
   if(!r?.provisional_candidate_id||ids.has(r.provisional_candidate_id))fail('IDENTITY');
   ids.add(r?.provisional_candidate_id);
   if(r.ku_id!==null||r.sense_id!==null||r.identity_status!=='UNREGISTERED_PROVISIONAL')fail('PROVISIONAL_IDENTITY');
   if(r.test_only!==true||r.playable!==false||r.release_eligible!==false||
      r.srs_write_allowed!==false||r.runtime_status!=='STAGING_ONLY'||
      r.semantic_certification!=='PENDING_INDEPENDENT_REVIEW')fail('ISOLATION');
   if(typeof r.question?.text!=='string'||!r.question.text.trim()||
      r.question.choice_count!==4||r.question.choice_display_order!=='SHUFFLE_ON_RENDER_REQUIRED'||
      !Array.isArray(r.question.choices)||r.question.choices.length!==4||
      r.question.choices.some(x=>typeof x!=='string'||!x.trim())||
      new Set(r.question.choices.map(x=>x.trim())).size!==4)fail('CHOICES');
   const answer=r.response?.canonical_answer;
   if(typeof answer!=='string'||r.question?.choices.filter(c=>c===answer).length!==1)fail('ANSWER_UNIQUE');
   if(r.response?.scoring_mode!==CASE_POLICY||r.question?.context_visibility!=='AFTER_ANSWER_ONLY'||
      !r.question?.context_en_after_answer?.trim()||!r.question?.context_zh_after_answer?.trim())fail('ANSWER_VISIBILITY');
   if(r.question?.text?.toLowerCase().includes(String(answer||'').toLowerCase()))fail('QUESTION_LEAK');
   return r;
 });
 if(errors.length)throw Error('B184_INVALID:'+errors.join('|'));
 return Object.freeze({schema_version:SCHEMA,records,test_only:true,release_eligible:false,srs_write_allowed:false});
}
export function fromJsonl(text){
 const rows=String(text).trim().split(/\r?\n/).map(line=>JSON.parse(line));
 return validatePack({schema_version:SCHEMA,test_only:true,release_eligible:false,srs_write_allowed:false,records:rows});
}
export function shuffledChoices(choices,random=Math.random){
 const arr=choices.map((value,index)=>({value,index}));
 // Fisher–Yates; original candidate array is not mutated.
 for(let i=arr.length-1;i>0;i--){const n=random();const j=Math.max(0,Math.min(i,Math.floor(n*(i+1))));[arr[i],arr[j]]=[arr[j],arr[i]]}
 return arr.map(x=>x.value);
}
export function publicQuestion(r,random=Math.random){
 return {id:r.provisional_candidate_id,prompt:r.question.text,choices:shuffledChoices(r.question.choices,random)};
}
export function revealAnswer(r,selected){
 return {correct:selected===r.response.canonical_answer,answer:r.response.canonical_answer,
         example_en:r.question.context_en_after_answer,example_zh:r.question.context_zh_after_answer,
         scoring_mode:CASE_POLICY,srs_write_allowed:false};
}
