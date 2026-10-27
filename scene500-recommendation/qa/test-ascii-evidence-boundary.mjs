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

const falseAiWords=['train','training','wait','waiting','fails','failed','failure','paint','painting','mail','email','daily','rail','airplane','chair','fair','claim','maintain','available','detail','certain'];
for(const word of falseAiWords){
 const q='Can you help with '+word+' today?';
 const ids=e.search(q,{limit:500}).results.map(r=>r.sceneId);
 for(const id of ['S276','S277','S278','S279','S280'])
  assert.ok(!ids.includes(id),'WHOLE_WORD_AI_FALSE_POSITIVE '+word+' '+id);
}
for(const q of ['AI','AI.','(AI)','AI-assisted tools','Using AI in class','我想学习 AI 技术']){
 const ids=e.search(q,{limit:500}).results.map(r=>r.sceneId);
 assert.ok(ids.some(id=>['S276','S277','S278','S279','S280'].includes(id)),'WHOLE_WORD_AI_EXPECTED '+q);
}
console.log('PASS_SCENE500_ASCII_BOUNDARY: 20 embedded-AI words, 6 standalone-AI forms, original 3 negatives + 3 positives');
