const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('final round policy owns 10/20/30/50 scene sizing instead of legacy fixed ten',()=>{
  const src=read('round-policy.js');
  assert.match(src,/new Set\(\[10,20,30,50\]\)/);
  assert.match(src,/window\.openScene=function\(scene\)/);
  assert.match(src,/PAI_LEARNING_QA\?\.unlearned\?\.\(scene\)/);
  assert.match(src,/slice\(0,roundSize\(\)\)/);
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
