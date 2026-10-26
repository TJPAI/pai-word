import assert from 'node:assert/strict';
import {applyObservedQueryCorrections} from '../observed-query-corrections.mjs';
const catalog={scenes:{S034:{name:'点餐'},S039:{name:'饮料与酒水'},S078:{name:'乘公交车'},S079:{name:'乘地铁'},S135:{name:'图书馆学习'},S279:{name:'机器学习'},S280:{name:'深度学习'}}};
const row=(sceneId,score)=>({sceneId,name:catalog.scenes[sceneId].name,score,reason:['baseline']});
const search=(query,results,options={})=>applyObservedQueryCorrections({query,total:results.length,results},query,{catalog,limit:10,...options});
assert.equal(search('How to order coffee',[]).results[0]?.sceneId,'S039');
assert.equal(search('学习英语发音',[row('S279',4),row('S280',3),row('S135',2)]).results.some(r=>['S279','S280'].includes(r.sceneId)),false);
const bus=search('不要坐地铁，改坐公交',[row('S079',15.644),row('S078',15.329)]);
assert.equal(bus.results[0]?.sceneId,'S078');
assert.equal(bus.results.some(r=>r.sceneId==='S079'),false);
assert.equal(search('不要坐地铁，改坐公交',[row('S079',15.644)],{eligibleSceneIds:['S079']}).results.length,0);
assert.equal(search('学习机器学习',[row('S279',5)]).results[0]?.sceneId,'S279');
assert.equal(search('坐地铁',[row('S079',5)]).results[0]?.sceneId,'S079');
assert.equal(search('How to order tea',[]).results.length,0);
assert.equal(search('Could I order a coffee please?',[]).results[0]?.sceneId,'S039');
assert.equal(search('How can I order coffee?',[]).results[0]?.sceneId,'S039');
assert.equal(search('我不坐地铁了，改乘公交车',[row('S079',15.6),row('S078',12.1)]).results[0]?.sceneId,'S078');
assert.equal(search('我不坐地铁了，改乘公交车',[row('S079',15.6),row('S078',12.1)]).results.some(r=>r.sceneId==='S079'),false);
assert.equal(search('如何学习机器学习',[row('S279',5)]).results[0]?.sceneId,'S279');
assert.equal(search("I'd like to order a coffee.",[]).results[0]?.sceneId,'S039');
assert.equal(search("I’d like to order coffee.",[]).results[0]?.sceneId,'S039');
assert.equal(search("I'd like to order a sandwich.",[]).results[0]?.sceneId,'S034');
assert.equal(search('如何学习英语发音',[row('S279',4),row('S280',3),row('S135',2)]).results.some(r=>['S279','S280'].includes(r.sceneId)),false);
assert.equal(search('我想学习英语发音',[row('S279',4),row('S280',3),row('S135',2)]).results.some(r=>['S279','S280'].includes(r.sceneId)),false);
assert.equal(search('如何学习机器学习',[row('S279',5)]).results[0]?.sceneId,'S279');
assert.equal(search('How to order a sandwich?',[]).results[0]?.sceneId,'S034');
assert.equal(search('Please order a pizza',[]).results[0]?.sceneId,'S034');
assert.equal(search('I want to order a salad',[]).results[0]?.sceneId,'S034');
assert.equal(search('How to cancel a sandwich?',[]).results.length,0);
assert.equal(search('How to order a sandwich?',[],{eligibleSceneIds:['S039']}).results.length,0);
for(const [q,target,blocked] of [
 ['原计划坐地铁，现在换公交','S078','S079'],
 ['改坐地铁，不坐公交车','S079','S078'],
 ['今天不坐公交，改乘地铁','S079','S078']
]){
 const out=search(q,[row('S079',15),row('S078',14)]);
 assert.equal(out.results[0]?.sceneId,target,'SWITCH_TARGET '+q);
 assert.ok(!out.results.some(r=>r.sceneId===blocked),'NEGATED_SCENE_LEAK '+q);
}
assert.equal(search('地铁和公交哪个快',[row('S079',15),row('S078',14)]).results.length,2);
assert.equal(search('英语学习，不是机器学习',[row('S279',9),row('S280',8),row('S135',2)]).results.some(x=>['S279','S280'].includes(x.sceneId)),false);
assert.equal(search('学习英语口语而非深度学习',[row('S280',9),row('S135',2)]).results.some(x=>x.sceneId==='S280'),false);
assert.equal(search('机器学习不是深度学习',[row('S279',9),row('S280',8)]).results[0]?.sceneId,'S279');
assert.equal(search('英语学习和机器学习',[row('S279',9)]).results[0]?.sceneId,'S279');
assert.equal(search('Can I order a sandwich please?',[]).results[0]?.sceneId,'S034');
assert.equal(search('May I order a soup?',[]).results[0]?.sceneId,'S034');
assert.equal(search('Can I cancel a sandwich?',[]).results.length,0);
console.log('PASS_SCENE500_OBSERVED_QUERY_CORRECTIONS: 37 assertions');
