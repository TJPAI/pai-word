// Ensure incomplete editorial P0 evidence never enters publishable lexicon overlays.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const x=JSON.parse(fs.readFileSync('data/audit/core13k20k-p0-evidence-v6.json','utf8'));
assert.equal(x.schema,'pai-core20k-p0-repeated-gloss-evidence-v6');
assert.equal(x.count,20);
assert.equal(x.rows.length,20);
assert.equal(new Set(x.rows.map(r=>r.ku_id)).size,20);
for(const row of x.rows){
 assert.equal(row.release_eligible,false,'P0 source evidence alone may not release '+row.ku_id);
 assert(row.ku_type!=='sense','This audit only covers non-sense KU');
 assert(row.old_zh&&row.core20k_zh);
 if(row.evidence_url)assert(row.evidence_url.startsWith('https://dictionary.cambridge.org/'));
}
console.log('P0 editorial evidence gate PASS (20 pending, 0 release-eligible)');
