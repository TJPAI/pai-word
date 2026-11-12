import assert from 'node:assert/strict';
import {inspectScene1341NativeEntry as inspect} from '../../rebuild-preview/scene1341-native-entry-preflight.mjs';
const sceneId='SC50-0002';
let legacyCalls=0;
const legacy={PAI_START_POLICY_SESSION(){legacyCalls++;},scene1341Namespace:'scene1341-v2',
 isolatedSrsVerified:true,v2RegistryVerified:true};
const empty=inspect({sceneId,nativeRuntime:legacy});
assert.equal(empty.canEnterNativeLearning,false);
assert.equal(empty.canCallLegacyStartPolicySession,false);
assert.equal(empty.canCreateStudyQueue,false);
assert.equal(empty.canWriteSrs,false);
assert.equal(empty.productionReleaseAllowed,false);
assert(empty.blockerCodes.includes('NO_SOURCE_VERIFIED_SCENE1341_KU_LOADED'));
assert(empty.blockerCodes.includes('FORMAL_RELEASE_NOT_APPROVED'));
const rec={
 scene_ku_id:'SC1341-KU-00297',scene_id:sceneId,source_sense_id:'SC-SENSE-00297',
 source_rank:63,expression:'bad breath',source_pack_path:'source/v2.json',
 source_pack_blob:'a'.repeat(40),cg_qa:'PASS',muse_qa:'DEFERRED_QUOTA_20261113',
 muse_recheck_required:true,release_status:'PROVISIONAL_PENDING_MUSE',
 author_draft:true,production_release_allowed:false,source_master_authorization_verified:false,
 answer:{meaning_zh:'口臭',example_en:'I have bad breath.',example_zh:'我有口臭。',collocations:[]},
 display:{w:'bad breath',m:'口臭',e:'I have bad breath.',example_zh:'我有口臭。'}
};
const forged={
 status:'APPROVED_FOR_ISOLATED_STAGING',ku_id:rec.scene_ku_id,
 scene_id:sceneId,source_sense_id:rec.source_sense_id,source_rank:rec.source_rank,
 source_pack_blob:rec.source_pack_blob,master_snapshot_blob:'b'.repeat(40),
 approval_evidence_blob:'c'.repeat(40),display_qa_pass:true
};
const quarantined=inspect({sceneId,records:[rec],authorizations:{[rec.scene_ku_id]:forged},nativeRuntime:legacy});
assert.equal(quarantined.sourceRecords,1);
assert.equal(quarantined.provisionalStagingEligible,0);
assert.equal(quarantined.quarantined,1);
// Even caller-forged "verified" booleans are not real storage/registry evidence.
assert.equal(quarantined.nativeRuntimeNamespaceImplemented,false);
assert.equal(quarantined.quarantineRegistryRecords,1);
assert.equal(quarantined.quarantineRegistryEntries,1);
assert.equal(quarantined.isolatedSrsStorageKey,'pai-word:scene1341-v2:srs:v1');
assert.equal(quarantined.canRestoreIsolatedSrs,false);
assert.equal(quarantined.canEnterNativeLearning,false);
assert.equal(quarantined.canWriteSrs,false);
assert(quarantined.blockerCodes.includes('MASTER_ITEM_AUTHORIZATION_OR_DISPLAY_QA_PENDING'));
assert.equal(legacyCalls,0,'Must never call legacy shared SRS entry');
const held=inspect({sceneId,records:[{...rec,scene_ku_id:'SC1341-KU-00365'}],nativeRuntime:legacy});
assert.equal(held.decisions[0].reason,'QA_V2_DUPLICATE_KU_HOLD');
assert.equal(held.canCreateStudyQueue,false);
const unchanged=inspect({sceneId,records:[rec],nativeRuntime:null});
assert.equal(unchanged.nativeRuntimeNamespaceImplemented,false);
assert(unchanged.blockerCodes.includes('NATIVE_SCENE1341_REGISTRY_AND_ISOLATED_SRS_NOT_IMPLEMENTED'));
assert.throws(()=>inspect({sceneId:'S001'}),/INVALID_SCENE/);
assert.throws(()=>inspect({sceneId,records:[rec,rec]}),/SCENE_OR_KU_ID_MISMATCH/);
assert.throws(()=>inspect({sceneId:'SC50-0003',records:[rec]}),/SCENE_OR_KU_ID_MISMATCH/);
assert.equal(legacyCalls,0);
const fs=await import('node:fs/promises');
const home=await fs.readFile(new URL('../../rebuild-preview/home-dashboard.js',import.meta.url),'utf8');
assert(home.includes("scene1341-native-entry-preflight.mjs"),'Native entry preflight must be wired in existing scene details');
assert(home.includes("entryModule.inspectScene1341NativeEntry({sceneId:id})"));
assert(home.includes('SCENE1341_NATIVE_STAGING_MUST_NOT_AUTO_ACTIVATE'));
console.log(JSON.stringify({status:'PASS',source:'V2_1778_QUARANTINE',
 checked:['no-authorizations','forged-master-approval','held-bad-breath','native-namespace-only','duplicate-and-cross-scene'],
 stagingEligible:0,legacyRuntimeCalls:legacyCalls,SRS:false,release:false}));
