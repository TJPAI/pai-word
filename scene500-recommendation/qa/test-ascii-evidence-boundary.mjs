import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene500Recommender} from '../engine.mjs';
const catalog=JSON.parse(fs.readFileSync('scene500-recommendation/catalog-v0.2.json','utf8'));
const e=createScene500Recommender({catalog});
for(const q of ['Could you take me to the train station by taxi?','Wait for the pedestrian light before crossing','The application fails to launch after the update']){
 const ids=e.search(q,{limit:30}).results.map(r=>r.sceneId);
 for(const id of ['S276','S277','S278','S279','S280'])assert.ok(!ids.includes(id),'ASCII_SUBSTRING_FALSE_POSITIVE '+q+' '+id);
}
assert.ok(e.search('AI assistant',{limit:30}).results.some(x=>['S276','S277','S278','S279','S280'].includes(x.sceneId)),'WHOLE_WORD_AI_MUST_MATCH');
assert.ok(e.search('我想学习AI',{limit:30}).results.some(x=>['S276','S277','S278','S279','S280'].includes(x.sceneId)),'MIXED_CHINESE_ENGLISH_AI_MUST_MATCH');
assert.ok(e.search('机器学习',{limit:30}).results.some(x=>x.sceneId==='S279'),'CHINESE_ML_MUST_MATCH');
console.log('PASS_SCENE500_ASCII_BOUNDARY: 3 negatives, 2 AI positives, Chinese ML');
