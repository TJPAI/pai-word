// Independent-review handoff for the EIGHT unique affected open/nonblind queries.
// No relevance labels, no access to protected blind cases, no default ranking changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const [abPath,provenancePath]=process.argv.slice(2);
assert.ok(abPath&&provenancePath,'expected source-pinned A/B and provenance reports');
const ab=JSON.parse(fs.readFileSync(abPath,'utf8'));
const provenance=JSON.parse(fs.readFileSync(provenancePath,'utf8'));
assert.equal(ab.schema,'cg-rec-sc1341-functional-token-open-ab-v1');
assert.equal(provenance.schema,'cg-rec-sc1341-nonblind-source-provenance-trace-v1');
assert.equal(ab.sourceCommit,provenance.sourceCommit);
assert.equal(ab.manifestSha,provenance.manifestSha);
assert.equal(ab.independentGoldCount,0);
assert.equal(ab.release_allowed,false);
assert.equal(ab.distinctChangedQueryCount,8);
assert.equal(ab.distinctTop1ChangedQueryCount,3);
const affected=new Set(ab.distinctChangedQueries.map(x=>x.query));
const rows=new Map();
for(const rec of ab.records){
 for(const e of rec.evaluations){
  for(const [side,result] of [['control',e.control],['contrast',e.contrast]]){
   if(!affected.has(result.query))continue;
   if(!rows.has(result.query))rows.set(result.query,{query:result.query,observations:[],sourceCaseIds:new Set()});
   const row=rows.get(result.query);
   row.sourceCaseIds.add(rec.id);
   row.observations.push({caseId:rec.id,side,experimentalIntentAliases:e.experimentalIntentAliases,defaultTop10:result.baseline,guardTop10:result.guard,fullResultsChanged:result.changed,top1Changed:result.top1Changed});
  }
 }
}
assert.equal(rows.size,8);
const byQuery=new Map();
for(const c of provenance.cases){
 for(const side of ['control','contrast']){
  const result=c[side];
  if(!byQuery.has(result.query))byQuery.set(result.query,result.results);
 }
}
const reviewItems=[...rows.values()].map(row=>{
 const sourceTop10=byQuery.get(row.query);
 assert.ok(sourceTop10,'no source evidence '+row.query);
 const defaultRun=row.observations.find(x=>!x.experimentalIntentAliases);
 assert.ok(defaultRun,'no alias-off baseline '+row.query);
 assert.deepEqual(defaultRun.defaultTop10.map(x=>x.scene_id),sourceTop10.map(x=>x.scene_id));
 return {query:row.query,sourceCaseIds:[...row.sourceCaseIds].sort(),repeatedObservations:row.observations.length,top1ChangedInAnyRun:row.observations.some(x=>x.top1Changed),defaultTop1:defaultRun.defaultTop10[0]?.scene_id||null,experimentalTop1:defaultRun.guardTop10[0]?.scene_id||null,sourceExactBaselineTop10:sourceTop10,allVariantResults:row.observations,independentRelevanceVerdict:'NOT_ADJUDICATED',humanReviewer1:null,humanReviewer2:null,sourceSemanticReview:'PENDING'};
});
assert.equal(reviewItems.filter(x=>x.top1ChangedInAnyRun).length,3);
const packet={schema:'cg-rec-sc1341-open-eight-unique-queries-adjudication-handoff-v1',sourceCommit:ab.sourceCommit,manifestSha:ab.manifestSha,caseCount:ab.caseCount,comparisonExecutions:ab.queryEvaluations,uniqueQueries:ab.distinctQueryCount,affectedUniqueQueries:reviewItems.length,top1ChangedUniqueQueries:3,formalHumanGold:0,release_allowed:false,independentReviewRequired:true,doNotUseForBlindGold:true,reviewItems,warning:'Source-pinned open nonblind diagnostic only. Reviewer judgments must be collected independently and cannot retroactively become protected blind24 gold.'};
console.log(JSON.stringify(packet,null,2));
