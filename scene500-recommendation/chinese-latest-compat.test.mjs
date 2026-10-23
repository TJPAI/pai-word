import test from 'node:test';
import assert from 'node:assert/strict';
import {createChineseV094Index} from './zh-v094-runtime-bridge.mjs';
import {createSparseSceneRetriever} from './sparse-retriever.mjs';
const id=i=>'zh_'+i.toString(16).padStart(20,'0');
const rows=Array.from({length:20000},(_,i)=>({id:id(i),t:'词'+i,n:'词'+i,s:0}));
rows[0]={id:id(0),t:'书',n:'书',s:0};
rows[1]={id:id(1),t:'書',n:'书',s:0};
const catalog={scene_count:500,scenes:Object.fromEntries(Array.from({length:500},(_,i)=>{
 const name='S'+String(i+1).padStart(3,'0');
 return [name,{name,aliases:[],actions:[],objects:[]}];
}))};
const associations={association_version:'fixture',links:[{
 term_id:id(0),scene_id:'S001',score:1,rank:1,evidence_type:'fixture',confidence:1,association_version:'fixture'
}]};
const reply=data=>({ok:true,json:async()=>structuredClone(data)});
test('latest exact-first: normalized sibling must not override exact term ID',()=>{
 const idx=createChineseV094Index({version:'0.9.4-test',terms:rows});
 assert.equal(idx.candidates('书').length,1);
 assert.equal(idx.candidates('书')[0].term_id,id(0));
 assert.equal(idx.candidates('書')[0].term_id,id(1));
});
test('single character is evidence only when it is the entire query',()=>{
 const registry={scene_count:500,terms:{'书':[{sceneId:'S001',weight:1}]}};
 const search=createSparseSceneRetriever({catalog,registry});
 assert.equal(search.search('书',{limit:5}).results[0].sceneId,'S001');
 assert.equal(search.search('我想买书',{limit:5}).results.length,0);
});
