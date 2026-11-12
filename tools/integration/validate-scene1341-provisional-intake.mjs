/* Runtime-free CI intake of 1779 real CG-QA candidate answers.
 * Fetches exact immutable source blobs and validates every record. Does not
 * publish KU, create learning sessions or touch formal user SRS.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectScene1341ProvisionalShard} from '../../rebuild-preview/scene1341-provisional-intake.mjs';
const pin=JSON.parse(fs.readFileSync('tools/integration/scene1341-provisional-intake-pin-20261112.v1.json','utf8'));
assert.equal(pin.qa_manifest.records,1779);
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
assert.equal(manifest.counts.included_cg_pass_no_known_mu_objection,1779);
assert.deepEqual(manifest.shards.map(s=>s.blob),pin.shards.map(s=>s.blob));
assert.deepEqual(manifest.shards.map(s=>s.path),pin.shards.map(s=>s.path));
const seen=new Set(),sceneRanks=new Set(),results=[];
for(const part of pin.shards){
 const shard=await get(part.path,part.blob);
 shard.__path=part.path;
 const result=inspectScene1341ProvisionalShard({shard,pin,blob:part.blob});
 for(const entry of shard.records){
  assert(!seen.has(entry.scene_ku_id),'GLOBAL_DUPLICATE_KU '+entry.scene_ku_id);
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
assert.equal(seen.size,1779);
assert.equal(sceneRanks.size,1779);
const report={status:'PASS',schema:pin.schema,qaSource:pin.qa_manifest.commit,
  cgQaPassCandidates:seen.size,structurallyAccepted:results.reduce((n,x)=>n+x.structurallyAccepted,0),masterAuthorizationVerified:0,
  stagedPlayable:0,formalReleased:0,museReview:'DEFERRED_QUOTA_20261113',
  dataSourceGitBlobValidated:true,shards:results};
console.log(JSON.stringify(report,null,2));
