import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const correct=source.match(/function correct\(score\)\{[^\n]+\}/)?.[0];
const start=source.indexOf('function choose(score){');
const end=source.indexOf('\n function browseReady(',start);
assert(correct&&start>=0&&end>start,'Current rating entrypoints missing');
const choose=source.slice(start,end);
for(const phase of ['question','answer-paused','answer','repeating']){
 const calls=[],context={
   phase,visibleKey:'ku1',began:Date.now()-100,responseMs:null,
   state:{view:'learning'},document:{hidden:false},
   window:{PAI_AUTOBROWSE:{stop(){calls.push('stop')}},PAI_CANCEL_PENDING_BROWSE(){calls.push('cancel')}},
   pageRevealed:()=>phase!=='question',startRatedSequence:score=>calls.push(score),Date
 };
 vm.createContext(context);
 vm.runInContext(correct+';'+choose+'; choose("hard"); correct("good"); correct("bad");',context);
 assert.deepEqual(calls.filter(x=>['hard','good','bad'].includes(x)),['hard','good'],phase+' should accept rating and correction');
 if(phase==='answer')assert(!calls.includes('stop'),'correction should not stop auto browse again');
 else assert(calls.includes('stop'),phase+' should pause auto browse when rating begins');
}
for(const phase of ['committing']){
 const calls=[],context={phase,visibleKey:'ku1',began:0,state:{view:'learning'},document:{hidden:false},
  window:{},pageRevealed:()=>true,startRatedSequence:score=>calls.push(score),Date};
 vm.createContext(context);vm.runInContext(choose+';choose("good");',context);
 assert.deepEqual(calls,[],'committing must reject new grading');
}
console.log('PASS: current rating entrypoints, corrections and commit-phase protection');
