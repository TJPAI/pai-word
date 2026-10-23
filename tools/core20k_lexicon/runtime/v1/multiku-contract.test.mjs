import assert from 'node:assert/strict';
import {auditMultiKUPack,validateMultiKURecord,SIX_KU_TYPES} from './multiku-contract.mjs';
assert.equal(SIX_KU_TYPES.length,6);
for(const ku_type of SIX_KU_TYPES){
 const x=validateMultiKURecord({ku_type,quality_status:'EDITORIAL_UNVERIFIED',evidence_status:'REVIEW_REQUIRED'});
 assert.equal(x.valid,false);
 assert(x.errors.includes('NOT_CERTIFIED'));
}
const sample={headword_id:'word:demo',headword:'demo',rank:1,sense_id:'sense:demo',ku_id:'ku:demo',ku_type:'Grammar',teaching_objective:'Identify form',prompt:'Pick form',correct_answer:'a',explanation_zh:'示例',example_en:'An example.',example_zh:'例子',difficulty:1,quality_status:'PRODUCTION_READY',evidence_status:'PRODUCTION_READY',source_attribution:['test-only'],gloss_en:'demo',gloss_zh:'示例',us_ipa:'/x/',related_ku_ids:[],grammar:{pattern:'a',usage_conditions:'b'}};
assert.equal(validateMultiKURecord(sample).valid,true);
assert(validateMultiKURecord(sample,{eligibleForPlayback:true}).errors.includes('CONSUMER_CURRENTLY_SENSE_ONLY'));
assert.equal(auditMultiKUPack([sample,sample]).valid_count,1);
assert(auditMultiKUPack([sample,sample]).records[1].errors.includes('DUPLICATE_KU_ID'));
console.log('PASS 10/10 logical checks; TEST-ONLY dummy input never published');
