import assert from 'node:assert/strict';
import {makeNativeScene500ScratchProbe as make} from './scene500-native-handwriting-harness.mjs';
const p=make();
assert.equal(p.isDrawing(),false);
assert.equal(p.canvas.width,640);
assert.equal(p.canvas.height,1000);
p.canvasEvent('pointerdown',p.event(20,20));
assert.deepEqual(p.timeouts(),[600]);
p.fireTimers();
assert.equal(p.isDrawing(),true,'Long hold enters native handwriting');
assert(p.screen.classList.contains('pai-scratch-active'));
assert.equal(p.surface.style.height,'610px');
p.canvasEvent('pointerup',p.event(20,20));
p.canvasEvent('pointerdown',p.event(35,35));
p.canvasEvent('pointermove',p.event(55,55));
p.canvasEvent('pointermove',p.event(65,65));
p.canvasEvent('pointerup',p.event(65,65));
assert(p.ops.some(x=>x[0]==='curve'),'Native stroke segments were drawn');
assert(p.ops.some(x=>x[0]==='stroke'),'Native canvas stroke called');
const beforeClear=p.ops.filter(x=>x[0]==='clear').length;
p.canvasEvent('pointerdown',p.event(20,20));
p.fireTimers();
assert.equal(p.isDrawing(),true,'Second hold erases but remains in drawing mode');
assert.equal(p.ops.filter(x=>x[0]==='clear').length,beforeClear+1);
p.canvasEvent('pointerup',p.event(20,20));
p.canvasEvent('pointerdown',p.event(20,20));
p.canvasEvent('pointerup',p.event(20,20));
assert.equal(p.isDrawing(),false,'Short tap exits drawing');
assert.equal(p.renderCount(),1);
p.window.PAI_SCRATCH_REENTER();
assert.equal(p.isDrawing(),true,'Reentry uses native scratch method');
p.window.PAI_SCRATCH_BEGIN_RATING();
p.setKU('NATIVE_TEST_KU_002');
p.window.PAI_SCRATCH_FINISH_RATING();
assert.equal(p.isDrawing(),true,'Rating transition restores drawing mode');
const a=make();
a.canvasEvent('pointerdown',a.event(20,20));
a.canvasEvent('pointermove',a.event(100,100));
assert.equal(a.timeouts().length,0,'Moving before hold cancels long-press');
a.fireTimers();
assert.equal(a.isDrawing(),false);
const b=make();
b.canvasEvent('pointerdown',b.event(10,10));
b.canvasEvent('pointercancel',b.event(10,10));
b.fireTimers();
assert.equal(b.isDrawing(),false,'Cancelled pointer does not enter drawing');
const controls=make();
const target={
  closest:(selector)=>{
    if(selector==='.learning-screen')return controls.screen;
    if(selector.startsWith('button,'))return {tagName:'BUTTON'};
    return null;
  }
};
controls.documentEvent('pointerdown',{...controls.event(20,20),target});
assert.equal(controls.timeouts().length,0,'Native controls do not enter drawing on long hold');
console.log(JSON.stringify({status:'PASS',source:'original Scene500 handwriting IIFE',
 checks:['600ms enter','native stroke','hold-to-erase','tap-to-exit','rating reenter',
 'drag-cancels-hold','pointer-cancel','ignore controls'],srsWrites:0,scene1341Activated:false}));
