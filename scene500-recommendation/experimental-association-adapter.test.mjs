import test from 'node:test';
import assert from 'node:assert/strict';
import {withExperimentalSceneExtension} from './experimental-association-adapter.mjs';
const catalog={scenes:{S001:{name:'书店购书'},S002:{name:'校园学习'}}};
const base={search:()=>({query:'',total:0,results:[]}),getPage:(s,i=0,n=5)=>s.results.slice(i*n,(i+1)*n)};
const edge={term_id:'zh_a',term:'数学研究',scene_id:'S002',score:.4,release_eligible:false,status:'EXPERIMENTAL_UNVERIFIED'};
const ext={schema:'scene500-experimental-compound-extension-v0.1',status:'EXPERIMENTAL_NOT_APPROVED',requires_opt_in:true,production_ready:false,lexicon_version:'0.10.1-evidence-compat',baseline_count:3553,candidates:[edge]};
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
 assert.throws(()=>withExperimentalSceneExtension(base,{catalog,extension:{...ext,lexicon_version:'0.9.4-rc.2'},enabled:true}));
 assert.throws(()=>withExperimentalSceneExtension(base,{catalog,extension:{...ext,candidates:[edge,{...edge,term_id:'zh_other',scene_id:'S001'}]},enabled:true}),/AMBIGUOUS_EXPERIMENTAL_TERM/);
});

test('negating compound cannot inherit positive base association',()=>{
 const inverted={...edge,term_id:'zh_negative',term:'不可再生能源',anchor_term:'可再生能源'};
 const other={...edge,term_id:'zh_positive',term:'太阳能电池',anchor_term:'电池'};
 const engine=withExperimentalSceneExtension(base,{catalog,extension:{...ext,candidates:[inverted,other]},enabled:true});
 assert.equal(engine.search('不可再生能源').results.some(x=>x.experimental),false);
 assert.equal(engine.search('太阳能电池').results.some(x=>x.experimental),true);
});

test('experimental query does not match a positive phrase inside a negated compound',()=>{
 const positive={...edge,term:'可再生能源',term_id:'zh_positive',anchor_term:'能源'};
 const engine=withExperimentalSceneExtension(base,{catalog,extension:{...ext,candidates:[positive]},enabled:true});
 assert.equal(engine.search('可再生能源',{limit:5}).results.length,1);
 assert.equal(engine.search('不可再生能源',{limit:5}).results.length,0);
 assert.equal(engine.search('研究不可再生能源与可再生能源',{limit:5}).results.length,1);
});
