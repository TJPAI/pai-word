// Run: node scripts/test-v21-top100-runtime-identity.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../scripts/scene500-top100-loader.mjs',import.meta.url),'utf8');
for(const expression of [
 "core.byRank.get(coreRank)",
 "word.w.toLowerCase()!==lemma.toLowerCase()",
 "core.byKU.get(kuId)",
 "u.w!==word",
 "u.s.playable!==true",
 "playable.length!==1",
 "playable[0]!==u.s",
 "eligible!==22227"
])assert(source.includes(expression),'missing identity guard: '+expression);
const selected=JSON.parse(readFileSync(new URL('../data/scene500-top100-v40/group-01.json',import.meta.url),'utf8'));
for(const [scene,rows] of Object.entries(selected.scenes)){
 assert.equal(rows.length,100,scene);
 for(const [i,row] of rows.entries()){
  assert.equal(row[0],i+1,scene+' scene rank');
  assert(Number.isInteger(row[2])&&row[2]>=1&&row[2]<=20000,scene+' Core20K rank');
  if(row[3]!==null)assert.equal(typeof row[3],'string',scene+' KU id');
 }
}
console.log('PASS: Top100 loader identity guards and shard-01 structure (static contracts only)');
