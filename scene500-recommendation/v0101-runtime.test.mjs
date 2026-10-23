import test from 'node:test';
import assert from 'node:assert/strict';
import {loadScene500WithChineseLexicon} from './chinese-lexicon-loader.mjs';
const catalog={scene_count:500,scenes:Object.fromEntries(Array.from({length:500},(_,i)=>{
 const id='S'+String(i+1).padStart(3,'0');
 return [id,{name:id==='S002'?'洗漱与个人清洁':id,aliases:[],actions:[],objects:[]}];
}))};
const id=i=>'zh_'+i.toString(16).padStart(20,'0');
const terms=Array.from({length:20000},(_,i)=>({
 term_id:id(i),term:'词项'+i,normalized_term:'词项'+i,aliases:[],
 pos:null,frequency_rank:null,frequency_score:null,stopword_hint:false,
 source_version:'V8.0_QA_UNCHANGED_MEMBERSHIP',quality_status:'candidate_unfrozen'
}));
terms[0]={...terms[0],term:'洗漱',normalized_term:'洗漱'};
const runtime={schema_version:'1.0',data_version:'0.10.1-evidence-compat',
 runtime_version:'0.9.4-rc.2-compatible',contract_version:'1.1',
 integration_ready:true,production_ready:false,source_version:'0.10.1-evidence-compat',terms};
const associations={association_version:'test',links:[{
 term_id:id(0),scene_id:'S002',rank:1,score:1,confidence:1,evidence_type:'test',
 association_version:'test'
}]};
const response=data=>({ok:true,json:async()=>structuredClone(data)});
async function load(payload){
 return loadScene500WithChineseLexicon({
  catalog,lexiconUrl:'lex',associationUrl:'links',
  fetchImpl:async url=>response(url==='lex'?payload:associations),timeoutMs:30000
 });
}
test('V0.10.1 full 20k terms are actually loaded into hybrid scoring and paging',async()=>{
 const engine=await load(runtime);
 assert.equal(engine.mode,'hybrid');
 assert.equal(engine.lexiconVersion,'0.10.1-evidence-compat');
 assert.equal(engine.runtimeDataVersion,'0.10.1-evidence-compat');
 assert.equal(engine.productionReady,false);
 const snapshot=engine.search('洗漱',{limit:5});
 assert.equal(snapshot.results[0].sceneId,'S002');
 assert.ok(snapshot.results[0].reason.includes('term_scene_association'));
 assert.deepEqual(engine.getPage(snapshot,0,5),snapshot.results);
});
test('V0.10.1 invalid integration flag fails closed',async()=>{
 assert.equal((await load({...runtime,integration_ready:false})).mode,'rule_fallback');
 assert.equal((await load({...runtime,production_ready:true})).mode,'rule_fallback');
 assert.equal((await load({...runtime,contract_version:'2'})).mode,'rule_fallback');
});

test('real loader defaults experimental extension off and requires valid opt-in',async()=>{
 const extension={schema:'scene500-experimental-compound-extension-v0.1',
  status:'EXPERIMENTAL_NOT_APPROVED',requires_opt_in:true,production_ready:false,
  lexicon_version:'0.10.1-evidence-compat',baseline_count:3553,
  candidates:[{term_id:id(1),term:'测试扩展词',scene_id:'S002',score:.3,
   status:'EXPERIMENTAL_UNVERIFIED',release_eligible:false}]};
 const configure=async(enabled,ext=extension)=>{
  const diagnostics=[];
  const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lex',
   associationUrl:'links',fetchImpl:async url=>response(url==='lex'?runtime:associations),
   enableExperimentalExtension:enabled,experimentalExtension:ext,timeoutMs:30000,
   onDiagnostic:x=>diagnostics.push(x)});
  return {engine,diagnostics};
 };
 const disabled=await configure(false);
 assert.equal(disabled.engine.mode,'hybrid');
 assert.equal(disabled.engine.search('测试扩展词').results.some(x=>x.experimental),false);
 const enabled=await configure(true);
 assert.equal(enabled.engine.mode,'hybrid');
 assert.equal(enabled.engine.experimentalExtension,'ENABLED_UNVERIFIED');
 assert.ok(enabled.engine.search('测试扩展词').results.some(x=>x.experimental));
 const invalid=await configure(true,{...extension,production_ready:true});
 assert.equal(invalid.engine.mode,'rule_fallback');
 assert.equal(invalid.diagnostics[0].code,'SCENE500_ASSET_FALLBACK');
});
