#!/usr/bin/env node
// Build conservative lexical candidate edges using real Chinese20K membership and Scene500.
// Explicitly NOT AI semantic verification. Usage:
// node scripts/build-scene500-chinese-associations.cjs words.json catalog.json output.json
const fs=require('node:fs'),crypto=require('node:crypto');
const [,,wordsPath,catalogPath,outPath]=process.argv;
if(!wordsPath||!catalogPath||!outPath)throw Error('Usage: node build-scene500-chinese-associations.cjs WORDS CATALOG OUTPUT');
const wordsRaw=fs.readFileSync(wordsPath),catalogRaw=fs.readFileSync(catalogPath);
const wordsData=JSON.parse(wordsRaw),catalog=JSON.parse(catalogRaw);
const words=wordsData.words?.map(x=>typeof x==='string'?x:x.term);
if(!Array.isArray(words)||words.length!==20000||new Set(words).size!==20000)throw Error('Expected 20000 unique words');
if(catalog.scene_count!==500||Object.keys(catalog.scenes||{}).length!==500)throw Error('Expected 500 scenes');
const norm=s=>String(s??'').normalize('NFKC').replace(/\\s+/g,'');
const allowed=new Set(words);
const edges=new Map();
for(const [sceneId,scene] of Object.entries(catalog.scenes)){
 if(!/^S(?:00[1-9]|0[1-9]\\d|[1-4]\\d\\d|500)$/.test(sceneId))throw Error('Invalid ID '+sceneId);
 const fields=[['name',[scene.name],1],['aliases',scene.aliases||[],.8],['actions',scene.actions||[],.7],['objects',scene.objects||[],.55]];
 for(const [field,items,weight] of fields)for(const raw of items){
  const term=norm(raw);
  if(term.length<2||!allowed.has(term))continue;
  const key=term+'\u0000'+sceneId,old=edges.get(key);
  if(!old||weight>old.weight)edges.set(key,{term,sceneId,weight,field,status:'lexical_candidate_unverified'});
 }
}
const terms={};
for(const row of edges.values())(terms[row.term]??=[]).push(row);
for(const key of Object.keys(terms))terms[key].sort((a,b)=>b.weight-a.weight||a.sceneId.localeCompare(b.sceneId));
const topTerms=Object.fromEntries(Object.entries(terms).sort(([a],[b])=>a.localeCompare(b)).map(([term,rows])=>[term,rows.slice(0,50).map(({sceneId,weight,field,status})=>({sceneId,weight,evidence_field:field,status}))]));
const out={schema:'pai-scene500-chinese-associations-v0.1',stage:'lexical_candidate_unverified',scene_count:500,source:{word_sha256:crypto.createHash('sha256').update(wordsRaw).digest('hex'),catalog_sha256:crypto.createHash('sha256').update(catalogRaw).digest('hex')},word_count:words.length,terms:topTerms,stats:{matched_words:Object.keys(topTerms).length,edges:Object.values(topTerms).reduce((a,v)=>a+v.length,0),unmatched_words:words.length-Object.keys(topTerms).length}};
fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out.stats));
