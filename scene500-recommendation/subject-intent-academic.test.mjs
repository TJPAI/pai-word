import test from 'node:test';
import assert from 'node:assert/strict';
import {getSubjectSceneCandidates} from './subject-intent.mjs';
const names={'S137':'查找资料','S151':'确定研究问题','S132':'小组讨论','S126':'课堂听课','S296':'软件开发','S134':'实验课'};
const catalog={scenes:Object.fromEntries(Object.entries(names).map(([id,name])=>[id,{name}]))};
for(const query of ['人工智能','AI','artificial intelligence','量子计算','quantum computing']){
 test('academic subject exact routing '+query,()=>{
  const rows=getSubjectSceneCandidates(query,{catalog});
  assert.equal(rows.length,5);
  assert.equal(rows[0].sceneId,'S137');
  assert.equal(new Set(rows.map(r=>r.sceneId)).size,5);
  assert.ok(rows.every(r=>r.evidenceStatus==='editorial_mapping_unverified'));
 });
}
test('subject routing does not hijack compound queries',()=>{
 assert.deepEqual(getSubjectSceneCandidates('人工智能课程怎么选',{catalog}),[]);
 assert.deepEqual(getSubjectSceneCandidates('量子计算机坏了',{catalog}),[]);
});
test('eligibility is hard filter',()=>{
 const rows=getSubjectSceneCandidates('量子计算',{catalog,eligibleSceneIds:['S151']});
 assert.deepEqual(rows.map(r=>r.sceneId),['S151']);
});
