import assert from 'node:assert/strict';
import {createLearningEntry} from '../rebuild-preview/learning-entry.mjs';
let loads=0,opened=[];
const gate=createLearningEntry({load:async()=>{loads++},open:(id,d)=>opened.push([id,d])});
await Promise.all([gate.enter('S001'),gate.enter('S002','high'),gate.preload()]);
assert.equal(loads,1);assert.equal(gate.isReady(),true);
assert.deepEqual(opened,[['S001','all'],['S002','high']]);
let attempts=0;
const retry=createLearningEntry({load:async()=>{if(++attempts===1)throw Error('offline')},open:id=>id});
await assert.rejects(retry.enter('S003'),/offline/);
assert.equal(retry.isReady(),false);
assert.equal(await retry.enter('S003'),'S003');assert.equal(attempts,2);

// Invalid requests must not initiate engine loading or mutate scene history.
let invalidLoads=0,invalidOpens=0;
const guarded=createLearningEntry({load:()=>{invalidLoads++},open:()=>{invalidOpens++}});
await assert.rejects(guarded.enter(''),/LEARNING_SCENE_REQUIRED/);
await assert.rejects(guarded.enter(null),/LEARNING_SCENE_REQUIRED/);
assert.equal(invalidLoads,0);assert.equal(invalidOpens,0);
assert.throws(()=>createLearningEntry({load:null,open:()=>{}}),/LEARNING_ENTRY_DEPENDENCIES/);
assert.throws(()=>createLearningEntry({load:()=>{},open:null}),/LEARNING_ENTRY_DEPENDENCIES/);
// After a rejected shared load, all waiting entries must fail without opening.
let rejectCount=0,feedback=0,failedOpens=0;
const shared=createLearningEntry({load:async()=>{rejectCount++;throw Error('network')},open:()=>{failedOpens++},onError:()=>{feedback++}});
const outcomes=await Promise.allSettled([shared.enter('S011'),shared.enter('S012')]);
assert.deepEqual(outcomes.map(x=>x.status),['rejected','rejected']);
assert.equal(rejectCount,1);assert.equal(feedback,1);assert.equal(failedOpens,0);assert.equal(shared.isReady(),false);
console.log('PASS learning entry: single flight, retry, invalid requests and shared failure isolation');
