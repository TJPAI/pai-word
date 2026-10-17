const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('daily new-word quota and per-round size use independent state fields',()=>{
  const src=read('round-policy.js');
  assert.match(src,/state\.wordsPerRound/);
  assert.match(src,/state\.newPerDay/);
  assert.match(src,/const roundSize=/);
  assert.match(src,/const dailyLimit=/);
  assert.match(src,/const dailyRemaining=/);
  assert.match(src,/Math\.min\(roundSize\(\),dailyRemaining\(\)\)/);
  assert.match(src,/window\.setWordsPerRound=function\(n\)/);
  assert.doesNotMatch(src,/window\.setNewPerDay=function\(n\).*setWordsPerRound/s);
});

test('final round policy overrides legacy fixed-ten scene sizing',()=>{
  const src=read('round-policy.js');
  assert.match(src,/new Set\(\[10,20,30,50\]\)/);
  assert.match(src,/window\.openScene=function\(scene\)/);
  assert.match(src,/PAI_LEARNING_QA\?\.unlearned\?\.\(scene\)/);
  assert.match(src,/slice\(0,limit\)/);
  assert.match(src,/state\.learningSession\.queue=keys/);
});

test('settings retain daily new words and add a separate per-round selector',()=>{
  const src=read('round-policy.js');
  assert.match(src,/==='每日新词'/);
  assert.match(src,/每轮单词数/);
  assert.match(src,/onchange=\"setWordsPerRound\(\+this\.value\)\"/);
  assert.match(src,/每日新词控制全天新词总量/);
});

test('Scene500 difficulty pools are expanded before user-visible 50-word cap',()=>{
  const src=read('round-policy.js');
  assert.match(src,/const DISPLAY_LIMIT=50/);
  assert.match(src,/for\(const difficulty of \['basic','common','advanced','high'\]\)/);
  assert.match(src,/rankAllowed\(rank,difficulty\)/);
  assert.match(src,/added>=DISPLAY_LIMIT/);
  assert.match(src,/Math\.min\(DISPLAY_LIMIT,baseWordCount\(id,d\)\)/);
});

test('manual recall correction remains immediate and authoritative',()=>{
  const src=read('round-policy.js');
  assert.match(src,/PAI_TAP_FLOW\?\.correct/);
  assert.match(src,/PAI_TAP_FLOW\.cancel\?\.\(\)/);
  assert.match(src,/rateLearning\?\.\(score,u\.k\)/);
});
