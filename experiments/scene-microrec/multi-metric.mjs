// Independent comparison metrics; no training and no tuning.
// Editorial labels are multi-relevance sets, not a blind gold standard.
import fs from 'node:fs';
import {createScene500Recommender} from '../../scene500-recommendation/engine.mjs';
import {createMicroRec} from './microrec.mjs';
import {createIntentAware} from './intent-aware.mjs';
import {createConservativeMicro} from './conservative.mjs';
import {trainSparse} from './sparse-supervised.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=read('../../scene500-recommendation/catalog-v0.2.json');
const base=createScene500Recommender({catalog}),micro=createMicroRec(catalog),intent=createIntentAware(catalog),conservative=createConservativeMicro(catalog),sparse=trainSparse(catalog);
const systems={
 'current-rule':q=>base.search(q,{limit:10}).results,
 lexical:q=>micro.search(q,{method:'lexical',limit:10}),
 hashed:q=>micro.search(q,{method:'hashed-semantic',limit:10}),
 hybrid:q=>micro.search(q,{method:'hybrid',limit:10}),
 intent:q=>intent.search(q,{limit:10}),
 conservative:q=>conservative.search(q,{limit:10}),
 sparse:q=>sparse.search(q,{limit:10})
};
const files=['holdout-20-editorial-v1.json','prospective-24-v1.json','generalization-probe-20-v1.json'];
const sets=files.flatMap(file=>read('../../scene500-recommendation/qa/'+file).cases.map(c=>({...c,suite:file})));
const metrics={};
for(const [name,fn] of Object.entries(systems)){
 let n=0,first=0,hit5=0,ndcg=0,rr=0,negative=0,leaks=0,empty=0,invalid=0,dupes=0;
 const byLanguage={zh:{labeled:0,hit5:0},en:{labeled:0,hit5:0},mixed:{labeled:0,hit5:0}};
 for(const row of sets){
  const results=fn(row.query),ids=results.map(x=>x.sceneId);
  if(!ids.length)empty++;
  if(new Set(ids).size!==ids.length)dupes++;
  if(ids.some(id=>!catalog.scenes[id]))invalid++;
  const relevant=row.expected||row.relevant||[];
  const excluded=row.excluded||[];
  const en=/[a-z]/i.test(row.query),zh=/[\u3400-\u9fff]/u.test(row.query),lang=en&&zh?'mixed':en?'en':'zh';
  if(relevant.length){
   n++;byLanguage[lang].labeled++;
   if(relevant.includes(ids[0]))first++;
   if(ids.slice(0,5).some(x=>relevant.includes(x))){hit5++;byLanguage[lang].hit5++;}
   const position=ids.findIndex(x=>relevant.includes(x));
   if(position>=0)rr+=1/(position+1);
   let dcg=0;for(let i=0;i<5;i++)if(relevant.includes(ids[i]))dcg+=1/Math.log2(i+2);
   let ideal=0;for(let i=0;i<Math.min(5,new Set(relevant).size);i++)ideal+=1/Math.log2(i+2);
   ndcg+=dcg/(ideal||1);
  }
  if(excluded.length){negative++;if(ids.slice(0,5).some(x=>excluded.includes(x)))leaks++;}
 }
 metrics[name]={labeled:n,top1:first,top5:hit5,ndcg5:+(ndcg/n).toFixed(4),mrr10:+(rr/n).toFixed(4),negative_checks:negative,negative_leaks:leaks,empty,invalid,dupes,byLanguage};
}
const report={status:'EDITORIAL_NONBLIND_NOT_CERTIFIED',queries:sets.length,metrics,disclosure:'No confidence calibration; scoring scales differ by system. Current-rule is NOT real V0.10.1 hybrid. Some cases overlap in topic and authoring; do not use these metrics as independent certification.'};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./multi-metric-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
if(Object.values(metrics).some(x=>x.invalid||x.dupes))process.exitCode=1;
