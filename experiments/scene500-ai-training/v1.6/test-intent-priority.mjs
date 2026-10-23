// QA for C2 intent-priority corpus. Run after build-c2-intent-priority.mjs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const path='experiments/scene500-ai-training/v1.6/c2-intent-priority-corpora.json';
const data=JSON.parse(readFileSync(path,'utf8'));
assert.match(data.taxonomyFingerprint,/^[a-f0-9]{64}$/);
assert.match(data.catalogFileSha256,/^[a-f0-9]{64}$/);
const ids=Array.from({length:500},(_,i)=>'S'+String(i+1).padStart(3,'0'));
for(const [variant,scenes] of Object.entries(data.variants)){
 assert.equal(scenes.length,500);
 assert.deepEqual(scenes.map(x=>x.id),ids);
 assert.ok(scenes.every(x=>x.passage.startsWith('passage: ')&&x.passage.length<=369));
 const d=data.diagnostics[variant];
 assert.equal(d.scenes,500);
 assert.equal(d.changedScenes,229);
 assert.equal(d.intentIncludedScenes+d.intentExcludedScenes,229);
 console.log(variant,JSON.stringify(d));
}
assert.ok(data.diagnostics.P1.intentIncludedScenes>=data.diagnostics.C2.intentIncludedScenes);
assert.ok(data.diagnostics.P2.intentIncludedScenes>=data.diagnostics.C2.intentIncludedScenes);
assert.ok(data.diagnostics.P3.intentIncludedScenes>=data.diagnostics.C2.intentIncludedScenes);
console.log('PASS C2/P1/P2/P3 corpus structural QA');
