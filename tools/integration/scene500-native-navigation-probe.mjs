/* Executes original native Scene500 learning navigation functions unmodified.
 * Read-only, mock in-memory records; never inject Scene1341 into PAI_CORE.
 * Tests actual swipe/auto/batch state transitions, NOT Safari pixels/touch events.
 */
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const a=src.indexOf(' const sceneBrowseKeys=()=>{');
const b=src.indexOf(' // Auto-browse is presentation-only:',a);
if(a<0||b<a||b-a<6000||b-a>10000)throw Error('NATIVE_NAVIGATION_SOURCE_CONTRACT_CHANGED');
const native=src.slice(a,b);
for(const required of ['window.PAI_CHANGE_BATCH=async','window.PAI_NAVIGATE_LEARNING=async','window.browseAnswer=async','const cycleKeys=()=>{']){
  if(!native.includes(required))throw Error('MISSING_NATIVE_NAVIGATION_'+required);
}

export function createNativeScene500NavigationProbe({count=23,batchSize=10,initialIndex=0,face='ANSWER',phase='answer-paused'}={}){
  if(!Number.isInteger(count)||count<2||!Number.isInteger(batchSize)||batchSize<1||
     !Number.isInteger(initialIndex)||initialIndex<0||initialIndex>=count)throw Error('PROBE_INVALID_OPTIONS');
  const units=Array.from({length:count},(_,i)=>{
    const k='NATIVE-TEST-'+String(i+1).padStart(3,'0');
    return {k,sid:k,w:{w:'word'+i,rank:i+1,loaded:true}};
  });
  const byKU=new Map(units.map(u=>[u.k,u]));
  const session={kind:'scene',scene500SceneId:'SC50-0001',queue:[units[initialIndex].k],completed:[]};
  const state={view:'learning',selectedScene:'SC50-0001',scene500DifficultyByScene:{},
    learningSession:session,wordsPerRound:batchSize,autoPronounce:{question:false,swipe:false},
    autoBrowseEnabled:false,revealed:face==='ANSWER'};
  let page=face,phaseNow=phase,events=[],countWrites=0,needsLoad=false;
  const track=x=>events.push(x);
  const window={
    PAI_SAVE_DEFERRED:false,PAI_KU_STORAGE_READY:false,PAI_AUDIO:{stop:()=>track('audioStop')},
    PAI_AUTOBROWSE:{restart:()=>track('restart')},
    PAI_PREFERRED_CARD_FACE:()=>page,
    getVisibleLearningUnit:null,
    PAI_SCRATCH_DRAWING:()=>false
  };
  const PAI_TAP_FLOW={
    snapshot:()=>({phase:phaseNow}),pageState:()=>page,
    commitEarly:()=>{track('commitEarly');return false},
    cancel:()=>track('cancel'),
    browseReady:(_k,_fn,answer)=>{page=answer?'ANSWER':'QUESTION';phaseNow=answer?'answer-paused':'question';state.revealed=answer;track('browseReady')},
  };
  const context={
    window,state,PAI_TAP_FLOW,document:{hidden:false},active:true,loading:false,error:'',
    historicalCommitInProgress:false,historyRetest:false,historyAttemptId:null,token:0,
    browseToken:0,browseIndex:null,browsedUnit:null,
    byKey:k=>byKU.get(k),unit:()=>byKU.get(session.queue[0]),
    allUnits:()=>units,unitKey:(_w,sid)=>sid,ensureUnits:async()=>{needsLoad=true},
    stopAutoBrowse:()=>track('stopAutoBrowse'),captureLearningCursor:()=>track('cursor'),
    render:()=>track('render'),speak:()=>track('speak'),
    Date,console
  };
  vm.runInNewContext(native+'\nwindow.__nativeProbe={cycleKeys,sceneBrowseKeys};',context,{timeout:1500,filename:'Scene500:original-navigation'});
  return {
    window,state,units,events,
    current:()=>window.getVisibleLearningUnit()?.k,
    face:()=>page,
    phase:()=>phaseNow,
    cycleKeys:()=>Array.from(window.__nativeProbe.cycleKeys()),
    sceneKeys:()=>Array.from(window.__nativeProbe.sceneBrowseKeys()),
    setPhase:value=>{phaseNow=value},
    setFace:value=>{page=value;state.revealed=value==='ANSWER'},
    setDocumentHidden:value=>{context.document.hidden=value},
    setWriteDeferred:value=>{window.PAI_SAVE_DEFERRED=value},
    saveCount:()=>countWrites,
    loaded:()=>needsLoad
  };
}
