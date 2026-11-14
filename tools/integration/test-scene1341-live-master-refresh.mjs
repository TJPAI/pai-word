import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveLatestMasterSnapshot} from '../../rebuild-preview/scene1341-readonly/scene1341-v190-master-answer-intake.mjs';
const commit='acda081836511707bc12d8360fa0472ff12401b8';
const root='tools/scene1341_master/qa_reports/';
const manifest={version:'V190',source_master_sha256:'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986',
 source_final_rows:[1,3000],formal_ready:0,srs_eligible:false,
 counts:{examples_filled:1461,test_ipa_nonempty:1478,usage_note_filled:1461,collocations_filled:1461},
 shards:[
 {name:'CGMASTER_V190_SOURCE00001_01000_BATCH03_AUTHOR_MERGED_OVERLAY.jsonl.gz',records:1000,git_blob_sha1:'b63daf359370a254491188188cbb036496d9a258',sha256:'12c4d4b088d670feb6d9ec7cd895c8cdfb8fc08c42100b529bb9966ed12ba60c'},
 {name:'CGMASTER_V190_SOURCE01001_02000_BATCH03_AUTHOR_MERGED_OVERLAY.jsonl.gz',records:1000,git_blob_sha1:'ca147731e67979e875f3e37a95514a9bfeb3e9f0',sha256:'05786ca01ba101373a711254d490552b7654693252af3f1b039737eb1325e148'},
 {name:'CGMASTER_V190_SOURCE02001_03000_BATCH03_AUTHOR_MERGED_OVERLAY.jsonl.gz',records:1000,git_blob_sha1:'effac2ddb1fd145927d4ff41a130820d81ff83b2',sha256:'90afbdfb00536cd8c8840a7f88898c8b79e9bb14b884c604d0b32a6ba5bf703a'}
 ]};
const response=data=>new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
function mockBranch(manifestVersion='V191',missing=false){
 const next={...manifest,version:manifestVersion};
 const shards=manifest.shards.map(x=>({path:root+x.name,sha:x.git_blob_sha1}));
 const tree=[...shards,{path:root+'CGMASTER_'+manifestVersion+'_MANIFEST_20261115.json',sha:'a'.repeat(40)},
  {path:root+'CGMASTER_V190_MANIFEST_20261115.json',sha:'b'.repeat(40)}];
 return async url=>{
  if(url.includes('/branches/'))return response({commit:{sha:commit}});
  if(url.includes('/git/trees/'))return response({truncated:false,tree});
  if(url.includes('CGMASTER_'+manifestVersion+'_MANIFEST_'))return missing?new Response('Not found',{status:404}):response(next);
  if(url.includes('CGMASTER_V190_MANIFEST_'))return response(manifest);
  throw Error('Unexpected network fetch '+url);
 };
}
const snap=await resolveLatestMasterSnapshot({fetchImpl:mockBranch()});
assert.equal(snap.version,'V191');
assert.equal(snap.commit,commit);
assert.equal(snap.fallback,false);
assert.equal(snap.shards.length,3);
assert.equal(snap.expected.examples,1461);
assert.equal(snap.expected.ipa,1478);
// A later V192 may describe rows 3001-6000. It must not invalidate the
// latest complete FIRST batch (V191) or masquerade as source rows 1-3000.
const otherBatch=await resolveLatestMasterSnapshot({fetchImpl:async url=>{
 if(url.includes('/branches/'))return response({commit:{sha:commit}});
 if(url.includes('/git/trees/'))return response({truncated:false,tree:[
  ...manifest.shards.map(x=>({path:root+x.name,sha:x.git_blob_sha1})),
  {path:root+'CGMASTER_V192_MANIFEST_20261115.json',sha:'1'.repeat(40)},
  {path:root+'CGMASTER_V191_MANIFEST_20261115.json',sha:'2'.repeat(40)}
 ]});
 if(url.includes('CGMASTER_V192_MANIFEST_'))return response({...manifest,version:'V192',source_final_rows:[3001,6000]});
 if(url.includes('CGMASTER_V191_MANIFEST_'))return response({...manifest,version:'V191'});
 throw Error('Unexpected future batch request: '+url);
}});
assert.equal(otherBatch.version,'V191');
assert.equal(otherBatch.fallback,false);

const incomplete=await resolveLatestMasterSnapshot({fetchImpl:mockBranch('V192',true)});
assert.equal(incomplete.version,'V190');
assert.equal(incomplete.fallback,true);
assert.match(incomplete.liveError,/MASTER_LIVE_MANIFEST_HTTP_404/);
const offline=await resolveLatestMasterSnapshot({fetchImpl:async()=>{throw Error('network unavailable')}});
assert.equal(offline.fallback,true);
const page=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert(page.includes("$('master-refresh').addEventListener('click'"));
assert(page.includes('sourceLabel=v190.sourceVersion'));
assert(page.includes("（实时）")&&page.includes("（回退）"));
assert(page.includes('数据校验失败')&&page.includes('正式认证0'));
assert(page.includes('MASTER_LIVE_ALL_SOURCES_UNAVAILABLE'),'legacy baseline must survive even total Master source outage');
assert(!page.includes('question-ipa-test.html'));
console.log(JSON.stringify({status:'PASS',liveManifest:'V191',runtimeNoRebuild:true,branchPinned:true,newerDifferentBatchIgnored:true,
 incompleteFallback:'V190',offlineFallback:'V190',ready:0,srsWrites:0}));
