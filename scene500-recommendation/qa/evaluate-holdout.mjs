// Runs separately from structural gate; editorial expectations are not certified truth.
// node scene500-recommendation/qa/evaluate-holdout.mjs catalog.json runtime.json associations.json
import fs from 'node:fs';
import {loadScene500WithChineseLexicon} from '../chinese-lexicon-loader.mjs';
const [catalogPath,lexiconPath,associationPath]=process.argv.slice(2);
if(!catalogPath||!lexiconPath||!associationPath)throw Error('USAGE catalog runtime associations');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read(catalogPath),lexicon=read(lexiconPath),associations=read(associationPath);
const set={...read('scene500-recommendation/qa/holdout-20-editorial-v1.json')};
if(set.cases.length!==20||catalog.scene_count!==500||lexicon.terms.length!==20000||associations.links.length!==3553)throw Error('HOLDOUT_INPUT_COUNT_DRIFT');
for(const c of set.cases){if(!(c.relevant||c.excluded||c.openEnded===true)||[...(c.relevant||[]),...(c.excluded||[])].some(id=>!catalog.scenes[id]))throw Error('INVALID_EDITORIAL_CASE');}
const response=v=>({ok:true,json:async()=>v});
const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lexicon',associationUrl:'associations',fetchImpl:async u=>response(u==='lexicon'?lexicon:associations)});
if(engine.mode!=='hybrid')throw Error('HYBRID_NOT_LOADED');
const rows=set.cases.map(c=>{
 const ids=engine.search(c.query,{limit:10}).results.map(x=>x.sceneId);
 const rel=c.relevant||[],excluded=c.excluded||[];
 return {query:c.query,category:c.category,top5:ids.slice(0,5),resultCount:ids.length,hit1:rel.length?rel.includes(ids[0]):null,hit5:rel.length?ids.slice(0,5).some(x=>rel.includes(x)):null,excludedLeak:excluded.length?excluded.some(x=>ids.slice(0,5).includes(x)):null};
});
const known=rows.filter(r=>r.hit1!==null),excl=rows.filter(r=>r.excludedLeak!==null);
const groups={};
for(const row of rows){
 const key=row.category||'uncategorized';
 const g=groups[key]??={queries:0,labeled:0,top1Hits:0,top5Hits:0,excludedChecks:0,excludedLeaks:0,emptyResults:0};
 g.queries++;
 if(row.hit1!==null){g.labeled++;g.top1Hits+=Number(row.hit1);g.top5Hits+=Number(row.hit5);}
 if(row.excludedLeak!==null){g.excludedChecks++;g.excludedLeaks+=Number(row.excludedLeak);}
 if(row.resultCount===0)g.emptyResults++;
}
const summary={n:rows.length,labeled:known.length,unlabeled:rows.length-known.length,top1Hits:known.filter(r=>r.hit1).length,top5Hits:known.filter(r=>r.hit5).length,excludedChecks:excl.length,excludedLeaks:excl.filter(r=>r.excludedLeak).length,emptyResults:rows.filter(r=>r.resultCount===0).length,byCategory:groups};
console.log(JSON.stringify({status:'OBSERVED_EDITORIAL_HOLDOUT_NOT_CERTIFIED',shaNote:'Inputs same assets as gated Hybrid workflow',summary,rows},null,2));
