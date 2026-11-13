// Source-pinned *nonblind* diagnostic casebook. No independent relevance gold or QA PASS.
// Never read CG-REC-EVAL blind intake/predictions, never touch user history/SRS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadInputs} from '../scene1341-isolated-search.mjs';
import {negatedSpans} from '../scene1341-search-core.mjs';

const [catalogPath,rankedDir,sourceCommit,manifestSha]=process.argv.slice(2);
assert.ok(catalogPath&&rankedDir&&/^[0-9a-f]{40}$/.test(sourceCommit||'')&&/^[0-9a-f]{40}$/.test(manifestSha||''));
const index=loadInputs(catalogPath,rankedDir,{sourceCommit,manifestSha});
assert.equal(index.sceneCount,1341);
assert.equal(index.rankedSceneCount,110);
assert.equal(index.expressionCount,19371);
assert.equal(index.release_allowed,false);

// Deliberately transparent author-written diagnostic phrases. Not blind or ground truth.
const groups=[
 {name:'negated_vs_positive',pairs:[
  ['搬家','不是搬家，只是整理卧室'],
  ['整理房间','不是整理房间，而是洗衣与晾晒'],
  ['hotel check in','not hotel check in, but taxi'],
  ['外卖送达','不是外卖送达，只是查看订单'],
  ['机场 check in','not airport check in, but train'],
  ['买咖啡','不是买咖啡，而是想找厕所'],
  ['take a taxi','not take a taxi, but walk'],
  ['洗衣与晾晒','我不要洗衣，只想整理房间']
 ]},
 {name:'bilingual_context',pairs:[
  ['wake up','早上 wake up 之后洗漱'],
  ['hotel booking','酒店预订 hotel booking'],
  ['taxi','地铁停运 take taxi'],
  ['coffee','我想找 nearby coffee'],
  ['boarding pass','登机牌 boarding pass'],
  ['laundry','洗衣 detergent'],
  ['food delivery','外卖 order status'],
  ['room cleaning','整理卧室 clean room']
 ]},
 {name:'intent_scope',pairs:[
  ['外卖什么时候到','刚下单的外卖什么时候送达'],
  ['食物过期','食物会不会过期'],
  ['买票','不是买票，我要退票'],
  ['查订单','没有下单，只是在看菜单'],
  ['hospital','我想去医院但不是看急诊'],
  ['shopping','我不想购物，我要退货'],
  ['classroom','英语课堂里写作练习'],
  ['wake up','wake up and make breakfast']
 ]},
 {name:'identity_and_unranked',pairs:[
  ['SC50-0001','SC50-1341'],
  ['SC50-0004','整理房间'],
  ['SC50-0010','通知设置'],
  ['SC50-0037','刚下单的外卖什么时候送达'],
  ['SC50-0042','食物会不会过期'],
  ['SC50-0100','寻找场景'],
  ['SC50-0500','场景导航'],
  ['SC50-1341','最后一个场景']
 ]}
];
const cases=[];
for(const group of groups){
 for(let i=0;i<group.pairs.length;i++){
  const [control,contrast]=group.pairs[i];
  const render=query=>{
   const results=index.search(query,{limit:10,experimentalIntentAliases:false});
   assert.ok(results.length<=10&&new Set(results.map(r=>r.scene_id)).size===results.length);
   for(const r of results){assert.equal(r.release_status,'BLOCKED_PENDING_CG_QA_AND_MUSE');assert.equal(r.cg_qa,'NOT_REVIEWED_FOR_THIS_INDEX');assert.equal(r.provenance.source_commit,sourceCommit);}
   return {query,negatedSpans:negatedSpans(query),top10:results.map(r=>({scene_id:r.scene_id,score:r.score,has_ranked_data:r.has_ranked_data,explanations:r.explanations})),empty:results.length===0};
  };
  const a=render(control),b=render(contrast);
  cases.push({id:group.name+'-'+String(i+1).padStart(2,'0'),cohort:group.name,control:a,contrast:b,top1_changed:(a.top10[0]?.scene_id||null)!==(b.top10[0]?.scene_id||null),shared_top5:a.top10.slice(0,5).filter(x=>b.top10.slice(0,5).some(y=>y.scene_id===x.scene_id)).length,interpretation:'NEEDS_INDEPENDENT_SEMANTIC_REVIEW'});
 }
}
assert.equal(cases.length,32);
assert.equal(new Set(cases.map(c=>c.id)).size,32);
assert.deepEqual(groups.map(g=>g.pairs.length),[8,8,8,8]);
const report={schema:'cg-rec-sc1341-open-nonblind-diagnostic-v1',sourceCommit,manifestSha,engine:'scene500-recommendation-dev',engineReleaseAllowed:false,editorialSourceReadOnly:true,independentGoldCount:0,certifiedCount:0,cohorts:groups.map(g=>({name:g.name,pairs:g.pairs.length})),caseCount:cases.length,queryExecutions:cases.length*2,top1ChangedCount:cases.filter(c=>c.top1_changed).length,emptyQueryCount:cases.reduce((n,c)=>n+Number(c.control.empty)+Number(c.contrast.empty),0),cases,disclaimer:'Exploratory author-written casebook. Query pairs deliberately alter intent/context; changed ranking may be appropriate. No precision, recall, NDCG, independent human labels, Safari claim or release authorization.'};
console.log(JSON.stringify(report,null,2));
