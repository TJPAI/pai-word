/* Directly run native Scene500 learning() HTML template from learning-runtime.js.
 * MOCK MEMORY ONLY: no PAI_CORE registry or SRS writes; does not activate
 * any quarantined Scene1341 KU. Tests markup, not Safari pixels.
 */
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const start=source.indexOf(' function learning(){');
const stop=source.indexOf('\n let query=',start);
if(start<0||stop<start||stop-start<4000||stop-start>7000)
 throw Error('SCENE500_LEARNING_TEMPLATE_CHANGED');
const native=source.slice(start,stop);
const escape=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const NATIVE_SCENE500_CARD_SOURCE='learning-runtime.js:learning()';
export function renderNativeScene500Card({face='QUESTION',browsed=false,committing=false,auto=false,wordsPerRound=10,unit=null}={}){
 const ku=unit||{k:'NATIVE_TEST_001',w:{w:'wake up',ipaUS:'',rank:1},s:{kuType:'sense',ku_id:'NATIVE_TEST_001',m:'醒来',e:['I wake up.'],c:'wake up early',x:'',example_zh:''}};
 const u={...ku,w:{...ku.w},s:{...ku.s}};
 const state={
   learningSession:{title:'Scene500 原生测试',total:1,completed:[],queue:[u.k],kind:'scene',scene500SceneId:'SC50-0001',seen:{},attempts:0},
   records:{},selectedScene:'SC50-0001',wordsPerRound,
   hideWord:false,revealed:face==='ANSWER',autoBrowseEnabled:auto,autoPronounce:{question:false,swipe:false}
 };
 const map=new Map([[u.k,u]]);
 const context={
   state,window:{PAI_CORE:{byKU:map}},TOPIC_BATCH_SIZE:10,
   browsedUnit:browsed?u:null,unit:()=>u,allUnits:()=>[u],
   sceneBrowseKeys:()=>[u.k],
   loading:false,error:'',
   top:(title,progress)=>'<div class="study-top">'+escape(title)+' '+escape(progress)+'</div>',
   home:()=>'',esc:escape,
   answerHtml:card=>'<section class="answer" data-ku="'+escape(card.k)+'">答案</section>',
   PAI_TAP_FLOW:{
      selectedGradeFor:()=>null,
      snapshot:()=>({phase:committing?'committing':'question'}),
      hint:()=>face==='ANSWER'?'点空白回题目':'点空白看答案'
   },
   console
 };
 vm.runInNewContext(native+'\nwindow.__card=learning()',context,{timeout:1200,filename:'native-learning-card'});
 return context.window.__card;
}
