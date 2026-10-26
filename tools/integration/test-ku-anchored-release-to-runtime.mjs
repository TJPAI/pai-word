import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createApprovedTeachingMap} from '../../scripts/approved-teaching-release-gate.mjs';
import {loadApprovedTeachingOverlay,installApprovedTeachingOverlay} from '../../scripts/core20k-approved-overlay-loader.mjs';
globalThis.crypto??=webcrypto;
const id='w_0049_time_ku01',sense='registered:time:ku';
const runtimeBytes=new TextEncoder().encode('synthetic-pinned-runtime');
const packBytes=new TextEncoder().encode('synthetic-pinned-pack');
const digest=async bytes=>Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
const runtime_sha256=await digest(runtimeBytes),pack_sha256=await digest(packBytes);
const unit={w:{w:'time',rank:111,pos:'n.'},s:{ku_id:id,kuType:'sense',e:[]}};
const base={byKU:new Map([[id,unit]])};
const record={ku_id:id,sense_binding:sense,content_certified:true,production_ready:true,gloss_zh:'时间',example_en:'Time matters.',example_zh:'时间很重要。',answer_policy:{certified:true,accepted:['时间']}};
const overlay={schema_version:'pai-core20k-approved-overlay-v1',version:'synthetic-v1',runtime_sha256,pack_sha256,records:[record]};
const manifest={schema_version:'pai-core20k-overlay-manifest-v1',version:overlay.version,status:'PRODUCTION_READY',activation_allowed:true,runtime_sha256,pack_sha256,authority:{registrar_signed:true,semantic_certified:true,license_approved:true,release_signed:true,registrar_id:'synthetic-registrar',release_id:'synthetic-release'},reviewed_crosswalk:[{ku_id:id,lemma:'time',rank:111,pos:'n.',ku_type:'sense',sense_binding:sense,registrar_approved:true}]};
const release={status:'PRODUCTION_READY',production_ready:true,activation:{allowed:true},source_rights_cleared:true,official_membership_verified:true,records:[{ku_id:id,official_sense_id:null,binding_kind:'KU_ANCHORED_SENSE',binding_ku_id:id,binding_registered:true,binding_authorized:true,activation_allowed:true}]};
const check=async(r=release,m=manifest)=>{const gate=createApprovedTeachingMap(r);const result=await loadApprovedTeachingOverlay({enabled:gate.enabled,base,runtimeBytes,packBytes,overlay,manifest:m});return {gate,result}};
{
 const {gate,result}=await check();assert.equal(gate.enabled,true);assert.equal(result.enabled,true);assert.equal(result.accepted.size,1);assert.deepEqual(unit.s.e,[]);
}
for(const patch of [{binding_registered:false},{binding_authorized:false},{binding_ku_id:'different'},{activation_allowed:false}]){
 const {gate,result}=await check({...release,records:[{...release.records[0],...patch}]});
 assert.equal(gate.enabled,false);assert.equal(result.enabled,false);
}
for(const patch of [{status:'STAGING_ONLY'},{source_rights_cleared:false},{activation:{allowed:false}}]){
 const {gate,result}=await check({...release,...patch});assert.equal(gate.enabled,false);assert.equal(result.enabled,false);
}
{
 const {gate,result}=await check(release,{...manifest,authority:{...manifest.authority,release_signed:false}});
 assert.equal(gate.enabled,true);assert.equal(result.enabled,false,'generic approval cannot override runtime manifest rejection');
 const scope={};installApprovedTeachingOverlay((await check()).result,scope);assert.equal(scope.PAI_APPROVED_TEACHING_OVERLAY.enabled,true);
 installApprovedTeachingOverlay(result,scope);assert.equal(scope.PAI_APPROVED_TEACHING_OVERLAY.accepted.size,0);
}
console.log('PASS synthetic KU anchored identity joins both release gates; staging, unsigned, and stale map remain blocked');
