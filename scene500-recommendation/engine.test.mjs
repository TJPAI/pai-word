import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene500Recommender,loadScene500Recommender} from './engine.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('./catalog-v0.2.json',import.meta.url),'utf8'));
test('500 canonical scenes and stable top-N pages',()=>{
 const engine=createScene500Recommender({catalog,minimumScore:0});
 const snapshot=engine.search('起床与晨间准备',{limit:20});
 assert.equal(snapshot.results[0].sceneId,'S001');
 assert.equal(snapshot.results.length,20);
 assert.equal(new Set(snapshot.results.map(r=>r.sceneId)).size,20);
 const first=engine.getPage(snapshot,0);
 const second=engine.getPage(snapshot,1);
 assert.deepEqual(first,snapshot.results.slice(0,5));
 assert.deepEqual(second,snapshot.results.slice(5,10));
 assert.equal(new Set([...first,...second].map(r=>r.sceneId)).size,10);
 assert.deepEqual(snapshot,engine.search('起床与晨间准备',{limit:20}));
});
test('explicit eligibility and strict ID retention',()=>{
 const engine=createScene500Recommender({catalog,minimumScore:0});
 const result=engine.search('起床',{limit:20,eligibleSceneIds:['S001','S025']});
 assert.deepEqual(result.results.map(r=>r.sceneId).sort(),['S001','S025']);
 assert.equal(engine.search('起床',{eligibleSceneIds:[]}).total,0);
 assert.equal(engine.search('  ').total,0);
});
test('load uses supplied fetch and does not fetch until invoked',async()=>{
 let called=0;
 const engine=await loadScene500Recommender({catalogUrl:'/fake-catalog.json',fetchImpl:async url=>{
  called++;
  assert.equal(url,'/fake-catalog.json');
  return {ok:true,json:async()=>catalog};
 }});
 assert.equal(called,1);
 assert.equal(engine.search('洗漱',{limit:5}).results[0].sceneId,'S002');
});
test('errors are explicit and recoverable by caller',async()=>{
 await assert.rejects(()=>loadScene500Recommender({catalogUrl:'/bad',fetchImpl:async()=>({ok:false,status:503})}),/SCENE500_CATALOG_FETCH_FAILED/);
 assert.throws(()=>createScene500Recommender({catalog:{scene_count:1,scenes:{}}}),/SCENE500_INVALID_CATALOG/);
});
test('soft evidence supports mixed intent',()=>{
 const engine=createScene500Recommender({catalog,minimumScore:0});
 const result=engine.search('早晨起床后刷牙洗脸',{limit:20});
 assert.ok(result.results.some(r=>r.sceneId==='S001'));
 assert.ok(result.results.some(r=>r.sceneId==='S002'));
});

test('catalog is recommendation-only without home/SRS counters',()=>{
 assert.equal(Object.keys(catalog.scenes).length,500);
 for(const item of Object.values(catalog.scenes)){
  assert.equal(item.counts,undefined);
  assert.equal(item.ku_id,undefined);
 }
});

test('generic description bigrams alone cannot pass default relevance threshold',()=>{
 const scenes=Object.fromEntries(Array.from({length:500},(_,i)=>{
  const id='S'+String(i+1).padStart(3,'0');
  return [id,{name:'测试项'+String(i+1),description_enriched:'围绕数据讨论研究信息和方法的主题',quality:'machine_generated_unverified'}];
 }));
 const recommender=createScene500Recommender({catalog:{scene_count:500,scenes}});
 assert.equal(recommender.search('需要讨论研究信息和方法').total,0);
});
test('direct name evidence remains retrievable, even without semantic fields',()=>{
 const recommender=createScene500Recommender({catalog});
 const matches=recommender.search('我想学机场值机',{limit:100}).results;
 assert.ok(matches.some(r=>r.sceneId==='S104'));
});

test('duplicate canonical names preserve two identities and eligibility',()=>{
 const recommender=createScene500Recommender({catalog,minimumScore:0});
 assert.equal(catalog.scenes.S155.name,catalog.scenes.S494.name);
 const both=recommender.search('提出假设',{limit:500});
 assert.ok(both.results.some(r=>r.sceneId==='S155'));
 assert.ok(both.results.some(r=>r.sceneId==='S494'));
 const research=recommender.search('提出假设',{eligibleSceneIds:['S155'],limit:100});
 assert.deepEqual(research.results.map(x=>x.sceneId),['S155']);
 const general=recommender.search('提出假设',{eligibleSceneIds:['S494'],limit:100});
 assert.deepEqual(general.results.map(x=>x.sceneId),['S494']);
});
test('all pages retain ordering and never introduce ineligible scenes',()=>{
 const recommender=createScene500Recommender({catalog,minimumScore:0});
 const ids=Array.from({length:100},(_,i)=>'S'+String(i+1).padStart(3,'0'));
 const snapshot=recommender.search('项目讨论',{limit:100,eligibleSceneIds:ids});
 const combined=Array.from({length:20},(_,i)=>recommender.getPage(snapshot,i,5)).flat();
 assert.deepEqual(combined,snapshot.results);
 assert.ok(combined.every(r=>ids.includes(r.sceneId)));
 assert.equal(new Set(combined.map(r=>r.sceneId)).size,combined.length);
});
