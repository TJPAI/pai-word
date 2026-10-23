import test from 'node:test';
import assert from 'node:assert/strict';
import {createChineseV094Index} from './zh-v094-runtime-bridge.mjs';
import {loadScene500WithChineseLexicon} from './chinese-lexicon-loader.mjs';
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
test('compact Core20K + matching associations resolves hybrid without ID migration',async()=>{
 const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lex',associationUrl:'assoc',fetchImpl:async url=>reply(url==='lex'?{version:'0.9.4-test',terms:rows}:associations)});
 assert.equal(engine.mode,'hybrid');
 assert.ok(engine.search('书',{limit:5}).results.some(r=>r.sceneId==='S001'));
});
test('full records Core20K payload accepted and retains same association term ID',async()=>{
 const full={source_version:'0.9.4-test',records:rows.map(r=>({
  term_id:r.id,term:r.t,normalized_term:r.n,aliases:[],source_version:'0.9.4-test'
 }))};
 const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lex',associationUrl:'assoc',fetchImpl:async url=>reply(url==='lex'?full:associations)});
 assert.equal(engine.mode,'hybrid');
 assert.ok(engine.search('书',{limit:5}).results.some(r=>r.sceneId==='S001'));
});
test('invalid full records count falls back, without changing master data',async()=>{
 const bad={source_version:'0.9.4-test',records:rows.slice(0,100)};
 const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lex',associationUrl:'assoc',fetchImpl:async url=>reply(url==='lex'?bad:associations)});
 assert.equal(engine.mode,'rule_fallback');
});
