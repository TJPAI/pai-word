// Editorial overlay builder: only human-approved KU are emitted; pending records never alter runtime.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const input=JSON.parse(fs.readFileSync('data/audit/core13k20k-p0-256-editorial-queue-v1.json','utf8'));
assert.equal(input.schema,'pai-core20k-p0-256-editorial-queue-v1');
assert.equal(input.count,256);
assert.equal(input.rows.length,input.count);
assert.equal(input.source_checked,input.rows.filter(r=>r.source_content_checked).length);
assert.equal(input.proposed,input.rows.filter(r=>!!r.proposed_zh).length);
assert.equal(input.approved,input.rows.filter(r=>r.release_eligible).length);
const allowedTypes=new Set(['grammar','collocation','contrast','pronunciation','risk','usage']);
const seen=new Set(), approved=[];
for(const r of input.rows){
 assert(!seen.has(r.ku_id),'duplicate KU '+r.ku_id);seen.add(r.ku_id);
 assert(allowedTypes.has(r.ku_type),'unexpected KU type '+r.ku_id);
 assert.equal(typeof r.old_zh,'string');assert.equal(typeof r.core20k_zh,'string');
 if(r.release_eligible){
  assert.equal(r.editorial_checked,true,'editor not approved '+r.ku_id);
  assert.equal(r.source_content_checked,true,'source not verified '+r.ku_id);
  assert(r.proposed_zh?.trim().length>10,'missing proposed content '+r.ku_id);
  assert(r.source_url?.startsWith('https://'),'source URL missing '+r.ku_id);
  assert(r.editorial_reviewer&&r.editorial_reviewed_at,'missing approval provenance '+r.ku_id);
  assert.equal(r.status,'approved_for_overlay','incorrect approval state '+r.ku_id);
  approved.push({ku_id:r.ku_id,lemma:r.lemma,ku_type:r.ku_type,zh:r.proposed_zh,source_url:r.source_url,reviewer:r.editorial_reviewer,reviewed_at:r.editorial_reviewed_at});
 }
}
const overlay={schema:'pai-core20k-nonsenses-ku-overlay-v1',source:'data/audit/core13k20k-p0-256-editorial-queue-v1.json',items:approved,release_eligible_count:approved.length};
fs.mkdirSync('audit-output',{recursive:true});
fs.writeFileSync('audit-output/core20k-p0-approved-overlay.json',JSON.stringify(overlay,null,2)+'\n');
console.log('Editorial overlay contract PASS: '+input.rows.length+' reviewed records, '+approved.length+' approved changes');
