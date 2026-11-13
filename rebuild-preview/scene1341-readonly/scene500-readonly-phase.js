/* Read-only Scene500 phase adapter based on the ACTIVE
 * rebuild-preview/learning-runtime.js controller (not old tap-flow.js).
 * Never imports durable SRS, records or mutation functions.
 */
(function(root){
 'use strict';
 const DEFAULT_SHOW_MS=Object.freeze({again:6000,hard:4000,good:2000});
 function createReadOnlyPhaseController({onUpdate,onGradeComplete,onAdvance,playRatedWord=null,
  schedule=(fn,ms)=>setTimeout(fn,ms),unschedule=id=>clearTimeout(id)}={}){
  if(typeof onUpdate!=='function'||typeof onGradeComplete!=='function'||typeof onAdvance!=='function')
   throw Error('SCENE500_READONLY_CALLBACK_REQUIRED');
  let phase='question',preferredFace='question',cardKey=null,selected=null,timer=null,repeatTimer=null,audioCancel=null,token=0;
  const valid=grade=>Object.prototype.hasOwnProperty.call(DEFAULT_SHOW_MS,grade);
  const state=()=>Object.freeze({phase,preferredFace,cardKey,selected,revealed:phase==='answer'||phase==='answer-paused'||phase==='example',pending:selected!==null||timer!==null||repeatTimer!==null});
  function clearTimer(){token++;if(timer!==null){unschedule(timer);timer=null}if(repeatTimer!==null){unschedule(repeatTimer);repeatTimer=null}if(typeof audioCancel==='function'){audioCancel();audioCancel=null}}
  function finishPending(){if(selected!==null){const grade=selected;selected=null;onGradeComplete(grade,cardKey)}}
  function start(key){
   if(typeof key!=='string'||!key)throw Error('SCENE500_READONLY_KU_REQUIRED');
   clearTimer();selected=null;cardKey=key;preferredFace='question';phase=preferredFace;onUpdate(state());return state();
  }
  function tap(){
   if(!cardKey)return state();
   if(selected!==null){clearTimer();finishPending();preferredFace='question';phase='question'}
   else{preferredFace=phase==='question'?'answer':'question';phase=preferredFace==='answer'?'answer-paused':'question'}
   onUpdate(state());return state();
  }
  function choose(grade){
   if(!cardKey||!valid(grade))return false;
   clearTimer();selected=grade;phase='answer';onUpdate(state());
   // Consume native Scene500 tap-flow grade plan when the source-exact
   // policy is present; the fallback preserves isolated legacy harnesses.
   const plan=root.PAI_SCENE500_NATIVE_RATING_POLICY?.ratingPlan(grade);
   const startedKey=cardKey,epoch=token,count=plan?.repeatCount??{again:3,hard:2,good:1}[grade];
   const live=()=>epoch===token&&startedKey===cardKey&&selected===grade;
   let elapsed=false,audioDone=typeof playRatedWord!=='function';
   const finish=()=>{if(!live()||!elapsed||!audioDone)return;finishPending();onAdvance(grade,startedKey)};
   timer=schedule(()=>{timer=null;elapsed=true;finish()},plan?.showMs??DEFAULT_SHOW_MS[grade]);
   if(!audioDone){
    let spoken=0;
    const repeat=()=>{
     repeatTimer=null;if(!live())return;
     spoken++;
     let completed=false;
     const done=()=>{
      if(completed||!live())return;completed=true;audioCancel=null;
      if(spoken<count)repeatTimer=schedule(repeat,plan?.repeatGapMs??1000);
      else{audioDone=true;finish()}
     };
     try{audioCancel=playRatedWord(grade,spoken,done)||null}
     catch(_){done()}
    };
    repeat();
   }
   return true;
  }
  function navigate(key){
   clearTimer();finishPending();
   if(typeof key!=='string'||!key)throw Error('SCENE500_READONLY_KU_REQUIRED');
   cardKey=key;selected=null;phase=preferredFace==='answer'?'answer-paused':'question';onUpdate(state());return state();
  }
  // Follow native Scene500's beginExample/exampleFinished phase transition.
  // Example playback invalidates pending rated audio/countdown without scoring.
  function beginExample(){
   if(!cardKey||!['answer','answer-paused','example'].includes(phase))return false;
   clearTimer();selected=null;phase='example';onUpdate(state());return true;
  }
  function exampleFinished(){
   if(phase!=='example')return false;
   phase='answer-paused';onUpdate(state());return true;
  }
  function suspend(){
   // Native Scene500 visibilitychange invalidates rated timers and keeps a
   // revealed answer paused, without committing or navigating in background.
   const wasRevealed=phase==='answer'||phase==='answer-paused'||phase==='example';
   clearTimer();selected=null;
   phase=wasRevealed?'answer-paused':'question';
   onUpdate(state());return state();
  }
  function cancel(){clearTimer();selected=null;cardKey=null;preferredFace='question';phase='question';onUpdate(state())}
  return Object.freeze({start,tap,choose,navigate,beginExample,exampleFinished,suspend,cancel,state});
 }
 function createReadOnlyAutoBrowse({shouldRun,isBusy,isSpeaking=()=>false,navigate,onState,
  schedule=(fn,ms)=>setTimeout(fn,ms),unschedule=id=>clearTimeout(id)}={}){
  if([shouldRun,isBusy,isSpeaking,navigate,onState].some(fn=>typeof fn!=='function'))
   throw Error('SCENE500_READONLY_AUTO_CALLBACK_REQUIRED');
  // EXACT native Scene500 learning-runtime.js timing:
  // normal tier: 0.9 / 1.5 / 3 / 6 sec;
  // once spoken: 0.2 / 0.6 / 2 / 5 sec.
  const postSpeech=Object.freeze({900:200,1500:600,3000:2000,6000:5000});
  let enabled=false,tier=1500,timer=null,generation=0;
  let wakeLock=null,wakeGeneration=0;
  const clear=()=>{generation++;if(timer!==null){unschedule(timer);timer=null}};
  const releaseWake=()=>{
   wakeGeneration++;
   const lock=wakeLock;wakeLock=null;
   if(lock)Promise.resolve().then(()=>lock.release()).catch(()=>{});
  };
  async function syncWake(){
   const epoch=++wakeGeneration;
   if(!enabled||!shouldRun()){releaseWake();return}
   if(wakeLock||typeof navigator==='undefined'||!navigator.wakeLock?.request)return;
   try{
    const lock=await navigator.wakeLock.request('screen');
    if(epoch!==wakeGeneration||!enabled||!shouldRun()){
     try{await lock.release()}catch(_){}
     return;
    }
    wakeLock=lock;
    lock.addEventListener?.('release',()=>{if(wakeLock===lock)wakeLock=null},{once:true});
   }catch(_){/* Unsupported/denied: ordinary foreground auto-browse continues. */}
  }
  function stop(){clear();enabled=false;releaseWake();onState(false)}
  function next(speechEnded=false){
   if(!enabled)return;
   if(!shouldRun()){pause();return}
   const epoch=generation;
   if(isBusy()){
    const spoken=speechEnded||isSpeaking();
    timer=schedule(()=>{timer=null;if(epoch===generation)next(spoken)},120);
    return;
   }
   timer=schedule(()=>{
    timer=null;
    if(epoch!==generation||!enabled)return;
    if(!shouldRun()){pause();return}
    if(isBusy()){next(isSpeaking());return}
    if(navigate()===false){stop();return}
    next();
   },speechEnded?postSpeech[tier]:tier);
  }
  function start(){clear();enabled=true;onState(true);next();void syncWake()}
  function pause(){clear();releaseWake()}
  function resume(){if(enabled){clear();next();void syncWake()}}
  function resumeAfterSpeech(){if(enabled){clear();next(true);void syncWake()}}
  function restart(){if(enabled)start()}
  function setDelay(ms){
   const n=Number(ms);if(!Object.hasOwn(postSpeech,n))return false;
   tier=n;restart();return true
  }
  return Object.freeze({start,stop,pause,resume,resumeAfterSpeech,restart,setDelay,isEnabled:()=>enabled,getDelay:()=>tier});
 }
 root.PAI_SCENE500_READONLY_PHASE=Object.freeze({createReadOnlyPhaseController,createReadOnlyAutoBrowse,DEFAULT_SHOW_MS});
})(typeof window!=='undefined'?window:globalThis);
