#!/usr/bin/env node
// Deterministic Scene500 audit; synthetic probes are diagnostics, NOT independent ground truth.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const home=read('rebuild-preview/data/home-scene-index-v1.json');
const cat=read('scene500-recommendation/catalog-v0.2.json');
const names=Object.keys(home.scenes).sort(),ids=Object.keys(cat.scenes).sort();
assert.equal(names.length,500,'canonical scene count');
assert.deepEqual(ids,names,'scene IDs identical');
assert.deepEqual(ids,Array.from({length:500},(_,i)=>'S'+String(i+1).padStart(3,'0')),'contiguous S001..S500');
const fields=['description_enriched','aliases','actions','objects','example_queries'];
const counts={total:ids.length,draft:0,nameOnly:0,other:0,missingFields:{},duplicateAliases:[],invalidTerms:[],nameMismatch:[],overlapNamePairs:[],emptyNames:[]};
const candidateNames=new Map();
for(const id of ids){
 const s=cat.scenes[id],h=home.scenes[id];
 if(s.name!==h.name)counts.nameMismatch.push(id);
 if(!s.name?.trim())counts.emptyNames.push(id);
 if(s.quality==='draft_unverified')counts.draft++;
 else if(s.quality==='name_only_fallback')counts.nameOnly++;
 else counts.other++;
 for(const key of fields){
  if(s.quality==='draft_unverified'&&(!s[key]||(Array.isArray(s[key])&&!s[key].length)))
   counts.missingFields[key]=(counts.missingFields[key]||0)+1;
 }
 for(const key of ['aliases','actions','objects','example_queries','negative_terms']){
  if(s[key]!==undefined&&!Array.isArray(s[key]))counts.invalidTerms.push(id+':'+key+':type');
  const vals=Array.isArray(s[key])?s[key]:[];
  const clean=vals.map(v=>typeof v==='string'?v.trim():'');
  if(clean.some(v=>!v))counts.invalidTerms.push(id+':'+key+':empty');
  if(new Set(clean).size!==clean.length)counts.duplicateAliases.push(id+':'+key);
 }
 if(candidateNames.has(s.name))counts.overlapNamePairs.push([candidateNames.get(s.name),id,'exact']);
 candidateNames.set(s.name,id);
}
for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
 const a=cat.scenes[ids[i]].name,b=cat.scenes[ids[j]].name;
 if(a.length>=3&&b.length>=3&&(a.includes(b)||b.includes(a))&&a!==b)
  counts.overlapNamePairs.push([ids[i],ids[j],'substring']);
}
const report={generatedBy:'scripts/audit-scene500-recommendation.cjs',scope:'all 500 scene IDs',source:{catalog:cat.schema,home:home.schema},counts,valid:!counts.nameMismatch.length&&!counts.emptyNames.length&&!Object.keys(counts.missingFields).length&&!counts.invalidTerms.length&&!counts.duplicateAliases.length};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--strict')&&!report.valid)process.exitCode=1;
