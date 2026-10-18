const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const policy=JSON.parse(fs.readFileSync('data/scene500-ranked-membership-policy-v1.json','utf8'));

test('Scene500 membership has no fixed Top-K depth',()=>{
  assert.equal(policy.selectionPolicy,'threshold_based_ranked_membership');
  assert.equal(policy.fixedDepth,null);
  assert.equal(policy.rules.noFixedTopK,true);
  assert.equal(policy.rules.naturalSceneSize,true);
  assert.equal(policy.rules.weakRelevanceMustNotBeAddedToFillQuota,true);
});

test('study round size is independent from scene membership size',()=>{
  assert.equal(policy.rules.runtimeRoundSizeIndependentFromSceneSize,true);
  assert.deepEqual(policy.runtime.wordsPerRoundOptions,[10,25,50]);
  assert.equal(policy.runtime.wordsPerRoundDefault,10);
  assert.equal(policy.fixedMaximumSize,null);
});

test('historical Top100 Top300 Top1000 are QA-only metrics',()=>{
  assert.deepEqual(policy.qa.historicalDepthMetrics,[100,300,1000]);
  assert.equal(policy.qa.historicalDepthMetricsPurpose,'coverage_audit_only');
  assert.equal(policy.qa.historicalDepthMetricsAffectRuntimeMembership,false);
});

test('canonical learning architecture remains family-word-sense-KU',()=>{
  assert.equal(policy.architecture,'WORD_FAMILY -> WORD -> SENSE -> KU');
  assert.equal(policy.sceneMembershipUnit,'sense');
  assert.equal(policy.learningUnit,'KU');
  assert.equal(policy.masterLexicon,'Core-20K');
});
