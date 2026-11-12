/* Executes ORIGINAL Scene500 Web Speech audio code with deterministic mocks.
 * Proves state transitions only, never claims real audible iOS Safari sound.
 */
import fs from 'node:fs';
import vm from 'node:vm';
const s=fs.readFileSync(new URL('../../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const a=s.indexOf('  // Speech\n'),b=s.indexOf('  window.speak=(text,rate=.84)=>',a);
if(a<0||b<a||b-a<2500||b-a>6000)throw Error('NATIVE_AUDIO_SOURCE_CONTRACT_CHANGED');
const native=s.slice(a,b);
export function createNativeScene500AudioProbe({voiceAccent='us',speechSpeed=100,voices=[
 {lang:'en-US',name:'US Voice'},{lang:'en-GB',name:'GB Voice'}
]}={}){
 const timeouts=new Map(),listeners=new Map(),ops=[];let time=20000,nextTimer=1;
 const synth={
  speaking:false,pending:false,paused:false,
  getVoices:()=>voices,
  addEventListener:(name,fn)=>listeners.set('synth:'+name,fn),
  cancel(){ops.push('cancel');this.speaking=false;this.pending=false},
  resume(){ops.push('resume');this.paused=false},
  speak(u){ops.push({type:'speak',text:u.text,lang:u.lang,rate:u.rate,voice:u.voice?.name||null});
   this.speaking=true;this.utterance=u}
 };
 function SpeechSynthesisUtterance(text){this.text=text}
 const state={view:'learning',voiceAccent,speechSpeed};
 const document={hidden:false,addEventListener:(n,fn)=>listeners.set('document:'+n,fn)};
 const window={
   speechSynthesis:synth,
   getVisibleLearningUnit:()=>({k:'NATIVE_TEST_001'})
 };
 const context={state,window,document,speechSynthesis:synth,SpeechSynthesisUtterance,
  Date:{now:()=>time},console,
  setTimeout:(fn,ms)=>{const id=nextTimer++;timeouts.set(id,{fn,ms});return id},
  clearTimeout:id=>timeouts.delete(id)};
 vm.runInNewContext(native,context,{timeout:1000,filename:'Scene500-original-audio'});
 return {
  window,state,document,synth,ops,timeouts,
  tick:ms=>{time+=ms},
  visibility:hidden=>{document.hidden=hidden;listeners.get('document:visibilitychange')?.()},
  fireWatchdog:()=>{const tasks=[...timeouts.values()];timeouts.clear();for(const {fn}of tasks)fn()},
  voicesChanged:()=>listeners.get('synth:voiceschanged')?.()
 };
}
