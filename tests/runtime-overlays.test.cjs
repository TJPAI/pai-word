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
  assert.match(src,/window\.setNewPerDay=function\(n\)/);
  assert.match(src,/window\.setWordsPerRound=function\(n\)/);
  const base=read('mobile.js');
  assert.match(base,/newPerDay:50,wordsPerRound:10/);
});

test('final round policy owns scene sizing instead of legacy fixed ten',()=>{
  const src=read('round-policy.js');
  assert.match(src,/window\.openScene=function\(scene\)/);
  assert.match(src,/PAI_LEARNING_QA\?\.unlearned\?\.\(scene\)/);
  assert.match(src,/slice\(0,limit\)/);
  assert.match(src,/state\.learningSession\.queue=keys/);
});

test('Scene500 vocabulary pools and displayed counts have no artificial 50-word cap',()=>{
  const policy=read('round-policy.js');
  const bridge=read('scene500-integrated.js');
  assert.doesNotMatch(policy,/DISPLAY_LIMIT/);
  assert.doesNotMatch(policy,/Math\.min\(50/);
  assert.doesNotMatch(bridge,/MAX_SCENE_UNITS/);
  assert.match(policy,/for\(const u of fallback\)/);
  assert.match(bridge,/for\(const u of fallback\)addUnit\(units,seen,u\)/);
});

test('manual recall correction remains immediate and authoritative',()=>{
  const src=read('round-policy.js');
  assert.match(src,/PAI_TAP_FLOW\?\.correct/);
  assert.match(src,/PAI_TAP_FLOW\.cancel\?\.\(\)/);
  assert.match(src,/rateLearning\?\.\(score,u\.k\)/);
});
