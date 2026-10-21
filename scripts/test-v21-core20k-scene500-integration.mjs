// Run: node scripts/test-v21-core20k-scene500-integration.mjs
// Uses actual runtime exports with a 20,000-word in-memory fixture; no user state is written.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCore20KRuntime} from './core20k-unified-runtime-adapter.mjs';
import {applySceneTop100} from './scene500-top100-runtime.mjs';
const shard=JSON.parse(readFileSync(new URL('../data/scene500-top100-v40/group-01.json',import.meta.url),'utf8'));
const rows=shard.scenes.S001;
const map=new Map(rows.map(r=>[r[2],r]));
const headwords=Array.from({length:20000},(_,i)=>{
 const rank=i+1,match=map.get(rank),lemma=match?.[1]||'fixture_word_'+rank;
 return [rank,lemma,'n','',match?.[3]?[[match[3],'sense','模拟释义','',true]]:[]];
});
const core=buildCore20KRuntime({schema:'pai-core20k-runtime-v1',headwords});
const expected=rows.filter(r=>r[3]).length;
const result=applySceneTop100(core,'S001',rows);
assert.equal(result.playable,expected);
assert.equal(core.byScene.get('S001').length,expected);
const first=rows.find(r=>r[3]);
core.byKU.delete(first[3]);
const reduced=applySceneTop100(core,'S001',rows);
assert.equal(reduced.playable,expected-1,'unresolved KU must not be included');
assert.throws(()=>applySceneTop100(core,'S501',rows),/SCENE_ID/);
assert.throws(()=>applySceneTop100(core,'S001',rows.slice(1)),/TOP100_SIZE/);
console.log('PASS: real Core20K adapter + Scene500 resolver with controlled data; missing KU correctly excluded');
