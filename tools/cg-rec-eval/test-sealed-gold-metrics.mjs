// SYNTHETIC metric-calibration fixture; intentionally no real Scene1341 relevance labels.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'cg-rec-eval-metric-check-'));
try{
 const source=JSON.parse(fs.readFileSync(new URL('./scene1341-blind-intake-24.v1.json',import.meta.url),'utf8'));
 const cases=source.queries.map((q,k)=>({
  query_id:q.id,query:q.query,group:q.group,
  annotator_A:{status:'LOCKED',assessor_id:'SYNTHETIC_A',scene_relevance:[{scene_id:'SC50-0001',grade:3},{scene_id:'SC50-0002',grade:0}],none_relevant:false,rationale:'synthetic calibration'},
  annotator_B:{status:'LOCKED',assessor_id:'SYNTHETIC_B',scene_relevance:[{scene_id:'SC50-0001',grade:3},{scene_id:'SC50-0002',grade:0}],none_relevant:false,rationale:'synthetic calibration'},
  adjudication:{status:'LOCKED',none_relevant:false,scene_relevance:[{scene_id:'SC50-0001',grade:3},{scene_id:'SC50-0002',grade:0}],decision_reason:'synthetic fixture'}
 }));
 const gold={status:'LOCKED_ADJUDICATED_GOLD',officialGold:true,cases};
 const predictions={status:'PREDICTIONS_SEPARATED_FROM_UNADJUDICATED_QUERY_SET',queryCount:24,labeledCount:0,upstreamCommit:'SYNTHETIC_TEST_ONLY',manifestSha:'SYNTHETIC_TEST_ONLY',
 rows:source.queries.map(q=>({id:q.id,query:q.query,group:q.group,integrationTop10:[{scene_id:'SC50-0001'}],upstreamTop10:[{scene_id:'SC50-0002'},{scene_id:'SC50-0001'}]}))};
 const gp=path.join(folder,'synthetic-gold.json'),pp=path.join(folder,'synthetic-predictions.json');
 fs.writeFileSync(gp,JSON.stringify(gold));fs.writeFileSync(pp,JSON.stringify(predictions));
 const scorer=new URL('./score-sealed-blind-gold.mjs',import.meta.url).pathname;
 const child=spawnSync(process.execPath,[scorer,gp,pp],{encoding:'utf8'});
 if(child.status!==0)throw Error('SYNTHETIC_CALIBRATION_SCORER_FAILURE '+child.stderr);
 const output=JSON.parse(child.stdout);const exact=(a,b)=>Math.abs(a-b)<1e-12;
 const checks=[
  ['integration.top1',output.overall.integration.top1,1],
  ['integration.recall5',output.overall.integration.recall5,1],
  ['integration.mrr5',output.overall.integration.mrr5,1],
  ['integration.ndcg5',output.overall.integration.ndcg5,1],
  ['upstream.top1',output.overall.upstream.top1,0],
  ['upstream.recall5',output.overall.upstream.recall5,1],
  ['upstream.mrr5',output.overall.upstream.mrr5,.5],
  ['upstream.ndcg5',output.overall.upstream.ndcg5,1/Math.log2(3)]
 ];
 for(const [key,actual,expected]of checks)if(!exact(actual,expected))throw Error('METRIC_CALIBRATION_FAILED '+key+' '+actual+' expected '+expected);
 for(const group of ['zh','en','mixed'])if(output.byGroup[group].integration.n!==8||output.byGroup[group].upstream.mrr5!==.5)throw Error('GROUP_METRIC_ERROR '+group);
 console.log(JSON.stringify({status:'SYNTHETIC_METRIC_CALIBRATION_PASS',syntheticOnly:true,realGoldCreated:false,checks:checks.length,realCertifiedGold:0}));
}finally{fs.rmSync(folder,{recursive:true,force:true});}
