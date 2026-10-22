import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSparseSceneRetriever} from './sparse-retriever.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=read('./catalog-v0.2.json'),registry=read('./sparse-pilot-v0.1.json');
test('sparse pilot identifies core compound phrases and multiple intents',()=>{
 const x=createSparseSceneRetriever({catalog,registry});
 const out=x.search('先机场值机托运行李再去酒店入住');
 assert.deepEqual(out.terms,['机场值机','托运行李','酒店入住']);
 assert.equal(out.results[0].sceneId,'S104');
 assert.ok(out.results.some(r=>r.sceneId==='S113'));
});
test('eligibleSceneIds hard filter and stable canonical IDs',()=>{
 const x=createSparseSceneRetriever({catalog,registry});
 const out=x.search('预约牙医',{eligibleSceneIds:['S320']});
 assert.deepEqual(out.results.map(r=>r.sceneId),['S320']);
 assert.equal(out.total,1);
});
test('canonical duplicate name keeps separate IDs',()=>{
 const x=createSparseSceneRetriever({catalog,registry});
 assert.deepEqual(x.search('假设').results.map(x=>x.sceneId),['S155','S494']);
 assert.equal(x.search('科学假设').results[0].sceneId,'S155');
});
test('reject invalid weights, duplicate postings, and missing IDs',()=>{
 for(const terms of [
  {'牙医':[{sceneId:'S999',weight:1}]},
  {'牙医':[{sceneId:'S320',weight:2}]},
  {'牙医':[{sceneId:'S320',weight:1},{sceneId:'S320',weight:.3}]}
 ]){
  assert.throws(()=>createSparseSceneRetriever({catalog,registry:{scene_count:500,terms}}),/SCENE500_INVALID_POSTING/);
 }
});
