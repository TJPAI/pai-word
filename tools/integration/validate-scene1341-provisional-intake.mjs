/* Runtime-free CI intake of 1778 real CG-QA candidate answers.
 * Fetches exact immutable source blobs and validates every record. Does not
 * publish KU, create learning sessions or touch formal user SRS.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectScene1341ProvisionalShard,inspectScene1341ProvisionalRecord} from '../../rebuild-preview/scene1341-provisional-intake.mjs';
import {createScene1341QuarantineRegistry,createScene1341SrsStorageBoundary} from '../../rebuild-preview/scene1341-isolated-registry-srs.mjs';
import {createScene1341ReadOnlyDisplayProjection} from '../../rebuild-preview/scene1341-native-display-projection.mjs';
import {assertScene1341NativeAnswerHtml} from './scene1341-native-answer-renderer-harness.mjs';
const pin=JSON.parse(fs.readFileSync('tools/integration/scene1341-provisional-intake-pin-20261112.v2.json','utf8'));
assert.equal(pin.qa_manifest.records,1778);
assert.equal(pin.v1_status,'SUPERSEDED_DO_NOT_CONSUME');
assert.equal(pin.blocked_record?.ku_id,'SC1341-KU-00365');
const base='https://raw.githubusercontent.com/'+pin.qa_manifest.repo+'/'+pin.qa_manifest.commit+'/';
const gitBlob=buffer=>createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+buffer.length+'\0'),buffer])).digest('hex');
async function get(path,expected){
 const url=base+path;
 const resp=await fetch(url,{signal:AbortSignal.timeout(60000)});
 if(!resp.ok)throw Error('SOURCE_FETCH_FAILED '+path+' '+resp.status);
 const bytes=Buffer.from(await resp.arrayBuffer());
 const actual=gitBlob(bytes);
 if(actual!==expected)throw Error('SOURCE_GIT_BLOB_MISMATCH '+path+' '+actual+' != '+expected);
 return JSON.parse(bytes.toString('utf8'));
}
const manifest=await get(pin.qa_manifest.path,pin.qa_manifest.blob);
assert.equal(manifest.counts.included_cg_pass_no_known_mu_objection,1778);
assert.equal(manifest.global_checks.duplicate_teaching_goal_held,1);
assert.deepEqual(manifest.shards.map(s=>s.blob),pin.shards.map(s=>s.blob));
assert.deepEqual(manifest.shards.map(s=>s.path),pin.shards.map(s=>s.path));
const seen=new Set(),sceneRanks=new Set(),results=[],sourceRecords=[];let historicalMusePass=0,museDeferred=0,retainedBadBreath=false;
for(const part of pin.shards){
 const shard=await get(part.path,part.blob);
 shard.__path=part.path;
 const result=inspectScene1341ProvisionalShard({shard,pin,blob:part.blob});
 for(const entry of shard.records){
  sourceRecords.push(entry);
  if(entry.muse_qa==='PASS')historicalMusePass++;
  else if(entry.muse_qa==='DEFERRED_QUOTA_20261113')museDeferred++;
  else throw Error('UNEXPECTED_MUSE_STATUS '+entry.scene_ku_id);
  assert(!seen.has(entry.scene_ku_id),'GLOBAL_DUPLICATE_KU '+entry.scene_ku_id);
  assert.notEqual(entry.scene_ku_id,pin.blocked_record.ku_id,'HELD_DUPLICATE_LEAKED');
  if(entry.scene_ku_id==='SC1341-KU-00297'){
   assert.equal(entry.scene_id,'SC50-0002');
   assert.equal(entry.expression,'bad breath');
   retainedBadBreath=true;
  }
  const key=entry.scene_id+':'+entry.source_rank;
  assert(!sceneRanks.has(key),'GLOBAL_DUPLICATE_SCENE_RANK '+key);
  seen.add(entry.scene_ku_id);sceneRanks.add(key);
 }
 assert.equal(result.records,part.records);
 assert(result.accepted>=0&&result.accepted<=part.records,'INVALID_ACCEPTED_COUNT '+part.path);
 assert.equal(result.stagingEligible,0,'MASTER_AUTHORIZATION_NOT_YET_PROVIDED');
 assert.equal(result.formalReleaseEligible,0);
 const rejections=Object.fromEntries([...new Set(result.decisions.map(x=>x.decision.reason))].map(reason=>[reason,result.decisions.filter(x=>x.decision.reason===reason).length]));
 results.push({path:part.path,blob:part.blob,records:result.records,structurallyAccepted:result.accepted,quarantined:result.quarantined,rejections});
}
assert.equal(seen.size,1778);
assert.equal(pin.qa_manifest.records,seen.size);
assert.equal(retainedBadBreath,true,'PRIMARY_BAD_BREATH_SHOULD_REMAIN');
assert.equal(inspectScene1341ProvisionalRecord({scene_ku_id:pin.blocked_record.ku_id}).reason,'QA_V2_DUPLICATE_KU_HOLD');
assert.equal(sceneRanks.size,1778);
assert.equal(historicalMusePass+museDeferred,1778,'MUSE_HISTORY_STATUS_ACCOUNTING');
const registry=createScene1341QuarantineRegistry({records:sourceRecords});
const srsBoundary=createScene1341SrsStorageBoundary();
assert.equal(registry.records,1778,'ALL_1778_IN_SEPARATE_REGISTRY');
assert.equal(registry.quarantined,1778,'NO_UNAPPROVED_KU_IN_REGISTRY');
assert.equal(registry.canCreateStudyQueue,false,'NO_NATIVE_QUEUE');
assert.equal(registry.canWriteSrs,false,'NO_REGISTRY_SRS_WRITE');
assert.equal(registry.productionReleaseAllowed,false,'NO_FORMAL_RELEASE');
assert.deepEqual(registry.getNativeStudyUnits(),[],'NATIVE_UNITS_EMPTY');
assert.equal(Object.hasOwn(registry,'byKU'),false,'NO_LEGACY_CORE20K_REGISTRY_ALIAS');
assert.equal(registry.item('SC1341-KU-00365'),null,'HELD_KU_NEVER_ENTER_REGISTRY');
assert.equal(registry.item('SC1341-KU-00297')?.acceptedForQuarantine,true,'PRIMARY_BAD_BREATH_QUARANTINED');
assert.equal(srsBoundary.canWriteSrs,false);
assert.equal(srsBoundary.canRestoreForLearning,false);
assert.equal(srsBoundary.inspect().present,false);
const displayProjection=createScene1341ReadOnlyDisplayProjection(sourceRecords);
assert.equal(displayProjection.count,1778,'ALL_REAL_1778_DISPLAY_UNITS');
assert.equal(displayProjection.units.filter(u=>u.s.playable===false).length,1778,'EVERY_UNIT_NON_PLAYABLE');
assert.equal(displayProjection.units.filter(u=>u.canWriteSrs===false).length,1778,'EVERY_UNIT_NON_WRITABLE');
assert.equal(displayProjection.units.filter(u=>u.readOnly===true).length,1778,'EVERY_UNIT_READ_ONLY');
assert.deepEqual(displayProjection.nativePlayableUnits,[],'NO_NATIVE_STUDY_QUEUE');
assert.equal(displayProjection.canCreateStudyQueue,false);
assert.equal(displayProjection.canWriteSrs,false);
assert.equal(displayProjection.units.find(u=>u.k==='SC1341-KU-00001')?.w.w,'wake up');
assert.equal(displayProjection.units.some(u=>u.k==='SC1341-KU-00365'),false);
assert.equal(displayProjection.units.some(u=>u.k==='SC1341-KU-00297'),true);
for(const item of displayProjection.units)assertScene1341NativeAnswerHtml(item);



const report={status:'PASS',schema:pin.schema,qaSource:pin.qa_manifest.commit,
  cgQaPassCandidates:seen.size,structurallyAccepted:results.reduce((n,x)=>n+x.structurallyAccepted,0),masterAuthorizationVerified:0,
  stagedPlayable:0,formalReleased:0,museHistory:{historicalPassNotFinalCertification:historicalMusePass,deferredUntil20261113:museDeferred},
  dataSourceGitBlobValidated:true,isolatedRegistry:{records:registry.records,quarantined:registry.quarantined,scenes:registry.scenes,nativeUnits:0,canWriteSrs:false,namespace:registry.namespace,storageKey:srsBoundary.key,readOnlyNativeAnswerUnits:displayProjection.count,realScene500AnswerHtmlChecks:displayProjection.count},shards:results};
console.log(JSON.stringify(report,null,2));
