// Run: node scripts/qa-v22-home-counts.mjs
// Exercises the actual projectRatedKU projector in an isolated VM, without browser storage.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const runtime=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const start=runtime.indexOf('function projectRatedKU(');
const end=runtime.indexOf('window.rateBrowsedLearning=async',start);
assert(start>=0&&end>start,'Rating projector boundaries present');
const projector=runtime.slice(start,end);
const units=new Map([
 ['k1',{w:{rank:1,w:'alpha'}}],
 ['k2',{w:{rank:1,w:'alpha'}}],
 ['k3',{w:{rank:2,w:'beta'}}]
]);
const context={window:{PAI_MEMORY_SCHEDULERS:{review:(_algorithm,options)=>({grade:options.grade,due:options.now+1000})}},byKey:k=>units.get(k),date:()=>context.today,structuredClone,console};
context.today='2026-10-24';
vm.createContext(context);
vm.runInContext(projector+'\nthis.projectRatedKU=projectRatedKU;',context);
const rate=(before,k,grade='good')=>{const draft=structuredClone(before);context.projectRatedKU(draft,before,k,grade,1000,200);return draft};
const fresh=()=>({records:{},stats:{known:0,unknown:0},dailyNewProgress:{date:'2026-10-24',completed:[],newWordsCompleted:[],reinforcementCompleted:[]},learningSession:{kind:'scene',seen:{},queue:[],completed:[],attempts:0}});
let state=fresh();
state=rate(state,'k1');
assert.equal(state.dailyNewProgress.newWordsCompleted.length,1,'First KU of new headword counts +1');
state=rate(state,'k2');
assert.equal(state.dailyNewProgress.newWordsCompleted.length,1,'Second KU of same headword does not count twice');
state=rate(state,'k1','hard');
assert.equal(state.dailyNewProgress.newWordsCompleted.length,1,'Repeat rating does not add new word');
state=rate(state,'k3');
assert.equal(state.dailyNewProgress.newWordsCompleted.length,2,'Another new headword counts +1');
assert.equal(state.learningSession.attempts,4,'All successful projections count as attempts');
const beforeFailure=structuredClone(state);
const failedDraft=rate(state,'k3');
assert.deepEqual(state,beforeFailure,'Discarded projection does not mutate original state');
assert.notDeepEqual(failedDraft,state,'Projection is separate until durable commit');
context.today='2026-10-25';
state=rate(state,'k2','hard');
assert.equal(state.dailyNewProgress.date,'2026-10-24','Previously introduced KU does not manufacture new-day count');
console.log('PASS 7 projector invariants: first/new/duplicate/review/attempt/rollback/date');
console.log('LIMITATION: isolated projector checks, not Safari UI or actual IDB transactions');
