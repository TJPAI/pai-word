import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightAuthority} from './b201_authority_preflight.mjs';
const provisional={candidate_id:'B180-P002',headword:'bear',rank:714,sense_id:null,
 revision_hash:'a'.repeat(64),source_id:'Cambridge',evidence_locator:null,evidence_scope:null};
test('four B184 provisional candidates remain blocked without authority',()=>{
 for(const [candidate_id,headword,rank] of [
 ['B180-P002','bear',714],['B180-P005','package',720],
 ['B180-P006','board',721],['B180-P007','cut',722]]){
  const v=preflightAuthority({...provisional,candidate_id,headword,rank},{});
  assert.equal(v.eligible_for_id_reservation,false);
  assert.equal(v.registered,false);assert.equal(v.srs_write_allowed,false);
  assert.ok(v.errors.includes('NO_AUTHORITATIVE_REGISTRY'));
 }
});
test('frozen hash plus arbitrary sense ID never passes as registration authority',()=>{
 const registry={schema:'pai-core20k-authoritative-registry-v1',
 runtime_sha256:'e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b',
 headwords:{bear:{rank:714}},senses:{},approved_editorial_reviews:{},source_licenses:{},
 registrar_approval:{}};
 const v=preflightAuthority({...provisional,sense_id:'invented'},registry);
 assert.equal(v.eligible_for_id_reservation,false);
 assert.ok(v.errors.includes('SENSE_OWNER_NOT_APPROVED'));
});
test('even a complete synthetic authorization fixture never registers or publishes',()=>{
 const registry={schema:'pai-core20k-authoritative-registry-v1',
 runtime_sha256:'e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b',
 headwords:{bear:{rank:714}},senses:{s1:{headword:'bear',approval:'APPROVED'}},
 approved_editorial_reviews:{'B180-P002':{revision_hash:'a'.repeat(64)}},
 source_licenses:{example:'APPROVED'},
 registrar_approval:{status:'APPROVED',runtime_sha256:'e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b'}};
 const v=preflightAuthority({...provisional,sense_id:'s1',source_id:'example',
 evidence_locator:'test-evidence',evidence_scope:'test-scope'},registry);
 assert.equal(v.eligible_for_id_reservation,true);
 assert.equal(v.registered,false);
 assert.equal(v.release_eligible,false);
 assert.equal(v.srs_write_allowed,false);
});

test('absent hashes on both sides never count as editorial approval',()=>{
 const registry={schema:'pai-core20k-authoritative-registry-v1',approved_editorial_reviews:{'B180-P002':{}}};
 const result=preflightAuthority({...provisional,revision_hash:undefined},registry);
 assert.equal(result.eligible_for_id_reservation,false);
 assert.ok(result.errors.includes('EDITORIAL_REVISION_NOT_APPROVED'));
});
test('incorrect or malformed hash does not pass even with matching registry value',()=>{
 const registry={approved_editorial_reviews:{'B180-P002':{revision_hash:'bad'}}};
 const result=preflightAuthority({...provisional,revision_hash:'bad'},registry);
 assert.ok(result.errors.includes('EDITORIAL_REVISION_NOT_APPROVED'));
});

test('untrusted self-asserted registry can satisfy shape checks but never grant registration',()=>{
 const hash='b'.repeat(64);
 const fake={schema:'pai-core20k-authoritative-registry-v1',
   runtime_sha256:hash,headwords:{bear:{rank:714}},
   senses:{fabricated:{headword:'bear',approval:'APPROVED'}},
   approved_editorial_reviews:{'B180-P002':{revision_hash:hash}},
   source_licenses:{fabricated:'APPROVED'},
   registrar_approval:{status:'APPROVED',runtime_sha256:hash}};
 const result=preflightAuthority({
   ...provisional,revision_hash:hash,sense_id:'fabricated',
   source_id:'fabricated',evidence_locator:'fabricated',evidence_scope:'fabricated'
 },fake);
 // This is a documented trust-boundary failure, NOT production authorization.
 assert.equal(result.eligible_for_id_reservation,true);
 assert.equal(result.registered,false);
 assert.equal(result.release_eligible,false);
 assert.equal(result.srs_write_allowed,false);
});
