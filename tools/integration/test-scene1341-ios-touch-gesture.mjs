/* Execute the actual Scene1341 iPhone touch handlers, not a reimplementation. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,'inline preview script missing');
const begin=script.indexOf('let start=null;\n$(\'learning\').addEventListener(\'touchstart\'');
const end=script.indexOf('\nfunction stopAuto()',begin);
assert(begin>=0&&end>begin,'touch handler source cannot be located');
const handlers=new Map(),moves=[],batches=[];
let clock=1000,draw=false;
const ctx={
 $:id=>{assert.equal(id,'learning');return {addEventListener:(name,fn)=>{assert(!handlers.has(name));handlers.set(name,fn)}}},
 scratchDrawing:()=>draw,
 Date:{now:()=>clock},
 window:{__paiTapSuppressUntil:0},
 move:delta=>moves.push(delta),
 moveBatch:delta=>batches.push(delta),
 suppressTapUntil:0
};
vm.runInNewContext(script.slice(begin,end),ctx);
const target=interactive=>({closest:()=>interactive?{}:null});
const point=(x,y)=>({clientX:x,clientY:y});
const start=(x,y,interactive=false,count=1)=>{
 handlers.get('touchstart')({target:target(interactive),touches:Array.from({length:count},(_,i)=>point(x+i,y))});
};
const drag=(x,y,count=1)=>handlers.get('touchmove')({touches:Array.from({length:count},(_,i)=>point(x+i,y))});
const endTouch=(x,y,remaining=0)=>handlers.get('touchend')({changedTouches:[point(x,y)],touches:Array.from({length:remaining},()=>point(x,y))});
assert.deepEqual([...handlers.keys()],['touchstart','touchmove','touchcancel','touchend']);
start(150,200);drag(30,202);endTouch(30,202);
assert.deepEqual(moves, [1],'left swipe advances one within current batch');
assert(ctx.window.__paiTapSuppressUntil>clock,'Safari synthesized tap suppressed');
start(50,200);endTouch(160,202);assert.deepEqual(moves,[1,-1],'right swipe reverses');
start(80,200);endTouch(82,100);assert.deepEqual(batches,[1],'up swipe advances batch');
start(80,100);endTouch(82,200);assert.deepEqual(batches,[1,-1],'down swipe reverses batch');
const baseline=()=>[moves.length,batches.length];
// Interactive button on a new touch must invalidate any prior start.
start(150,200);start(150,200,true);endTouch(20,200);
assert.deepEqual([moves.length,batches.length],baseline(),'button tap cannot reuse stale swipe');
// iOS touchcancel must invalidate the in-progress start.
start(150,200);handlers.get('touchcancel')();endTouch(20,200);
assert.deepEqual([moves.length,batches.length],baseline(),'touchcancel must not navigate');
// Two fingers during the move cancel horizontal/vertical navigation.
start(150,200);drag(20,200,2);endTouch(20,200);
assert.deepEqual([moves.length,batches.length],baseline(),'multitouch drag must not navigate');
// Extra finger still resting during end is never a completed swipe.
start(150,200);endTouch(20,200,1);
assert.deepEqual([moves.length,batches.length],baseline(),'nonfinal touchend must not navigate');
// Scratch drawing and controls must bypass navigation, also after former swipe.
start(150,200);draw=true;start(150,200);endTouch(20,200);draw=false;
assert.deepEqual([moves.length,batches.length],baseline(),'scratch gesture cannot navigate');
// Short swipe, diagonal scroll and long hold are deliberately not navigation.
start(150,200);endTouch(100,200);
start(150,200);endTouch(50,105);
start(150,200);clock+=900;endTouch(20,200);
assert.deepEqual([moves.length,batches.length],baseline(),'thresholds and long presses remain safe');
console.log(JSON.stringify({status:'PASS',cases:12,source:'real iPhone touch handlers',srsWrites:0,scene500Writes:0}));
