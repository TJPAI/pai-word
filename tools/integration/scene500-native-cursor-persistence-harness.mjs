/* Execute source-exact Scene500 learning cursor storage contract.
 * In-memory localStorage only; no user SRS access or Scene1341 activation.
 * This covers pagehide/background/bookmark integrity, not Safari process kill.
 */
import fs from 'node:fs';
import vm from 'node:vm';
const nativeSource=fs.readFileSync(new URL('../../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const a=nativeSource.indexOf(' const SCENE_CURSORS_KEY=');
const b=nativeSource.indexOf(' const unlearned=',a);
if(a<0||b<a||b-a<1500||b-a>3000)throw Error('SCENE500_CURSOR_SOURCE_CHANGED');
const native=nativeSource.slice(a,b);
export const SCENE500_CURSOR_SOURCE='learning-runtime.js::SCENE_CURSORS_KEY';
export function createScene500NativeCursorProbe({
  storage=new Map(),pathname='/pai-word-preview/v22-integration/',scene='SC50-0001',
  kuId='SCENE500_TEST_KU_001',face='ANSWER'
}={}){
 const reads=[],writes=[],listeners=new Map(),state={
   view:'learning',selectedScene:scene,autoBrowseEnabled:false,
   learningSession:{scene500SceneId:scene,queue:[kuId,'SCENE500_TEST_KU_002'],
     completed:[],title:'Current scene'}
 };
 const cursorStore={
   getItem(key){reads.push(key);return storage.get(key)??null},
   setItem(key,value){writes.push({key,value});storage.set(key,value)}
 };
 const window={addEventListener:(type,callback)=>listeners.set(type,callback)};
 const document={hidden:false,addEventListener:(type,callback)=>listeners.set(type,callback)};
 const context={window,document,state,location:{pathname},localStorage:cursorStore,
   browsedUnit:null,unit:()=>({k:kuId}),PAI_TAP_FLOW:{pageState:()=>face},Date};
 vm.runInNewContext(native+'\nwindow.__nativeCursor={captureLearningCursor,flushLearningCursor,storageKey:SCENE_CURSORS_KEY}',context,
  {timeout:1500,filename:'Scene500-native-cursor'});
 return {
   window,state,storage,reads,writes,listeners,storageKey:window.__nativeCursor.storageKey,
   get:()=>window.PAI_LEARNING_CURSOR(),
   capture:()=>window.__nativeCursor.captureLearningCursor(),
   pagehide:()=>listeners.get('pagehide')?.(),
   background:()=>{document.hidden=true;listeners.get('visibilitychange')?.()},
   foreground:()=>{document.hidden=false;listeners.get('visibilitychange')?.()},
   setFace:value=>{context.PAI_TAP_FLOW.pageState=()=>value},
   setScene:value=>{state.selectedScene=value;state.learningSession.scene500SceneId=value},
   setKU:value=>{context.unit=()=>({k:value})},
   setBrowsed:value=>{context.browsedUnit=value?{k:value}:null}
 };
}
