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
console.log('PASS: Scene500 rank bands, same-word and cross-sense dedupe, due-first queue');
