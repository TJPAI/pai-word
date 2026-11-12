// Independent fixed-source comparison of historical CG-REC and the negation-fix candidate.
// The 22 expected targets are catalog-informed provisional, never blind-gold.
// The 14 negation queries are read from the immutable preceding ablation artifact.
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {loadInputs as loadOld} from '../../scene500-recommendation/scene1341-isolated-search.mjs';
import {loadInputs as loadNew} from '../../../candidate-latest/scene500-recommendation/scene1341-isolated-search.mjs';
const [catalogPath,rankedDir,sourceCommit,manifestSha,queriesPath,negationPath]=process.argv.slice(2);
if(![catalogPath,rankedDir,sourceCommit,manifestSha,queriesPath,negationPath].every(Boolean))throw Error('MISSING_FIXED_INPUTS');
const cases=JSON.parse(fs.readFileSync(queriesPath,'utf8'));
const neg=JSON.parse(fs.readFileSync(negationPath,'utf8'));
if(cases.cases?.length!==22||neg.rows?.length!==14||neg.qa_status!=='PROVISIONAL_DIAGNOSTIC_NOT_GOLD')throw Error('EXPECTED_SOURCE_CASES_22_AND_14');
const old=loadOld(catalogPath,rankedDir,{sourceCommit,manifestSha});
const current=loadNew(catalogPath,rankedDir,{sourceCommit,manifestSha});
if(old.sceneCount!==1341||current.sceneCount!==1341||old.expressionCount!==19371||current.expressionCount!==19371)throw Error('PINNED_COUNTS_MISMATCH');
const queries=[
 ...cases.cases.map(c=>({id:c.id,query:c.query,expected:c.expected,group:c.group||'unspecified',label:'CATALOG_INFORMED_NONBLIND'})),
 ...neg.rows.map(c=>({id:c.id,query:c.query,expected:c.provisionalTarget,group:'negation',label:'UNADJUDICATED_DIAGNOSTIC'}))
];
if(new Set(queries.map(x=>x.id)).size!==36)throw Error('NONUNIQUE_CASE_ID');
function run(engine,q){
 const start=performance.now(),r=engine.search(q,{limit:10,experimentalIntentAliases:false}),elapsedMs=performance.now()-start;
 const ids=r.map(x=>x.scene_id);
 if(ids.length>10||ids.length!==new Set(ids).size||ids.some(id=>!/^SC50-\\d{4}$/.test(id)))throw Error('INVALID_SEARCH_OUTPUT');
 return {top10:ids,top1:ids[0]||null,top5:ids.slice(0,5),elapsedMs,
  sourceIds:r.map(x=>x.explanations?.filter(y=>y.startsWith('matched_source_sense:'))||[])};
}
const rows=queries.map(q=>{
 const before=run(old,q.query),after=run(current,q.query);
 const beforeRank=q.expected?before.top10.indexOf(q.expected):-1,afterRank=q.expected?after.top10.indexOf(q.expected):-1;
 return {...q,before,after,changed:before.top10.join('|')!==after.top10.join('|'),
  top1Changed:before.top1!==after.top1,
  expectedRankBefore:beforeRank<0?null:beforeRank+1,
  expectedRankAfter:afterRank<0?null:afterRank+1,
  top5Regression:q.expected?beforeRank>=0&&beforeRank<5&&!(afterRank>=0&&afterRank<5):null,
  top5Gain:q.expected?!(beforeRank>=0&&beforeRank<5)&&afterRank>=0&&afterRank<5:null};
});
const metrics=arr=>{
 const judged=arr.filter(x=>x.expected);
 const measure=key=>({
  n:judged.length,
  top1:judged.filter(x=>x[key].top1===x.expected).length,
  hit5:judged.filter(x=>x[key].top5.includes(x.expected)).length,
  empty:arr.filter(x=>x[key].top10.length===0).length,
  mrr10:judged.reduce((s,x)=>{const k=x[key].top10.indexOf(x.expected);return s+(k<0?0:1/(k+1));},0)/judged.length,
  ndcg5:judged.reduce((s,x)=>{const k=x[key].top5.indexOf(x.expected);return s+(k<0?0:1/Math.log2(k+2));},0)/judged.length
 });
 return {historical:measure('before'),fixed:measure('after')};
};
const byGroup=Object.fromEntries([...new Set(rows.map(x=>x.group))].map(g=>{
 const subset=rows.filter(x=>x.group===g);
 return [g,{queries:subset.length,changed:subset.filter(x=>x.changed).length,top1Changed:subset.filter(x=>x.top1Changed).length,...metrics(subset)}];
}));
const result={status:'SOURCE_PINNED_CG_REC_OLD_VS_FIXED_DIAGNOSTIC_NONBLIND',
 candidateOld:'83a94cb1b6fd2a08143886b6be845ebc408e41e8',
 candidateFixed:'2d143b98953a3010e72ae51059ea7557eeef1aec',
 sourceCommit,manifestSha,queryCount:rows.length,sceneCount:1341,expressionCount:19371,
 changed:rows.filter(x=>x.changed).length,top1Changed:rows.filter(x=>x.top1Changed).length,
 top5Regressions:rows.filter(x=>x.top5Regression).map(x=>x.id),
 top5Gains:rows.filter(x=>x.top5Gain).map(x=>x.id),
 byGroup,metrics:metrics(rows),officialGold:false,releaseAllowed:false,rows};
if(rows.length!==36||rows.some(x=>!x.before||!x.after))throw Error('INCOMPLETE_PAIRWISE_RESULTS');
console.log(JSON.stringify(result,null,2));
