// Batch82 reproducible review helper. Input: Batch81 legacy_ku_crosswalk_16816.jsonl
// Example: node batch82-ipa-risk-audit.mjs <legacy.jsonl>
import fs from 'node:fs';import assert from 'node:assert/strict';
const path=process.argv[2];if(!path)throw Error('Provide full 16816-row JSONL path');
const rows=fs.readFileSync(path,'utf8').trim().split('\n').map(JSON.parse);
assert.equal(rows.length,16816);
const words=new Map();for(const r of rows)if(!words.has(r.headword_id))words.set(r.headword_id,r);
assert.equal(words.size,12994);
const stressRisk=[...words.values()].filter(r=>/^\/[bcdfghjklmnpqrstvwxyzðθʃʒŋ]+[ˈˌ]/.test(r.us_ipa||''));
const top=rows.filter(r=>r.rank<=1000);
assert.equal(top.length,2933);assert.equal(new Set(rows.map(r=>r.ku_id)).size,16816);
assert.equal(stressRisk.length,7468);
assert(rows.every(x=>x.production_ready===false));
console.log(JSON.stringify({headwords:words.size,ku:rows.length,top1000_ku:top.length,ipa_heuristic_flags:stressRisk.length,certified:0}));
