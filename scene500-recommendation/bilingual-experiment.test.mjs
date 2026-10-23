import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene500Recommender} from './engine.mjs';
import {createExperimentalBilingualAdapter} from './bilingual-experiment.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('./catalog-v0.2.json',import.meta.url),'utf8'));
test('opt-in bilingual adapter passes translated evidence into real Scene500 ranking',()=>{
 const baseline=createScene500Recommender({catalog});
 const adapter=createExperimentalBilingualAdapter(baseline,{
  entries:[{en:'brush teeth',zh:'刷牙'},{en:'wash face',zh:'洗脸'}]
 });
 const result=adapter.search('I want to brush teeth and wash face',{limit:5});
 assert.equal(result.query,'I want to brush teeth and wash face');
 assert.equal(result.experimental,true);
 assert.deepEqual(result.bilingualEvidence.map(x=>x.chinese),['刷牙','洗脸']);
 assert.equal(result.results[0]?.sceneId,'S002');
 assert.deepEqual(adapter.getPage(result,0,5),result.results.slice(0,5));
 assert.equal(baseline.search('brush teeth and wash face',{limit:5}).results.some(x=>x.sceneId==='S002'),false);
});
test('unknown English remains unexpanded and fallback behavior stays unchanged',()=>{
 const adapter=createExperimentalBilingualAdapter(createScene500Recommender({catalog}));
 const result=adapter.search('xyz_unmapped_technical_token');
 assert.deepEqual(result.bilingualEvidence,[]);
 assert.equal(result.query,'xyz_unmapped_technical_token');
});
