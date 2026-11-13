// Four-arm, source-pinned open NONBLIND experiment. No human gold and no default promotion.
// Compare default, lexical function-token guard, source-anchored intent hints, and both.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadInputs} from '../scene1341-isolated-search.mjs';
const [casebookPath,catalog,dir,sourceCommit,manifestSha]=process.argv.slice(2);
assert.ok(casebookPath&&catalog&&dir&&/^[0-9a-f]{40}$/.test(sourceCommit||'')&&/^[0-9a-f]{40}$/.test(manifestSha||''));
const saved=JSON.parse(fs.readFileSync(casebookPath,'utf8'));
assert.equal(saved.schema,'cg-rec-sc1341-open-nonblind-diagnostic-v1');
assert.equal(saved.sourceCommit,sourceCommit);assert.equal(saved.manifestSha,manifestSha);
assert.equal(saved.independentGoldCount,0);assert.equal(saved.caseCount,32);
const index=loadInputs(catalog,dir,{sourceCommit,manifestSha});
assert.equal(index.sceneCount,1341);assert.equal(index.rankedSceneCount,110);assert.equal(index.expressionCount,19371);
const qMap=new Map();
for(const c of saved.cases)for(const item of [c.control,c.contrast]){
 if(!qMap.has(item.query))qMap.set(item.query,{query:item.query,sourceCaseIds:new Set(),prior: item.top10});
 qMap.get(item.query).sourceCaseIds.add(c.id);
}
assert.equal(qMap.size,59,'expected 59 different human-readable open diagnostic queries');
const arms=[
 {id:'baseline',experimentalIntentAliases:false,experimentalFunctionalTokenGuard:false},
 {id:'functional_guard',experimentalIntentAliases:false,experimentalFunctionalTokenGuard:true},
 {id:'source_anchor_intent',experimentalIntentAliases:true,experimentalFunctionalTokenGuard:false},
 {id:'combined',experimentalIntentAliases:true,experimentalFunctionalTokenGuard:true}
];
const projection=items=>items.map((x,i)=>({rank:i+1,scene_id:x.scene_id,name:x.name,score:x.score,explanations:x.explanations,has_ranked_data:x.has_ranked_data}));
const records=[];
for(const item of qMap.values()){
 const result={query:item.query,sourceCaseIds:[...item.sourceCaseIds],arms:{}};
 for(const arm of arms){
   const raw=index.search(item.query,{limit:10,experimentalIntentAliases:arm.experimentalIntentAliases,experimentalFunctionalTokenGuard:arm.experimentalFunctionalTokenGuard});
   assert.ok(raw.length<=10&&new Set(raw.map(x=>x.scene_id)).size===raw.length);
   for(const x of raw){assert.equal(x.release_status,'BLOCKED_PENDING_CG_QA_AND_MUSE');assert.equal(x.cg_qa,'NOT_REVIEWED_FOR_THIS_INDEX');}
   result.arms[arm.id]=projection(raw);
 }
 assert.deepEqual(result.arms.baseline.map(x=>({scene_id:x.scene_id,score:x.score,has_ranked_data:x.has_ranked_data,explanations:x.explanations})),item.prior,'must reproduce source-pinned PR85 nonblind default');
 const a=result.arms;
 result.effect={
   functionalTop1Changed:a.baseline[0]?.scene_id!==a.functional_guard[0]?.scene_id,
   anchorTop1Changed:a.baseline[0]?.scene_id!==a.source_anchor_intent[0]?.scene_id,
   combinedTop1Changed:a.baseline[0]?.scene_id!==a.combined[0]?.scene_id,
   anchorAddedSourceIntent:a.source_anchor_intent.some(x=>x.explanations.some(e=>e.startsWith('EXPERIMENTAL_UNCERTIFIED_INTENT:'))),
   combinedAddedSourceIntent:a.combined.some(x=>x.explanations.some(e=>e.startsWith('EXPERIMENTAL_UNCERTIFIED_INTENT:'))),
   combinedDiffersFromEither:A(a.combined)!==A(a.functional_guard)&&A(a.combined)!==A(a.source_anchor_intent)
 };
 records.push(result);
}
function A(v){return JSON.stringify(v);}
const watchedQueries=['刚下单的外卖什么时候送达','食物会不会过期','不是买票，我要退票','不是买咖啡，而是想找厕所'];
const watched=watchedQueries.map(q=>{const x=records.find(y=>y.query===q);assert.ok(x,'missing open query '+q);return {query:q,arms:Object.fromEntries(arms.map(a=>[a.id,x.arms[a.id].slice(0,5)])),effect:x.effect};});
const stats={
 queries:records.length,evaluations:records.length*arms.length,
 functionalTop1Changed:records.filter(r=>r.effect.functionalTop1Changed).length,
 anchorTop1Changed:records.filter(r=>r.effect.anchorTop1Changed).length,
 combinedTop1Changed:records.filter(r=>r.effect.combinedTop1Changed).length,
 anchorEvidenceQueries:records.filter(r=>r.effect.anchorAddedSourceIntent).length,
 combinedEvidenceQueries:records.filter(r=>r.effect.combinedAddedSourceIntent).length,
 combinedDistinctFromEither:records.filter(r=>r.effect.combinedDiffersFromEither).length
};
assert.equal(stats.queries,59);assert.equal(stats.evaluations,236);
const report={schema:'cg-rec-sc1341-nonblind-four-arm-factorial-v1',sourceCommit,manifestSha,sourceSceneCount:1341,sourceExpressionCount:19371,arms,stats,watched,records,reviewStatus:'NOT_ADJUDICATED',formalHumanGold:0,release_allowed:false,defaultFlagsBothFalse:true,sourceDataEdited:false,protectedBlind24Accessed:false,disclaimer:'Open author-written queries only. Structural changes and provisional anchored hypotheses are NOT demonstrated relevance gains; require independent human adjudication.'};
console.log(JSON.stringify(report,null,2));
