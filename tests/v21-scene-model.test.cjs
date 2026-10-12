const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','v21-scene-model.js'),'utf8');

test('one KU can appear in two scenes without creating a second learning identity',()=>{
  const apply={w:{w:'apply'},sid:'w_0619_apply_ku01',s:{ku_id:'w_0619_apply_ku01',scene:'work'}};
  const other={w:{w:'plot'},sid:'w_1981_plot_ku_s01',s:{ku_id:'w_1981_plot_ku_s01',scene:'culture'}};
  const byKU=new Map([[apply.sid,apply],[other.sid,other]]);
  const ctx={console,window:null,Map,Set,SCENES:{work:'职场商务',academic:'学术学习',culture:'文化娱乐'},PAI_CORE:{byKU}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);
  const links=ctx.PAI_V21_SCENES.scenesForKU(apply.sid).map(x=>x.scene_id);
  assert.deepEqual([...links].sort(),['academic','work']);
  assert.equal(ctx.PAI_V21_SCENES.unitsForScene('work')[0],apply);
  assert.equal(ctx.PAI_V21_SCENES.unitsForScene('academic')[0],apply);
  assert.equal(ctx.PAI_V21_SCENES.unitsForScene('work')[0].s.ku_id,ctx.PAI_V21_SCENES.unitsForScene('academic')[0].s.ku_id);
});

test('legacy scene mapping is preserved as one approved scene link when no extra link exists',()=>{
  const unit={w:{w:'plot'},sid:'ku_plot',s:{ku_id:'ku_plot',scene:'culture'}},ctx={console,window:null,Map,Set,SCENES:{culture:'文化娱乐'},PAI_CORE:{byKU:null}};
  ctx.PAI_CORE.byKU=new Map([[unit.sid,unit]]);ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);
  assert.deepEqual(Array.from(ctx.PAI_V21_SCENES.scenesForKU('ku_plot'),x=>x.scene_id),['culture']);
  assert.equal(ctx.PAI_V21_SCENES.distinctLemmaCount('culture'),1);
});
