import assert from 'node:assert/strict';
import {B218_ACCEPTED,B218_RUNTIME_SHA,B218_PACK_SHA,scoreB218Context,validateB218Binding} from './core20k-b218-contextual-grading.mjs';
let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS',name)};
for(const [ku_id,answers] of Object.entries(B218_ACCEPTED)){
 for(const answer of answers)check('accept '+ku_id+' '+answer,()=>assert.equal(scoreB218Context({ku_id,context_ku_id:ku_id,answer}).correct,true));
}
for(const [ku_id,answer] of [
 ['w_0049_time_ku01','时刻'],['w_0049_time_ku01','次数'],['w_0049_time_ku01','需要更多时间'],
 ['w_0041_know_ku01','认识'],['w_0057_people_ku01','民族'],['w_0099_here_ku01','此时'],
 ['w_0266_person_ku01','人；个人'],['w_0139_talk_ku01','谈判']
])check('reject '+ku_id+' '+answer,()=>assert.equal(scoreB218Context({ku_id,context_ku_id:ku_id,answer}).correct,false));
check('cross-context fail closed',()=>assert.equal(scoreB218Context({ku_id:'w_0049_time_ku01',context_ku_id:'w_0041_know_ku01',answer:'时间'}).graded,false));
check('production path fail closed',()=>assert.equal(scoreB218Context({ku_id:'w_0049_time_ku01',context_ku_id:'w_0049_time_ku01',answer:'时间',mode:'PRODUCTION_READY'}).graded,false));
check('unknown KU fail closed',()=>assert.equal(scoreB218Context({ku_id:'missing',context_ku_id:'missing',answer:'时间'}).graded,false));
check('empty answer rejected',()=>assert.equal(scoreB218Context({ku_id:'w_0049_time_ku01',context_ku_id:'w_0049_time_ku01',answer:' '}).correct,false));
const ids=Object.keys(B218_ACCEPTED);
const registered={schema:'pai-core20k-b217-registered-crosswalk-v1',registration_status_overall:'APPROVED_BINDING_REGISTRATION_ONLY',registered_count:6,records:ids.map((ku_id,i)=>({ku_id,anchor_ku_id:ku_id,binding_kind:'KU_ANCHORED_SENSE',official_sense_id:null,registration_status:'APPROVED',release_eligible:false,production_ready:false,lemma:'word'+i,rank:i+1,pos:'n.',runtime_gloss_zh:'gloss'+i}))};
const review={schema:'pai-core20k-b218-teaching-review-v1',certification_status:'CONDITIONAL_PASS_PENDING_GRADING_IMPLEMENTATION_AND_SOURCE_ATTESTATION',records:ids.map(ku_id=>({ku_id,semantic_review:'PASS',example_translation_review:'PASS',answer_policy:B218_ACCEPTED[ku_id]}))};
const runtimeByKU=new Map(registered.records.map(r=>[r.ku_id,{w:{w:r.lemma,rank:r.rank,pos:r.pos},s:{ku_id:r.ku_id,kuType:'sense',m:r.runtime_gloss_zh,e:[]}}]));
const run=(x={})=>validateB218Binding({registered,review,verifiedRuntimeSha:B218_RUNTIME_SHA,verifiedPackSha:B218_PACK_SHA,runtimeByKU,...x});
check('synthetic six binding valid',()=>assert.equal(run().valid,true));
check('runtime hash mismatch',()=>assert.equal(run({verifiedRuntimeSha:'bad'}).valid,false));
check('pack hash mismatch',()=>assert.equal(run({verifiedPackSha:'bad'}).valid,false));
check('gloss drift',()=>{const copy=new Map(runtimeByKU);const u=copy.get(ids[0]);copy.set(ids[0],{...u,s:{...u.s,m:'drift'}});assert.equal(run({runtimeByKU:copy}).valid,false)});
check('KU anchor mismatch',()=>assert.equal(run({registered:{...registered,records:registered.records.map((r,i)=>i? r:{...r,anchor_ku_id:'wrong'}}}).valid,false));
check('release flag violation',()=>assert.equal(run({registered:{...registered,records:registered.records.map((r,i)=>i? r:{...r,production_ready:true}}}).valid,false));
check('policy drift',()=>assert.equal(run({review:{...review,records:review.records.map((r,i)=>i? r:{...r,answer_policy:['时间']})}}).valid,false));
check('runtime unchanged',()=>assert.deepEqual(runtimeByKU.get(ids[0]).s.e,[]));
console.log('B218 contextual grading and binding:',passed+'/'+passed,'PASS');
