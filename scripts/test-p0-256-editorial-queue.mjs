import assert from 'node:assert/strict';
import fs from 'node:fs';
const q=JSON.parse(fs.readFileSync('data/audit/core13k20k-p0-256-editorial-queue-v1.json','utf8'));
const v7=JSON.parse(fs.readFileSync('data/audit/core13k20k-p0-editorial-candidates-v7.json','utf8'));
assert.equal(q.schema,'pai-core20k-p0-256-editorial-queue-v1');
assert.equal(q.count,256);assert.equal(q.rows.length,256);
assert.equal(new Set(q.rows.map(r=>r.ku_id)).size,256);
assert.equal(q.inherited_from_20,20);
assert.equal(q.source_checked,q.rows.filter(r=>r.source_content_checked).length);
assert.equal(q.proposed,q.rows.filter(r=>r.proposed_zh).length);
assert.equal(q.approved,q.rows.filter(r=>r.release_eligible).length);
assert.equal(q.approved,0);
const old=new Map(v7.rows.map(r=>[r.ku_id,r]));
for(const r of q.rows){
 assert(r.ku_type!=='sense'&&r.old_zh&&r.core20k_zh,'invalid KU '+r.ku_id);
 assert.equal(r.editorial_checked,false);
 assert.equal(r.release_eligible,false);
 if(r.source_content_checked)assert(r.source_url?.startsWith('https://')&&r.source_evidence);
 const p=old.get(r.ku_id);
 if(p){assert.equal(p.old_zh,r.old_zh);assert.equal(p.core20k_zh,r.core20k_zh);assert.equal(p.status,r.status);}
}
assert.equal([...old.keys()].filter(id=>!q.rows.some(r=>r.ku_id===id)).length,0);
console.log('P0 256 editorial queue contract: PASS; '+q.source_checked+' source checked, '+q.proposed+' proposed, 0 approved');
