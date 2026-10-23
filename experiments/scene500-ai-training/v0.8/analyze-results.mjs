#!/usr/bin/env node
// Offline analysis for real E5 outputs. Never invent model scores.
// Usage: node experiments/scene500-ai-training/v0.8/analyze-results.mjs path/to/e5-results-local.json
import {readFileSync,writeFileSync} from 'node:fs';
const file=process.argv[2];
if(!file){console.error('Usage: node analyze-results.mjs path/to/e5-results-local.json');process.exit(2)}
const data=JSON.parse(readFileSync(file,'utf8'));
if(data.schema!=='scene500-e5-offline-evaluation-v1'||!Array.isArray(data.results)||data.results.length!==72)
  throw Error('Expected actual v0.7 E5 report with 72 results');
const seen=new Set();
for(const r of data.results){
 if(!r.id||seen.has(r.id))throw Error('Duplicate/missing test id');
 seen.add(r.id);
 if(!Array.isArray(r.top10)||r.top10.length!==10)throw Error('Missing ranked top10');
 if(!Array.isArray(r.expected_scene_ids))throw Error('Missing editorial labels');
 for(let i=0;i<10;i++){
  const {id,score}=r.top10[i];
  if(!/^S(00[1-9]|0[1-9][0-9]|[1-4][0-9]{2}|500)$/.test(id)||!Number.isFinite(score))
    throw Error('Invalid scene/score');
  if(i&&r.top10[i-1].score<score)throw Error('Not sorted');
 }
}
const positives=data.results.filter(x=>x.expected_scene_ids.length>0);
const empties=data.results.filter(x=>x.expected_scene_ids.length===0);
function summary(rows){
 const rr=rows.map(x=>{const rank=x.top10.findIndex(y=>x.expected_scene_ids.includes(y.id));return rank<0?0:1/(rank+1)});
 return {n:rows.length,recallAt1:rr.filter(v=>v===1).length,recallAt5:rr.filter(v=>v>=1/5).length,
 recallAt10:rr.filter(v=>v>0).length,mrrAt10:rr.reduce((a,b)=>a+b,0)/(rr.length||1)};
}
const languages=Object.fromEntries(['zh','en','mixed'].map(l=>[l,summary(positives.filter(x=>x.language===l))]));
// Sweep is DESCRIPTIVE ONLY. It must not be used to select threshold on the held-out test.
const thresholds=[0.5,0.6,0.7,0.8,0.9];
const descriptiveSweep=thresholds.map(t=>({
 threshold:t,
 positiveTop1Accepted:positives.filter(x=>x.top10[0].score>=t).length,
 emptyTop1Accepted:empties.filter(x=>x.top10[0].score>=t).length,
 note:'Provisional empty labels are not verified negatives; threshold selection forbidden on this set'
}));
const result={schema:'scene500-v08-report-analysis',sourceReport:file,
 labelStatus:'single_pass_editorial_not_gold',n:data.results.length,
 all:summary(positives),languages,provisionalEmptyCount:empties.length,
 descriptiveSweep,thresholdSelected:null,
 productionReady:false,warning:'This evaluation set was used in earlier development. A separate sealed, independently reviewed test is required.'};
const out=process.env.SCENE500_ANALYSIS_REPORT||file.replace(/\.json$/,'.analysis.json');
writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({saved:out,all:result.all,languages,productionReady:false},null,2));
