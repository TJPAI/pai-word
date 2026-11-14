/* Run the actual Scene1341 rating entrypoint against scratch/auto/phase mocks. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(inline);
const begin=inline.indexOf('function demoGrade(grade){');
const end=inline.indexOf("\n$('back').addEventListener",begin);
assert(begin>=0&&end>begin,'rating entrypoint source not found');
let hidden=false,card='SC1341-TEST-KU',phase='answer-paused';
const calls={scratch:0,pause:0,choose:[],stop:0};
const ctx={
 $:id=>{assert.equal(id,'learning');return {get hidden(){return hidden}}},
 phaseController:{state:()=>({cardKey:card,phase}),choose:g=>{calls.choose.push(g);return true}},
 autoBrowse:{pause:()=>calls.pause++},
 stopWordAudio:()=>calls.stop++,
 window:{PAI_SCRATCH_BEGIN_RATING:()=>calls.scratch++},
 exampleToWordPending:true
};
vm.runInNewContext(inline.slice(begin,end)+'\nthis.demoGrade=demoGrade;this.pending=()=>exampleToWordPending;this.setPending=v=>exampleToWordPending=v;',ctx);
const untouched=()=>{assert.equal(calls.scratch,0);assert.equal(calls.pause,0);assert.equal(calls.choose.length,0);assert.equal(calls.stop,0)};
ctx.demoGrade('invalid');untouched();
ctx.demoGrade(undefined);untouched();
hidden=true;ctx.demoGrade('good');untouched();hidden=false;
card=null;ctx.demoGrade('good');untouched();card='SC1341-TEST-KU';
phase='example';ctx.demoGrade('hard');
assert.equal(ctx.pending(),false,'rating cancels example-to-word owner');
assert.equal(calls.stop,1,'old example speech preempted once');
assert.equal(calls.scratch,1);
assert.equal(calls.pause,1);
assert.deepEqual(calls.choose,['hard']);
phase='answer-paused';ctx.demoGrade('good');
assert.equal(calls.scratch,2);
assert.equal(calls.pause,2);
assert.deepEqual(calls.choose,['hard','good']);
assert.equal(calls.stop,1,'no needless audio cancel on normal grade');
// After example speaker is replaced by word speech, phase is already answer-paused.
// A grade MUST still cancel that audio owner before starting the rating timer.
ctx.setPending(true);ctx.demoGrade('again');
assert.equal(ctx.pending(),false,'grade clears takeover even outside example phase');
assert.equal(calls.stop,2,'preempt replaced word speech before rating');
assert.equal(calls.scratch,3);
assert.equal(calls.pause,3);
assert.deepEqual(calls.choose,['hard','good','again']);
console.log(JSON.stringify({status:'PASS',source:'actual demoGrade handler',cases:7,srsWrites:0}));
