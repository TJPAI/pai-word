import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene500Recommender} from './engine.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./catalog-v0.2.json',import.meta.url),'utf8'));
const engine=createScene500Recommender({catalog:data,minimumScore:0});
// Weak-label diagnostic: the canonical title is expected to retrieve its own scene.
// Do NOT report as actual learner-query relevance accuracy.
test('canonical title retrieval across all 500 IDs (weak labels)',()=>{
 const failures=[];
 for(const [id,s] of Object.entries(data.scenes)){
  const hit=engine.search(s.name,{limit:10}).results;
  if(hit[0]?.sceneId!==id)failures.push({id,name:s.name,top:hit[0]?.sceneId});
 }
 assert.deepEqual(failures,[],JSON.stringify(failures.slice(0,20)));
});
test('stable paging over limit 100 with zero score floor',()=>{
 const first=engine.search('学习英语',{limit:100});
 assert.equal(first.results.length,100);
 const pages=Array.from({length:20},(_,i)=>engine.getPage(first,i,5)).flat();
 assert.deepEqual(pages,first.results);
 assert.equal(new Set(pages.map(r=>r.sceneId)).size,100);
});
test('unrelated search with production threshold may return zero',()=>{
 const prod=createScene500Recommender({catalog:data});
 assert.equal(prod.search('%%%%%%',{limit:100}).total,0);
});
