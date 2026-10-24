import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const path=process.argv[2];
if(!path)throw Error('USAGE: node scripts/core20k-production-staging-gate.mjs <staging.json>');
const raw=fs.readFileSync(path);
const pack=JSON.parse(raw.toString('utf8'));
assert.equal(pack.schema_version,'pai-core20k-production-intake-v1');
assert.equal(pack.test_only,true);
assert.equal(pack.release_eligible,false);
assert.equal(pack.srs_write_allowed,false);
assert(Array.isArray(pack.records)&&pack.records.length>0);
const ids=new Set(), tuples=new Map(), blocking=[];
for(const [index,r] of pack.records.entries()){
  for(const k of ['ku_id','sense_id','headword_id'])assert(typeof r[k]==='string'&&r[k].length>0, `missing ${k} at ${index}`);
  assert(!ids.has(r.ku_id),`duplicate ku_id: ${r.ku_id}`);ids.add(r.ku_id);
  assert.equal(r.test_only,true);
  assert.equal(r.quality?.release_eligible,false);
  assert.equal(r.quality?.srs_write_allowed,false);
  assert.equal(r.quality?.semantic_verified,false);
  assert.equal(r.quality?.stage,'PRODUCTION_INTAKE_QUARANTINE');
  assert.equal(r._intake?.production_review,'PENDING_INDEPENDENT_SEMANTIC_CERTIFICATION');
  const tuple=r.headword_id+'|'+r.sense_id;
  if(tuples.has(r.ku_id))assert.equal(tuples.get(r.ku_id),tuple);
  tuples.set(r.ku_id,tuple);
  if((r._intake?.risk_flags||[]).some(x=>x.severity==='blocking'))blocking.push(r.ku_id);
}
console.log(JSON.stringify({status:'PASS_STAGING_ISOLATION_ONLY',records:pack.records.length,unique_ku_ids:ids.size,blocking_ku_ids:blocking,sha256:crypto.createHash('sha256').update(raw).digest('hex'),production_release_eligible:0,runtime_identity_checked:false},null,2));
