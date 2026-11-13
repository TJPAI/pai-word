import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const page=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const script=page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script);
const begin=script.indexOf('let wordAudioGeneration=0,wordAudioWatchdog=null,wordAudioActive=false;');
const end=script.indexOf("\n$('speak').addEventListener",begin);
assert(begin>=0&&end>begin,'extract the real speech owner/watchdog controller');
const audioSource=script.slice(begin,end);
const queue=new Map(),spoken=[],events=[];
let seq=0,hidden=false;
const synthesis={
 speaking:false,pending:false,paused:false,
 speak(u){spoken.push(u);this.speaking=true;events.push('speak')},
 cancel(){this.speaking=false;this.pending=false;events.push('cancel')},
 resume(){this.paused=false}
};
const ctx={
 window:{speechSynthesis:synthesis},
 document:{get hidden(){return hidden}},
 SpeechSynthesisUtterance:function(){},
 buildReadOnlyUtterance:text=>({text,rate:.84}),
 setTimeout:(fn,ms)=>{const id=++seq;queue.set(id,{fn,ms});return id},
 clearTimeout:id=>queue.delete(id),
 Math,String,Number
};
vm.runInNewContext(audioSource+'\nthis.play=playWord;this.stop=stopWordAudio;this.state=()=>({generation:wordAudioGeneration,active:wordAudioActive,watchdog:wordAudioWatchdog});',ctx,{timeout:1000});
let firstDone=0,secondDone=0;
assert.equal(ctx.play('wake up',.84,()=>firstDone++),true);
const first=spoken.at(-1),firstTimer=[...queue.values()][0].fn;
assert.equal(ctx.state().active,true);
assert.equal(ctx.play('soon',.84,()=>secondDone++),true);
const second=spoken.at(-1);
assert.equal(events.filter(x=>x==='cancel').length,1);
first.onend();first.onerror();firstTimer();
assert.equal(firstDone,0,'old TTS callbacks and watchdog cannot finish the new card');
assert.equal(secondDone,0);
assert.equal(ctx.state().active,true);
second.onend();second.onerror();
assert.equal(secondDone,1,'duplicate onend/onerror must finish once');
assert.equal(ctx.state().active,false);
assert.equal(queue.size,0,'successful speech must release watchdog');

let canceledDone=0;
ctx.play('the',.84,()=>canceledDone++);
const third=spoken.at(-1),thirdTimer=[...queue.values()][0].fn;
ctx.stop();
third.onend();thirdTimer();
assert.equal(canceledDone,0,'manual swipe/grade cancellation must invalidate old TTS owner');
assert.equal(ctx.state().active,false);
assert.equal(queue.size,0);

let watchdogDone=0;
ctx.play('a',.84,()=>watchdogDone++);
const watchdog=[...queue.entries()][0];
queue.delete(watchdog[0]);watchdog[1].fn();
assert.equal(watchdogDone,1,'Safari stuck TTS watchdog must unblock audio owner once');
assert.equal(ctx.state().active,false);
assert.equal(queue.size,0);
spoken.at(-1).onend();
assert.equal(watchdogDone,1);

hidden=true;
const before=spoken.length;
assert.equal(ctx.play('hidden word',.84),false);
assert.equal(spoken.length,before,'hidden document must never enqueue TTS');

console.log('SC1341_SPEECH_OWNER_STALE_CALLBACK_WATCHDOG_PASS');
