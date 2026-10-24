import assert from 'node:assert/strict';
import {analyzeSceneQuery,isLocallyNegatedTerm} from './query-intent-candidate.mjs';
const cases=[
 ['不要地铁，改坐公交','地铁',true],
 ['不要地铁，改坐公交','公交',false],
 ['我想坐地铁','地铁',false],
 ['不要坐地铁，改坐公交','地铁',true],
 ['不要坐地铁，改坐公交','公交',false],
 ['不乘地铁','地铁',true],
 ['改坐地铁','地铁',false],
 ['避免开车','开车',true],
 ['坐公交不要坐地铁','地铁',true], // explicit local negation after transit verb
 ['不想洗碗','洗碗',true],
 ['学习人工智能','人工智能',false],
 ['不想学习机器学习','机器学习',true],
 ['我想学习机器学习','机器学习',false],
 ['不要点咖啡','咖啡',true],
 ['我要点咖啡','咖啡',false],
 ['不要吃早餐，改喝咖啡','早餐',true],
 ['不要吃早餐，改喝咖啡','咖啡',false],
 ['不要学习机器学习，但是我要学习机器学习','机器学习',false]
];
for(const [q,t,want] of cases)assert.equal(isLocallyNegatedTerm(q,t),want,q+' / '+t);
assert.equal(analyzeSceneQuery('AI和人工智能').mixedLanguage,true);
assert.equal(analyzeSceneQuery('不要地铁，改成公交').hasContrast,true);
console.log('PASS: query-intent candidate conservative unit checks',cases.length);
