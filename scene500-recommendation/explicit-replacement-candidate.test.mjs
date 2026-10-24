import assert from 'node:assert/strict';
import {rerankExplicitReplacementCandidate as rerank} from './explicit-replacement-candidate.mjs';
const catalog={scenes:{S078:{name:'乘坐公交车',aliases:['公交']},S079:{name:'乘坐地铁',aliases:['地铁']},S394:{name:'表达不同意见',aliases:['不同意']},S432:{name:'拒绝请求',aliases:['拒绝']}}};
const make=ids=>({query:'',results:ids.map((sceneId,i)=>({sceneId,score:20-i,rank:i+1})),total:ids.length});
const ids=r=>r.results.map(x=>x.sceneId);
const cases=[
 ['不要坐地铁，改坐公交',['S079','S078'],'S078',true],
 ['不要坐地铁，但是我要坐地铁',['S079','S078'],'S079',false],
 ['我想了解不同意该怎么用英语说',['S394','S079'],'S394',false],
 ['我想了解拒绝请求该怎么用英语说',['S432','S079'],'S432',false],
 ['虽然不想坐地铁，但还是要坐地铁',['S079','S078'],'S079',false],
 ['不要坐地铁，改坐公交',['S079'],'S079',false],
 ['不要坐地铁，改坐地铁',['S079','S078'],'S079',false],
 ['不要坐地铁，改坐公交',['S078','S079'],'S078',true]
];
for(const [query,input,first,applied] of cases){
 const before=make(input);
 const out=rerank(before,query,{catalog,limit:5});
 assert.equal(ids(out)[0],first,query);
 assert.equal(out.replacementApplied,applied,query);
 assert.deepEqual(before.results.map(x=>x.sceneId),input,'no mutation');
 if(!applied)assert.deepEqual(ids(out),input,query);
}
console.log('PASS explicit replacement candidate: '+cases.length+' isolated checks');
