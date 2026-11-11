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
 root.PAI_SCENE500_READONLY_PHASE=Object.freeze({createReadOnlyPhaseController,DEFAULT_SHOW_MS});
})(typeof window!=='undefined'?window:globalThis);
