// Lightweight-home boundary: one and only one engine initialization on first learning intent.
// The existing learning engine remains authoritative; this module never reads/writes SRS.
let pending=null,ready=false;
export function createLearningEntry({load,open,onError=()=>{}}){
 if(typeof load!=='function'||typeof open!=='function')throw Error('LEARNING_ENTRY_DEPENDENCIES');
 const preload=()=>{
   if(ready)return Promise.resolve();
   if(!pending)pending=Promise.resolve().then(load).then(()=>{ready=true}).catch(err=>{pending=null;onError(err);throw err});
   return pending;
  };
 return {
  isReady:()=>ready,
  preload,
  enter:async (scene,difficulty='all')=>{
   if(!scene||typeof scene!=='string')throw Error('LEARNING_SCENE_REQUIRED');
   // Do not alter any scene history or user record before the engine is ready.
   // Use shared promise for simultaneous taps; open only after successful load.
   await preload();
   return open(scene,difficulty);
  }
 };
}
