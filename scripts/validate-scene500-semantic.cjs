#!/usr/bin/env node
const fs = require('node:fs');
const assert = require('node:assert/strict');
const overlay=JSON.parse(fs.readFileSync('data/scene500-semantic-overlay-v0.8.json','utf8'));
const home=JSON.parse(fs.readFileSync('rebuild-preview/data/home-scene-index-v1.json','utf8'));
const ranker=require('./scene500-semantic-ranker.cjs');
const fields=['description_enriched','aliases','actions','objects','example_queries'];
const ids=Object.keys(overlay.scenes);
assert.equal(Object.keys(home.scenes).length,500,'home scene count');
assert.equal(ids.length,175,'first batch size');
const seenNames=new Set();
for(const id of ids){
 const rec=overlay.scenes[id],original=home.scenes[id];
 assert.ok(original,'unknown scene: '+id);
 assert.equal(rec.name,original.name,'immutable scene name: '+id);
 assert.ok(!seenNames.has(rec.name),'duplicate title: '+rec.name);
 seenNames.add(rec.name);
 assert.equal(rec.review_status,'draft_unverified','review provenance: '+id);
 for(const key of fields){
  const value=rec[key];
  assert.ok(typeof value==='string'?value.trim().length>0:Array.isArray(value)&&value.length>0,id+'.'+key);
  if(Array.isArray(value))assert.equal(new Set(value).size,value.length,'duplicate '+key+': '+id);
 }
}
const q='早上起来刷牙洗脸';
const a=ranker.rank(q,overlay.scenes,{limit:25,minScore:0});
const b=ranker.rank(q,overlay.scenes,{limit:25,minScore:0});
assert.deepEqual(a,b,'deterministic results');
assert.equal(new Set(a.map(x=>x.id)).size,a.length,'ranked results unique');
const combined=Array.from({length:Math.ceil(a.length/5)},(_,i)=>ranker.page(a,i)).flat();
assert.deepEqual(combined,a,'pagination loss/duplication');
console.log('PASS overlay identity, required fields, provenance, determinism and pagination');
