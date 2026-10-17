const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('daily and per-round settings use independent requested ranges and persisted defaults',()=>{
  const src=read('round-policy.js');
  assert.match(src,/DAILY_ALLOWED=new Set\(\[25,50,100,200\]\)/);
  assert.match(src,/ROUND_ALLOWED=new Set\(\[10,25,50\]\)/);
  assert.match(src,/state\.newPerDay=50/);
  assert.match(src,/state\.wordsPerRound=10/);
  assert.match(src,/if\(normalized\)save\(\)/);
  assert.match(src,/Math\.min\(roundSize\(\),dailyRemaining\(\)\)/);
  const base=read('mobile.js');
  assert.match(base,/newPerDay:50,wordsPerRound:10/);
});

test('round-policy is the only Scene500 session policy owner',()=>{
  const policy=read('round-policy.js');
  const bridge=read('scene500-integrated.js');
  assert.match(policy,/window\.openScene=function\(scene\)/);
  assert.match(policy,/state\.learningSession\.queue=keys/);
  assert.doesNotMatch(bridge,/window\.openScene\s*=/);
  assert.doesNotMatch(bridge,/window\.queueFor\s*=/);
  assert.doesNotMatch(bridge,/function assignment\(/);
  assert.match(bridge,/sessionPolicyOwner:'round-policy\.js'/);
});

test('Scene500 v2 ranks Core membership without duplicating lexical content',()=>{
  const bridge=read('scene500-integrated.js');
  const membership=JSON.parse(read('data/scene500-playable-membership-v2.json'));
  assert.equal(membership.schemaVersion,2);
  assert.equal(membership.policy.masterLexicon,'Core-20K');
  assert.equal(membership.policy.membershipUnit,'sense');
  assert.equal(membership.policy.learningUnit,'KU');
  assert.equal(membership.policy.seedReferenceUnit,'headword');
  assert.equal(membership.policy.generatedCandidatesNeverAutoVerified,true);
  assert.match(bridge,/ranked_membership_data_only/);
  assert.match(bridge,/membershipByScene/);
  assert.doesNotMatch(bridge,/BASE_POOL/);
  assert.doesNotMatch(bridge,/MAX_SCENE_UNITS/);
});

test('Scene500 wordId is never silently treated as Core rank',()=>{
  const bridge=read('scene500-integrated.js');
  const schema=JSON.parse(read('data/scene500-playable-membership-v2.schema.json'));
  const props=schema.properties.scenes.additionalProperties.properties.entries.items.properties;
  assert.ok(props.wordId);
  assert.ok(props.coreRank);
  assert.match(bridge,/function wordByStableId\(wordId\)/);
  assert.match(bridge,/function wordByCoreRank\(coreRank\)/);
  assert.match(bridge,/if\(raw\.wordId\).*wordByStableId/);
  assert.match(bridge,/if\(raw\.coreRank!==null&&raw\.coreRank!==undefined\).*wordByCoreRank/);
  assert.doesNotMatch(bridge,/Number\(raw\.wordId\)/);
});

test('Scene500 generated candidates cannot enter playable learning pools',()=>{
  const bridge=read('scene500-integrated.js');
  assert.match(bridge,/generated_candidate/);
  assert.match(bridge,/blockedGenerated/);
  assert.match(bridge,/\['editorial','dictionary_corpus_verified','source_verified'\]\.includes/);
});

test('Scene500 membership resolves explicit KU or sense before word, rank or lemma fallback',()=>{
  const bridge=read('scene500-integrated.js');
  const ku=bridge.indexOf('if(raw.kuId)');
  const sense=bridge.indexOf('if(raw.senseId)');
  const word=bridge.indexOf('if(raw.wordId)');
  const rank=bridge.indexOf('if(raw.coreRank!==null');
  const lemma=bridge.indexOf("const lemma=String(raw.lemma||'')");
  assert.ok(ku>=0&&ku<sense&&sense<word&&word<rank&&rank<lemma);
  assert.match(bridge,/rankIssues/);
  assert.match(bridge,/unresolvedEntries/);
  assert.match(bridge,/duplicateEntries/);
});

test('mechanical primary-sense fallback is never reported as Sense-level verified',()=>{
  const bridge=read('scene500-integrated.js');
  assert.match(bridge,/explicit_sense_binding/);
  assert.match(bridge,/primary_sense_fallback_unreviewed/);
  assert.match(bridge,/unverifiedSenseBindings/);
  assert.match(bridge,/ambiguousLemmaBindings/);
  assert.match(bridge,/candidateSenseCount/);
  assert.match(bridge,/bindingMethod/);
  assert.match(bridge,/senseBindingStatus/);
  assert.match(bridge,/exportResolvedMembership/);
  assert.match(bridge,/runtime_resolution_audit_only/);
});

test('sense review queue is deterministic and never mutates playable membership',()=>{
  const review=read('scene500-sense-review.js');
  assert.match(review,/sense-review-v2/);
  assert.match(review,/single_candidate_needs_review/);
  assert.match(review,/needs_candidate_selection/);
  assert.match(review,/sort\(\(a,b\)=>\(Number\(a\.coreRank\)/);
  assert.match(review,/buildMembershipPatch/);
  assert.match(review,/mutationApplied:false/);
  assert.match(review,/ku_id_not_in_candidates/);
  assert.doesNotMatch(review,/byScene\.set/);
  assert.doesNotMatch(review,/window\.openScene\s*=/);
  assert.doesNotMatch(review,/PAI_SCENE500_MEMBERSHIP\s*=/);
});

test('Sense-reviewed membership requires an explicit reviewed KU selection',()=>{
  const review=read('scene500-sense-review.js');
  const schema=JSON.parse(read('data/scene500-playable-membership-v2.schema.json'));
  const props=schema.properties.scenes.additionalProperties.properties.entries.items.properties;
  assert.ok(props.senseBindingReviewed);
  assert.ok(props.senseBindingMethod);
  assert.match(review,/senseBindingReviewed:true/);
  assert.match(review,/senseBindingMethod:'manual_review'/);
  assert.match(review,/const candidate=row\.candidates\.find/);
  assert.match(review,/No row is Sense-reviewed until an explicit selected KU/);
});

test('fresh rounds are distinct by headword, not only by KU',()=>{
  const src=read('round-policy.js');
  assert.match(src,/seenWords=new Set\(\)/);
  assert.match(src,/wordKey=u\.w\?\.rank\?\?u\.w\?\.w/);
  assert.match(src,/Object\.keys\(u\.w\?\.s\|\|\{\}\)\.some\(id=>state\.records\?\.\[id\]\)/);
});

test('home exposes separate new-word, reinforcement and due flows',()=>{
  const policy=read('round-policy.js');
  const home=read('home-dashboard.js');
  assert.match(policy,/window\.studyBudgetSummary=/);
  assert.match(policy,/window\.openReinforcement=function\(\)/);
  assert.match(home,/今日新词/);
  assert.match(home,/openReinforcement\(\)/);
  assert.match(home,/强化/);
  assert.match(home,/到期/);
});

test('manual recall correction remains immediate and authoritative',()=>{
  const src=read('round-policy.js');
  assert.match(src,/PAI_TAP_FLOW\?\.correct/);
  assert.match(src,/PAI_TAP_FLOW\.cancel\?\.\(\)/);
  assert.match(src,/rateLearning\?\.\(score,u\.k\)/);
});
