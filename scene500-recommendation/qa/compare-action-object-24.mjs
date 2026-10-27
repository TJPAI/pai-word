import fs from 'node:fs';
import {loadScene500WithChineseLexicon} from '../chinese-lexicon-loader.mjs';
import {compareActionObjectCandidates} from '../experimental-action-object.mjs';
const [cp,lp,ap]=process.argv.slice(2);
if(!cp||!lp||!ap)throw Error('USAGE: catalog runtime associations');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [catalog,lexicon,associations]=[cp,lp,ap].map(read);
const probe=read('scene500-recommendation/qa/prospective-24-v1.json');
const respond=value=>({ok:true,json:async()=>value});
const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lexicon',associationUrl:'associations',fetchImpl:async url=>respond(url==='lexicon'?lexicon:associations)});
if(engine.mode!=='hybrid'||probe.cases.length!==24)throw Error('A_B_INPUT_INVALID');
const rows=probe.cases.map(c=>{
 const base=engine.search(c.query,{limit:10});
 const comparison=compareActionObjectCandidates(base,c.query,{catalog,limit:10});
 const measure=rr=>{const ids=rr.map(x=>x.sceneId);return {top1:c.expected?.length?c.expected.includes(ids[0]):null,top5:c.expected?.length?ids.slice(0,5).some(x=>c.expected.includes(x)):null,leak:c.excluded?.length?ids.slice(0,5).some(x=>c.excluded.includes(x)):null,empty:ids.length===0,ids:ids.slice(0,5)}};
 return {query:c.query,group:c.group,baseline:measure(base.results),experimental:measure(comparison.results),candidateIds:comparison.candidates.map(x=>x.sceneId)};
});
const stats=key=>{const v=rows.map(r=>r[key]);return {top1:v.filter(r=>r.top1).length,top5:v.filter(r=>r.top5).length,labeled:v.filter(r=>r.top1!==null).length,leaks:v.filter(r=>r.leak).length,negativeChecks:v.filter(r=>r.leak!==null).length,empty:v.filter(r=>r.empty).length}};
console.log(JSON.stringify({status:'NON_GATING_EDITORIAL_AB_NOT_BLIND',mode:engine.mode,sourceCommit:process.env.GITHUB_SHA||null,baseline:stats('baseline'),experimental:stats('experimental'),changed:rows.filter(r=>r.baseline.ids.join(',')!==r.experimental.ids.join(',')).length,rows},null,2));
