import assert from 'node:assert/strict';
import {inspectHomeBudget} from '../rebuild-preview/light-home-budget.mjs';
const now=new Date(2026,9,20,12);
const state={newPerDay:50,wordsPerRound:10,records:{a:{}},
 dailyNewProgress:{date:'2026-10-20',newWordsCompleted:['one','two']},
 selectedScene:'S001',
 daily:{date:'2026-10-20',wordQuota:50,reinforcementQuota:15,lexiconLimit:20000,
  policy:'selected-scene-words-v3',scene:'S001',assigned:{S001:['a']},reinforcementKeys:['a','b']}};
const incomplete=inspectHomeBudget(state,{now});
assert.equal(incomplete.dailyCompleted,2);
assert.equal(incomplete.complete,false);
assert.equal(incomplete.reinforcementRemaining,null);
assert.equal(incomplete.due,null);
const complete=inspectHomeBudget(state,{now,validKU:new Set(['a','b']),authoritativeDue:4});
assert.equal(complete.complete,true);assert.equal(complete.reinforcementRemaining,1);
assert.equal(complete.due,4);assert.equal(complete.dailyRemaining,48);
const stale=inspectHomeBudget({...state,daily:{...state.daily,date:'2026-10-19'}},{now,validKU:new Set(['a','b']),authoritativeDue:4});
assert.equal(stale.complete,false);
assert.equal(stale.reinforcementRemaining,null);
assert.equal(inspectHomeBudget(state,{now:new Date(2026,9,21,12)}).dailyCompleted,0);
console.log('PASS lightweight home budget: daily progress, no false zero, stale assignment, day rollover');
