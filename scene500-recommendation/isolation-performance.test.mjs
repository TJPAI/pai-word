import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createScene500Recommender} from './engine.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('./catalog-v0.2.json',import.meta.url),'utf8'));
const holdout=JSON.parse(fs.readFileSync(new URL('./query-holdout-v0.1.json',import.meta.url),'utf8'));
test('all canonical 500 IDs are present and duplicate names remain distinct',()=>{
 assert.deepEqual(Object.keys(catalog.scenes).sort(),Array.from({length:500},(_,i)=>'S'+String(i+1).padStart(3,'0')));
 assert.equal(catalog.scenes.S155.name,catalog.scenes.S494.name);
});
test('eligible subset never leaks in holdout queries',()=>{
 const engine=createScene500Recommender({catalog,minimumScore:0});
 const allowed=['S155','S494','S217','S218'];
 for(const q of holdout.cases.map(x=>x.query)){
  const snap=engine.search(q,{eligibleSceneIds:allowed,limit:500});
  assert.ok(snap.results.every(x=>allowed.includes(x.sceneId)));
  assert.equal(new Set(snap.results.map(x=>x.sceneId)).size,snap.results.length);
 }
});
test('ranking and pagination deterministic over varied queries',()=>{
 const engine=createScene500Recommender({catalog,minimumScore:0});
 for(const q of holdout.cases.map(x=>x.query)){
  const a=engine.search(q,{limit:100});
  assert.deepEqual(engine.search(q,{limit:100}),a);
  assert.deepEqual(Array.from({length:20},(_,i)=>engine.getPage(a,i,5)).flat(),a.results);
 }
});
test('diagnostic local throughput (non-gating: hardware-dependent)',()=>{
 const engine=createScene500Recommender({catalog});
 const queries=holdout.cases.map(x=>x.query);
 const t0=performance.now();let count=0;
 for(let round=0;round<5;round++)for(const query of queries){engine.search(query,{limit:100});count++;}
 const elapsed=performance.now()-t0;
 console.log(JSON.stringify({label:'non-gating local Node performance',searches:count,elapsedMs:+elapsed.toFixed(2),meanMs:+(elapsed/count).toFixed(3)}));
 assert.equal(count,150);
});
