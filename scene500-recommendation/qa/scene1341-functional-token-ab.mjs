// Exploratory lexical ablation; NOT a relevance evaluation. Keeps default scores byte-identical.
// Reuses the 32 open/nonblind query pairs; never accesses the protected blind 24-query intake.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadInputs} from '../scene1341-isolated-search.mjs';

const [casebookPath,catalogPath,rankedDir,sourceCommit,manifestSha]=process.argv.slice(2);
assert.ok(casebookPath&&catalogPath&&rankedDir&&/^[0-9a-f]{40}$/.test(sourceCommit||'')&&/^[0-9a-f]{40}$/.test(manifestSha||''));
const prior=JSON.parse(fs.readFileSync(casebookPath,'utf8'));
assert.equal(prior.sourceCommit,sourceCommit);
assert.equal(prior.manifestSha,manifestSha);
assert.equal(prior.caseCount,32);
assert.equal(prior.independentGoldCount,0);
const index=loadInputs(catalogPath,rankedDir,{sourceCommit,manifestSha});
assert.equal(index.sceneCount,1341);
assert.equal(index.rankedSceneCount,110);
assert.equal(index.expressionCount,19371);
const inspect=(query,existing,experimentalIntentAliases)=>{
 const baseline=index.search(query,{limit:10,experimentalIntentAliases});
 const defaultExplicit=index.search(query,{limit:10,experimentalIntentAliases,experimentalFunctionalTokenGuard:false});
 assert.deepEqual(defaultExplicit,baseline,'opt-in flag must not change default');
 if(!experimentalIntentAliases)assert.deepEqual(baseline.map(x=>({scene_id:x.scene_id,score:x.score,explanations:x.explanations})),existing.top10,'must preserve previously captured open casebook results');
 const changed=index.search(query,{limit:10,experimentalIntentAliases,experimentalFunctionalTokenGuard:true});
 for(const res of changed){assert.equal(res.release_status,'BLOCKED_PENDING_CG_QA_AND_MUSE');assert.equal(res.cg_qa,'NOT_REVIEWED_FOR_THIS_INDEX');}
 const projection=items=>items.map((x,i)=>({rank:i+1,scene_id:x.scene_id,name:x.name,score:x.score,has_ranked_data:x.has_ranked_data,explanations:x.explanations}));
 return {query,baseline:projection(baseline),guard:projection(changed),changed:JSON.stringify(baseline)!==JSON.stringify(changed),top1Changed:baseline[0]?.scene_id!==changed[0]?.scene_id,emptyBaseline:baseline.length===0,emptyGuard:changed.length===0};
};
const records=[];for(const c of prior.cases){
 const evaluations=[];
 for(const flag of [false,true]){
  evaluations.push({experimentalIntentAliases:flag,control:inspect(c.control.query,c.control,flag),contrast:inspect(c.contrast.query,c.contrast,flag)});
 }
 records.push({id:c.id,cohort:c.cohort,evaluations,independentRelevanceVerdict:'PENDING'});
}
assert.equal(records.length,32);
const all=records.flatMap(r=>r.evaluations.flatMap(v=>[v.control,v.contrast]));
assert.equal(all.length,128);
const watched=[
 '刚下单的外卖什么时候送达','食物会不会过期','不是买票，我要退票','不是买咖啡，而是想找厕所'
].map(query=>{
 const rec=all.find(x=>x.query===query);
 assert.ok(rec,'open casebook missing '+query);
 return {query,baselineTop5:rec.baseline.slice(0,5),guardTop5:rec.guard.slice(0,5),top1Changed:rec.top1Changed,changed:rec.changed};
});
const report={schema:'cg-rec-sc1341-functional-token-open-ab-v1',sourceCommit,manifestSha,caseCount:32,queryEvaluations:128,experiment:'ONLY_OPT_IN',functionalTokenSet:['不会','我要','不是','而是','只是','不要','不想','我想'],changedComparisons:all.filter(x=>x.changed).length,top1ChangedComparisons:all.filter(x=>x.top1Changed).length,emptyBaseline:all.filter(x=>x.emptyBaseline).length,emptyExperimental:all.filter(x=>x.emptyGuard).length,watched,records,independentGoldCount:0,release_allowed:false,conclusion:'NO_RELEVANCE_VERDICT_INFERRED: exploratory nonblind lexical ablation; all quality decisions need independent humans.'};
console.log(JSON.stringify(report,null,2));
