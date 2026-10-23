import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCore20KPack,inspectCore20KRelease} from '../scripts/core20k-versioned-pack-gate.mjs';
const manifest={schema_version:'pai-core20k-teaching-pack-v1',pack_version:'qa-v1',
 source_commit_sha:'a'.repeat(40),frozen_membership_version:'Core20K-V2.0.6',record_count:1,release_eligible:true,production_ready_ku_count:1};
const verified={headword_id:'w1',headword:'example',rank:1,sense_id:'s1',
 ku_id:'k1',ku_type:'Sense',pos:'n',gloss_zh:'例子',gloss_en:'an instance',
 us_ipa:'/ɪɡˈzæmpəl/',quality_status:'PRODUCTION_READY',
 evidence_status:'PRODUCTION_READY',source_attribution:['independent review']};
const pack=records=>({schema_version:manifest.schema_version,pack_version:manifest.pack_version,
 frozen_membership_version:manifest.frozen_membership_version,records});
test('only certified, noncolliding entries are eligible',()=>{
 assert.equal(validateCore20KPack(manifest,pack([verified])).eligible.length,1);
 assert.throws(()=>validateCore20KPack(manifest,pack([{...verified,quality_status:'EDITORIAL_UNVERIFIED'}])),/NOT_RELEASE_ELIGIBLE|CONTAINS_BLOCKED_KU/);
 assert.throws(()=>validateCore20KPack(manifest,pack([verified]),{existingKUIds:new Set(['k1'])}),/NOT_RELEASE_ELIGIBLE/);
});
test('identity and manifest mismatch fail closed',()=>{
 assert.throws(()=>validateCore20KPack(manifest,pack([verified,verified])),/COUNT_MISMATCH|DUPLICATE_KU/);
 assert.throws(()=>validateCore20KPack({...manifest,pack_version:'different'},pack([verified])),/VERSION_MISMATCH/);
 assert.throws(()=>validateCore20KPack(manifest,pack([{...verified,ku_id:null}])),/ROW_IDENTITY/);
});
test('no release remains on stable runtime',async()=>{
 const r=await inspectCore20KRelease();
 assert.equal(r.mode,'stable_runtime');
});

test('empty staging pack is never releasable',()=>{
 const empty={...manifest,record_count:0,production_ready_ku_count:0,release_eligible:false};
 assert.throws(()=>validateCore20KPack(empty,pack([])),/NOT_RELEASE_ELIGIBLE/);
 assert.throws(()=>validateCore20KPack({...empty,release_eligible:true},pack([])),/NOT_RELEASE_ELIGIBLE/);
});
