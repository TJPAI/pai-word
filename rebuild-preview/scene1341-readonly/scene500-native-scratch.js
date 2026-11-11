// Adapted from exact active Scene500 rebuild-preview/learning-runtime.js scratch subsystem.
// Native smoothing, 600ms hold to draw/erase, Safari selection suppression and overlay geometry.
// No persistent KU/SRS storage, no publishing, read-only Scene1341 sandbox.
// Ephemeral handwriting mode: long press to enter, hold again to erase.
(function(){
 // Read-only Scene1341 compatibility context: same native drawing algorithm,
 // with the source controller's page predicate replaced by this local view.
 const state={get view(){return document.getElementById('learning')?.hidden?'home':'learning'}};
 let activeSurface=null,activeCanvas=null,activeMode=false,pointer=null,hold=null,readyToInk=false,moved=false,lastInk=null,startX=0,startY=0,ctx=null;
 const suppress=()=>{window.__paiTapSuppressUntil=Date.now()+850};
 const cancelHold=()=>{if(hold!==null){clearTimeout(hold);hold=null}};
 const reset=()=>{
  cancelHold();pointer=null;activeMode=false;readyToInk=false;
  if(activeSurface){
   const screen=activeSurface.closest('.learning-screen');
   activeSurface.classList.remove('is-drawing');
   screen?.classList.remove('pai-scratch-active');
   activeSurface.removeAttribute('style');
   const body=screen?.querySelector('.study-body');
   if(body&&activeSurface.parentNode!==body)body.appendChild(activeSurface);
  }
  activeSurface=null;activeCanvas=null;ctx=null;
 };
 window.PAI_SCENE1341_SCRATCH_RESET=reset;
 window.PAI_SCRATCH_DRAWING=()=>activeMode;
 function initScratch(){
  const surface=document.querySelector('.learning-screen .pai-scratch-area');
  if(!surface){reset();return}
  if(surface===activeSurface)return;
  reset();activeSurface=surface;activeCanvas=surface.querySelector('canvas');
  const canvas=activeCanvas;if(!canvas)return;
  // Canvas always covers the full region above the three rating buttons while drawing.
  const size=()=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,3);canvas.width=Math.max(1,Math.ceil(rect.width*dpr));canvas.height=Math.max(1,Math.ceil(rect.height*dpr));ctx=canvas.getContext('2d');if(ctx){ctx.scale(dpr,dpr);ctx.strokeStyle='#243347';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round'}};
  size();
  const point=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}};
  const clear=()=>{lastInk=null;if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height)};
  window.PAI_SCRATCH_REENTER=()=>{if(!activeMode&&activeSurface){enter();readyToInk=true}};
  const enter=()=>{
   if(activeMode)return;
   activeMode=true;readyToInk=false;surface.classList.add('is-drawing');
   const screen=surface.closest('.learning-screen'),rating=screen?.querySelector('.recall-correction');
   if(screen&&rating){
    // Escape study-body's overflow clipping and stacking context: the overlay
    // must be a direct child of the learning screen, above the hero and header.
    const a=screen.getBoundingClientRect(),z=rating.getBoundingClientRect();
    screen.appendChild(surface);
    screen.classList.add('pai-scratch-active');
    surface.style.top='0px';surface.style.bottom='auto';
    surface.style.left='0px';surface.style.width='100%';
    surface.style.height=Math.max(180,z.top-a.top)+'px';
   }
   size();suppress();
  };
  canvas.addEventListener('pointerdown',e=>{
   if(pointer!==null||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;
   pointer=e.pointerId;moved=false;lastInk=null;const p=point(e);startX=p.x;startY=p.y;
   try{canvas.setPointerCapture(e.pointerId)}catch{}
   hold=setTimeout(()=>{hold=null;if(pointer!==e.pointerId||moved)return;if(activeMode)clear();else enter();suppress()},600);
  });
  canvas.addEventListener('pointermove',e=>{
   if(pointer!==e.pointerId)return;
   const p=point(e);
   if(!moved&&Math.hypot(p.x-startX,p.y-startY)>8){moved=true;cancelHold()}
   if(!activeMode||hold!==null||!readyToInk)return;
   if(moved&&ctx){
    const samples=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[];
    const events=samples.length?samples:[e];
    for(const sample of events){
     const raw=point(sample);
     const anchor=lastInk||{x:startX,y:startY};
     const distance=Math.hypot(raw.x-anchor.x,raw.y-anchor.y);
     if(distance<0.35)continue;
     const alpha=distance>14?0.92:distance>6?0.82:0.68;
     const v={x:anchor.x+(raw.x-anchor.x)*alpha,y:anchor.y+(raw.y-anchor.y)*alpha};
     if(!lastInk)lastInk={x:startX,y:startY};
     const mid={x:(lastInk.x+v.x)/2,y:(lastInk.y+v.y)/2};
     // Commit only the new segment; never repaint the entire stroke on each move.
     ctx.beginPath();ctx.moveTo(lastInk.midX??startX,lastInk.midY??startY);
     ctx.quadraticCurveTo(lastInk.x,lastInk.y,mid.x,mid.y);
     ctx.stroke(); // Each beginPath must be painted before the next sample replaces it.
     lastInk={x:v.x,y:v.y,midX:mid.x,midY:mid.y};
    }
    suppress();
   }
  });
  const finish=e=>{
   if(pointer!==e.pointerId)return;
   if(activeMode&&!moved&&hold!==null){cancelHold();suppress();reset();window.render?.();return;}
   cancelHold();
   if(moved&&activeMode)suppress();
   if(lastInk&&ctx){ctx.beginPath();ctx.moveTo(lastInk.midX??startX,lastInk.midY??startY);ctx.lineTo(lastInk.x,lastInk.y);ctx.stroke()}lastInk=null;pointer=null;if(activeMode)readyToInk=true;
  };
  canvas.addEventListener('pointerup',finish);
  canvas.addEventListener('pointercancel',e=>{if(pointer===e.pointerId){cancelHold();pointer=null;lastInk=null;suppress()}});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
 }
 // Ordinary face: transparent scratch surface must not swallow controls, taps or swipes.
 // Long-press starts on non-control content of either question or answer page.
 let ordinaryPress=null,ordinaryTimer=null;
 const clearOrdinary=()=>{if(ordinaryTimer!==null)clearTimeout(ordinaryTimer);ordinaryTimer=null;ordinaryPress=null};
 document.addEventListener('pointerdown',e=>{
  if(activeMode||state.view!=='learning'||!e.isPrimary||e.pointerType==='mouse'&&e.button!==0)return;
  const screen=e.target.closest?.('.learning-screen'),rating=screen?.querySelector('.recall-correction');
  if(!screen||!rating||e.target.closest('button,a,input,select,textarea,summary,details,.auto-word-toggle,[data-word-audio],[data-example-audio]'))return;
  if(e.clientY>=rating.getBoundingClientRect().top)return;
  clearOrdinary();ordinaryPress={id:e.pointerId,x:e.clientX,y:e.clientY};
  ordinaryTimer=setTimeout(()=>{
   ordinaryTimer=null;
   if(!ordinaryPress||ordinaryPress.id!==e.pointerId||state.view!=='learning')return;
   ordinaryPress=null;
   initScratch();window.PAI_SCRATCH_REENTER?.();suppress();
  },600);
 },true);
 document.addEventListener('pointermove',e=>{
  if(ordinaryPress?.id===e.pointerId&&Math.hypot(e.clientX-ordinaryPress.x,e.clientY-ordinaryPress.y)>8)clearOrdinary();
 },true);
 document.addEventListener('pointerup',e=>{if(ordinaryPress?.id===e.pointerId)clearOrdinary()},true);
 document.addEventListener('pointercancel',e=>{if(ordinaryPress?.id===e.pointerId)clearOrdinary()},true);
 // Safari selection menu can win the 600ms hold race unless selection is suppressed.
 // Restrict this to the study surface, leaving settings and unrelated text intact.
 const scratchSelectionTarget=target=>{
  const screen=target?.closest?.('.learning-screen');
  return !!screen&&!!target.closest('.study-top,.word-hero,.study-body,.pai-scratch-area,.recall-note,.recall-correction,.session-footnote');
 };
 document.addEventListener('selectstart',e=>{if(state.view==='learning'&&scratchSelectionTarget(e.target))e.preventDefault()},true);
 document.addEventListener('contextmenu',e=>{if(state.view==='learning'&&scratchSelectionTarget(e.target))e.preventDefault()},true);
 let pendingAutoRestore=false,ratingWasDrawing=false;
 window.PAI_SCRATCH_BEGIN_RATING=()=>{if(activeMode)ratingWasDrawing=true};
 window.PAI_SCRATCH_FINISH_RATING=()=>{
  if(!ratingWasDrawing)return;
  ratingWasDrawing=false;
  if(state.view!=='learning')return;
  // Commit and navigation have finished; rebuild the blank drawing surface
  // without displaying the next question's hero or affecting KU/SRS data.
  const expectedKU=window.getVisibleLearningUnit?.()?.k||null;
  requestAnimationFrame(()=>{
   if(state.view!=='learning'||document.hidden||!expectedKU||window.getVisibleLearningUnit?.()?.k!==expectedKU)return;
   initScratch();
   window.PAI_SCRATCH_REENTER?.();
  });
 };
 const previousRender=window.render;
 if(typeof previousRender==='function')window.render=function(...args){
  pendingAutoRestore=(pendingAutoRestore||activeMode)&&window.PAI_SCRATCH_AUTO_TRANSITION===true&&state.view==='learning';
  reset();
  const result=previousRender.apply(this,args);
  if(state.view==='learning')requestAnimationFrame(()=>{initScratch();if(pendingAutoRestore&&activeSurface&&!activeMode&&state.view==='learning'){pendingAutoRestore=false;window.PAI_SCRATCH_REENTER?.();}});
  return result;
 };
 if(state.view==='learning')requestAnimationFrame(initScratch);
})();
