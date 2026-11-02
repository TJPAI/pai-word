import fs from 'node:fs';
const files=process.argv.slice(2);
if(files.length<2)throw Error('USAGE: node summarize-engine-ab.mjs file30 file50');
const reports=files.map(p=>JSON.parse(fs.readFileSync(p,'utf8')));
let totals={rule_only:{n:0,top1:0,top5:0,top10:0,empty:0},hybrid_v0101:{n:0,top1:0,top5:0,top10:0,empty:0}};
for(const report of reports){
 if(report.status!=='REAL_ENGINE_LEVEL_AB_RULE_VS_HYBRID_PROVISIONAL_LABELS'||report.hybridMode!=='hybrid')throw Error('INVALID_ENGINE_REPORT');
 for(const row of report.rows){
  for(const key of Object.keys(totals)){
   const score=row.scores[key];
   if(!score||!Array.isArray(score.ids))throw Error('MISSING_ENGINE '+key);
   totals[key].n++;totals[key].top1+=Number(score.top1);totals[key].top5+=Number(score.hit5);totals[key].top10+=Number(score.hit10);totals[key].empty+=Number(score.empty);
  }
 }
}
if(totals.rule_only.n!==80||totals.hybrid_v0101.n!==80)throw Error('EXPECTED_80_INDEPENDENT_INTENTS');
const comparisons=reports.flatMap(report=>report.rows.map(r=>({
 id:r.id,query:r.query,
 ruleTop5:r.scores.rule_only.ids.slice(0,5),hybridTop5:r.scores.hybrid_v0101.ids.slice(0,5),
 deltaTop1:Number(r.scores.hybrid_v0101.top1)-Number(r.scores.rule_only.top1),
 deltaTop5:Number(r.scores.hybrid_v0101.hit5)-Number(r.scores.rule_only.hit5),
 changed:r.scores.rule_only.ids.join('|')!==r.scores.hybrid_v0101.ids.join('|')
})));
const out={status:'ENGINE_AB_80_SUMMARY_PROVISIONAL',n:80,totals,changed:comparisons.filter(x=>x.changed).length,top1Gains:comparisons.filter(x=>x.deltaTop1>0),top1Regressions:comparisons.filter(x=>x.deltaTop1<0),top5Gains:comparisons.filter(x=>x.deltaTop5>0),top5Regressions:comparisons.filter(x=>x.deltaTop5<0),notes:'Catalog-informed provisional primary labels, unjudged alternatives, no Safari or playable KU and no semantic vector model.'};
console.log(JSON.stringify(out,null,2));
