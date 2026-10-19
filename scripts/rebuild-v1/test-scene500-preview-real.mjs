// Regression against ACTUAL Scene500 V4 projection and frozen Core20K preview shards.
// Node: node scripts/rebuild-v1/test-scene500-preview-real.mjs <shards-dir> <Scene500_RuntimeProjection.json.gz>
// Test-only scene groups are synthesized directly from the immutable projection.
// This is NOT independent validation of published group-01..20 JSON files.
import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';import crypto from 'node:crypto';
import {PreviewReader} from './preview-reader.mjs';
const [shards,projectionPath]=process.argv.slice(2);assert(shards&&projectionPath,'Two input paths required');
const projection=JSON.parse(zlib.gunzipSync(fs.readFileSync(projectionPath)));
assert.equal(Object.keys(projection.scenes).length,500);
let fetched=0;
const fetcher=async url=>{
 fetched++;
 if(url.startsWith('scene/')){
  const group=Number(url.match(/group-(\d+)\.json$/)?.[1]);
  if(!Number.isInteger(group)||group<1||group>20)return {ok:false};
  const scenes={};
  for(let n=(group-1)*25+1;n<=group*25;n++){
   const id='S'+String(n).padStart(3,'0');
   scenes[id]=projection.scenes[id].rows.slice(0,100);
  }
  return {ok:true,json:async()=>({schema:'pai-scene500-top100-v40-v1',
   policy:'ranks_1_100; only single_playable_general_sense; no scene_sense_verified_claim',scenes})};
 }
 const p=path.join(shards,url.replace(/^\.\//,''));
 if(!fs.existsSync(p))return {ok:false};
 const b=fs.readFileSync(p);
 return {ok:true,json:async()=>JSON.parse(b),arrayBuffer:async()=>b};
};
const digest=async b=>crypto.createHash('sha256').update(b).digest('hex');
const reader=new PreviewReader({base:'.',fetcher,digest,inflate:async b=>zlib.gunzipSync(b)});
await reader.start();
let playable=0;
for(let n=1;n<=500;n++){
 const id='S'+String(n).padStart(3,'0');
 const result=await reader.sceneTop100(id,{fetcher,base:'scene'});
 assert.equal(result.originalCandidates,100);
 for(const item of result.items){
  assert.equal(item.ku[1],'sense');
  assert.equal(item.word.units.filter(k=>k[1]==='sense'&&k[4]===true&&String(k[2]).trim()).length,1);
 }
 playable+=result.playable;
}
assert.equal(playable,22227);
console.log(JSON.stringify({status:'PASS_PROJECTION_DERIVED_TEST',scenes:500,positions:50000,playable,fetched,cachedShards:reader.cache.size}));
