import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const page=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const script=page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script);
const start=script.indexOf('function move(delta,fromAuto=false,fromRatedAdvance=false){');
const end=script.indexOf('\nfunction demoGrade(grade){',start);
assert(start>=0&&end>start,'extract actual Scene1341 swipe and batch navigation');
const navigation=script.slice(start,end);
const rows=Array.from({length:23},(_,i)=>({scene_ku_id:'KU-'+i,expression:'word '+i}));
let tested=0;
for(const face of ['question','answer']){
 for(const rated of [false,true]){
  for(const operation of ['left','right','batch-next','batch-prev','auto-next']){
   const events=[];
   let index=11,phase=face,selected=rated?'hard':null,autoRestarts=0;
   const phaseController={
    state:()=>({selected,phase,preferredFace:face}),
    navigate:key=>{events.push('navigate:'+key);selected=null;phase=face==='answer'?'answer-paused':'question'}
   };
   const ctx={
    phaseController,subset:()=>rows,
    scratchDrawing:()=>false,
    currentBatchNextIndex:(list,current,delta)=>{
     const size=10,lo=Math.floor(current/size)*size,hi=Math.min(list.length,lo+size);
     return lo+((current-lo+delta)%(hi-lo)+(hi-lo))%(hi-lo);
    },
    BATCH:10,index,
    resetScratch:()=>events.push('reset'),
    stopWordAudio:()=>events.push('stop-audio'),
    playWord:()=>events.push('speak'),
    readOnlyPrefs:{get:()=>false},
    autoBrowse:{restart:()=>{autoRestarts++;events.push('auto-restart')}},
    window:{PAI_SCRATCH_FINISH_RATING:()=>events.push('finish-rating')},
    revealed:face==='answer',
    exampleToWordPending:true
   };
   vm.runInNewContext(navigation+'\nthis.move=move;this.moveBatch=moveBatch;',ctx,{timeout:1000});
   try{
    if(operation==='left')ctx.move(-1);
    if(operation==='right')ctx.move(1);
    if(operation==='auto-next')ctx.move(1,true);
    if(operation==='batch-next')ctx.moveBatch(1);
    if(operation==='batch-prev')ctx.moveBatch(-1);
   }catch(error){throw Error(face+' rated='+rated+' operation='+operation+' index='+ctx.index+' : '+error.message)}
   const expected={
    left:10,right:12,'auto-next':12,'batch-next':20,'batch-prev':0
   }[operation];
   assert.equal(ctx.index,expected,face+' '+rated+' '+operation);
   assert.equal(phase,face==='answer'?'answer-paused':'question',
    'manual/auto/batch must retain preferred question/answer face');
   assert(events.includes('stop-audio'),'every transition must preempt old audio');
   assert(events.indexOf('stop-audio')<events.findIndex(e=>e.startsWith('navigate:')),
    'old speech must stop before new KU is bound');
   assert.equal(events.filter(e=>e==='finish-rating').length,rated?1:0,
    'pending grade scratch must finish once');
   assert.equal(events.filter(e=>e==='speak').length,0,'auto-pronounce off must stay off');
   assert.equal(autoRestarts,operation==='auto-next'?0:1,
    'manual gesture restarts auto timing; auto tick does not');
   assert.equal(ctx.exampleToWordPending,false);
   tested++;
  }
 }
}
// One-batch vertical gestures must be a no-op, including during grading.
{
 let navigations=0,stops=0;
 const ctx={
  phaseController:{state:()=>({selected:'good'}),navigate:()=>navigations++},
  subset:()=>rows.slice(0,7),BATCH:10,index:4
 };
 vm.runInNewContext(navigation+'\nthis.moveBatch=moveBatch;',ctx,{timeout:1000});
 ctx.moveBatch(1);ctx.moveBatch(-1);
 assert.equal(ctx.index,4);
 assert.equal(navigations,0);
 assert.equal(stops,0);
}
console.log('SC1341_REAL_NAVIGATION_FACE_GRADE_AUDIO_PARITY_PASS '+tested+' transitions plus one-batch no-op');
