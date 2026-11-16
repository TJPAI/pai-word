#!/usr/bin/env node
/**
 * Read-only Scene1341 Master IPA coverage audit (no IPA synthesis).
 * Usage:
 *   node tools/integration/audit-scene1341-master-ipa.mjs \
 *     --root tools/scene1341_master/production \
 *     --output /tmp/scene1341-ipa-coverage.json
 *
 * Requires scene JSON files on disk. Never mutates Master, review or SRS.
 */
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SCENE=/^SC50-(?:0[0-9]{3}|1[0-2][0-9]{2}|13[0-3][0-9]|134[01])$/;
const FILE=/^tools\/scene1341_master\/production\/scenes\/SC50-\d{4}\.json$/;
const sha=/^[0-9a-f]{40}$/;
const fail=(s)=>{throw Error('SC1341_IPA_AUDIT_'+s)};
const norm=(s)=>String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const ipa=(q)=>String(q?.ipa||q?.ipa_candidate||'').trim();
const parseArgs=(argv)=>{
 const out={root:'tools/scene1341_master/production',output:null};
 for(let i=0;i<argv.length;i++){
  if(argv[i]==='--root')out.root=argv[++i];
  else if(argv[i]==='--output')out.output=argv[++i];
  else fail('ARGUMENT_'+argv[i]);
 }
 if(!out.root)fail('MISSING_ROOT');
 return out;
};
const safePct=(n,d)=>d?+(100*n/d).toFixed(3):0;
const byCountDesc=(a,b)=>b.count-a.count||a.name.localeCompare(b.name);
export function inspectMasterIPA(index,readScene) {
 if(index?.schema_version!=='scene1341-master-index/v1'||
 index.scene_count!==1341||index.source_associations!==230289||
 !index.scenes||Object.keys(index.scenes).length!==1341)fail('INDEX_CONTRACT');
 return (async()=>{
 const scenes=[],expressions=new Map(),seenRows=new Set();
 const totals={associations:0,withIPA:0,withoutIPA:0,uniqueExpressions:0,
  uniqueWithIPA:0,uniqueWithoutIPA:0,scenesWithZeroIPA:0,
  conflictingPronunciationExpressions:0};
 const sourceCategories=new Map();
 const variants=new Map();
 const missingSamples=[],conflictSamples=[];
 for(let i=1;i<=1341;i++){
  const id='SC50-'+String(i).padStart(4,'0'),meta=index.scenes[id];
  if(!meta||!FILE.test(meta.path||'')||
   meta.path!=='tools/scene1341_master/production/scenes/'+id+'.json'||
   !sha.test(meta.git_blob_sha1||'')||!Number.isInteger(meta.records)||meta.records<1)fail('INDEX_SCENE_'+id);
  const doc=await readScene(meta.path,id);
  if(doc?.scene_id!==id||doc.record_count!==meta.records||!Array.isArray(doc.records)||
   doc.records.length!==meta.records||doc.release_allowed!==false||
   doc.srs_eligible!==false)fail('SCENE_DOC_'+id);
  let withIPA=0,missingIPA=0,word=0,multiword=0;
  for(const r of doc.records){
   if(r.scene_id!==id||!Number.isSafeInteger(r.source_final_row)||r.source_final_row<1||
   seenRows.has(r.source_final_row)||r.release_allowed!==false||r.srs_eligible===true)fail('ROW_'+id);
   seenRows.add(r.source_final_row);
   const e=norm(r.question_page?.expression||r.expression);
   if(!e)fail('EMPTY_EXPRESSION_'+id);
   const p=ipa(r.question_page);
   const lexical=expressions.get(e)||{expression:e,count:0,withIPA:0,ipas:new Set(),scenes:new Set()};
   lexical.count++;lexical.scenes.add(id);
   if(p){withIPA++;lexical.withIPA++;lexical.ipas.add(p);}
   else{missingIPA++;if(missingSamples.length<30)missingSamples.push({scene_id:id,source_final_row:r.source_final_row,expression:e})}
   expressions.set(e,lexical);
   if(e.includes(' '))multiword++;else word++;
   const origin=String(r.question_page?.ipa_source||r.question_page?.ipa_provenance||'UNSPECIFIED');
   if(p)sourceCategories.set(origin,(sourceCategories.get(origin)||0)+1);
  }
  scenes.push({scene_id:id,associations:doc.record_count,withIPA,withoutIPA:missingIPA,
    coveragePercent:safePct(withIPA,doc.record_count),singleToken:word,multiword});
  totals.associations+=doc.record_count;totals.withIPA+=withIPA;totals.withoutIPA+=missingIPA;
  if(!withIPA)totals.scenesWithZeroIPA++;
 }
 if(totals.associations!==230289||seenRows.size!==230289)fail('SOURCE_TOTAL');
 for(const x of expressions.values()){
  if(x.withIPA)totals.uniqueWithIPA++;else totals.uniqueWithoutIPA++;
  if(x.ipas.size>1){
   totals.conflictingPronunciationExpressions++;
   if(conflictSamples.length<30)conflictSamples.push({expression:x.expression,ipaVariants:[...x.ipas],scenes:[...x.scenes].slice(0,8)});
  }
 }
 totals.uniqueExpressions=expressions.size;
 return {
  schema:'scene1341-master-ipa-coverage/v1',
  sourceMasterSha256:index.source_master_sha256||null,
  masterRelease:index.master_release?.version||null,
  releaseAllowed:false,srsEligible:false,
  totals:{...totals,coveragePercent:safePct(totals.withIPA,totals.associations),
   uniqueExpressionCoveragePercent:safePct(totals.uniqueWithIPA,totals.uniqueExpressions)},
  provenanceObserved:[...sourceCategories].map(([name,count])=>({name,count})).sort(byCountDesc),
  worstScenes:scenes.slice().sort((a,b)=>a.coveragePercent-b.coveragePercent||a.scene_id.localeCompare(b.scene_id)).slice(0,20),
  bestScenes:scenes.slice().sort((a,b)=>b.coveragePercent-a.coveragePercent||a.scene_id.localeCompare(b.scene_id)).slice(0,20),
  scenes,missingSamples,conflictSamples,
  caveat:'IPA count = nonempty Master question_page.ipa or ipa_candidate, not confirmed native Kaikki or QA PASS. Expression grouping normalizes case/space only; ambiguous senses must be reviewed separately.'
 };
 })();
}
if(process.argv[1]&&import.meta.url===new URL('file://'+path.resolve(process.argv[1])).href){
 const args=parseArgs(process.argv.slice(2));
 const index=JSON.parse(await readFile(path.join(args.root,'SCENE1341_LIVE_INDEX.json'),'utf8'));
 const r=await inspectMasterIPA(index,async(metaPath)=>{
  const scenePath=path.join(args.root,'scenes',path.basename(metaPath));
  return JSON.parse(await readFile(scenePath,'utf8'));
 });
 const output=JSON.stringify(r,null,2)+'\n';
 if(args.output)await writeFile(args.output,output,'utf8');
 console.log(JSON.stringify({release:r.masterRelease,totals:r.totals,worst:r.worstScenes.slice(0,5),output:args.output},null,2));
}
