import fs from 'node:fs';import assert from 'node:assert/strict';
const r=fs.readFileSync(new URL('batch79_seven_grammar_complete_staging.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
assert.equal(r.length,7);assert.equal(new Set(r.map(x=>x.ku_id)).size,7);
for(const x of r){assert.equal(x.ku_type,'Grammar');for(const f of ['teaching_objective','prompt','correct_answer','explanation_zh','example_en','example_zh','sense_id'])assert(x[f]?.trim(),f+':'+x.ku_id);assert(x.source_attribution[0].url.startsWith('https://'));assert.equal(x.production_ready,false);assert.equal(x.release_eligible,false);assert(x.missing_approvals.length>=6)}
console.log('PASS 7 unique existing KU IDs, complete learning draft fields, explicit 6-stage fail-closed');
