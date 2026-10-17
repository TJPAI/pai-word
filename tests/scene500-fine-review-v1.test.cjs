const fs=require('fs');
const assert=require('assert');

const schema=JSON.parse(fs.readFileSync('data/scene500-sense-membership-schema-v1.json','utf8'));
const freeze=JSON.parse(fs.readFileSync('data/core20k-final-v206/freeze-contract.json','utf8'));
const policy=JSON.parse(fs.readFileSync('data/core20k-final-v206/post-freeze-policy.json','utf8'));
const review=fs.readFileSync('scene500-fine-review-v1.js','utf8');

assert.equal(freeze.baselineId,'Core20K_LongTerm_V2.0.6');
assert.equal(freeze.status,'FINAL_FROZEN');
assert.equal(freeze.rows,20000);
assert.equal(freeze.roleCounts.INHERITED_CORE13K_LEXICAL,12994);
assert.equal(freeze.roleCounts.LEXICAL_SEMANTIC,6002);
assert.equal(freeze.roleCounts.STRUCTURAL,1004);
assert.equal(policy.membershipImmutable,true);
assert.equal(policy.scene500.productionUnit,'SENSE');
assert.equal(policy.scene500.fixedTopK,false);
assert.deepEqual(policy.scene500.qaWindows,[100,300,1000]);
assert.equal(schema.membershipUnit,'sense');
assert.equal(schema.learningUnit,'KU');
assert.equal(schema.productionRules.generatedCandidateMayBeVerified,false);
assert.equal(schema.productionRules.finalMembershipRequiresRealSenseId,true);
assert.ok(review.includes("legacy_composed_scene_id_forbidden"));
assert.ok(review.includes("verified_requires_external_evidence"));
assert.ok(review.includes("generated_candidate_cannot_be_verified"));
assert.ok(review.includes("Core20K_LongTerm_V2.0.6"));

console.log('scene500 fine review v1 policy checks passed');
