import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('./',import.meta.url);
const html=readFileSync(new URL('enteach-batch200-24ku-side-by-side-20261027.v1.html',base),'utf8');
const document=JSON.parse(readFileSync(new URL('enteach-batch200-24ku-comparison-pairs-20261027.v1.json',base),'utf8'));
const match=html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(match,'embedded JSON script exists');
const records=JSON.parse(match[1]);
assert.equal(records.length,24);
assert.equal(new Set(records.map(x=>x.id)).size,24);
assert.equal(records.reduce((n,x)=>n+x.edits.length,0),29);
for(const [i,x] of records.entries()){
 const expected=document.records[i];
 assert.equal(x.id,expected.ku_id);
 assert.equal(x.w,expected.headword);
 assert.equal(x.rank,expected.core_rank);
 assert.deepEqual(x.edits,expected.edits);
 assert.ok(x.edits.every(e=>e.before!==e.after));
 assert.ok(!['supreme','sequel'].includes(x.w));
}
for(const token of ['fetch(','localStorage','indexedDB','PAI_SRS','new XMLHttpRequest']){
 assert.ok(!html.includes(token),'review page cannot call '+token);
}
assert.equal(document.release.production_ready,false);
assert.equal(document.release.activation_allowed,false);
console.log('PASS 24 records, 29 deltas, KU identity, excluded HOLD, no SRS/browser storage/network API');
