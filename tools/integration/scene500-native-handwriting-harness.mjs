/* Run the original Scene500 ephemeral handwriting IIFE (source-exact).
 * Isolated mock canvas + timers; this does not validate real Safari pointer
 * dispatch, pixel fidelity, pressure/handwriting, or activate Scene1341 KU.
 */
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const start=src.indexOf('// Ephemeral handwriting mode: long press to enter, hold again to erase.');
if(start<0||src.slice(start).length<7000||!src.trimEnd().endsWith('})();'))
  throw Error('SCENE500_HANDWRITING_SOURCE_CHANGED');
const native=src.slice(start);
export function makeNativeScene500ScratchProbe(){
  const canvasListeners=new Map(),documentListeners=new Map(),ops=[];
  const pending=new Map();let nextTimer=1,renderCount=0;
  const addClass=new Set();
  const classList={add:x=>addClass.add(x),contains:x=>addClass.has(x)};
  const context2d={
    scale:(...args)=>ops.push(['scale',...args]),
    clearRect:(...args)=>ops.push(['clear',...args]),
    beginPath:()=>ops.push(['begin']),
    moveTo:(...args)=>ops.push(['move',...args]),
    quadraticCurveTo:(...args)=>ops.push(['curve',...args]),
    stroke:()=>ops.push(['stroke']),
    lineTo:(...args)=>ops.push(['line',...args])
  };
  const canvas={
    width:0,height:0,
    getBoundingClientRect:()=>({left:0,top:0,width:320,height:500}),
    getContext:()=>context2d,
    setPointerCapture:()=>{},
    addEventListener:(type,fn)=>canvasListeners.set(type,fn)
  };
  const rating={getBoundingClientRect:()=>({top:610})};
  const screen={
    classList,
    getBoundingClientRect:()=>({top:0}),
    querySelector:selector=>selector==='.recall-correction'?rating:null,
    appendChild:()=>ops.push(['append'])
  };
  const surface={
    classList,style:{},querySelector:selector=>selector==='canvas'?canvas:null,
    closest:selector=>selector==='.learning-screen'?screen:null
  };
  const document={
    hidden:false,
    querySelector:selector=>selector==='.learning-screen .pai-scratch-area'?surface:null,
    addEventListener:(type,fn)=>documentListeners.set(type,fn)
  };
  let ku='NATIVE_TEST_KU_001';
  const window={
    render:()=>{renderCount++;ops.push(['render'])},
    getVisibleLearningUnit:()=>({k:ku})
  };
  const state={view:'learning'};
  const timers={
    setTimeout(fn,ms){const id=nextTimer++;pending.set(id,{fn,ms});return id},
    clearTimeout(id){pending.delete(id)},
    requestAnimationFrame(fn){fn()}
  };
  const context={window,document,state,console,
    setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout,
    requestAnimationFrame:timers.requestAnimationFrame,devicePixelRatio:2,
    Date,Math};
  vm.runInNewContext(native,context,{timeout:1200,filename:'Scene500-original-scratch'});
  const evt=(x,y,pointerId=1)=>({
    pointerId,isPrimary:true,pointerType:'touch',button:0,clientX:x,clientY:y,
    preventDefault:()=>ops.push(['preventDefault']),getCoalescedEvents:()=>[]
  });
  return {
    window,state,canvas,screen,surface,ops,documentListeners,
    isDrawing:()=>window.PAI_SCRATCH_DRAWING(),
    canvasEvent:(type,e)=>canvasListeners.get(type)?.(e),
    documentEvent:(type,e)=>documentListeners.get(type)?.(e),
    event:evt,
    timeouts:()=>[...pending.values()].map(v=>v.ms),
    fireTimers:()=>{const arr=[...pending.entries()];for(const [id,{fn}]of arr){if(pending.delete(id))fn()}},
    renderCount:()=>renderCount,
    setKU:id=>{ku=id},setHidden:v=>{document.hidden=v}
  };
}
