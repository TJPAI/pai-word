import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canRegisterKU} from '../../../scripts/core20k-ku-registration-gate.mjs';

// B188 checks real provisional B184 references against the real registration gate.
// No ID assignment, source certification or Runtime changes are performed.
const plan=JSON.parse(fs.readFileSync(new URL('./b187_registration_preflight_4_20261025.json',import.meta.url),'utf8'));
const ids=new Set(['B180-P002','B180-P005','B180-P006','B180-P007']);
test('B187 scope contains exactly four distinct provisional candidates',()=>{
 assert.equal(plan.records.length,4);
 assert.deepEqual(new Set(plan.records.map(x=>x.provisional_candidate_id)),ids);
 assert.equal(plan.counts.new_registered,0);
});
test('all four fail formal KU registration with real pending fields',()=>{
 for(const r of plan.records){
  const c={candidate_id:r.provisional_candidate_id,target_sense_id:r.existing_registration_gate.target_sense_id,
   ku_id:r.existing_registration_gate.ku_id,pos:r.existing_registration_gate.pos,
   gloss_zh:r.existing_registration_gate.gloss_zh,gloss_en:r.existing_registration_gate.gloss_en,
   review_status:r.existing_registration_gate.review_status,
   evidence_locator:r.existing_registration_gate.evidence_locator,evidence_scope:r.existing_registration_gate.evidence_scope};
  const result=canRegisterKU(c,{license_status:'unverified'});
  assert.equal(result.eligible,false,r.phrase);
  for(const reason of ['MISSING_TARGET_IDENTITY','NOT_EDITORIALLY_ACCEPTED','LICENSE_NOT_APPROVED','MISSING_FIELD_EVIDENCE','MISSING_OR_COLLIDING_KU_ID']){
   assert.ok(result.reasons.includes(reason),r.phrase+':'+reason);
  }
 }
});
test('content PASS and isolated E2E are not registration authority',()=>{
 assert.equal(plan.production_ready,false);
 assert.equal(plan.release_eligible,false);
 for(const r of plan.records){
  assert.equal(r.gates.isolation_preview,'PASS_CHROMIUM_ONLY');
  assert.equal(r.gates.production_release,'BLOCKED');
 }
});
test('collision is rejected even when all other source fields are superficially present',()=>{
 const c={candidate_id:'fixture',target_sense_id:'fixture-sense',ku_id:'existing-ku',
 pos:'v.',gloss_zh:'测试',gloss_en:'test',review_status:'accepted',
 evidence_locator:'fixture',evidence_scope:'fixture'};
 const result=canRegisterKU(c,{license_status:'approved'},new Set(['existing-ku']));
 assert.equal(result.eligible,false);assert.ok(result.reasons.includes('MISSING_OR_COLLIDING_KU_ID'));
});
