import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene500Recommender} from './engine.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('./catalog-v0.2.json',import.meta.url),'utf8'));
const cases=JSON.parse(fs.readFileSync(new URL('./query-holdout-v0.2.json',import.meta.url),'utf8')).cases;
function metrics(engine){
 let n=0,recall=0,mrr=0,ndcg=0;
 for(const row of cases){
  const expected=row.relevantSceneIds||[];
  if(!expected.length)continue;
  n++;
  const found=engine.search(row.query,{limit:10}).results.map(x=>x.sceneId);
  recall+=expected.filter(id=>found.slice(0,5).includes(id)).length/expected.length;
  const first=found.findIndex(id=>expected.includes(id));
  if(first>=0)mrr+=1/(first+1);
  const ideal=expected.slice(0,5).reduce((sum,_,i)=>sum+1/Math.log2(i+2),0);
  const actual=found.slice(0,5).reduce((sum,id,i)=>sum+(expected.includes(id)?1/Math.log2(i+2):0),0);
  ndcg+=actual/ideal;
 }
 return {n,recall:recall/n,mrr:mrr/n,ndcg:ndcg/n};
}
test('actual full 500 catalog regression: diagnostic baseline stays reproducible',()=>{
 const e=createScene500Recommender({catalog});
 const m=metrics(e);
 assert.equal(m.n,31);
 assert.ok(Math.abs(m.recall-0.27419354838709675)<1e-12);
 assert.ok(Math.abs(m.mrr-0.2698924731182796)<1e-12);
 assert.ok(Math.abs(m.ndcg-0.2331062705009973)<1e-12);
});
test('identical names remain independent scene IDs with eligibility and paging',()=>{
 assert.equal(catalog.scenes.S155.name,catalog.scenes.S494.name);
 const e=createScene500Recommender({catalog});
 const all=e.search('提出假设',{limit:500});
 const ids=new Set(all.results.map(x=>x.sceneId));
 assert.ok(ids.has('S155')&&ids.has('S494'));
 assert.equal(ids.size,all.results.length);
 assert.deepEqual(e.getPage(all,0,5),all.results.slice(0,5));
 assert.deepEqual(e.getPage(all,1,5),all.results.slice(5,10));
 const restricted=e.search('提出假设',{limit:500,eligibleSceneIds:['S494']});
 assert.ok(restricted.results.every(x=>x.sceneId==='S494'));
});
