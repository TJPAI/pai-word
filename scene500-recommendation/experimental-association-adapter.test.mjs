import test from 'node:test';
import assert from 'node:assert/strict';
import {withExperimentalSceneExtension} from './experimental-association-adapter.mjs';
const catalog={scenes:{S001:{name:'书店购书'},S002:{name:'校园学习'}}};
const base={search:()=>({query:'',total:0,results:[]}),getPage:(s,i=0,n=5)=>s.results.slice(i*n,(i+1)*n)};
const edge={term_id:'zh_a',term:'数学研究',scene_id:'S002',score:.4,release_eligible:false,status:'EXPERIMENTAL_UNVERIFIED'};
const ext={schema:'scene500-experimental-compound-extension-v0.1',status:'EXPERIMENTAL_NOT_APPROVED',requires_opt_in:true,production_ready:false,candidates:[edge]};
test('default disabled and explicitly enabled experimental retrieval',()=>{
 assert.equal(withExperimentalSceneExtension(base,{catalog,extension:ext}),base);
 const engine=withExperimentalSceneExtension(base,{catalog,extension:ext,enabled:true});
 assert.equal(engine.experimentalExtension,'ENABLED_UNVERIFIED');
 const r=engine.search('数学研究',{limit:5});
 assert.deepEqual(r.results.map(x=>x.sceneId),['S002']);
 assert.equal(r.results[0].experimental,true);
 assert.equal(r.results[0].evidenceStatus,'unverified');
 assert.equal(engine.search('数学研究',{eligibleSceneIds:['S001']}).results.length,0);
 assert.equal(engine.search('数学研究',{limit:0}).results.length,0);
});
test('reject any unsafe or falsely promoted association extension',()=>{
 assert.throws(()=>withExperimentalSceneExtension(base,{catalog,extension:{...ext,production_ready:true},enabled:true}));
 assert.throws(()=>withExperimentalSceneExtension(base,{catalog,extension:{...ext,candidates:[{...edge,release_eligible:true}]},enabled:true}));
});
