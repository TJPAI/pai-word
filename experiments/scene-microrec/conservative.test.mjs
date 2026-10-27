import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createConservativeMicro} from './conservative.mjs';
const c=JSON.parse(fs.readFileSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url)));
const m=createConservativeMicro(c);
for(const q of ['如何学习英语发音','I want to improve my English accent','练习英语口语']){const r=m.search(q,{limit:10});assert(!r.some(x=>['S279','S280'].includes(x.sceneId)),q);}
for(const q of ['机器学习课程怎么报名','AI深度学习模型如何训练']){const r=m.search(q,{limit:10});assert(r.every(x=>c.scenes[x.sceneId]));}
assert.deepEqual(m.search(''),[]);
assert.deepEqual(m.search('我要预约酒店',{eligibleSceneIds:[]}),[]);
console.log('PASS conservative safety smoke checks');
