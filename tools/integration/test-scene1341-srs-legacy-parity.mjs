import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {projectScene1341Grade,createScene1341Srs,SCENE1341_SRS_SCOPE} from '../../rebuild-preview/scene1341-srs-v2.mjs';
const window={};vm.runInNewContext(fs.readFileSync('rebuild-preview/memory-schedulers.js','utf8'),{window});
const scheduler=window.PAI_MEMORY_SCHEDULERS;
assert.equal(scheduler.resolve('basic').version,'session-retrieval-v3');
const now=1800000000000,kuId='SC1341-KU-00001';
let steps=0;
for(const sessionKind of ['scene','free']){
 for(const grade of ['again','hard','good']){
  for(const repeat of [false,true]){
   for(const previous of [null,
    {last:now-86400000,interval:86400000,lastStableInterval:86400000,reps:2,lastGrade:'good',due:now-1},
    {last:now-3*86400000,interval:3*86400000,lastStableInterval:3*86400000,reps:5,lastGrade:'hard',due:now+86400000},
    {last:now-7*86400000,interval:7*86400000,lastStableInterval:7*86400000,reps:8,lastGrade:'again',due:now-1}]){
    const actualPrevious=previous&&{...previous,kuId,namespace:SCENE1341_SRS_SCOPE};
    const legacy=scheduler.review('basic',{previous:actualPrevious,grade,now,repeat,sessionKind});
    const newKu=projectScene1341Grade({kuId,grade,previous:actualPrevious,now,repeat,sessionKind,
      attemptId:'parity-attempt-0001'});
    for(const k of ['last','lastKnown','lastGrade','reps','learningPending','srsPolicy','due','interval','lastStableInterval']){
      assert.equal(newKu[k],legacy[k],`SRS parity fail ${sessionKind} ${grade} repeat=${repeat} ${k}`);
    }
    assert.equal(newKu.intervalMs,legacy.interval);
    assert.equal(newKu.namespace,SCENE1341_SRS_SCOPE);
    assert.equal(newKu.storageKey,'scene1341-v2:'+kuId);
    steps++;
   }
  }
 }
}
assert.equal(steps,48);
const gated=createScene1341Srs({releaseApproved:false});
await assert.rejects(()=>gated.rate({kuId,grade:'good',now,
 attemptId:'blocked-attempt',kuReleaseEligible:true}),/NOT_APPROVED/);
console.log(JSON.stringify({status:'PASS',legacyBasicVersion:'session-retrieval-v3',
 parityCases:steps,gradeOptions:3,sessionKinds:2,repeatModes:2,baselineStates:4,
 unchangedProductionRuntime:true,actualReleaseEligible:0}));
