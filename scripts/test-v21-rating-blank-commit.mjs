// Regression test for blank-tap early commit in both browsing modes.
// Run: node scripts/test-v21-rating-blank-commit.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const start=source.indexOf('function tap(){');
const end=source.indexOf('function beginExample()',start);
assert(start>=0&&end>start,'current tap implementation must exist');
const implementation=source.slice(start,end);
for(const autoBrowseEnabled of [false,true]){
 const state={view:'learning',revealed:true,autoBrowseEnabled};
 let phase='answer',generation=8,visibleKey='ku1',holdAfterRating=false;
 let cancelAudioWait=null,ratingSpeechStarted=true,timer=19,pageState='QUESTION';
 let commits=0,played=0,stopped=0,restarts=0;
 const context={state,document:{hidden:false},
  window:{getVisibleLearningUnit:()=>({k:'ku1',w:{w:'apple'}}),PAI_AUDIO:{stop(){stopped++},play(){played++}},
   render(){},PAI_AUTOBROWSE:{restart(){restarts++}}},
  clearTimeout(){},Date,Math,phase,generation,visibleKey,holdAfterRating,cancelAudioWait,ratingSpeechStarted,timer,pageState,
  syncPage(){state.revealed=context.pageState==='ANSWER'},
  finish(){commits++},ready(){},config(){return{}}
 };
 vm.createContext(context);
 vm.runInContext(implementation+';tap();',context);
 assert.equal(commits,1,'blank should request early commit once');
 assert.equal(context.holdAfterRating,true,'blank should retain current card');
 assert.equal(context.timer,null,'blank should clear rating countdown');
 assert.equal(context.pageState,'QUESTION','blank should toggle currently displayed answer');
 assert.equal(played,autoBrowseEnabled?0:1,'manual blank should speak, auto blank should not');
 assert.equal(restarts,0,'do not restart browsing before durable commit');
 assert.equal(stopped,1,'stop pending rating speech');
}
console.log('PASS: both blank-tap modes request one immediate commit, hold current card, and respect speech rules');
