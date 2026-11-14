/* Execute the actual Scene1341 speaker and visibility handlers in a single VM.
 * Safari may background before speech cancellation delivers its stale onend.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script);
const speakerStart=script.indexOf("$('speak').addEventListener('click',e=>{");
const speakerEnd=script.indexOf('\nfunction playCurrentExample()',speakerStart);
const visibilityStart=script.indexOf("document.addEventListener('visibilitychange',()=>{");
const visibilityEnd=script.indexOf("\ndocument.addEventListener('keydown'",visibilityStart);
assert(speakerStart>=0&&speakerEnd>speakerStart&&visibilityStart>=0&&visibilityEnd>visibilityStart);
const listeners={};let phase='example',speeches=[],paused=0,resumed=0,stopped=0,suspended=0;
const doc={hidden:false,addEventListener:(type,fn)=>{listeners['document:'+type]=fn}};
const ctx={
 $:id=>({hidden:false,addEventListener:(type,fn)=>{listeners[id+':'+type]=fn}}),
 document:doc,
 phaseController:{
  state:()=>({phase,selected:null}),
  exampleFinished:()=>{phase='answer';return true},
  suspend:()=>{suspended++}
 },
 autoBrowse:{pause:()=>{paused++},resumeAfterSpeech:()=>{resumed++},resume:()=>{resumed++}},
 subset:()=>[{expression:'wake up'}],index:0,
 playWord:(word,rate,onDone)=>{speeches.push({word,rate,onDone});return true},
 stopWordAudio:()=>{stopped++},
 window:{PAI_SCRATCH_FINISH_RATING:()=>{throw Error('not a graded answer')}}
};
vm.runInNewContext("let exampleToWordPending=false;\n"+script.slice(speakerStart,speakerEnd)+
 "\n"+script.slice(visibilityStart,visibilityEnd)+
 "\nthis.pending=()=>exampleToWordPending;",ctx);
listeners['speak:click']({stopPropagation(){}});
assert.equal(phase,'answer');
assert.equal(ctx.pending(),true);
assert.equal(speeches.length,1);
assert.equal(speeches[0].word,'wake up');
const stale=speeches[0].onDone;
doc.hidden=true;listeners['document:visibilitychange']();
assert.equal(ctx.pending(),false,'background clears speaker takeover');
assert.equal(stopped,1);
assert.equal(suspended,1);
const before=resumed;
stale();
assert.equal(resumed,before,'stale onend must never rearm auto in background');
doc.hidden=false;listeners['document:visibilitychange']();
assert.equal(resumed,before+1,'foreground resumes via one explicit lifecycle event');
// Subsequent manual speaker with no example ownership cannot resume auto
// merely because the earlier example takeover was interrupted.
listeners['speak:click']({stopPropagation(){}});
assert.equal(ctx.pending(),false);
speeches.at(-1).onDone();
assert.equal(resumed,before+1);
console.log(JSON.stringify({status:'PASS',cases:6,source:'real speaker and visibility handlers',srsWrites:0}));
