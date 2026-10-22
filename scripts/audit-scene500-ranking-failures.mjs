// Diagnostic post-run error audit; does not relabel reference data.
import fs from 'node:fs';
const [catalogPath,evaluationPath,outPath]=process.argv.slice(2);
if(!catalogPath||!evaluationPath||!outPath)throw Error('Usage: node audit-scene500-ranking-failures.mjs catalog.json native-node-evaluation.json output.json');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const evalReport=JSON.parse(fs.readFileSync(evaluationPath,'utf8'));
if(catalog.scene_count!==500||!catalog.scenes||!evalReport?.baseline?.details||!evalReport?.hybrid?.details)
 throw Error('SCENE500_INVALID_FAILURE_AUDIT_INPUT');
const old=evalReport.baseline.details,now=evalReport.hybrid.details;
if(old.length!==now.length)throw Error('SCENE500_MISMATCHED_EVALUATION_CASES');
const records=old.map((before,index)=>{
 const after=now[index],ids=after.expected;
 if(after.query!==before.query||JSON.stringify(ids)!==JSON.stringify(before.expected)||!Array.isArray(ids)||!Array.isArray(after.top5))
  throw Error('SCENE500_MISMATCHED_QUERY_OR_LABEL: '+index);
 const names=ids.map(id=>{if(!catalog.scenes[id])throw Error('SCENE500_UNKNOWN_EXPECTED_ID: '+id);return catalog.scenes[id].name});
 const predNames=after.top5.map(id=>{if(!catalog.scenes[id])throw Error('SCENE500_UNKNOWN_PREDICTED_ID: '+id);return catalog.scenes[id].name});
 const hitIds=ids.filter(id=>after.top5.includes(id));
 const status=hitIds.length===ids.length?'fully_hit':hitIds.length===0?'missed_all':'partial_hit';
 return {query:after.query,label_scene_ids:ids,label_scene_names:names,top5:after.top5,top5_names:predNames,hit_ids:hitIds,status,baseline_recall5:before.recall5,candidate_recall5:after.recall5,label_review_status:'editorial_unreviewed'};
});
const summary={collection:'existing_diagnostic_not_blind',total:records.length,fully_hit:records.filter(r=>r.status==='fully_hit').length,partial_hit:records.filter(r=>r.status==='partial_hit').length,missed_all:records.filter(r=>r.status==='missed_all').length,review_warning:'At least three labels are disputed; a miss is not automatically an algorithm defect.'};
fs.writeFileSync(outPath,JSON.stringify({schema:'scene500-v094-failure-audit-v0.1',summary,records},null,2)+'\n');
console.log(JSON.stringify(summary));
