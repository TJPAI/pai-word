import assert from 'node:assert/strict';
import {createApprovedTeachingMap} from '../../scripts/approved-teaching-release-gate.mjs';
const valid={status:'PRODUCTION_READY',production_ready:true,source_rights_cleared:true,official_membership_verified:true,activation:{allowed:true},records:[{ku_id:'approved-ku',official_sense_id:'official-sense',activation_allowed:true}]};
const check=(patch)=>createApprovedTeachingMap({...valid,...patch});
assert.equal(check({}).enabled,true);
for(const patch of [
 {status:'CHATGPT_ONLY_PROVISIONAL'},
 {status:'EDITORIAL_STAGING_UNCERTIFIED'},
 {production_ready:false},
 {source_rights_cleared:false},
 {official_membership_verified:false},
 {activation:{allowed:false}},
 {records:[]},
 {records:[{ku_id:'approved-ku',official_sense_id:null,activation_allowed:true}]},
 {records:[{ku_id:'approved-ku',official_sense_id:'official-sense',activation_allowed:false}]},
 {records:[valid.records[0],valid.records[0]]}
]){
 const result=check(patch);
 assert.equal(result.enabled,false,JSON.stringify(patch));
 assert.equal(result.accepted.size,0,'never partly activate rejected release');
}
const anchor={ku_id:'approved-ku',official_sense_id:null,binding_kind:'KU_ANCHORED_SENSE',binding_ku_id:'approved-ku',binding_registered:true,binding_authorized:true,activation_allowed:true};
assert.equal(check({records:[anchor]}).enabled,true);
for(const patch of [{binding_registered:false},{binding_authorized:false},{binding_ku_id:'wrong'},{activation_allowed:false}])assert.equal(check({records:[{...anchor,...patch}]}).enabled,false);
assert.equal(check({records:[anchor],status:'STAGING_ONLY'}).enabled,false);
assert.equal(check({records:[anchor],source_rights_cleared:false}).enabled,false);
console.log('PASS staged teaching cannot bypass identity, rights, membership and activation gate');
