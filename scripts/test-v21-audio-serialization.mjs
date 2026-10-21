import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the actual speech-controller source, not a reimplementation.
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const start=source.indexOf('let audioGeneration=0');
const end=source.indexOf('window.speak=',start);
assert(start>=0&&end>start,'speech controller not found');
const speechBlock=source.slice(start,end);
const spoken=[];
let active=null;
const synth={
 speaking:false,pending:false,paused:false,
 getVoices(){return [{lang:'en-US'}]},
 addEventListener(){},
 cancel(){this.speaking=false;this.pending=false;if(active){const old=active;active=null;old.onend?.()}},
 speak(u){active=u;this.speaking=true;spoken.push(u.text)}
};
class Utterance{constructor(text){this.text=text}}
const window={speechSynthesis:synth,SpeechSynthesisUtterance:Utterance};
let watchdogId=0;const watchdogs=new Map();
const context={window,speechSynthesis:synth,SpeechSynthesisUtterance:Utterance,
 state:{voiceAccent:'us',speechSpeed:100},refreshVoices:()=>{},speechVoices:[{lang:'en-US'}],
 console,Set,Math,setTimeout:(fn,ms)=>{const id=++watchdogId;watchdogs.set(id,{fn,ms});return id},clearTimeout:id=>watchdogs.delete(id)};
vm.createContext(context);
vm.runInContext(speechBlock,context);
const audio=window.PAI_AUDIO;
audio.play('previous');
let idle=0;
audio.whenIdle(()=>idle++);
audio.play('replacement');
assert.equal(idle,0,'replacing an utterance must not awaken rating while new speech starts');
assert.deepEqual(spoken,['previous','replacement']);
assert.equal(synth.speaking,true);
active.onend();
assert.equal(idle,1,'rating can begin only when replacement speech finishes');
audio.play('manual');
let stopped=0;
audio.whenIdle(()=>stopped++);
audio.stop();
assert.equal(stopped,1,'explicit stop must release waiting callbacks');
assert.equal(watchdogs.size,0,'stopped utterances must clear watchdogs');
// Safari may never fire onend/onerror. The watchdog must release waiters exactly once.
audio.play('stuck');
let timedOut=0;
audio.whenIdle(()=>timedOut++);
assert.equal(watchdogs.size,1,'one active speech watchdog expected');
const watchdog=[...watchdogs.values()][0].fn;
watchdog();
assert.equal(timedOut,1,'watchdog must release the pending rating');
assert.equal(watchdogs.size,0,'watchdog must clean up');
active?.onend?.();
assert.equal(timedOut,1,'late speech event must not trigger a second completion');
// A delayed callback from a replaced utterance must not complete the new one.
audio.play('old-utterance');
const oldUtterance=active;
const oldWatchdog=[...watchdogs.values()][0].fn;
let replacementIdle=0;
audio.whenIdle(()=>replacementIdle++);
audio.play('new-utterance');
oldUtterance.onend();
oldUtterance.onerror();
oldWatchdog();
assert.equal(replacementIdle,0,'stale speech callbacks cannot release new speech');
assert.equal(watchdogs.size,1,'new utterance watchdog must remain active');
active.onend();
assert.equal(replacementIdle,1,'new utterance must release waiters once');
assert.equal(watchdogs.size,0);
console.log('PASS: replacement does not trigger premature rating speech, natural finish and stop and watchdog release waiters');
