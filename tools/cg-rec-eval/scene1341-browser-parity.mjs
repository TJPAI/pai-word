// Independent cross-implementation query comparison, not an equivalence assertion.
import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {createScene1341HomeCatalog} from '../../rebuild-preview/scene1341-home-adapter.mjs';
import {csv,loadInputs} from '../../../candidate/scene500-recommendation/scene1341-isolated-search.mjs';
const [catalogPath,rankedDir,sourceCommit,manifestSha,queriesPath]=process.argv.slice(2);
if(![catalogPath,rankedDir,sourceCommit,manifestSha,queriesPath].every(Boolean))throw Error('MISSING_ARGS');
const catalogText=fs.readFileSync(catalogPath,'utf8');
const rankedCache=new Map();
for(let v=51;v<=61;v++)rankedCache.set(v,csv(fs.readFileSync(path.join(rankedDir,'v'+v+'-ranked.csv'),'utf8')));
const delivered=new Map();
for(const rows of rankedCache.values())for(const r of rows)delivered.set(r.scene_id,(delivered.get(r.scene_id)||0)+1);
const ranked={
 async initialize(){return {scenes:[...delivered].map(([scene_id,count])=>({scene_id,count}))};},
 async batch(v){if(!rankedCache.has(v))throw Error('UNEXPECTED_BATCH');return rankedCache.get(v);},
 async scene(id){return {rows:[...rankedCache.values()].flat().filter(r=>r.scene_id===id)};}
};
const adapter=createScene1341HomeCatalog({ranked,fetchImpl:async()=>new Response(catalogText,{status:200})});
const engine=loadInputs(catalogPath,rankedDir,{sourceCommit,manifestSha});
const cases=JSON.parse(fs.readFileSync(queriesPath,'utf8'));
if(cases.cases.length!==22)throw Error('EXPECTED_AB22');
const extra=[
 ['NEG001','我不是搬家，只是整理卧室'],
 ['NEG002','不是外卖下单，我是来取餐的'],
 ['NEG003','不想看电视，我要照顾宠物'],
 ['NEG004','不是点餐，只是问食材'],
 ['NEG005','not coffee, I want to order food']
];
const entries=[...cases.cases.map(c=>({id:c.id,query:c.query,expected:c.expected,group:c.group})),...extra.map(([id,query])=>({id,query,expected:null,group:'negation'}))];
const rows=[];
for(const c of entries){
 const t0=performance.now(),browser=await adapter.search(c.query,{limit:10}),t1=performance.now();
 const legacy=engine.search(c.query,{limit:10}),t2=performance.now();
 const a=browser.map(x=>x.id),b=legacy.map(x=>x.scene_id);
 rows.push({id:c.id,group:c.group,query:c.query,provisionalTarget:c.expected,browserTop10:a,engineTop10:b,browserTop1:a[0]||null,engineTop1:b[0]||null,top1Same:a[0]===b[0],top5Overlap:a.slice(0,5).filter(id=>b.slice(0,5).includes(id)).length,browserP5:c.expected?a.slice(0,5).includes(c.expected):null,engineP5:c.expected?b.slice(0,5).includes(c.expected):null,browserMs:t1-t0,engineMs:t2-t1,browserFirstSource:browser[0]?.searchEvidence||null,engineFirstSource:legacy[0]?.explanations||[]});
}
const summary={status:'SC1341_SOURCE_PINNED_BROWSER_VS_REC_ENGINE_DIAGNOSTIC_NON_BLIND',sourceCommit,manifestSha,queryCount:rows.length,matchedTop1:rows.filter(x=>x.top1Same).length,differentTop1:rows.filter(x=>!x.top1Same).length,groups:Object.fromEntries([...new Set(rows.map(x=>x.group))].map(g=>{const sub=rows.filter(x=>x.group===g);return [g,{count:sub.length,top1Same:sub.filter(x=>x.top1Same).length,browserTop5Hits:sub.filter(x=>x.browserP5).length,engineTop5Hits:sub.filter(x=>x.engineP5).length}]})),data:{scenes:engine.sceneCount,rankedScenes:engine.rankedSceneCount,expressions:engine.expressionCount},release_allowed:false,rows};
if(rows.length!==27||engine.expressionCount!==19371)throw Error('EXPECTED_INDEPENDENT_COMPARISON_CONTRACT');
console.log(JSON.stringify(summary,null,2));
