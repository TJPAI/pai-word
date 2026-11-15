import assert from 'node:assert/strict';
import {validateLiveFeed,selectSceneBatches,resolveLiveFeed} from '../../rebuild-preview/scene1341-readonly/scene1341-live-feed.mjs';
const shard={name:'CGMASTER_V191_00001_03000.jsonl.gz',records:3000,git_blob_sha1:'a'.repeat(40),sha256:'b'.repeat(64)};
const feed={schema_version:'scene1341-live-feed/v1',source_master_sha256:'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986',formal_ready:0,srs_eligible:false,batches:[
 {first_source_final_row:1,last_source_final_row:3000,version:'V191',records:3000,scene_ids:['SC50-0001','SC50-0002'],shards:[shard]},
 {first_source_final_row:3001,last_source_final_row:6000,version:'V192',records:3000,scene_ids:['SC50-0002','SC50-0003'],shards:[{...shard,name:'CGMASTER_V192_03001_06000.jsonl.gz'}]}]};
assert.equal(validateLiveFeed(feed).associationCount,6000);
assert.deepEqual(selectSceneBatches(feed,'SC50-0002').map(b=>b.version),['V191','V192']);
assert.deepEqual(selectSceneBatches(feed,'SC50-0003').map(b=>b.version),['V192']);
for(const change of [f=>f.formal_ready=1,f=>f.batches[1].first_source_final_row=3000,
 f=>f.batches[0].shards[0].sha256='bad',f=>f.batches[0].scene_ids.push('SC50-9999'),
 f=>f.batches[0].scene_ids.push('SC50-0001')]){
 const copy=structuredClone(feed);change(copy);assert.throws(()=>validateLiveFeed(copy),/MASTER_FEED_/);
}
const commit='c'.repeat(40);
const response=await resolveLiveFeed({commit,fetchImpl:async (url,opts)=>{
 assert(url.includes(commit+'/tools/scene1341_master/qa_reports/CGMASTER_LIVE_FEED.json'));
 assert.equal(opts.cache,'no-store');return new Response(JSON.stringify(feed),{status:200});
}});
assert.equal(response.canWriteSrs,false);assert.equal(response.commit,commit);
await assert.rejects(()=>resolveLiveFeed({commit:'latest',fetchImpl:async()=>{throw Error('must not fetch')}}),/MASTER_FEED_COMMIT/);
console.log('PASS multi-batch feed 6000 associations, scene lazy selection, immutable SHA, fail-closed validation, SRS=0');
