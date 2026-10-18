const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(ROOT,'scene-counts.js'),'utf8');

test('scene cards show unique word inventory separately from today queue',()=>{
  const countEl={innerHTML:'',attrs:{},setAttribute(k,v){this.attrs[k]=v}};
  const card={querySelector(sel){return sel==='.scene-count'?countEl:null}};
  const head={appendChild(){}};
  const ctx={
    state:{view:'scenes'},
    SCENES:{daily:'日常生活'},
    PAI_CORE:{byScene:new Map([['daily',[{w:{rank:1}},{w:{rank:1}},{w:{rank:2}}]]])},
    todayCount:()=>0,
    render(){},
    document:{querySelectorAll:()=>[card],createElement:()=>({textContent:''}),head}
  };
  ctx.window=ctx;
  vm.runInNewContext(source,ctx);
  assert.equal(ctx.PAI_SCENE_COUNTS.sceneWordTotal('daily'),2);
  assert.match(countEl.innerHTML,/2 词/);
  assert.match(countEl.innerHTML,/今日 0/);
  assert.equal(countEl.attrs['aria-label'],'2 个词，今日 0 个学习任务');
});

test('bootstrap loads scene-count layer between product and flow',()=>{
  const bootstrap=fs.readFileSync(path.join(ROOT,'core-bootstrap.js'),'utf8');
  assert.match(bootstrap,/scene-counts\.js\?v=v267i-scene-counts-1/);
  assert.ok(bootstrap.indexOf('scene-counts.js')>bootstrap.indexOf('product-v2.js'));
  assert.ok(bootstrap.indexOf('scene-counts.js')<bootstrap.indexOf('flow-v2.js'));
});
