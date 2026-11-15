import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import fs from 'node:fs';
import {fetchSceneAssociations} from '../../rebuild-preview/scene1341-readonly/scene1341-live-feed.mjs';
globalThis.crypto=webcrypto;
const records=[1,2].map(i=>({record_id:'SC1341-FINAL-SRC-'+String(i).padStart(32,'0'),
 source_final_row:i,scene_id:i===1?'SC50-0001':'SC50-0002',release_allowed:false,srs_eligible:false,
 question_page:{expression:'sample'},answer_page:{meaning_zh:'测试'}}));
const bytes=gzipSync(records.map(r=>JSON.stringify(r)).join('\n')+'\n');
const gitHead=Buffer.from('blob '+bytes.length+'\0');
const sha1=createHash('sha1').update(Buffer.concat([gitHead,bytes])).digest('hex');
const sha256=createHash('sha256').update(bytes).digest('hex');
const feed={schema_version:'scene1341-live-feed/v1',source_master_sha256:'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986',
 formal_ready:0,srs_eligible:false,batches:[{first_source_final_row:1,last_source_final_row:2,
 version:'V191',records:2,scene_ids:['SC50-0001','SC50-0002'],
 shards:[{name:'CGMASTER_TEST.jsonl.gz',records:2,git_blob_sha1:sha1,sha256}]}]};
const commit='a'.repeat(40);
const response=data=>new Response(data,{status:200});
const fetchImpl=async(url,options)=>{assert(url.includes('/'+commit+'/'));assert.equal(options.cache,'no-store');return response(bytes)};
const data=await fetchSceneAssociations({commit,feed},'SC50-0001',{fetchImpl});
assert.equal(data.rows.length,1);assert.equal(data.rows[0].source_final_row,1);
assert.equal(data.canWriteSrs,false);
const other=await fetchSceneAssociations({commit,feed},'SC50-0002',{fetchImpl});
assert.equal(other.rows[0].source_final_row,2);
const absent=await fetchSceneAssociations({commit,feed},'SC50-0003',{fetchImpl:async()=>{throw Error('unexpected fetch')}});
assert.equal(absent.rows.length,0);
const corrupted=structuredClone(feed);corrupted.batches[0].shards[0].sha256='0'.repeat(64);
await assert.rejects(()=>fetchSceneAssociations({commit,feed:corrupted},'SC50-0001',{fetchImpl}),/MASTER_FEED_SHARD_HASH/);
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert(html.includes('id="master-live-feed-status"'));
assert(html.includes("import('./scene1341-live-feed.mjs')"));
assert(html.includes("resolveLiveFeed({commit:v190.sourceCommit})"));
assert(!html.includes('question-ipa-test.html'));
console.log('PASS scene-scoped immutable gzip SHA1/SHA256, row separation, missing scene, invalid hash, original settings diagnostics, SRS=0');
