const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');

test('V26.7I product layer exposes honest general scene and removes stale UI claims',()=>{
  const src=read('product-v2.js');
  assert.match(src,/Core-13000 V26\.7I/);
  assert.match(src,/SCENES\.general='通用基础 · 待细分'/);
  assert.match(src,/d==='time_space_abstract'\)scene='general'/);
  assert.match(src,/d==null\)scene=MODEL_TECH_KUS\.has\(k\)\?'tech':'daily'/);
  assert.match(src,/d==='animals_plants'/);
  assert.match(src,/state\.voiceAccent='us'/);
  assert.match(src,/16,616 KU/);
  assert.match(src,/近义 \/ 易混词辨析/);
  assert.doesNotMatch(src,/Core-13000 V25\.5/);
});

test('bootstrap accepts ku_id-v2 and cache-busts V26.7I product layer',()=>{
  const src=read('core-bootstrap.js');
  assert.match(src,/\['ku_id-v1','ku_id-v2'\]/);
  assert.match(src,/product-v2\.js\?v=v267i-product-1/);
});
