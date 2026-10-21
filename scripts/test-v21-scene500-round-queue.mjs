// Run: node scripts/test-v21-scene500-round-queue.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/round-policy.js',import.meta.url),'utf8');
function run(difficulty,records={},due=[]){
 const word=(rank,ids)=>{
  const w={rank,w:'w'+rank,s:{}};
  return ids.map(k=>{w.s[k]={};return {k,sid:k,w}});
 };
 const units=[...word(100,['a','a2']),...word(5500,['b']),...word(9000,['c']),...word(15000,['d']),...word(16000,['e'])];
 const state={newPerDay:50,wordsPerRound:10,scene500DifficultyByScene:{S001:difficulty},
  records,selectedScene:'daily',daily:{reinforcementKeys:[]}};
 let queue=null;
 const window={PAI_SCENE500:{sceneIds:['S001']},PAI_LEARNING_QA:{due:()=>due},
  PAI_CORE:{byKU:new Map(units.map(u=>[u.k,u]))},globalNewCompleted:()=>0,
  PAI_START_POLICY_SESSION:keys=>{queue=keys;state.learningSession={};return keys},
  rebuildDailyAssignments(){},render(){},openScene(){}};
 const ctx={window,state,save(){},allUnits:()=>units,unitKey:(_w,k)=>k,
  SCENES:{S001:'fixture'},document:{}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 window.openScene('S001');
 return queue;
}
assert.deepEqual([...run('all')],['a','b','c','d','e']);
assert.deepEqual([...run('basic')],['a']);
assert.deepEqual([...run('common')],['b']);
assert.deepEqual([...run('advanced')],['c']);
assert.deepEqual([...run('high')],['d','e']);
assert.deepEqual([...run('all',{a2:{lastGrade:'good'}})],['b','c','d','e'],
 'learning another sense must exclude the whole headword from fresh');
assert.deepEqual([...run('all',{},['d','c'])],['d','c','a','b','e'],
 'due KUs occupy slots before new words');
assert.deepEqual([...run('all',{},['a','a2','d'])],['a','d','b','c','e'],
 'two due senses of a single headword must not duplicate the word or reappear as fresh');
// Legacy scene route must obey the same headword invariant.
{
 const alpha={rank:10,w:'alpha'},beta={rank:20,w:'beta'};
 const units=[{k:'a',w:alpha,s:{scene:'legacy'}},{k:'a2',w:alpha,s:{scene:'legacy'}},{k:'b',w:beta,s:{scene:'legacy'}}];
 const state={newPerDay:50,wordsPerRound:10,records:{},selectedScene:'legacy',daily:{reinforcementKeys:[]}};
 const window={PAI_SCENE500:{sceneIds:[]},PAI_LEARNING_QA:{due:()=>['a','a2'],unlearned:()=>units},
  PAI_CORE:{byKU:new Map(units.map(u=>[u.k,u]))},globalNewCompleted:()=>0,
  openScene(){state.learningSession={kind:'scene'}}};
 const ctx={window,state,save(){},allUnits:()=>[],unitKey(){},SCENES:{},document:{}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 window.openScene('legacy');
 assert.deepEqual([...state.learningSession.queue],['a','b'],
  'legacy scene must not repeat due senses or reintroduce the same word as fresh');
}
// Reinforcement sessions must also avoid repeating a headword in one round.
{
 const alpha={rank:10,w:'alpha'},beta={rank:20,w:'beta'};
 const state={newPerDay:50,wordsPerRound:10,records:{},daily:{reinforcementKeys:['a','a2','b','a']}};
 const window={PAI_CORE:{byKU:new Map([['a',{w:alpha}],['a2',{w:alpha}],['b',{w:beta}]])},
  globalReinforcementRemaining(){},PAI_LEARNING_QA:{},openScene(){},render(){}};
 const ctx={window,state,save(){},SCENES:{},document:{}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 window.openReinforcement();
 assert.deepEqual([...state.learningSession.queue],['a','b'],
  'reinforcement round must select only one KU per headword');
}
// Deduplication must defer—not discard—the other due sense: once the first
// sense is no longer due, the second remains eligible on the next round.
assert.deepEqual([...run('basic',{},['a','a2'])],['a'],
 'same-headword due senses must not coexist in a round');
assert.deepEqual([...run('basic',{a:{due:Date.now()+86400000}},['a2'])],['a2'],
 'second sense must be scheduled when first sense is no longer due');
console.log('PASS: Scene500 rank bands, same-word and cross-sense dedupe, due-first queue');
