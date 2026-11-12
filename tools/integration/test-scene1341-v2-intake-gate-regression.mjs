import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inspectScene1341ProvisionalRecord,inspectScene1341ProvisionalShard}
  from '../../rebuild-preview/scene1341-provisional-intake.mjs';

const pin=JSON.parse(fs.readFileSync(new URL('./scene1341-provisional-intake-pin-20261112.v2.json',import.meta.url),'utf8'));
assert.equal(pin.schema,'scene1341-provisional-intake-pin-v2');
assert.equal(pin.v1_status,'SUPERSEDED_DO_NOT_CONSUME');
assert.equal(pin.qa_manifest.records,1778);
assert.equal(pin.shards.length,7);
assert.equal(pin.shards.reduce((n,s)=>n+s.records,0),1778);
assert.equal(new Set(pin.shards.map(s=>s.path)).size,7);
assert.equal(new Set(pin.shards.map(s=>s.blob)).size,7);
assert.equal(pin.status,'QUARANTINED');
assert.equal(pin.release_approved,0);
assert.equal(pin.not_production_srs,true);
assert.equal(pin.not_public_release,true);
const base={
 scene_ku_id:'SC1341-KU-00297',scene_id:'SC50-0002',source_sense_id:'SC-SENSE-00297',
 source_rank:297,expression:'bad breath',source_pack_path:'source/verified.json',
 source_pack_blob:'a'.repeat(40),cg_qa:'PASS',muse_qa:'DEFERRED_QUOTA_20261113',
 muse_recheck_required:true,release_status:'PROVISIONAL_PENDING_MUSE',
 author_draft:true,production_release_allowed:false,source_master_authorization_verified:false,
 answer:{meaning_zh:'口臭',example_en:'I have bad breath.',example_zh:'我有口臭。',collocations:[]},
 display:{w:'bad breath',m:'口臭',e:'I have bad breath.',example_zh:'我有口臭。'}
};
const check=(record,authorization)=>inspectScene1341ProvisionalRecord(record,authorization);
assert.deepEqual(
 {accepted:check(base).accepted,stagingEligible:check(base).stagingEligible},
 {accepted:true,stagingEligible:false});
assert.equal(check({...base,scene_ku_id:'SC1341-KU-00365'}).reason,'QA_V2_DUPLICATE_KU_HOLD');
assert.equal(check({...base,cg_qa:'PENDING'}).accepted,false);
assert.equal(check({...base,muse_qa:'PASS',muse_recheck_required:true}).accepted,false);
assert.equal(check({...base,production_release_allowed:true}).accepted,false);
assert.equal(check({...base,question:'unapproved question'}).accepted,false);
assert.equal(check({...base,display:{...base.display,m:'different translation'}}).accepted,false);
const mismatchedMaster={
 status:'APPROVED_FOR_ISOLATED_STAGING',ku_id:base.scene_ku_id,
 scene_id:base.scene_id,source_sense_id:base.source_sense_id,
 source_rank:base.source_rank,source_pack_blob:'b'.repeat(40),
 master_snapshot_blob:'c'.repeat(40),approval_evidence_blob:'d'.repeat(40),display_qa_pass:true
};
assert.equal(check(base,mismatchedMaster).stagingEligible,false);
assert.equal(check(base,{...mismatchedMaster,source_pack_blob:base.source_pack_blob,display_qa_pass:false}).stagingEligible,false);
assert.throws(()=>inspectScene1341ProvisionalShard({shard:{__path:pin.shards[0].path},pin:{...pin,schema:'scene1341-provisional-intake-pin-v1'},blob:pin.shards[0].blob}),/INVALID_PIN/);
console.log(JSON.stringify({status:'PASS',sourceCount:1778,shards:7,oldVersionRejected:true,heldDuplicateRejected:true,unauthorizedStagingRejected:true,publicRelease:false,productionSrs:false}));
