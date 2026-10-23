import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getSubjectSceneCandidates,mergeSubjectCandidates} from './subject-intent.mjs';
import {createScene500ContractAdapter} from './contract-adapter.mjs';
import {loadScene500WithChineseLexicon} from './chinese-lexicon-loader.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('./catalog-v0.2.json',import.meta.url),'utf8'));
const subjects=['数学','物理','化学','天文','哲学','政治','经济'];
test('all seven bare subjects give grounded Scene500 candidates',()=>{
 for(const q of subjects){
  const results=getSubjectSceneCandidates(q,{catalog});
  assert.ok(results.length>=3,q);
  assert.ok(results.every(x=>catalog.scenes[x.sceneId]?.name===x.name));
  assert.ok(results.every(x=>x.evidenceStatus==='editorial_mapping_unverified'));
 }
});
test('partial words and long sentences do not trigger generic subject recommendations',()=>{
 for(const q of ['经济学','政治经济学','他在学习数学','数学家','化学品']){
  assert.equal(getSubjectSceneCandidates(q,{catalog}).length,0,q);
 }
});
test('eligible scenes, Top5, and rank are respected',()=>{
 const results=mergeSubjectCandidates({query:'数学',results:[],total:0},'数学',{catalog,eligibleSceneIds:['S126','S137'],limit:5});
 assert.deepEqual(results.results.map(x=>x.sceneId),['S126','S137']);
 assert.deepEqual(results.results.map(x=>x.rank),[1,2]);
 assert.equal(results.total,2);
});
test('hybrid and fallback both recover bare subjects without fabricating specialized scenes',async()=>{
 const lexicon={source_version:'fixture',terms:[{term_id:'t1',term:'猫',normalized_term:'猫',aliases:[],source_version:'fixture'}]};
 const associations={association_version:'fixture',links:[]};
 const hybrid=createScene500ContractAdapter({catalog,lexicon,associations});
 for(const q of subjects)assert.ok(hybrid.search(q,{limit:5}).results.length>0,q);
 const fallback=await loadScene500WithChineseLexicon({catalog});
 assert.equal(fallback.mode,'rule_fallback');
 assert.ok(fallback.search('数学',{limit:5}).results.length>0);
 assert.deepEqual(fallback.search('数学',{limit:5,eligibleSceneIds:['S137']}).results.map(x=>x.sceneId),['S137']);
});

test('non-subject hybrid requests respect requested Top5 and zero limit',()=>{
 const lexicon={source_version:'fixture',terms:[{term_id:'t1',term:'书',normalized_term:'书',aliases:[],source_version:'fixture'}]};
 const associations={association_version:'fixture',links:[]};
 const engine=createScene500ContractAdapter({catalog,lexicon,associations,minimumScore:0});
 const five=engine.search('未知词语',{limit:5});
 assert.equal(five.results.length,5);
 assert.equal(five.total,500);
 assert.equal(engine.search('未知词语',{limit:0}).results.length,0);
 const filtered=engine.search('未知词语',{limit:5,eligibleSceneIds:['S001','S002','S003','S004','S005','S006']});
 assert.equal(filtered.results.length,5);
 assert.equal(filtered.total,6);
});
