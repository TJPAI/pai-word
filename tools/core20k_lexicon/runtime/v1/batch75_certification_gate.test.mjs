import fs from 'node:fs';import assert from 'node:assert/strict';
const path=new URL('./batch75_seven_certification_gate.jsonl',import.meta.url);
const rows=fs.readFileSync(path,'utf8').trim().split('\n').map(JSON.parse);
assert.equal(rows.length,7);assert.equal(new Set(rows.map(x=>x.ku_id)).size,7);
for(const r of rows){
 assert.equal(r.ku_type,'Grammar');
 assert.equal(r.certification_stage,'DIRECT_RULE_EVIDENCE_ATTACHED');
 assert.equal(r.production_ready,false);assert.equal(r.release_eligible,false);
 for(const k of ['sense_alignment_verified','bilingual_final_signoff','answer_uniqueness_verified','pos_context_ipa_verified'])assert.equal(r[k],false);
 assert(r.external_source_url.startsWith('https://'));
 assert(r.blocking_requirements.length===4);
}
console.log('PASS: 7 real legacy KU IDs, 4 unsatisfied certification gates each, zero unauthorized promotions');
