import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the actual isolated phase controller with a deterministic clock,
// deferred audio callbacks, and the exact Scene500 grade plan.
const policy=fs.readFileSync('rebuild-preview/scene1341-readonly/scene500-native-rating-policy-exact.js','utf8');
const phase=fs.readFileSync('rebuild-preview/scene1341-readonly/scene500-readonly-phase.js','utf8');
const context={window:{}};
vm.runInNewContext(policy,context,{timeout:1000});
vm.runInNewContext(phase,context,{timeout:1000});
const create=context.window.PAI_SCENE500_READONLY_PHASE.createReadOnlyPhaseController;
let cases=0;
for(const grade of ['again','hard','good']){
 for(const interrupt of ['manual-next','manual-prev','batch-next','batch-prev','blank-tap','suspend','example','auto-tick']){
  const tasks=new Map(),grades=[],advances=[],audios=[],states=[];
  let id=0;
  const schedule=(fn,ms)=>{const n=++id;tasks.set(n,{fn,ms});return n};
  const unschedule=n=>tasks.delete(n);
  const ctrl=create({
   onUpdate:s=>states.push({phase:s.phase,preferredFace:s.preferredFace}),
   onGradeComplete:(g,k)=>grades.push([g,k]),
   onAdvance:(g,k)=>advances.push([g,k]),
   playRatedWord:(g,i,done)=>{
    const a={g,i,done,canceled:false};
    audios.push(a);
    return ()=>{a.canceled=true};
   },schedule,unschedule
  });
  ctrl.start('KU-OLD');
  ctrl.tap(); // user is on the answer page before grading
  assert.equal(ctrl.state().preferredFace,'answer');
  ctrl.choose(grade);
  assert.equal(ctrl.state().selected,grade);
  const stale=audios[0].done;
  switch(interrupt){
   case 'manual-next':case 'manual-prev':case 'batch-next':case 'batch-prev':
    ctrl.navigate('KU-NEW');break;
   case 'blank-tap':ctrl.tap();break;
   case 'suspend':ctrl.suspend();break;
   case 'example':assert.equal(ctrl.beginExample(),true);break;
   case 'auto-tick':ctrl.navigate('KU-NEW');break;
  }
  // Late browser TTS events and stale timers may arrive after the interrupt.
  stale();stale();
  for(const [n,task] of [...tasks]){tasks.delete(n);task.fn()}
  assert.equal(advances.length,0,grade+' '+interrupt+' must not advance stale rated card');
  assert.equal(ctrl.state().pending,false,grade+' '+interrupt+' must clear pending timer');
  assert.equal(ctrl.state().selected,null);
  assert.equal(grades.length,interrupt==='suspend'||interrupt==='example'?0:1,
   grade+' '+interrupt+' must commit once only when navigation/tap finalizes');
  if(grades.length){
   assert.equal(grades[0][0],grade);
   assert.equal(grades[0][1],'KU-OLD','stale grade must never be assigned to new KU');
  }
  if(interrupt==='blank-tap'){
   assert.equal(ctrl.state().phase,'question');
   assert.equal(ctrl.state().preferredFace,'question');
  }else if(interrupt==='example'){
   assert.equal(ctrl.state().phase,'example');
  }else{
   assert.equal(ctrl.state().phase,'answer-paused',
    grade+' '+interrupt+' must preserve answer mode');
  }
  if(interrupt==='manual-next'||interrupt==='manual-prev'||interrupt==='batch-next'||interrupt==='batch-prev'||interrupt==='auto-tick'){
   assert.equal(ctrl.state().cardKey,'KU-NEW');
  }
  cases++;
 }
}
// A fresh graded card after stale callbacks must still finish normally.
{
 const tasks=new Map(),audios=[],grades=[],advances=[];
 let next=0;
 const ctrl=create({
  onUpdate:()=>{},onGradeComplete:(g,k)=>grades.push([g,k]),
  onAdvance:(g,k)=>advances.push([g,k]),
  playRatedWord:(g,i,done)=>{audios.push(done);return ()=>{}},
  schedule:(fn,ms)=>{const id=++next;tasks.set(id,{fn,ms});return id},
  unschedule:id=>tasks.delete(id)
 });
 ctrl.start('KU-OLD');ctrl.choose('good');
 const oldDone=audios[0];
 ctrl.navigate('KU-NEW');oldDone();
 ctrl.choose('good');
 // Execute first speech and the show timer; old stale audio must not finish new KU.
 audios.at(-1)();
 for(const [id,t] of [...tasks]){tasks.delete(id);t.fn()}
 assert.equal(grades.length,2);
 assert.equal(advances.length,1);
 assert.equal(advances[0][1],'KU-NEW');
 oldDone();
 assert.equal(advances.length,1);
}
console.log('SC1341_RATED_NAVIGATION_RACE_MATRIX_PASS '+cases+' interrupted combinations plus fresh KU');
