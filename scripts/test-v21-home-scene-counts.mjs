// Run: node scripts/test-v21-home-scene-counts.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=new URL('../rebuild-preview/data/home-scene-index-v1.json',import.meta.url);
const data=JSON.parse(readFileSync(file,'utf8'));
assert.equal(data.schema,'pai-word-v21-home-index-v1');
assert.equal(Object.keys(data.scenes).length,500);
let aggregate=0;
for(let i=1;i<=500;i++){
 const id='S'+String(i).padStart(3,'0'),s=data.scenes[id];
 assert(s,'missing '+id);
 assert(s.name?.trim(),'missing scene name '+id);
 const c=s.counts;
 for(const key of ['all','basic','common','advanced','high']){
  assert(Number.isInteger(c[key])&&c[key]>=0&&c[key]<=100,id+' invalid '+key);
 }
 assert.equal(c.all,c.basic+c.common+c.advanced+c.high,id+' difficulty partition mismatch');
 assert(c.all>0,id+' unexpectedly empty');
 aggregate+=c.all;
}
assert.equal(aggregate,22227,'unexpected scene-count baseline');
console.log('PASS: 500 home scene counts, difficulty partition, nonempty coverage, aggregate 22227');
