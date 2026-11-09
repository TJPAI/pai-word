import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildScene1341StudyQueue,createScene1341StudySession,SCENE1341_SESSION_SCOPE,SCENE1341_BOOKMARK_SCOPE} from '../../rebuild-preview/scene1341-study-session.mjs';
import {createScene1341ReleaseIndex} from '../../rebuild-preview/scene1341-release-gate.mjs';
import {createScene1341Srs,SCENE1341_SRS_SCOPE,SCENE1341_DURABLE_STORE,sceneKuKey} from '../../rebuild-preview/scene1341-srs-v2.mjs';
const base='tools/integration/scene1341-teaching/';
const files=['enteach-v51-first20-answer-only-v2.json','scene1341-v51-sc0001-answer-only-021-050.v2.json','scene1341-v51-sc0001-answer-only-051-100.v2.json','scene1341-v51-sc0001-answer-only-101-130.v2.json','scene1341-v51-sc0001-answer-only-131-180.v2.json','scene1341-v51-sc0001-answer-only-181-234.v2.json','scene1341-v51-sc0002-answer-only-001-020.v2.json',
 'scene1341-v51-sc0002-answer-only-021-070.v2.json'];
const items=files.flatMap(f=>JSON.parse(fs.readFileSync(base+f,'utf8')).records);
assert.equal(items.length,304);assert(items.every(x=>!Object.hasOwn(x,'question')));
const source='eaa6d729bb04a9bedbafd8e1081a11fc791caa39';
const gate=createScene1341ReleaseIndex({items,sourceBlob:source,manifest:null});
assert.equal(gate.approved,0);
for(const sceneId of ['SC50-0001','SC50-0002']){
 const queue=buildScene1341StudyQueue({sceneId,items,releaseIndex:gate,now:1800000000000});
 assert.equal(queue.available,0);assert.equal(queue.queue.length,0);
}
assert.throws(()=>createScene1341StudySession({sceneId:'SC50-0001',queue:[items[0].scene_ku_id],releaseIndex:gate}),/UNRELEASED/);
const approved=new Set(items.slice(0,3).map(x=>x.scene_ku_id));
const approvedGate={get:id=>({eligible:approved.has(id)})};
const now=1800000000000;
const read=new Map();
const entry=items[0].scene_ku_id;
read.set(sceneKuKey(entry),{namespace:SCENE1341_SRS_SCOPE,kuId:entry,due:now-1,intervalMs:86400000,reps:1,lastAttemptId:'prev-0001'});
const selection=buildScene1341StudyQueue({sceneId:'SC50-0001',items,releaseIndex:approvedGate,records:read,now,limit:3});
assert.equal(selection.available,3);assert.equal(selection.due,1);assert.equal(selection.newCount,2);
assert.deepEqual(selection.queue,[items[0].scene_ku_id,items[1].scene_ku_id,items[2].scene_ku_id]);
const session=createScene1341StudySession({sceneId:'SC50-0001',queue:[...selection.queue],releaseIndex:approvedGate});
assert.equal(session.view().scope,SCENE1341_SESSION_SCOPE);
assert.equal(session.bookmark().scope,SCENE1341_BOOKMARK_SCOPE);
assert.equal(session.view().revealed,false);
const fakeStore={namespace:SCENE1341_SRS_SCOPE,storeName:SCENE1341_DURABLE_STORE,read:async key=>read.get(key)||null,
 commit:async(key,value,{expectedAttemptId})=>{assert.equal(read.get(key)?.lastAttemptId||null,expectedAttemptId);read.set(key,value)}};
