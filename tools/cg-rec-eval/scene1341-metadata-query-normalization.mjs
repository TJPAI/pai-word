// Independent source mutation and query normalization QA for actual pinned CG-REC core.
// Uses frozen CSV source and query-only holdout, never model-generated gold.
import fs from 'node:fs';
import path from 'node:path';
import {buildCatalog,csv} from '../../../candidate-current/scene500-recommendation/scene1341-search-core.mjs';
const [catalogPath,rankedDir,sourceCommit,manifestSha,queriesPath]=process.argv.slice(2);
if(![catalogPath,rankedDir,sourceCommit,manifestSha,queriesPath].every(Boolean))throw Error('FIVE_PINNED_INPUTS_REQUIRED');
const rawCatalog=fs.readFileSync(catalogPath,'utf8');
const ranked=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(rankedDir,'v'+(51+i)+'-ranked.csv'),'utf8'));
const intake=JSON.parse(fs.readFileSync(queriesPath,'utf8'));
if(intake.status!=='QUERY_ONLY_UNADJUDICATED_NO_GOLD'||intake.queries?.length!==24)throw Error('ONLY_UNLABELED_HOLDOUT_ALLOWED');
const meta={sourceCommit,manifestSha},engine=buildCatalog(rawCatalog,ranked,meta);
if(engine.sceneCount!==1341||engine.expressionCount!==19371||engine.release_allowed!==false)throw Error('CANONICAL_SOURCE_INVALID');
function encode(rows){
 const keys=Object.keys(rows[0]),quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 return [keys.map(quote).join(','),...rows.map(r=>keys.map(k=>quote(r[k])).join(','))].join('\n')+'\n';
}
const catalogRows=csv(rawCatalog);
const last=catalogRows.findIndex(x=>x.id==='SC50-1341');
if(last<0)throw Error('MISSING_LAST_SCENE');
const metadata=[];
for(const [name,mutate] of [
 ['blank_category',r=>{r.category=' ';}],
 ['blank_effective_name',r=>{r.revised_name=' ';r.name=' ';}],
 ['blank_revised_name_with_valid_fallback',r=>{r.revised_name='';r.name=' ';}]
]){
 const rows=catalogRows.map(x=>({...x}));mutate(rows[last]);
 let caught=null;try{buildCatalog(encode(rows),ranked,meta);}catch(e){caught=e.message;}
 if(!caught?.includes('EMPTY_SCENE_METADATA SC50-1341'))throw Error('SCENE_METADATA_NOT_FAIL_CLOSED '+name+' '+String(caught));
 metadata.push({name,rejected:true});
}
const fingerprints=rs=>JSON.stringify(rs.map(r=>[r.scene_id,r.score,r.explanations]));
const variants=[
 ['surround_tab',q=>'\t'+q+'\t'],
 ['surround_unicode_spaces',q=>'\u2003 '+q+' \u2003'],
 ['uppercase_ascii',q=>q.replace(/[a-z]/g,x=>x.toUpperCase())],
 ['fullwidth_ascii',q=>q.replace(/[!-~]/g,x=>String.fromCodePoint(x.charCodeAt(0)+0xFEE0))],
 ['collapse_internal_space',q=>q.replace(/ /g,'\t\n  ')]
];
const results=[];
for(const row of intake.queries){
 for(const optIn of [false,true]){
  const original=fingerprints(engine.search(row.query,{limit:10,experimentalIntentAliases:optIn}));
  for(const [label,mutate] of variants){
   const changed=mutate(row.query);
   const actual=fingerprints(engine.search(changed,{limit:10,experimentalIntentAliases:optIn}));
   if(actual!==original)throw Error('QUERY_NORMALIZATION_RANK_REGRESSION '+row.id+' '+label+' '+optIn);
   results.push({id:row.id,variant:label,optIn,equal:true});
  }
 }
}
if(metadata.length!==3||results.length!==240)throw Error('EXPECTED_3_META_240_QUERY_CHECKS');
console.log(JSON.stringify({status:'SOURCE_META_AND_QUERY_NORMALIZATION_PARITY_PASS',
 sourceCommit,manifestSha,coreCommit:process.env.CG_REC_SHA??null,metadataMutations:metadata,
 queryOnlyCount:24,experimentalModes:2,normalizationComparisons:results.length,fullOrderAndExplanationsIdentical:true,
 realGoldCount:0,certified:false,releaseAllowed:false}));
