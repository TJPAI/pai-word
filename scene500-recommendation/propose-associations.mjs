// Offline coverage-expansion candidates, NOT a production association file.
// Usage: node scene500-recommendation/propose-associations.mjs lexicon.json associations.json [output.json]
// No network, no LLM; conservative evidence-only lexical proposal. Human/independent
// review required before promotion. Never invent frequency or term IDs.
import fs from 'node:fs';
import {validateChineseLexiconContract,validateAssociations} from './contract-adapter.mjs';
const [lexFile,linkFile,outFile]=process.argv.slice(2);
if(!lexFile||!linkFile)throw Error('USAGE: propose-associations.mjs lexicon.json associations.json [output.json]');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read(new URL('./catalog-v0.2.json',import.meta.url));
const raw=read(lexFile);
const lexicon=raw.terms?.length===20000&&raw.terms[0]?.id&&raw.terms[0]?.t?
 {source_version:String(raw.version??'0.9.4-rc.2'),terms:raw.terms.map(t=>({
  term_id:t.id,term:t.t,normalized_term:t.n,aliases:[],source_version:String(raw.version??'0.9.4-rc.2')
 }))}:raw;
const associations=read(linkFile);
// A 20k membership match does not establish release compatibility.
// Distinct source versions must be reported rather than silently presented as a synced release.
const sourceLexiconVersion=String(raw.version??raw.source_version??'');
const associationSourceVersion=String(associations.source?.lexicon_version??associations.source?.lexiconVersion??'');
validateChineseLexiconContract(lexicon);
validateAssociations({lexicon,associations,catalog});
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\s，。！？、；：,.!?;:]+/g,'');
const existing=new Set(associations.links.map(x=>x.term_id+'\0'+x.scene_id));
const counts=new Map(), owners=new Map();
for(const x of associations.links)counts.set(x.term_id,(counts.get(x.term_id)||0)+1);
for(const t of lexicon.terms){
 const key=normalize(t.normalized_term);
 if(!owners.has(key))owners.set(key,new Set());
 owners.get(key).add(t.term_id);
}
const profiles=Object.entries(catalog.scenes).map(([sceneId,s])=>({
 sceneId,fields:{
  name:[s.name],alias:s.aliases??[],action:s.actions??[],object:s.objects??[],
 }, negatives:(s.negative_terms??[]).map(normalize)
}));
// Index exact field values once: avoid scanning all 500 scenes for every one of 20k terms.
const index=new Map();
for(const profile of profiles){
 for(const [kind,values] of Object.entries(profile.fields)){
  for(const value of values){
   const key=normalize(value);
   if(!key)continue;
   if(!index.has(key))index.set(key,new Map());
   const byScene=index.get(key);
   if(!byScene.has(profile.sceneId))byScene.set(profile.sceneId,{profile,evidence:new Set()});
   byScene.get(profile.sceneId).evidence.add(kind+'_exact');
  }
 }
}
const proposals=[],ambiguous=[],insufficient=[];
for(const t of lexicon.terms){
 const key=normalize(t.normalized_term);
 if(!key)continue;
 if(owners.get(key).size>1){ambiguous.push(t.term_id);continue;}
 let n=counts.get(t.term_id)||0;
 if(n>=50)continue;
 const candidate=[];
 for(const {profile:s,evidence:matched} of index.get(key)?.values()??[]){
  if(existing.has(t.term_id+'\0'+s.sceneId))continue;
  if(s.negatives.some(x=>x&&key.includes(x)))continue;
  const evidence=[...matched];
  // An isolated single character is only useful when it is distinctive.
  // High-ambiguity keys remain unmatched rather than generating dozens of guesses.
  if(key.length===1&&index.get(key).size>3)continue;
  // Explicit alias/action/object is direct profile evidence, but not verified truth.
  const score=evidence.includes('name_exact')?.9:
   evidence.includes('alias_exact')?.8:
   evidence.includes('action_exact')?.7:.6;
  candidate.push({term_id:t.term_id,term:t.term,scene_id:s.sceneId,score,
   confidence:Math.min(.65,score),evidence_type:'unverified_profile_exact',
   evidence,source_version:lexicon.source_version,status:'candidate_review_only'});
 }
 candidate.sort((a,b)=>b.score-a.score||a.scene_id.localeCompare(b.scene_id));
 const selected=candidate.slice(0,50-n);
 proposals.push(...selected);
 if(!selected.length&&!n)insufficient.push(t.term_id);
}
const result={
 status:'CANDIDATES_NOT_APPROVED',catalog_version:catalog.schema,
 lexicon_version:lexicon.source_version,association_version:associations.association_version,
 baseline:{terms:lexicon.terms.length,links:associations.links.length,linkedTerms:counts.size},
 provenance:{sourceLexiconVersion,associationSourceVersion,versionMatch:associationSourceVersion?associationSourceVersion===sourceLexiconVersion:null},
 proposed:{links:proposals.length,newTerms:new Set(proposals.filter(p=>!counts.has(p.term_id)).map(p=>p.term_id)).size},
 exclusions:{ambiguousTermIds:ambiguous.length,unlinkedWithoutExactEvidence:insufficient.length},
 method:'indexed exact profile evidence; single-character keys only when at most 3 scenes; no automatic promotion',
 candidates:proposals
};
const serialized=JSON.stringify(result,null,2);
if(outFile)fs.writeFileSync(outFile,serialized+'\n');else console.log(serialized);
