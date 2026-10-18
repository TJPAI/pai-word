import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {buildCore20KRuntime} from './core20k-unified-runtime-adapter.mjs';
const arg=process.argv[2]||'data/core20k-runtime.json.gz';
const data=JSON.parse(gunzipSync(readFileSync(arg)).toString('utf8'));
const core=buildCore20KRuntime(data);
assert.equal(core.qa.words,20000);
assert.equal(core.qa.activeKU,16617);
assert.equal(core.qa.playableSense,16137);
assert.equal(core.byScene.get('daily').length,16137);
let activeWords=0, firstBlockedButLaterPlayable=0;
for(const word of core.words){
 const units=Object.values(word.s);
 const eligible=units.filter(s=>s.playable);
 if(eligible.length)activeWords++;
 if(units.length&&units[0].playable===false&&eligible.length){
  firstBlockedButLaterPlayable++;
  const primary=Object.keys(word.s).find(k=>core.byKU.get(k)?.s?.playable===true);
  assert(primary,'Missing playable primary '+word.w);
  assert(core.byKU.get(primary).s.m.trim(),'Blank answer '+word.w);
 }
}
assert.equal(activeWords,12976);
assert.equal(firstBlockedButLaterPlayable,17);
assert.equal(core.byLemma.get('out')[0].rank,1);
assert.equal(core.byLemma.get('chameleon')[0].rank,20000);
console.log(JSON.stringify({pass:true,words:core.qa.words,ku:core.qa.activeKU,playableSense:core.qa.playableSense,activeWords,firstBlockedButLaterPlayable}));
