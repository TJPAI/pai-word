#!/usr/bin/env node
// Build a reproducible *candidate* E5 corpus; never overwrite the canonical catalog.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
const root='experiments/scene500-ai-training/v1.4/';
const base=JSON.parse(readFileSync('scene500-recommendation/catalog-v0.2.json','utf8')).scenes;
const files=['semantic-overrides.json','semantic-overrides-batch2.json','semantic-overrides-batch3.json','semantic-overrides-batch4.json'];
const overrides={};
for(const file of files){
 const o=JSON.parse(readFileSync(root+file,'utf8'));
 assert.equal(o.schema,'scene500-semantic-overrides-v1');
 for(const [id,v] of Object.entries(o.scenes)){
  assert(!overrides[id], 'duplicate override '+id);
  assert(base[id], 'unknown ID '+id);
  if(v.name)assert.equal(v.name,base[id].name,'name drift '+id);
  for(const key of ['description','boundary'])assert.equal(typeof v[key],'string',id+' '+key);
  assert(v.description.trim().length>=15,id+' short description');
  assert(Array.isArray(v.query_intents)&&v.query_intents.length>=1,id+' no intents');
  overrides[id]=v;
 }
}
assert.equal(Object.keys(base).length,500);
assert.equal(Object.keys(overrides).length,229);
const generic=Object.keys(base).filter(id=>base[id].description_enriched.includes('用于理解、描述或讨论相关情境'));
assert.equal(generic.length,223);
assert(generic.every(id=>overrides[id]),'uncovered generic scene');
const ids=Object.keys(base).sort();
const output=ids.map(id=>{
 const v=overrides[id],s=base[id];
 const oldText=s.description_enriched;
 // Keep old catalog intact. Preserve stable ID and name. Use explicit query-intent
 // examples rather than generic synthetic 'how do I say...' queries.
 const newText=v?
  [s.name,v.description,'常见表达：'+v.query_intents.join('；'),'区分：'+v.boundary].join('。'):
  [s.name,oldText].join('。');
 return {id,name:s.name,oldText,newText,changed:!!v};
});
assert.equal(output.length,500);
assert.equal(output.filter(x=>x.changed).length,229);
const out=process.argv[2]||root+'e5-ab-corpus.json';
mkdirSync(dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify({schema:'scene500-e5-ab-corpus-v1',status:'CANDIDATE_NOT_EVALUATED',
 source:'scene500-recommendation/catalog-v0.2.json',count:500,overrides:229,
 scenes:output},null,2)+'\n');
console.log(JSON.stringify({output,scenes:500,changed:229,templateCoverage:223,
 duplicates:0,warning:'No model inference performed; compare E5 on identical query set and prompts.'},null,2));
