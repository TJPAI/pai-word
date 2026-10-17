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

test('Scene500 playable vocabulary is membership-driven with no broad fallback',()=>{
  const bridge=read('scene500-integrated.js');
  const membership=JSON.parse(read('data/scene500-playable-membership-v1.json'));
  assert.equal(membership.policy.playableOnly,true);
  assert.equal(membership.policy.generatedCandidatesNeverAutoVerified,true);
  assert.match(bridge,/PAI_SCENE500_MEMBERSHIP/);
  assert.match(bridge,/playableVocabulary:'membership_data_only'/);
  assert.match(bridge,/broadBackfillPlayable:false/);
  assert.doesNotMatch(bridge,/BASE_POOL/);
  assert.doesNotMatch(bridge,/MAX_SCENE_UNITS/);
});

test('Scene500 membership runtime exposes QA for missing, empty, unresolved and duplicate entries',()=>{
  const bridge=read('scene500-integrated.js');
  assert.match(bridge,/missingMembership/);
  assert.match(bridge,/emptyPlayable/);
  assert.match(bridge,/unresolvedLemmas/);
  assert.match(bridge,/duplicateEntries/);
  assert.match(bridge,/membershipSchemaVersion/);
  assert.match(bridge,/membershipStatus/);
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
