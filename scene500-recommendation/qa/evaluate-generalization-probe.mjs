// Non-gating generalization probe: fresh editor-authored paraphrases; results must never be advertised as blind accuracy.
// node scene500-recommendation/qa/evaluate-generalization-probe.mjs catalog.json runtime.json associations.json
import fs from 'node:fs';
import {loadScene500WithChineseLexicon} from '../chinese-lexicon-loader.mjs';
const [cp,lp,ap]=process.argv.slice(2);
if(!cp||!lp||!ap)throw Error('USAGE: catalog runtime associations');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [catalog,lexicon,associations]=[cp,lp,ap].map(read);
const data=read('scene500-recommendation/qa/generalization-probe-20-v1.json');
if(data.cases.length!==20||catalog.scene_count!==500||lexicon.terms.length!==20000||associations.links.length!==3553)throw Error('GENERALIZATION_INPUT_DRIFT');
const queries=new Set();
for(const c of data.cases){
 if(!c.query||queries.has(c.query)||!(c.expected?.length||c.excluded?.length||c.openEnded===true))throw Error('GENERALIZATION_INVALID_CASE');
 queries.add(c.query);
 if([...(c.expected||[]),...(c.excluded||[])].some(id=>!catalog.scenes[id]))throw Error('GENERALIZATION_BAD_SCENE_ID');
}
const response=v=>({ok:true,json:async()=>v});
const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lexicon',associationUrl:'associations',fetchImpl:async url=>response(url==='lexicon'?lexicon:associations)});
if(engine.mode!=='hybrid')throw Error('GENERALIZATION_NOT_HYBRID');
const rows=data.cases.map(c=>{
 const ids=engine.search(c.query,{limit:10}).results.map(r=>r.sceneId);
 return {query:c.query,group:c.group,top5:ids.slice(0,5),empty:ids.length===0,
  top1:c.expected?.length?c.expected.includes(ids[0]):null,
  top5Hit:c.expected?.length?ids.slice(0,5).some(id=>c.expected.includes(id)):null,
  excludedLeak:c.excluded?.length?ids.slice(0,5).some(id=>c.excluded.includes(id)):null};
});
const marked=rows.filter(r=>r.top1!==null),neg=rows.filter(r=>r.excludedLeak!==null);
const counts={queries:rows.length,labeled:marked.length,top1Hit:marked.filter(r=>r.top1).length,top5Hit:marked.filter(r=>r.top5Hit).length,negativeChecks:neg.length,negativeLeaks:neg.filter(r=>r.excludedLeak).length,empty:rows.filter(r=>r.empty).length};
console.log(JSON.stringify({status:'EXPLORATORY_PROBE_NOT_CERTIFIED',mode:engine.mode,counts,rows},null,2));
