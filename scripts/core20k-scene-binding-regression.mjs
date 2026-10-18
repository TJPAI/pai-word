// Run: node scripts/core20k-scene-binding-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const word=(rank,w,k)=>({rank,w,s:{[k]:{kuType:'sense',playable:true,m:w,scene:'daily'}}});
const alpha=word(1,'alpha','ku-alpha'),beta=word(2,'beta','ku-beta');
const units=[{w:alpha,sid:'ku-alpha',k:'ku-alpha',s:alpha.s['ku-alpha']},{w:beta,sid:'ku-beta',k:'ku-beta',s:beta.s['ku-beta']}];
const core={words:[alpha,beta],byKU:new Map(units.map(u=>[u.k,u])),byLemma:new Map([['alpha',[alpha]],['beta',[beta]]]),byScene:new Map()};
const entries=[
 {lemma:'beta',coreRank:1,sceneRank:1}, // stale Core13K rank; must resolve beta by lemma
 {lemma:'alpha',kuId:'ku-beta',senseBindingReviewed:true,sceneRank:2}, // wrong KU must be excluded
 {lemma:'alpha',kuId:'ku-alpha',senseBindingReviewed:true,sceneRank:3}
];
const window={PAI_CORE:core,PAI_SCENE500_MEMBERSHIP:{schemaVersion:2,scenes:{cs018:{reviewed:true,evidenceStatus:'editorial',entries}}}};
const sandbox={window,SCENES:{daily:'Daily'},console};
vm.runInNewContext(readFileSync('scene500-integrated.js','utf8'),sandbox,{filename:'scene500-integrated.js'});
const result=window.PAI_SCENE500;
const resolved=result.membershipByScene.cs018;
assert.equal(resolved.length,2);
assert.equal(resolved[0].lemma,'beta');
assert.equal(resolved[0].kuId,'ku-beta');
assert.equal(resolved[0].bindingMethod,'stale_coreRank_lemma_fallback');
assert.equal(resolved[1].lemma,'alpha');
assert.equal(resolved[1].kuId,'ku-alpha');
assert.equal(core.byScene.get('cs018').length,2);
assert.ok(result.qa.unresolvedEntries.some(x=>x.includes('ku-beta')));
console.log(JSON.stringify({pass:true,scene:'cs018',entries:entries.length,resolved:resolved.length,blocked:result.qa.unresolvedEntries.length}));
