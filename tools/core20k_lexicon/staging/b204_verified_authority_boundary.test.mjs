import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifiedPreflight} from './b204_verified_authority_boundary.mjs';
const baseline='e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b';
const hash='a'.repeat(64);
const candidate={candidate_id:'B180-P002',headword:'bear',rank:714,sense_id:'fake',
 revision_hash:hash,source_id:'fake',evidence_locator:'fake',evidence_scope:'fake'};
const registry={schema:'pai-core20k-authoritative-registry-v1',runtime_sha256:baseline,
 headwords:{bear:{rank:714}},senses:{fake:{headword:'bear',approval:'APPROVED'}},
 approved_editorial_reviews:{'B180-P002':{revision_hash:hash}},
 source_licenses:{fake:'APPROVED'},registrar_approval:{status:'APPROVED',runtime_sha256:baseline}};
const source=JSON.stringify(registry);
const trusted={authority:'FORMAL_RELEASE_REGISTRY',sha256:createHash('sha256').update(source).digest('hex'),
 release_approved:true,runtime_sha256:baseline};
test('self-attested approval cannot pass without independent manifest',()=>{
 const result=verifiedPreflight(candidate,source);
 assert.equal(result.eligible_for_id_reservation,false);
 assert.deepEqual(result.errors,['TRUSTED_REGISTRY_MANIFEST_MISSING']);
});
test('altered registry is blocked by pinned digest',()=>{
 const v=verifiedPreflight(candidate,source+' ',trusted);
 assert.equal(v.eligible_for_id_reservation,false);
 assert.deepEqual(v.errors,['TRUSTED_REGISTRY_HASH_MISMATCH']);
});
test('approval metadata must be bound to the exact baseline',()=>{
 const v=verifiedPreflight(candidate,source,{...trusted,runtime_sha256:'b'.repeat(64)});
 assert.deepEqual(v.errors,['RUNTIME_BASELINE_MISMATCH']);
});
test('a synthetic independently pinned fixture is only a preflight, never a registration',()=>{
 const v=verifiedPreflight(candidate,source,trusted);
 assert.equal(v.eligible_for_id_reservation,true);
 assert.equal(v.registered,false);assert.equal(v.release_eligible,false);assert.equal(v.srs_write_allowed,false);
});
