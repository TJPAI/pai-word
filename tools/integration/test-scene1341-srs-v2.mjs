import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene1341Srs,sceneKuKey,projectScene1341Grade,
 SCENE1341_SRS_SCOPE,SCENE1341_DURABLE_STORE} from '../../rebuild-preview/scene1341-srs-v2.mjs';
import {createScene1341TeachingAdapter} from '../../rebuild-preview/scene1341-teaching-consumption.mjs';

const path='tools/integration/scene1341-teaching/';
const files=['enteach-v51-first20-answer-only-v2.json',
 'scene1341-v51-sc0001-answer-only-021-050.v2.json',
 'scene1341-v51-sc0001-answer-only-051-100.v2.json'];
const packs=files.map(f=>JSON.parse(fs.readFileSync(path+f,'utf8')));
let ids=new Set(),sceneIds=new Set();
for(const pack of packs){
 const a=createScene1341TeachingAdapter(pack);
 assert.equal(a.activationAllowed,false);
 assert.equal(a.canWriteSrs,false);
 assert.equal(a.canCreateStudyQueue,false);
 assert.equal(a.srsNamespace,'scene1341-v2');
 for(const entry of pack.records){
  assert(!ids.has(entry.scene_ku_id));ids.add(entry.scene_ku_id);sceneIds.add(entry.scene_id);
  assert.equal(a.question(entry.scene_ku_id).kind,'self_recall');
  assert(!Object.hasOwn(entry,'question'));
 }
}
assert.equal(ids.size,100);
assert.deepEqual([...sceneIds],['SC50-0001']);
assert.throws(()=>sceneKuKey('KU-00001'),/INVALID_KU/);
assert.equal(sceneKuKey('SC1341-KU-00001'),'scene1341-v2:SC1341-KU-00001');

const memory=new Map();let committed=0;
const store={namespace:SCENE1341_SRS_SCOPE,storeName:SCENE1341_DURABLE_STORE,
 read:async k=>memory.get(k)||null,
 commit:async(k,v,{expectedAttemptId})=>{
  const prev=memory.get(k);
  assert.equal(prev?.lastAttemptId||null,expectedAttemptId);
  memory.set(k,v);committed++;
 }};
const draft=createScene1341Srs({store});
await assert.rejects(()=>draft.rate({kuId:'SC1341-KU-00001',
 grade:'good',now:1800000000000,attemptId:'attempt-0001',kuReleaseEligible:true}),/NOT_APPROVED/);
assert.equal(committed,0);
assert.throws(()=>createScene1341Srs({store:{...store,namespace:'core20k'}}),/STORE_CONTRACT_INVALID/);
const isolated=createScene1341Srs({store,releaseApproved:true});
await assert.rejects(()=>isolated.rate({kuId:'SC1341-KU-00001',
 grade:'good',now:1800000000000,attemptId:'attempt-0001',kuReleaseEligible:false}),/NOT_APPROVED/);
assert.equal(committed,0);
const first=await isolated.rate({kuId:'SC1341-KU-00001',grade:'good',
 now:1800000000000,attemptId:'attempt-0001',kuReleaseEligible:true});
assert.equal(first.reps,1);assert.equal(first.intervalMs,259200000);
assert.equal(first.due,1800000000000+259200000);
assert.equal(committed,1);
const replay=await isolated.rate({kuId:'SC1341-KU-00001',grade:'good',
 now:1800001000000,attemptId:'attempt-0001',kuReleaseEligible:true});
assert.deepEqual(replay,first);assert.equal(committed,1);
const hard=await isolated.rate({kuId:'SC1341-KU-00001',grade:'hard',
 now:1800001000000,attemptId:'attempt-0002',kuReleaseEligible:true});
assert.equal(hard.reps,2);assert(hard.intervalMs>=86400000);
const again=projectScene1341Grade({kuId:'SC1341-KU-00001',grade:'again',
 previous:hard,now:1800002000000,attemptId:'attempt-0003'});
assert.equal(again.intervalMs,600000);
await assert.rejects(()=>isolated.rate({kuId:'CORE20K-KU-00001',
 grade:'good',now:1800002000000,attemptId:'attempt-0004',kuReleaseEligible:true}),/INVALID_KU/);
assert.equal(memory.size,1);
assert.equal([...memory.keys()][0],'scene1341-v2:SC1341-KU-00001');
console.log(JSON.stringify({status:'PASS',authorDrafts:100,sourceScene:'SC50-0001',
 actualProductionApproved:0,storedFixtureRecords:1,realAppWrites:0,
 hasQuestionPayload:false,isolatedSrsNamespace:SCENE1341_SRS_SCOPE}));
