// Contract-boundary smoke tests. Run: node --test scene500-recommendation/integration-boundary.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadScene500WithChineseLexicon} from './chinese-lexicon-loader.mjs';

const scenes=Object.fromEntries(Array.from({length:500},(_,i)=>{
 const id='S'+String(i+1).padStart(3,'0');
 return [id,{name:id==='S320'?'预约牙医':id==='S155'?'数据分析':'场景'+id,aliases:[],actions:[],objects:[]}];
}));
const catalog={schema:'fixture-1',scene_count:500,scenes};
const lexicon={source_version:'fixture-1',terms:[
 {term_id:'zh_fixture_1',term:'牙医',normalized_term:'牙医',frequency_rank:null,frequency_score:null,pos:null,aliases:[],source_version:'fixture-1'}
]};
const associations={association_version:'fixture-1',links:[
 {term_id:'zh_fixture_1',scene_id:'S320',score:1,rank:1,evidence_type:'fixture',confidence:1,association_version:'fixture-1'}
]};
const jsonResponse=value=>({ok:true,json:async()=>structuredClone(value)});
const fetchValid=async url=>jsonResponse(url==='/lexicon'?lexicon:associations);

test('hybrid contract: exact term_id posting, stable scene ID, five-item paging',async()=>{
 const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'/lexicon',associationUrl:'/links',fetchImpl:fetchValid});
 assert.equal(engine.mode,'hybrid');
 const snapshot=engine.search('我想预约牙医',{limit:500});
 assert.equal(snapshot.results[0].sceneId,'S320');
 assert.ok(snapshot.results[0].matchedTerms.includes('牙医'));
 assert.deepEqual(engine.getPage(snapshot,0,5),snapshot.results.slice(0,5));
 assert.deepEqual(engine.getPage(snapshot,1,5),snapshot.results.slice(5,10));
 assert.equal(engine.search('牙医',{limit:5,eligibleSceneIds:['S155']}).results.some(x=>x.sceneId==='S320'),false);
});

test('optional assets missing -> rule fallback, without modifying catalog',async()=>{
 const engine=await loadScene500WithChineseLexicon({catalog});
 assert.equal(engine.mode,'rule_fallback');
 assert.equal(engine.search('预约牙医',{limit:5}).results[0].sceneId,'S320');
 assert.equal(Object.keys(catalog.scenes).length,500);
});

test('invalid associations -> rule fallback rather than broken hybrid',async()=>{
 const invalid={...associations,links:[{...associations.links[0],term_id:'missing'}]};
 const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'/lexicon',associationUrl:'/links',fetchImpl:async url=>jsonResponse(url==='/lexicon'?lexicon:invalid)});
 assert.equal(engine.mode,'rule_fallback');
});

test('pre-aborted signal -> rule fallback; no requests made',async()=>{
 const controller=new AbortController();controller.abort();
 let calls=0;
 const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'/lexicon',associationUrl:'/links',signal:controller.signal,fetchImpl:async()=>{calls++;throw Error('unexpected');}});
 assert.equal(engine.mode,'rule_fallback');
 assert.equal(calls,0);
});

test('HTTP failure -> rule fallback',async()=>{
 const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'/lexicon',associationUrl:'/links',fetchImpl:async()=>({ok:false,status:503})});
 assert.equal(engine.mode,'rule_fallback');
});
