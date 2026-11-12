import assert from 'node:assert/strict';
import {
  createScene1341QuarantineRegistry,createScene1341SrsStorageBoundary,
  validateScene1341SrsSnapshot,SC1341_SRS_STORAGE_KEY,SC1341_SRS_SNAPSHOT_SCHEMA
} from '../../rebuild-preview/scene1341-isolated-registry-srs.mjs';
const base={
 scene_ku_id:'SC1341-KU-00297',scene_id:'SC50-0002',source_sense_id:'SC-SENSE-00297',
 source_rank:63,expression:'bad breath',source_pack_path:'source/verified-v2.json',
 source_pack_blob:'a'.repeat(40),cg_qa:'PASS',muse_qa:'DEFERRED_QUOTA_20261113',
 muse_recheck_required:true,release_status:'PROVISIONAL_PENDING_MUSE',
 author_draft:true,production_release_allowed:false,source_master_authorization_verified:false,
 answer:{meaning_zh:'口臭',example_en:'I have bad breath.',example_zh:'我有口臭。',collocations:[]},
 display:{w:'bad breath',m:'口臭',e:'I have bad breath.',example_zh:'我有口臭。'}
};
const other={...base,scene_ku_id:'SC1341-KU-00298',source_sense_id:'SC-SENSE-00298',source_rank:64};
const auth={
 status:'APPROVED_FOR_ISOLATED_STAGING',ku_id:base.scene_ku_id,scene_id:base.scene_id,
 source_sense_id:base.source_sense_id,source_rank:base.source_rank,
 source_pack_blob:base.source_pack_blob,master_snapshot_blob:'b'.repeat(40),
 approval_evidence_blob:'c'.repeat(40),display_qa_pass:true
};
const registry=createScene1341QuarantineRegistry({
 records:[base,other],authorizations:{[base.scene_ku_id]:auth}
});
assert.equal(registry.namespace,'scene1341-v2');
assert.equal(registry.records,2);
assert.equal(registry.quarantined,2);
assert.equal(registry.item(base.scene_ku_id).stagingEligible,false);
assert.equal(registry.item(base.scene_ku_id).acceptedForQuarantine,true);
assert.equal(registry.listScene('SC50-0002').length,2);
assert.deepEqual(registry.getNativeStudyUnits(),[]);
assert.equal(registry.canCreateStudyQueue,false);
assert.equal(registry.canWriteSrs,false);
assert.equal(registry.productionReleaseAllowed,false);
assert.equal(Object.prototype.hasOwnProperty.call(registry,'byKU'),false);
assert.throws(()=>registry.createStudyQueue(),/FORMAL_RELEASE_REQUIRED/);
assert.throws(()=>createScene1341QuarantineRegistry({records:[base,base]}),/DUPLICATE_ID/);
assert.throws(()=>createScene1341QuarantineRegistry({records:[base,{...other,source_rank:63}]}),/DUPLICATE_ID/);
assert.throws(()=>createScene1341QuarantineRegistry({records:[{...base,scene_ku_id:'KU-00297'}]}),/INVALID_KU/);
const held=createScene1341QuarantineRegistry({records:[{...base,scene_ku_id:'SC1341-KU-00365'}]});
assert.equal(held.item('SC1341-KU-00365').decision,'QA_V2_DUPLICATE_KU_HOLD');
assert.equal(held.quarantined,1);

const keys=new Map(),reads=[],writes=[];
const storage={
 getItem(key){reads.push(key);return keys.get(key)??null},
 setItem(key,value){writes.push([key,value]);keys.set(key,value)},
 removeItem(key){writes.push([key,null]);keys.delete(key)}
};
const boundary=createScene1341SrsStorageBoundary({storage});
assert.equal(boundary.namespace,'scene1341-v2');
assert.equal(boundary.key,SC1341_SRS_STORAGE_KEY);
assert(SC1341_SRS_STORAGE_KEY.includes('scene1341-v2'));
assert.equal(boundary.canWriteSrs,false);
assert.equal(boundary.canRestoreForLearning,false);
assert.equal(boundary.inspect().present,false);
for(const operation of ['write','restore','clear'])
 assert.throws(()=>boundary[operation](base),/RELEASE_NOT_APPROVED/);
assert.equal(writes.length,0);
const snapshot=JSON.stringify({
 schema:SC1341_SRS_SNAPSHOT_SCHEMA,namespace:'scene1341-v2',
 items:[{kuId:base.scene_ku_id,sceneId:base.scene_id,due:1794500000000,repetitions:1,intervalDays:2}]
});
assert.equal(validateScene1341SrsSnapshot(snapshot).entries,1);
keys.set(SC1341_SRS_STORAGE_KEY,snapshot);
assert.deepEqual(boundary.inspect(),{present:true,valid:true,entries:1,restorable:false});
keys.set(SC1341_SRS_STORAGE_KEY,JSON.stringify({schema:SC1341_SRS_SNAPSHOT_SCHEMA,namespace:'scene500',items:[]}));
assert.equal(boundary.inspect().valid,false);
assert.throws(()=>validateScene1341SrsSnapshot('{bad'),/INVALID_JSON/);
assert.throws(()=>validateScene1341SrsSnapshot({
 schema:SC1341_SRS_SNAPSHOT_SCHEMA,namespace:'scene1341-v2',
 items:[{kuId:'word-1',sceneId:base.scene_id,due:100,repetitions:1,intervalDays:1}]
}),/INVALID_ITEM/);
assert.throws(()=>validateScene1341SrsSnapshot({
 schema:SC1341_SRS_SNAPSHOT_SCHEMA,namespace:'scene1341-v2',
 items:[{kuId:base.scene_ku_id,sceneId:base.scene_id,due:100,repetitions:1,intervalDays:1},
 {kuId:base.scene_ku_id,sceneId:base.scene_id,due:100,repetitions:1,intervalDays:1}]
}),/DUPLICATE/);
assert(reads.every(key=>key===SC1341_SRS_STORAGE_KEY),'Never query a Scene500/Core20K key');
assert.equal(writes.length,0,'Never write or clear ANY user localStorage key');
console.log(JSON.stringify({status:'PASS',sourceRecords:2,quarantined:2,namespace:'scene1341-v2',
 inspectedKeys:[...new Set(reads)],storageWrites:writes.length,
 nativeUnits:0,legacySrsReads:0,productionRelease:false}));
