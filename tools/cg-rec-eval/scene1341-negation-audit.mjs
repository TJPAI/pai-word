// Controlled source-level negation fix ablation. Does not modify upstream candidate or production.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
const [catalogPath,rankedDir,sourceCommit,manifestSha]=process.argv.slice(2);
if(![catalogPath,rankedDir,sourceCommit,manifestSha].every(Boolean))throw Error('EXPECTED_PINNED_SOURCE_AND_DATA');
const base=new URL('../../scene500-recommendation/scene1341-isolated-search.mjs',import.meta.url);
const source=fs.readFileSync(base,'utf8');
const trigger='if(negative.length)';
if(source.split(trigger).length!==2)throw Error('NEGATIVE_LENGTH_SOURCE_MARKER_CHANGED_REVIEW_REQUIRED');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cg-rec-negation-'));
const patched=path.join(scratch,'scene1341-isolated-search.mjs');
fs.writeFileSync(patched,source.replace(trigger,'if(negative.size)'));
const original=await import(base.href);
const corrected=await import(pathToFileURL(patched).href);
const files=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(rankedDir,'v'+(51+i)+'-ranked.csv'),'utf8'));
const raw=fs.readFileSync(catalogPath,'utf8');
const meta={sourceCommit,manifestSha};
const before=original.buildCatalog(raw,files,meta),after=corrected.buildCatalog(raw,files,meta);
const queries=[
 ['N001','我不是搬家，只是整理卧室','SC50-0004'],
 ['N002','不想做家务，我只想整理房间','SC50-0004'],
 ['N003','不想看电视，我要照顾宠物','SC50-0014'],
 ['N004','不是外卖下单，我是来取餐的','SC50-0037'],
 ['N005','我不是在点餐，只是问食材','SC50-0030'],
 ['N006','不是洗衣服，而是整理衣柜','SC50-0003'],
 ['N007','不是收快递，是要寄包裹',null],
 ['N008','not coffee, I want to order food','SC50-0028'],
 ['N009','不是看电视，而是准备睡觉','SC50-0022'],
 ['N010','不是厨房清洁，是要做饭','SC50-0007'],
 ['N011','我要修理家电，不是买新的','SC50-0017'],
 ['N012','不是酒店入住，是预约餐厅',null],
 ['N013','整理房间但不要搬家','SC50-0004'],
 ['N014','不想点外卖，去咖啡馆','SC50-0023']
];
const rows=[];
for(const [id,query,provisionalTarget] of queries){
 function run(engine){
  const start=performance.now();const results=engine.search(query,{limit:10});
  return {top10:results.map(x=>x.scene_id),top3:results.slice(0,3).map(x=>({scene_id:x.scene_id,score:x.score,explanations:x.explanations})),elapsedMs:performance.now()-start};
 }
 const b=run(before),a=run(after);
 rows.push({id,query,provisionalTarget,label_status:'UNADJUDICATED_CATALOG_INFORMED',before:b,patched:a,changed:b.top10.join('|')!==a.top10.join('|'),top1Changed:b.top10[0]!==a.top10[0]});
}
fs.rmSync(scratch,{recursive:true,force:true});
console.log(JSON.stringify({status:'SC1341_NEGATION_SET_SIZE_CONTROLLED_SOURCE_ABLATION',sourceCommit,manifestSha,onlyPatch:'if(negative.length) -> if(negative.size)',dataScenes:before.sceneCount,rankedScenes:before.rankedSceneCount,expressionCount:before.expressionCount,qa_status:'PROVISIONAL_DIAGNOSTIC_NOT_GOLD',queryCount:rows.length,changed:rows.filter(x=>x.changed).length,top1Changed:rows.filter(x=>x.top1Changed).length,rows},null,2));
