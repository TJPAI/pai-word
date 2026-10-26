import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const s=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
const start=s.indexOf('window.PAI_SCRATCH_FINISH_RATING=()=>{');
const end=s.indexOf('\n };',start);
assert(start>=0&&end>start,'find real post-rating handler');
const handler=s.slice(start,end+4);
function runCase({leave=false,hidden=false,replaceKU=false}={}){
 const callbacks=[],calls=[],state={view:'learning'},document={hidden:false};
 let key='ku-one';
 const window={
  getVisibleLearningUnit:()=>({k:key}),
  PAI_SCRATCH_REENTER:()=>calls.push('reenter')
 };
 const context={window,state,document,requestAnimationFrame:fn=>callbacks.push(fn),initScratch:()=>calls.push('init')};
 vm.runInNewContext('let ratingWasDrawing=true;'+handler,context,{filename:'scratch-rating-handler.js'});
 window.PAI_SCRATCH_FINISH_RATING();
 assert.equal(callbacks.length,1,'grade queues exactly one restore');
 if(leave)state.view='scenes';
 if(hidden)document.hidden=true;
 if(replaceKU)key='ku-two';
 callbacks[0]();
 assert.deepEqual(calls,leave||hidden||replaceKU?[]:['init','reenter'],'deferred restore must not resurrect stale canvas');
 window.PAI_SCRATCH_FINISH_RATING();
 assert.equal(callbacks.length,1,'consumed rating intent cannot queue duplicate restoration');
}
runCase();runCase({leave:true});runCase({hidden:true});runCase({replaceKU:true});
console.log('PASS behavioral scratch rating restore: current KU only, hidden/leave/replace fail-closed');
