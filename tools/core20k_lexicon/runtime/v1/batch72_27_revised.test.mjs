import fs from 'node:fs';import assert from 'node:assert/strict';
const rows=fs.readFileSync(new URL('./batch72_27_revised_staging.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
assert.equal(rows.length,27);assert.equal(new Set(rows.map(r=>r.ku_id)).size,27);
let repaired=0;
for(const r of rows){
 assert.equal(r.ku_type,'Collocation');assert.equal(r.choices.length,4);
 assert.equal(new Set(r.choices).size,4);assert.equal(r.choices[r.correct_option_index],r.correct_answer);
 assert.equal(r.production_ready,false);assert.equal(r.release_eligible,false);
 assert.equal(r.linguistic_distractor_review_complete,false);
 if(r.batch72_status==='CONFLICT_REMOVED_PEDAGOGY_REVIEW_REQUIRED')repaired++;
}
assert.equal(repaired,8);
console.log('PASS 27 records, 8 repaired risks, stable KU IDs, fail closed');
