import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createMicroRec} from './microrec.mjs';
import {createIntentAware} from './intent-aware.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url)));
const m=createMicroRec(catalog),i=createIntentAware(catalog);
assert.equal(m.size,500);
for(const method of ['lexical','hashed-semantic','hybrid']){
 const rows=m.search('我想预订酒店',{method,limit:10});
 assert(rows.length<=10);
 assert(rows.every(x=>catalog.scenes[x.sceneId]));
 assert.deepEqual(rows,m.search('我想预订酒店',{method,limit:10}),'deterministic');
 assert.deepEqual(m.search('',{method}),[]);
 assert(m.search('地铁',{method,eligibleSceneIds:['S079']}).every(x=>x.sceneId==='S079'));
}
for(const q of ['不坐地铁，改乘公交','今天不坐公交，改乘地铁','I want to book a hotel room','我想在 hotel check-in']) {
 const rows=i.search(q,{limit:10});
 assert(rows.every(x=>catalog.scenes[x.sceneId]));
 assert.deepEqual(rows,i.search(q,{limit:10}));
}
// Taxonomy growth simulation: new IDs are distinct, old data untouched.
const scenes={...catalog.scenes};
for(let n=501;n<=1500;n++){const id='S'+String(n).padStart(4,'0');scenes[id]={name:'扩展测试场景 '+n,aliases:['测试扩展 '+n],actions:['测试'],objects:['对象'],description_enriched:'仅用于规模模拟'};}
const expanded={...catalog,scene_count:1500,scenes};
const big=createMicroRec(expanded);
assert.equal(big.size,1500);
for(const q of ['我想预订酒店','公交换乘','I need coffee']){
 const rows=big.search(q,{limit:10});
 assert(rows.length<=10);
 assert.equal(new Set(rows.map(x=>x.sceneId)).size,rows.length);
}
const raw=Buffer.byteLength(JSON.stringify(expanded));
console.log(JSON.stringify({status:'PASS',base:500,expanded:1500,expanded_catalog_bytes:raw,notes:'Synthetic 1000 scenes only tests scaling and stable identities, not Scene1500 relevance.'}));
