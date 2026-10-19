import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=JSON.parse(fs.readFileSync('data/audit/core13k20k-p0-evidence-v6.json','utf8'));
const c=JSON.parse(fs.readFileSync('data/audit/core13k20k-p0-editorial-candidates-v7.json','utf8'));
assert.equal(c.schema,'pai-core20k-p0-editorial-candidates-v7');
assert.equal(base.count,20);
assert.equal(c.total,20);
assert.equal(c.rows.length,20);
assert.equal(c.drafted,5);
assert.equal(c.source_verified,0);
assert.equal(c.release_eligible,0);
const expected=new Map(base.rows.map(r=>[r.ku_id,r]));
assert.equal(expected.size,20);
for(const r of c.rows){
 const old=expected.get(r.ku_id);
 assert(old,'unknown KU');
 assert.equal(r.ku_type,old.ku_type);
 assert.equal(r.old_zh,old.old_zh);
 assert.equal(r.core20k_zh,old.core20k_zh);
 assert.equal(r.release_eligible,false);
 assert.equal(r.source_content_checked,false);
 assert.equal(r.editorial_checked,false);
 assert(['draft_waiting_source_verification','pending_evidence'].includes(r.status));
 if(r.proposed_zh){
  assert(r.source_url?.startsWith('https://dictionary.cambridge.org/'));
  assert(r.proposed_zh.length>12);
 }else assert.equal(r.source_url,null);
}
console.log('P0 editorial V7 fail-closed contract PASS: 20 records, 5 drafts, 0 approved');
