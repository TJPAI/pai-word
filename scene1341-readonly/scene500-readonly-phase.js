/* Read-only Scene500 phase adapter based on the ACTIVE
 * rebuild-preview/learning-runtime.js controller (not old tap-flow.js).
 * Never imports durable SRS, records or mutation functions.
 */
(function(root){
 'use strict';
 const DEFAULT_SHOW_MS=Object.freeze({again:6000,hard:4000,good:2000});
 function createReadOnlyPhaseController({onUpdate,onGradeComplete,onAdvance,
  schedule=(fn,ms)=>setTimeout(fn,ms),unschedule=id=>clearTimeout(id)}={}){
  if(typeof onUpdate!=='function'||typeof onGradeComplete!=='function'||typeof onAdvance!=='function')
   throw Error('SCENE500_READONLY_CALLBACK_REQUIRED');
  let phase='question',cardKey=null,selected=null,timer=null,token=0;
  const valid=grade=>Object.prototype.hasOwnProperty.call(DEFAULT_SHOW_MS,grade);
  const state=()=>Object.freeze({phase,cardKey,selected,revealed:phase==='answer',pending:timer!==null});
  function clearTimer(){token++;if(timer!==null){unschedule(timer);timer=null}}
  function finishPending(){if(selected!==null){const grade=selected;selected=null;onGradeComplete(grade,cardKey)}}
  function start(key){
   if(typeof key!=='string'||!key)throw Error('SCENE500_READONLY_KU_REQUIRED');
   clearTimer();selected=null;cardKey=key;phase='question';onUpdate(state());return state();
  }
  function tap(){
   if(!cardKey)return state();
   if(selected!==null){clearTimer();finishPending();phase='question'}
   else phase=phase==='question'?'answer':'question';
   onUpdate(state());return state();
  }
  function choose(grade){
   if(!cardKey||!valid(grade))return false;
   clearTimer();selected=grade;phase='answer';onUpdate(state());
   const startedKey=cardKey,epoch=token;
   timer=schedule(()=>{
    if(epoch!==token||startedKey!==cardKey||selected!==grade)return;
    timer=null;finishPending();onAdvance(grade,startedKey);
   },DEFAULT_SHOW_MS[grade]);
   return true;
  }
  function navigate(key){
   clearTimer();finishPending();
   if(typeof key!=='string'||!key)throw Error('SCENE500_READONLY_KU_REQUIRED');
   cardKey=key;selected=null;phase='question';onUpdate(state());return state();
  }
  function cancel(){clearTimer();selected=null;cardKey=null;phase='question';onUpdate(state())}
  return Object.freeze({start,tap,choose,navigate,cancel,state});
 }
 function createReadOnlyAutoBrowse({shouldRun,isBusy,navigate,onState,
  schedule=(fn,ms)=>setTimeout(fn,ms),unschedule=id=>clearTimeout(id)}={}){
  if([shouldRun,isBusy,navigate,onState].some(fn=>typeof fn!=='function'))
   throw Error('SCENE500_READONLY_AUTO_CALLBACK_REQUIRED');
  const speeds=Object.freeze([200,600,2000,5000]);
  let enabled=false,delay=2000,timer=null,generation=0;
  const clear=()=>{generation++;if(timer!==null){unschedule(timer);timer=null}};
  function stop(){clear();enabled=false;onState(false)}
  function next(){
   if(!enabled||!shouldRun()){stop();return}
   const epoch=generation;
   // Match native Scene500: speech and pending correction have priority;
   // start the navigation gap after they finish, never interrupt them.
   if(isBusy()){
    timer=schedule(()=>{timer=null;if(epoch===generation)next()},120);
    return;
   }
   timer=schedule(()=>{
    timer=null;
    if(epoch!==generation||!enabled)return;
    if(!shouldRun()){stop();return}
    if(isBusy()){next();return}
    if(navigate()===false){stop();return}
    next();
   },delay);
  }
  function start(){clear();enabled=true;onState(true);next()}
  function restart(){if(enabled)start()}
  function setDelay(ms){const n=Number(ms);if(!speeds.includes(n))return false;delay=n;restart();return true}
  return Object.freeze({start,stop,restart,setDelay,isEnabled:()=>enabled,getDelay:()=>delay});
 }
 root.PAI_SCENE500_READONLY_PHASE=Object.freeze({createReadOnlyPhaseController,createReadOnlyAutoBrowse,DEFAULT_SHOW_MS});
})(typeof window!=='undefined'?window:globalThis);
