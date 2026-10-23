// Editorial diagnostic only — never report as independent/blind accuracy.
// Run: node --test scene500-recommendation/semantic-diagnostic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene500Recommender} from './engine.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('./catalog-v0.2.json',import.meta.url),'utf8'));
const engine=createScene500Recommender({catalog});
const cases=[
 {query:'我要洗衣服然后晾起来',relevant:['S006'],type:'action-object'},
 {query:'把屋子收拾整齐，书桌也整理下',relevant:['S004'],type:'neighbor'},
 {query:'今天打扫卫生拖地板',relevant:['S005'],type:'neighbor'},
 {query:'做饭之前先洗菜切菜',relevant:['S007'],type:'neighbor'},
 {query:'今晚一家人坐在餐桌吃晚饭',relevant:['S008'],type:'neighbor'},
 {query:'牙疼想去看牙医',relevant:['S320'],type:'colloquial'},
 {query:'早晨起床后刷牙洗脸',relevant:['S001','S002'],type:'multi-intent'},
 {query:'我要洗衣服，还要整理卧室',relevant:['S006','S004'],type:'multi-intent'},
 {query:'我正在设计实验并提出研究假设',relevant:['S155'],type:'neighbor'},
 {query:'假如明天下雨，我们就待在家里',relevant:['S494'],type:'neighbor'}
];
test('editorial semantic diagnostics produce deterministic top-five metrics and case report',()=>{
 let matched=0,rr=0,recall=0;
 const detail=cases.map(c=>{
  const top=engine.search(c.query,{limit:5}).results.map(x=>x.sceneId);
  const hits=c.relevant.filter(x=>top.includes(x));
  const first=top.findIndex(x=>c.relevant.includes(x));
  if(hits.length)matched++;
  if(first>=0)rr+=1/(first+1);
  recall+=hits.length/c.relevant.length;
  return {type:c.type,query:c.query,relevant:c.relevant,top5:top,hitCount:hits.length};
 });
 assert.equal(detail.length,cases.length);
 for(const item of detail)assert.equal(new Set(item.top5).size,item.top5.length);
 console.log('EDITORIAL_DIAGNOSTIC_NOT_BLIND '+JSON.stringify({count:cases.length,hitAt5:matched/cases.length,macroRecallAt5:recall/cases.length,mrrAt5:rr/cases.length,cases:detail}));
});
