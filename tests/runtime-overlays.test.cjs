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
