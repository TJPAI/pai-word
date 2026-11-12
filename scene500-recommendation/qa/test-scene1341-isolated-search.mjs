import assert from 'node:assert/strict';
import {loadInputs,csv} from '../scene1341-isolated-search.mjs';
const [catalog,dir,commit,blob]=process.argv.slice(2);
const index=loadInputs(catalog,dir,{sourceCommit:commit,manifestSha:blob});
assert.equal(index.sceneCount,1341);assert.equal(index.rankedSceneCount,110);assert.equal(index.expressionCount,19371);assert.equal(index.certifiedCount,0);assert.equal(index.release_allowed,false);
const queries=[
 ['起床与晨间准备','SC50-0001'],
 ['洗漱与个人清洁','SC50-0002'],
 ['整理房间','SC50-0004'],
 ['wake up','SC50-0001'],
 ['洗衣与晾晒','SC50-0006']
];
for(const [q,id] of queries){const got=index.search(q);assert.equal(got[0]?.scene_id,id,JSON.stringify({q,top:got.slice(0,3)}));assert.deepEqual(got,index.search(q));assert.ok(got.length<=10);assert.equal(got[0].release_status,'BLOCKED_PENDING_CG_QA_AND_MUSE');}
const mixed=['早上 wake up 之后洗漱','hotel 预订入住','我想找 nearby coffee','机场 check in','地铁停运 take taxi','我不是搬家，只是整理卧室'];
const diagnostic=mixed.map(query=>({query,top5:index.search(query).slice(0,5).map(x=>({scene_id:x.scene_id,score:x.score,has_ranked_data:x.has_ranked_data,explanations:x.explanations}))}));
for(const d of diagnostic){assert.ok(d.top5.length<=5);assert.equal(new Set(d.top5.map(x=>x.scene_id)).size,d.top5.length);}
const notDelivered=index.search('SC50-1341')[0];assert.equal(notDelivered.scene_id,'SC50-1341');assert.equal(notDelivered.has_ranked_data,false);assert.equal(notDelivered.ranked_records,0);
// Experiments must be opt-in, source anchored and never mutate baseline results.
const missed=[
 {q:'刚下单的外卖什么时候送达',expected:'SC50-0037',anchor:'SC50-0037-0017'},
 {q:'食物会不会过期',expected:'SC50-0042',anchor:'SC50-0042-0020'},
 {q:'takeaway 外卖送到哪儿了',expected:'SC50-0037',anchor:'SC50-0037-0017'}
];
for(const c of missed){
 const baseline=index.search(c.q,{limit:10});
 const optin=index.search(c.q,{limit:10,experimentalIntentAliases:true});
 assert.ok(optin.some(x=>x.scene_id===c.expected&&x.explanations.some(e=>e.includes('EXPERIMENTAL_UNCERTIFIED_INTENT')&&e.includes(c.anchor))),JSON.stringify(c));
 assert.deepEqual(index.search(c.q,{limit:10}),baseline,'baseline must remain identical after experiments');
 assert.equal(optin[0].release_status,'BLOCKED_PENDING_CG_QA_AND_MUSE');
}
const noLeak=index.search('我要买外卖，但还没下单',{experimentalIntentAliases:true});
assert.ok(!noLeak.some(x=>x.explanations.some(e=>e.startsWith('EXPERIMENTAL_UNCERTIFIED_INTENT'))));
assert.deepEqual(csv('one,two\na,"b,c"\n'),[{one:'a',two:'b,c'}]);
assert.throws(()=>loadInputs(catalog,dir,{sourceCommit:'unversioned',manifestSha:blob}),/PINNED_SOURCE/);
const experimentalCaseComparisons=missed.map(c=>({query:c.q,provisional_target:c.expected,baseline_top10:index.search(c.q,{limit:10}).map(x=>x.scene_id),optin_top10:index.search(c.q,{limit:10,experimentalIntentAliases:true}).map(x=>x.scene_id),review_status:'UNADJUDICATED_EXPERIMENT_ONLY'}));
console.log(JSON.stringify({experimentalCaseComparisons,status:'PASS_ISOLATED_STRUCTURE_AND_SMOKE',gold_labels:'PROVISIONAL_NON_BLIND',source_commit:commit,manifest_blob:blob,scenes:index.sceneCount,ranked_scenes:index.rankedSceneCount,ranked_expressions:index.expressionCount,independent_certified:0,release_allowed:false,smoke_query_count:queries.length,mixed_diagnostic_count:diagnostic.length,diagnostic},null,2));
