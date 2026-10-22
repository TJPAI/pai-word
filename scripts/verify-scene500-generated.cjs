#!/usr/bin/env node
// Compare generated Scene500 artifacts semantically, ignoring JSON property insertion order.
// Run after build. This check is read-only and does not touch home or learning state.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const files=[
 'data/scene500-recommendation-catalog-v0.1.json',
 'scene500-recommendation/catalog-v0.2.json'
];
function canonical(v){
 if(Array.isArray(v))return v.map(canonical);
 if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));
 return v;
}
for(const file of files){
 const committed=execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'});
 const actual=fs.readFileSync(file,'utf8');
 assert.deepEqual(canonical(JSON.parse(actual)),canonical(JSON.parse(committed)),
   'generated contents disagree with committed '+file);
 console.log('PASS semantic consistency:',file);
}
