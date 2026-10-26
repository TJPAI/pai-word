import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
const begin=source.indexOf('let autoBrowseTimer=null,autoBrowseGeneration=0,autoAudioUnsubscribe=null;');
const end=source.indexOf('let autoWakeLock=null',begin);
assert(begin>=0&&end>begin,'scheduler exists');
const snippet=source.slice(begin,end);
function simulation({speech=false,phase='question',deferred=false,tier=1.5}={}){
 let id=0,timers=new Map(),waiters=new Set(),moves=0,play=speech;
 const state={autoBrowseEnabled:true,view:'learning',autoBrowseInterval:tier};
 const window={PAI_SAVE_DEFERRED:deferred,PAI_TAP_FLOW:{snapshot:()=>({phase})},PAI_AUDIO:{
  isActive:()=>play,whenIdle:cb=>{waiters.add(cb);return()=>waiters.delete(cb)}
 },PAI_NAVIGATE_LEARNING:async()=>{moves++}};
 const context={state,window,active:true,loading:false,error:null,document:{hidden:false},
  setTimeout:(cb,ms)=>{const key=++id;timers.set(key,{cb,ms});return key},
  clearTimeout:key=>timers.delete(key),console,Math,Number};
 vm.runInNewContext(snippet+';globalThis.testApi={scheduleAutoBrowse,stopAutoBrowse};',context);
 const fire=async()=>{const job=[...timers.values()][0];assert(job,'pending timer');timers.clear();await job.cb();await Promise.resolve()};
 return {start:()=>context.testApi.scheduleAutoBrowse(),stop:()=>context.testApi.stopAutoBrowse(),
  fire,setSpeech:value=>{play=value;if(!play){for(const cb of [...waiters]){waiters.delete(cb);cb()}}},
  get moves(){return moves},get waiting(){return waiters.size},get delay(){return [...timers.values()][0]?.ms},get timers(){return timers.size},
  setPhase:v=>{phase=v},setDeferred:v=>{window.PAI_SAVE_DEFERRED=v}};
}
{
 const x=simulation();x.start();assert.equal(x.delay,1500);await x.fire();assert.equal(x.moves,1);assert.equal(x.timers,1);x.stop();assert.equal(x.timers,0);
}
{
 const x=simulation({speech:true,tier:0.9});x.start();assert.equal(x.timers,0);assert.equal(x.waiting,1);x.setSpeech(false);assert.equal(x.delay,200);await x.fire();assert.equal(x.moves,1);
}
{
 const x=simulation({phase:'answer'});x.start();await x.fire();assert.equal(x.moves,0,'pending rating is never auto-navigated');x.stop();
}
{
 const x=simulation({deferred:true});x.start();await x.fire();assert.equal(x.moves,0,'pending durable save is never auto-navigated');x.stop();
}
{
 const x=simulation({speech:true});x.start();x.stop();x.setSpeech(false);assert.equal(x.timers,0,'stopped browser never resurrects timer');
}
{
 const x=simulation();x.start();x.setSpeech(true);await x.fire();assert.equal(x.moves,0,'audio starting after timer cannot be cut off');assert.equal(x.waiting,1);x.setSpeech(false);assert.equal(x.delay,600);
}
console.log('PASS executable auto-browse timing, speech, rating and stop races');
