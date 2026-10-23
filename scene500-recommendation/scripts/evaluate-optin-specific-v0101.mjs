// Scene500 contract-level experimental QA. Does not modify any production asset.
import fs from 'node:fs';
import {createScene500ContractAdapter} from '../contract-adapter.mjs';
const [catalogPath,lexiconPath,baselinePath,experimentPath,outputPath] = process.argv.slice(2);
if (![catalogPath,lexiconPath,baselinePath,experimentPath,outputPath].every(Boolean))
 throw Error('USAGE: node scripts/evaluate-optin-specific-v0101.mjs catalog.json chinese.json baseline.json experiment3653.json output.json');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read(catalogPath), lexicon=read(lexiconPath), baseline=read(baselinePath), experiment=read(experimentPath);
if (baseline.links.length!==3553||experiment.links.length!==3653||
    experiment.quality!=='UNVERIFIED_NOT_PRODUCTION') throw Error('INVALID_STAGING_INPUT');
const orig=createScene500ContractAdapter({catalog,lexicon,associations:baseline});
const staged=createScene500ContractAdapter({catalog,lexicon,associations:experiment});
const prior=new Set(baseline.links.map(e=>e.term_id+'|'+e.scene_id));
const terms=new Map(lexicon.terms.map(t=>[t.term_id,t.term]));
const added=experiment.links.filter(e=>!prior.has(e.term_id+'|'+e.scene_id));
if(added.length!==100)throw Error('UNEXPECTED_DELTA');
const rows=added.map(e=>{
 const query=terms.get(e.term_id);
 const a=orig.search(query,{limit:5}).results;
 const b=staged.search(query,{limit:5}).results;
 const oldRank=a.findIndex(x=>x.sceneId===e.scene_id);
 const newRank=b.findIndex(x=>x.sceneId===e.scene_id);
 return {query,scene_id:e.scene_id,baseline_top5:oldRank<0?null:oldRank+1,
 staged_top5:newRank<0?null:newRank+1,
 baseline_results:a.map(x=>x.sceneId),
 staged_results:b.map(x=>x.sceneId)};
});
const result={schema:'scene500-original-hybrid-a-b-v0.1',status:'EXPERIMENT_ONLY',
 baseline_links:3553,staged_links:3653,candidates:100,
 entered_top5:rows.filter(x=>x.baseline_top5===null&&x.staged_top5!==null).length,
 dropped_top5:rows.filter(x=>x.baseline_top5!==null&&x.staged_top5===null).length,
 remain_absent:rows.filter(x=>x.staged_top5===null).length,
 rows};
fs.writeFileSync(outputPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({entered_top5:result.entered_top5,dropped_top5:result.dropped_top5,remain_absent:result.remain_absent}));
