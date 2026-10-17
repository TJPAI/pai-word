const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('daily and per-round settings use independent requested ranges and defaults',()=>{
  const src=read('round-policy.js');
  assert.match(src,/DAILY_ALLOWED=new Set\(\[25,50,100,200\]\)/);
  assert.match(src,/ROUND_ALLOWED=new Set\(\[10,25,50\]\)/);
  assert.match(src,/state\.newPerDay=50/);
  assert.match(src,/state\.wordsPerRound=10/);
  assert.match(src,/Math\.min\(roundSize\(\),dailyRemaining\(\)\)/);
  const base=read('mobile.js');
  assert.match(base,/newPerDay:50,wordsPerRound:10/);
});

test('final round policy owns scene sizing instead of legacy fixed ten',()=>{
  const src=read('round-policy.js');
  assert.match(src,/window\.openScene=function\(scene\)/);
  assert.match(src,/slice\(0,limit\)/);
  assert.match(src,/state\.learningSession\.queue=keys/);
});

test('Scene500 has no artificial vocabulary cap but broad parent-scene fallback is not playable',()=>{
  const policy=read('round-policy.js');
  assert.doesNotMatch(policy,/DISPLAY_LIMIT/);
  assert.doesNotMatch(policy,/Math\.min\(50/);
  assert.match(policy,/playableVocabulary='curated_scene_lemmas_only'/);
  assert.match(policy,/broadBackfillPlayable=false/);
  assert.match(policy,/delete state\.scene500Pilot/);
});

test('Scene500 fresh rounds are distinct by headword, not only by KU',()=>{
  const src=read('round-policy.js');
  assert.match(src,/seenWords=new Set\(\)/);
  assert.match(src,/wordKey=u\.w\?\.rank\?\?u\.w\?\.w/);
  assert.match(src,/Object\.keys\(u\.w\?\.s\|\|\{\}\)\.some\(id=>state\.records\?\.\[id\]\)/);
});

test('manual recall correction remains immediate and authoritative',()=>{
  const src=read('round-policy.js');
  assert.match(src,/PAI_TAP_FLOW\?\.correct/);
  assert.match(src,/PAI_TAP_FLOW\.cancel\?\.\(\)/);
  assert.match(src,/rateLearning\?\.\(score,u\.k\)/);
});
