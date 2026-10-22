import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadScene500WithChineseLexicon} from './chinese-lexicon-loader.mjs';
import {validateChineseLexiconContract} from './contract-adapter.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('./catalog-v0.2.json',import.meta.url),'utf8'));
const lexicon={source_version:'V0.9.0-RC1',terms:[{term_id:'zh-test-1',term:'牙医',normalized_term:'牙医',frequency_rank:null,frequency_score:null,pos:null,aliases:[],source_version:'V0.9.0-RC1'}]};
const associations={association_version:'pilot',links:[{term_id:'zh-test-1',scene_id:'S320',score:1,rank:1,evidence_type:'test',confidence:.5,association_version:'pilot'}]};
test('nullable unverified frequency and POS fields are accepted',()=>{
 assert.equal(validateChineseLexiconContract(lexicon).count,1);
});
test('lazy loader combines sparse and rule while preserving eligibility',async()=>{
 const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'/words',associationUrl:'/links',fetchImpl:async u=>({ok:true,json:async()=>u==='/words'?lexicon:associations})});
 assert.equal(engine.mode,'hybrid');
 const res=engine.search('预约牙医',{eligibleSceneIds:['S320']});
 assert.deepEqual(res.results.map(x=>x.sceneId),['S320']);
 assert.ok(res.results[0].matchedTerms.includes('牙医'));
 assert.deepEqual(engine.getPage(res,0,5),res.results);
});
test('missing assets and HTTP errors degrade to rule output contract',async()=>{
 for(const args of [
  {},
  {lexiconUrl:'/words',associationUrl:'/links',fetchImpl:async()=>({ok:false,status:404})},
  {lexiconUrl:'/words',associationUrl:'/links',fetchImpl:async()=>{throw Error('offline')}}
 ]){
  const engine=await loadScene500WithChineseLexicon({catalog,...args});
  assert.equal(engine.mode,'rule_fallback');
  const results=engine.search('机场值机',{limit:10,eligibleSceneIds:['S104']}).results;
  assert.ok(results.every(x=>x.sceneId==='S104'&&Array.isArray(x.reason)&&Array.isArray(x.matchedTerms)));
 }
});
test('abort-aware timeout degrades instead of hanging',async()=>{
 const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'/words',associationUrl:'/links',timeoutMs:5,fetchImpl:async(_,opt)=>new Promise((_,reject)=>opt.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}))});
 assert.equal(engine.mode,'rule_fallback');
});

test('real V0.9.4 compact data shape is accepted without fabricated frequency',async()=>{
 const terms=Array.from({length:20000},(_,i)=>({id:'zh_'+i.toString(16).padStart(20,'0'),t:'模拟词'+i,n:'模拟词'+i,s:0}));
 terms[0]={id:terms[0].id,t:'牙医',n:'牙医',s:0};
 const compact={version:'0.9.4-rc.2',terms};
 const link={association_version:'pilot',links:[{term_id:terms[0].id,scene_id:'S320',score:1,rank:1,evidence_type:'test_fixture',confidence:.5,association_version:'pilot'}]};
 const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'/v094',associationUrl:'/links',
   fetchImpl:async url=>({ok:true,json:async()=>url==='/v094'?compact:link})});
 assert.equal(engine.mode,'hybrid');
 assert.deepEqual(engine.search('牙医',{eligibleSceneIds:['S320']}).results.map(x=>x.sceneId),['S320']);
});
