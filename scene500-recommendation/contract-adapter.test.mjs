import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene500ContractAdapter,validateChineseLexiconContract,validateAssociations} from './contract-adapter.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('./catalog-v0.2.json',import.meta.url),'utf8'));
const lexicon={source_version:'test-v1',terms:[
 {term_id:'zh-0001',term:'牙医',normalized_term:'牙医',frequency_rank:100,frequency_score:.8,pos:'n',aliases:[],source_version:'test-v1'},
 {term_id:'zh-0002',term:'假设',normalized_term:'假设',frequency_rank:101,frequency_score:.7,pos:'v',aliases:[],source_version:'test-v1'}
]};
const associations={association_version:'pilot-test-v1',links:[
 {term_id:'zh-0001',scene_id:'S320',score:1,rank:1,evidence_type:'editorial_fixture',confidence:.7,association_version:'pilot-test-v1'},
 {term_id:'zh-0002',scene_id:'S155',score:1,rank:1,evidence_type:'editorial_fixture',confidence:.7,association_version:'pilot-test-v1'},
 {term_id:'zh-0002',scene_id:'S494',score:.8,rank:2,evidence_type:'editorial_fixture',confidence:.7,association_version:'pilot-test-v1'}
]};
test('contract validation and legacy search/getPage compatibility',()=>{
 assert.equal(validateChineseLexiconContract(lexicon).count,2);
 assert.equal(validateAssociations({lexicon,associations,catalog}).links,3);
 const engine=createScene500ContractAdapter({catalog,lexicon,associations});
 const a=engine.search('预约牙医',{eligibleSceneIds:['S320'],limit:20});
 assert.deepEqual(a.results.map(x=>x.sceneId),['S320']);
 assert.equal(a.results[0].rank,1);
 assert.ok(a.results[0].matchedTerms.includes('牙医'));
 assert.ok(a.results[0].reason.includes('term_scene_association'));
 assert.deepEqual(engine.getPage(a,0,5),a.results.slice(0,5));
 const both=engine.search('假设',{eligibleSceneIds:['S155','S494'],limit:20});
 assert.deepEqual(both.results.map(x=>x.sceneId),['S155','S494']);
 assert.equal(both.results[0].name,both.results[1].name);
});
test('bad association references and duplicate term IDs fail closed',()=>{
 assert.throws(()=>validateChineseLexiconContract({...lexicon,terms:[...lexicon.terms,lexicon.terms[0]]}),/INVALID_CHINESE_TERM/);
 assert.throws(()=>validateAssociations({lexicon,catalog,associations:{...associations,links:[{...associations.links[0],scene_id:'S999'}]}}),/INVALID_ASSOCIATION/);
});

test('ambiguous normalized lookup does not merge distinct term_id scene postings',()=>{
 const terms=[
  {term_id:'zh-a',term:'甲词',normalized_term:'同形词',frequency_rank:null,frequency_score:null,pos:null,aliases:[],source_version:'test-v1'},
  {term_id:'zh-b',term:'乙词',normalized_term:'同形词',frequency_rank:null,frequency_score:null,pos:null,aliases:[],source_version:'test-v1'}
 ];
 const links=[
  {term_id:'zh-a',scene_id:'S155',score:1,rank:1,evidence_type:'fixture',confidence:1,association_version:'collision-fixture'},
  {term_id:'zh-b',scene_id:'S494',score:1,rank:1,evidence_type:'fixture',confidence:1,association_version:'collision-fixture'}
 ];
 const engine=createScene500ContractAdapter({catalog,lexicon:{source_version:'test-v1',terms},associations:{association_version:'collision-fixture',links}});
 const result=engine.search('同形词',{eligibleSceneIds:['S155','S494'],limit:20});
 assert.ok(result.results.every(r=>!r.reason.includes('term_scene_association')),'ambiguous lookup must not blend unrelated term IDs');
});
