// Open, author-written NONBLIND counterfactual failure analysis.
// Consumes exactly PR96 four-arm source-pinned evidence; does not read protected blind24.
// No generated labels, relevance wins, or default flags.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const [input] = process.argv.slice(2);
assert.ok(input, 'FACTORIAL_JSON_REQUIRED');
const source = JSON.parse(fs.readFileSync(input,'utf8'));
assert.equal(source.schema,'cg-rec-sc1341-nonblind-four-arm-factorial-v1');
assert.equal(source.formalHumanGold,0);
assert.equal(source.release_allowed,false);
assert.equal(source.protectedBlind24Accessed,false);
assert.equal(source.defaultFlagsBothFalse,true);
assert.equal(source.stats.queries,59);
assert.equal(source.stats.evaluations,236);
const ids = ['baseline','functional_guard','source_anchor_intent','combined'];
const targets = [
 ['food_delivery','刚下单的外卖什么时候送达'],
 ['food_expiry','食物会不会过期'],
 ['ticket_refund','不是买票，我要退票'],
 ['contrastive_toilet','不是买咖啡，而是想找厕所']
];
const byQuery = new Map(source.records.map(x=>[x.query,x]));
assert.equal(byQuery.size,59);
const outputs = targets.map(([caseId,query])=>{
 const record=byQuery.get(query);
 assert.ok(record, 'MISSING_OPEN_CASE '+query);
 const baseline=record.arms.baseline;
 assert.ok(Array.isArray(baseline) && baseline.length, 'EMPTY_BASELINE '+query);
 const armResults={};
 for(const id of ids){
  const rows=record.arms[id];
  assert.ok(Array.isArray(rows)&&rows.length<=10,'INVALID_ARM '+id);
  assert.equal(new Set(rows.map(x=>x.scene_id)).size,rows.length,'DUPLICATE_SCENE');
  const baseSet=new Set(baseline.slice(0,5).map(x=>x.scene_id));
  const currentSet=new Set(rows.slice(0,5).map(x=>x.scene_id));
  armResults[id]={
   top1:rows[0]?.scene_id??null,
   top1_name:rows[0]?.name??null,
   top1_score:rows[0]?.score??null,
   top5:rows.slice(0,5).map(x=>x.scene_id),
   top5_overlap_with_baseline:[...currentSet].filter(x=>baseSet.has(x)).length,
   changes_top1:rows[0]?.scene_id!==baseline[0]?.scene_id,
   source_anchor_explanations:rows.flatMap(x=>x.explanations||[]).filter(x=>x.startsWith('EXPERIMENTAL_UNCERTIFIED_INTENT:')),
   rank_deltas_from_baseline:Object.fromEntries(baseline.slice(0,5).map((x,i)=>[x.scene_id,rows.findIndex(y=>y.scene_id===x.scene_id)<0?null:(i+1)-(rows.findIndex(y=>y.scene_id===x.scene_id)+1)]))
  };
 }
 return {caseId,query,sourceCaseIds:record.sourceCaseIds,arms:armResults,editorialRelevance:'NOT_ADJUDICATED',failureCauseStatus:'HYPOTHESIS_ONLY'};
});
const changed=source.records.filter(r=>ids.slice(1).some(id=>r.arms[id][0]?.scene_id!==r.arms.baseline[0]?.scene_id));
const report={
 schema:'cg-rec-sc1341-open-counterfactual-top5-audit-v1',
 sourceCommit:source.sourceCommit,
 manifestSha:source.manifestSha,
 sourceQueries:59,
 fourArmExecutions:236,
 targetCases:outputs,
 anyTop1ChangedQueries:changed.length,
 changedQueryAudit:changed.map(r=>({query:r.query,sourceCaseIds:r.sourceCaseIds,top1:Object.fromEntries(ids.map(id=>[id,r.arms[id][0]?.scene_id??null]))})),
 formalHumanGold:0,blind24Accessed:false,sourceDataEdited:false,algorithmChanged:false,
 defaultFlagsBothFalse:true,release_allowed:false,
 interpretation:'Changes in Top1/Top5, source anchors and scores are structural counterfactual differences only; no relevance win or statistical accuracy claim.'
};
assert.equal(report.targetCases.length,4);
assert.equal(report.targetCases[0].arms.baseline.top1,'SC50-0020');
assert.equal(report.targetCases[1].arms.baseline.top1,'SC50-0046');
assert.equal(report.targetCases[2].arms.baseline.top1,'SC50-0033');
assert.equal(report.targetCases[3].arms.baseline.top1,'SC50-0543');
console.log(JSON.stringify(report,null,2));
