// Regression: home projection preserves the existing Scene500 search algorithm.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=JSON.parse(read('rebuild-preview/data/home-scene-index-v1.json'));
assert.equal(Object.keys(index.scenes).length,500);
const specs=Object.entries(index.scenes).map(([id,s])=>({id,name:s.name,desc:s.desc,tags:s.tags}));
const {loadHomeSources}=await import('./build-v21-home-ku-metadata.mjs');
const {core}=await loadHomeSources();
const source=read('scene-search.js');
function runSearch(useProjection){
 const state={scene500Recent:[]};
 const ctx={window:{PAI_CORE20K_ROOT:true,PAI_SCENE500:{specs},PAI_CORE:{byScene:new Map()}},URLSearchParams,location:{search:''},state,SCENES:{},save:()=>{},allUnits:id=>{
  if(useProjection)return [];
  return core.byScene.get(id)||[];
 },document:{},console};
 if(useProjection)ctx.window.PAI_LIGHT_HOME_INDEX=index;
 vm.runInNewContext(source,ctx);
 return ctx.window.PAI_SCENE_SEARCH.search;
}
const original=runSearch(false),projected=runSearch(true);
const queries=[...specs.map(s=>s.name),'我要去美国参加学术会议，还要坐飞机和住酒店','仓库无人机盘点','论文研究','看医生','早上洗漱','租房水电','', '完全不相关的虚构场景'];
const difficulties=['all','basic','common','advanced','high'];
let checked=0;
for(const q of queries)for(const d of difficulties){
 const a=original(q,d,5),b=projected(q,d,5);
 assert.deepEqual(JSON.parse(JSON.stringify(a.map(x=>({id:x.id,score:x.score,reviewedCount:x.reviewedCount})))),JSON.parse(JSON.stringify(b.map(x=>({id:x.id,score:x.score,reviewedCount:x.reviewedCount})))),q+'/'+d);
 checked++;
}
assert.equal(checked,2540);
console.log('PASS 2540 original-vs-projection searches');
