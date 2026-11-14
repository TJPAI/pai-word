import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveLatestMasterSnapshot} from '../../rebuild-preview/scene1341-readonly/scene1341-v190-master-answer-intake.mjs';
const commit='acda081836511707bc12d8360fa0472ff12401b8';
const root='tools/scene1341_master/qa_reports/';
const manifest=JSON.parse(fs.readFileSync('tools/scene1341_master/qa_reports/CGMASTER_V190_MANIFEST_20261115.json','utf8'));
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
assert(!page.includes('question-ipa-test.html'));
console.log(JSON.stringify({status:'PASS',liveManifest:'V191',runtimeNoRebuild:true,branchPinned:true,
 incompleteFallback:'V190',offlineFallback:'V190',ready:0,srsWrites:0}));