const srs=createScene1341Srs({store:fakeStore,releaseApproved:true});
await assert.rejects(()=>session.rate({grade:'good',now,attemptId:'attempt-0002',srs}),/ANSWER_NOT_REVEALED/);
assert.equal(session.reveal().revealed,true);
const saved=await session.rate({grade:'good',now,attemptId:'attempt-0002',srs});
assert.equal(saved.record.namespace,SCENE1341_SRS_SCOPE);assert.equal(saved.view.index,1);
assert.equal(saved.bookmark.kuId,items[1].scene_ku_id);
const resumed=createScene1341StudySession({sceneId:'SC50-0001',queue:[...selection.queue],releaseIndex:approvedGate,bookmark:saved.bookmark});
assert.equal(resumed.view().kuId,items[1].scene_ku_id);
assert.throws(()=>createScene1341StudySession({sceneId:'SC50-0002',queue:[...selection.queue],releaseIndex:approvedGate,bookmark:saved.bookmark}),/BOOKMARK_INVALID/);
assert.throws(()=>buildScene1341StudyQueue({sceneId:'SC50-0001',items,releaseIndex:approvedGate,records:new Map([[sceneKuKey(entry),{namespace:'core20k',kuId:entry,due:now-1}]]) ,now}),/FOREIGN_RECORD/);
approved.delete(items[1].scene_ku_id);
assert.throws(()=>resumed.reveal(),/APPROVAL_REVOKED/);
const draftSrs=createScene1341Srs({store:fakeStore,releaseApproved:false});
const approvedAgain=new Set([items[2].scene_ku_id]);
const isolated=createScene1341StudySession({sceneId:'SC50-0001',queue:[items[2].scene_ku_id],releaseIndex:{get:id=>({eligible:approvedAgain.has(id)})}});
isolated.reveal();await assert.rejects(()=>isolated.rate({grade:'good',now,attemptId:'attempt-0003',srs:draftSrs}),/NOT_APPROVED/);
assert.equal(isolated.view().index,0,'failed SRS commit must not advance the session');
// A slow durable commit must not permit a second tap or a swipe to race the cursor.
let unblock;
const pendingStore={namespace:SCENE1341_SRS_SCOPE,storeName:SCENE1341_DURABLE_STORE,
 read:async()=>null,commit:async()=>new Promise(resolve=>{unblock=resolve})};
const pendingSrs=createScene1341Srs({store:pendingStore,releaseApproved:true});
const pendingSession=createScene1341StudySession({sceneId:'SC50-0001',
 queue:[items[2].scene_ku_id],releaseIndex:{get:id=>({eligible:approvedAgain.has(id)})}});
pendingSession.reveal();
const inFlight=pendingSession.rate({grade:'good',now,attemptId:'race-00001',srs:pendingSrs});
assert.equal(pendingSession.view().ratingPending,true);
await assert.rejects(()=>pendingSession.rate({grade:'hard',now,attemptId:'race-00002',srs:pendingSrs}),/RATING_PENDING/);
assert.throws(()=>pendingSession.next(),/RATING_PENDING/);
assert.throws(()=>pendingSession.previous(),/RATING_PENDING/);
assert.throws(()=>pendingSession.reveal(),/RATING_PENDING/);
for(let i=0;i<10&&!unblock;i++)await Promise.resolve();
assert.equal(typeof unblock,'function');
unblock();
await inFlight;
assert.equal(pendingSession.view().complete,true);
assert.equal(pendingSession.view().ratingPending,false);
// Failure must clear the lock without moving the card, so retry remains possible.
const failedSession=createScene1341StudySession({sceneId:'SC50-0001',
 queue:[items[2].scene_ku_id],releaseIndex:{get:id=>({eligible:approvedAgain.has(id)})}});
failedSession.reveal();
const failedSrs={namespace:SCENE1341_SRS_SCOPE,rate:async()=>{throw Error('STORAGE_FAILED')}};
await assert.rejects(()=>failedSession.rate({grade:'good',now,attemptId:'race-00003',srs:failedSrs}),/STORAGE_FAILED/);
assert.equal(failedSession.view().ratingPending,false);
assert.equal(failedSession.view().index,0);
assert.equal(failedSession.view().revealed,true);
console.log(JSON.stringify({status:'PASS',authorDrafts:304,actualProductionApproved:gate.approved,
 queueBlockedForRealDrafts:true,approvedFixtureQueue:3,bookmarkResume:true,
 revocationBlocked:true,failedCommitDidNotAdvance:true,realUserSrsWrites:0}));
