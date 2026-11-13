// Transparent source-provenance forensic trace for NONBLIND diagnostics.
// Rehydrates real ranked source-sense expressions and original catalog names.
// Produces only audit candidates, never a relevance verdict, gold, or a release grant.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {csv} from '../scene1341-search-core.mjs';
const [casebookFile,catalogPath,rankedDir,sourceCommit,manifestSha]=process.argv.slice(2);
assert.ok(casebookFile&&catalogPath&&rankedDir&&/^[0-9a-f]{40}$/.test(sourceCommit||'')&&/^[0-9a-f]{40}$/.test(manifestSha||''));
const doc=JSON.parse(fs.readFileSync(casebookFile,'utf8'));
assert.equal(doc.schema,'cg-rec-sc1341-open-nonblind-diagnostic-v1');
assert.equal(doc.sourceCommit,sourceCommit);
assert.equal(doc.manifestSha,manifestSha);
assert.equal(doc.engineReleaseAllowed,false);
assert.equal(doc.independentGoldCount,0);
assert.equal(doc.caseCount,32);
const catalog=csv(fs.readFileSync(catalogPath,'utf8'));
assert.equal(catalog.length,1341);
const scenes=new Map(catalog.map(r=>[r.id,{name:r.revised_name||r.name,category:r.category,original_name:r.name}]));
const senses=new Map();
let total=0;
for(let i=51;i<=61;i++){
 const rows=csv(fs.readFileSync(path.join(rankedDir,'v'+i+'-ranked.csv'),'utf8'));
 for(const r of rows){
   if(senses.has(r.sense_id))throw Error('DUPLICATE_SOURCE_SENSE '+r.sense_id);
   assert.ok(scenes.has(r.scene_id));
   senses.set(r.sense_id,{scene_id:r.scene_id,expression:r.expression,meaning:r.sense_zh,rank:r.rank,sourceShard:'v'+i});
   total++;
 }
}
assert.equal(total,19371);
const trace=results=>results.slice(0,10).map((r,rankIndex)=>{
 const scene=scenes.get(r.scene_id);
 assert.ok(scene,'unknown scene '+r.scene_id);
 const sourceId=r.explanations.find(x=>x.startsWith('matched_source_sense:'))?.slice('matched_source_sense:'.length);
 const evidence=sourceId?senses.get(sourceId):null;
 if(sourceId){assert.ok(evidence,'unresolvable source sense '+sourceId);assert.equal(evidence.scene_id,r.scene_id);}
 return {rank:rankIndex+1,scene_id:r.scene_id,scene_name:scene.name,original_scene_name:scene.original_name,scene_category:scene.category,score:r.score,has_ranked_data:r.has_ranked_data,matched_source_sense_id:sourceId||null,matched_source_expression:evidence?.expression||null,matched_source_meaning:evidence?.meaning||null,matched_source_rank:evidence?.rank||null,source_shard:evidence?.sourceShard||null,explanations:r.explanations};
});
const cases=doc.cases.map(c=>({id:c.id,cohort:c.cohort,control:{query:c.control.query,negatedSpans:c.control.negatedSpans,results:trace(c.control.top10)},contrast:{query:c.contrast.query,negatedSpans:c.contrast.negatedSpans,results:trace(c.contrast.top10)},top1Changed:c.top1_changed,independentAdjudication:'PENDING'}));
const watched=[
 {query:'刚下单的外卖什么时候送达',scenes:['SC50-0020','SC50-0023','SC50-0036','SC50-0037']},
 {query:'食物会不会过期',scenes:['SC50-0046','SC50-0512','SC50-0811','SC50-0042']},
 {query:'不是买票，我要退票',scenes:['SC50-0033','SC50-0064','SC50-0013','SC50-0075']},
 {query:'不是买咖啡，而是想找厕所',scenes:['SC50-0543','SC50-0033']}
].map(item=>{
 const c=cases.find(x=>x.control.query===item.query||x.contrast.query===item.query);
 assert.ok(c,'missing query from casebook: '+item.query);
 const half=c.control.query===item.query?c.control:c.contrast;
 return {query:item.query,context:half,sceneDirectory:item.scenes.map(id=>({scene_id:id,...scenes.get(id),retrievalRank:half.results.find(r=>r.scene_id===id)?.rank||null})),reviewStatus:'UNLABELED_SEMANTIC_RISK'};
});
const report={schema:'cg-rec-sc1341-nonblind-source-provenance-trace-v1',sourceCommit,manifestSha,caseCount:cases.length,sourceSenseRows:total,sourceSceneRows:scenes.size,casebookAuthoredNonblind:true,release_allowed:false,independentGoldCount:0,certifiedCount:0,watched, cases,limitation:'Top10 is a diagnostic snapshot with source evidence, not a gold label. Cross-category contrasts are not automatic correctness judgments. No hidden blind intake used, no production activation.'};
console.log(JSON.stringify(report,null,2));
