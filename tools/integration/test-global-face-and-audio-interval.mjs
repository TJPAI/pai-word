import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
assert(s.includes("let preferredPageState='QUESTION';let pageState='QUESTION'"));
assert(s.includes('preferredPageState=pageState;syncPage()'),'blank tap updates global preference');
assert(s.includes('function resetPage(){pageState=preferredPageState;syncPage()}'),'new scene inherits preferred face');
assert(s.includes("wasRevealed=window.PAI_PREFERRED_CARD_FACE?.()==='ANSWER'"),'next word inherits preferred face');
assert(s.includes("originalFace=window.PAI_PREFERRED_CARD_FACE?.()==='ANSWER'"),'next batch inherits preferred face');
assert(s.includes('isActive(){return activeSpeech}'),'speech state available to scheduler');
const auto=s.slice(s.indexOf('function scheduleAutoBrowse(speechEnded=false){'),s.indexOf('let autoWakeLock='));
assert(auto.indexOf('window.PAI_AUDIO?.isActive?.()')>=0);
assert(auto.indexOf('window.PAI_AUDIO.whenIdle(')>auto.indexOf('window.PAI_AUDIO?.isActive?.()'));
assert(auto.indexOf('autoBrowseTimer=setTimeout')>auto.indexOf('window.PAI_AUDIO.whenIdle('));
assert(auto.includes('if(generation===autoBrowseGeneration)scheduleAutoBrowse(true);'));
assert(s.includes('if(autoAudioUnsubscribe){autoAudioUnsubscribe();autoAudioUnsubscribe=null}'));

assert(s.includes("const autoEntrySpeech=state.autoPronounce[window.PAI_PREFERRED_CARD_FACE?.()==='ANSWER'?'swipe':'question']"),'scene entry must use preferred face audio setting');
assert(s.includes('if(gestureSpeech&&autoEntrySpeech&&u.w?.w)'),'gesture speech follows preferred face');
assert(s.includes('if(!gestureSpeech&&autoEntrySpeech)speak(u.w.w)'),'deferred scene-entry speech follows preferred face');
assert(auto.includes('if(autoBrowseTimer!==null)return;'),'prevent duplicate automatic timers');

const autoIntervalDecl=s.match(/const autoInterval=\(speechEnded=false\)=>\{[^\n]+\};/);
assert(autoIntervalDecl,'dual interval mapping present');
const vm=await import('node:vm');
for(const [tier,spokenMs,silentMs] of [[0.9,200,900],[1.5,600,1500],[3,2000,3000],[6,5000,6000]]){
  const context={state:{autoBrowseInterval:tier},Math,Number};
  const result=vm.runInNewContext(autoIntervalDecl[0]+'[autoInterval(true),autoInterval(false)]',context);
  assert.deepEqual(Array.from(result),[spokenMs,silentMs],'interval tier '+tier);
}
assert(auto.includes('scheduleAutoBrowse(true);'),'speech completion chooses speech-ended interval');
assert(auto.includes('autoInterval(speechEnded)'),'scheduler must use selected interval mode');
assert(auto.includes('if(window.PAI_AUDIO?.isActive?.()){scheduleAutoBrowse();return;}'),'late/manual speech must block navigation and restart from speech end');
assert(auto.indexOf('if(window.PAI_AUDIO?.isActive?.()){scheduleAutoBrowse();return;}')<auto.indexOf('window.PAI_NAVIGATE_LEARNING(1,\'auto\')'),'audio guard must precede auto navigation');
console.log('PASS global card-face preference and speech-ended interval invariants');
