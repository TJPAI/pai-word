import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightAuthority} from './b201_authority_preflight.mjs';
const provisional={candidate_id:'B180-P002',headword:'bear',rank:714,sense_id:null,
 revision_hash:'revision',source_id:'Cambridge',evidence_locator:null,evidence_scope:null};
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
 approved_editorial_reviews:{'B180-P002':{revision_hash:'revision'}},
 source_licenses:{example:'APPROVED'},
 registrar_approval:{status:'APPROVED',runtime_sha256:'e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b'}};
 const v=preflightAuthority({...provisional,sense_id:'s1',source_id:'example',
 evidence_locator:'test-evidence',evidence_scope:'test-scope'},registry);
 assert.equal(v.eligible_for_id_reservation,true);
 assert.equal(v.registered,false);
 assert.equal(v.release_eligible,false);
 assert.equal(v.srs_write_allowed,false);
});
