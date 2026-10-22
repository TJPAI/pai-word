#!/usr/bin/env node
// Diagnostic metrics. Editorial unreviewed probes are NOT a production ground-truth set.
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
const {createScene500Recommender}=await import(pathToFileURL(require('node:path').resolve('scene500-recommendation/engine.mjs')).href);
const catalog=JSON.parse(fs.readFileSync('scene500-recommendation/catalog-v0.2.json','utf8'));
const set=JSON.parse(fs.readFileSync('scene500-recommendation/query-diagnostics-v0.1.json','utf8'));
const engine=createScene500Recommender({catalog});
const rows=set.cases.map(t=>{
 const ranked=engine.search(t.query,{limit:100}).results.map(x=>x.sceneId);
 const actual=new Set(ranked.slice(0,5)),rel=t.relevantSceneIds;
 const hits=rel.filter(id=>actual.has(id)).length;
 const first=ranked.findIndex(id=>rel.includes(id));
 return {query:t.query,category:t.category,relevant:rel,top5:ranked.slice(0,5),
  recall5:rel.length?hits/rel.length:null,
  precision5:hits/5,
  reciprocalRank10:first>=0&&first<10?1/(first+1):0,
  falsePositive5:t.negativeSceneIds.filter(id=>actual.has(id)),
  missing:rel.filter(id=>!actual.has(id))};
});
const relevant=rows.filter(r=>r.recall5!==null),avg=(xs)=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
const summary={label:'UNREVIEWED EDITORIAL DIAGNOSTIC - NOT VALIDATED ACCURACY',queries:rows.length,
 recall5:avg(relevant.map(r=>r.recall5)),precision5:avg(relevant.map(r=>r.precision5)),
 mrr10:avg(relevant.map(r=>r.reciprocalRank10)),
 negativeInTop5:rows.reduce((n,r)=>n+r.falsePositive5.length,0),
 failures:rows.filter(r=>r.missing.length||r.falsePositive5.length).length,
 byCategory:Object.fromEntries([...new Set(rows.map(r=>r.category))].map(k=>{
 const subs=rows.filter(r=>r.category===k&&r.recall5!==null);
 return [k,{count:subs.length,recall5:avg(subs.map(r=>r.recall5))}];
 }))};
const report={summary,rows};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--assert-structure')){
 if(rows.length!==set.cases.length||rows.some(r=>new Set(r.top5).size!==r.top5.length))process.exitCode=1;
}
})().catch(e=>{console.error(e);process.exitCode=1});
