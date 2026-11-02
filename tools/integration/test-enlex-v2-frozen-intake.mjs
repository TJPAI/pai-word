import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const intake=JSON.parse(fs.readFileSync('tools/integration/enlex-v2-staging-intake-20261102.json','utf8'));
assert.equal(intake.schema,'pai-enlex-v2-staging-intake-v1');
assert.equal(intake.state,'STAGING_CONTRACT_ONLY');
assert.equal(intake.release_eligible,false);
assert.equal(intake.runtime_modified,false);
assert.equal(intake.deployment_requested,false);
assert.equal(intake.source.records,27471);
assert.equal(intake.source.shards,6);
assert.match(intake.source.commit,/^[0-9a-f]{40}$/);
assert.equal(intake.scene1341.state,'NOT_VERIFIED_FROZEN');

const root=process.argv[2];
if(!root){
 console.log('PASS ENLEX V2 intake fail-closed contract; source shard verification requires explicit source checkout path');
 process.exit(0);
}
const manifestPath=path.join(root,intake.source.manifest);
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
assert.equal(manifest.version,intake.source.version);
assert.equal(manifest.records,intake.source.records);
assert.equal(manifest.shards.length,6);
assert.equal(manifest.runtime_modified,false);
assert.equal(manifest.status,'INTEGRATION_SNAPSHOT_FROZEN_NOT_RELEASE_ELIGIBLE');
let total=0,semantic=0,rebuild=0,rebuildMethod=0,overlap=0;
const seenPaths=new Set();
for(const shard of manifest.shards){
 assert(!seenPaths.has(shard.path),'duplicate shard path');
 seenPaths.add(shard.path);
 assert.match(shard.blob_sha,/^[0-9a-f]{40}$/);
 const bytes=fs.readFileSync(path.join(root,shard.path));
 const blob=crypto.createHash('sha1').update('blob '+bytes.length+'\\0').update(bytes).digest('hex');
 assert.equal(blob,shard.blob_sha,'frozen shard SHA mismatch: '+shard.path);
 for(const line of bytes.toString('utf8').split(/\\r?\\n/)){
  if(!line.trim())continue;
  const item=JSON.parse(line);
  total++;
  if(item.v2_needs_semantic_review===true)semantic++;
  if(item.question_requires_rebuild===true)rebuild++;
  if(item.v2_rebuild_method!=null)rebuildMethod++;
  if(item.v2_needs_semantic_review===true&&item.question_requires_rebuild===true)overlap++;
 }
}
assert.equal(total,27471);
console.log(JSON.stringify({status:'PASS',mode:'FROZEN_SOURCE_READ_ONLY',shards:6,records:total,semantic_review_flags:semantic,question_rebuild_flags:rebuild,rebuild_method_present:rebuildMethod,semantic_and_rebuild_overlap:overlap,production_eligible:false}));
