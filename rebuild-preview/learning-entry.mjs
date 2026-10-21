// Lightweight-home boundary: one and only one engine initialization on first learning intent.
// The existing learning engine remains authoritative; this module never reads/writes SRS.
export function createLearningEntry({load,open,onError=()=>{}}){
 let pending=null,ready=false,entering=null;
 if(typeof load!=='function'||typeof open!=='function')throw Error('LEARNING_ENTRY_DEPENDENCIES');
 const preload=()=>{
   if(ready)return Promise.resolve();
   if(!pending)pending=Promise.resolve().then(load).then(()=>{ready=true}).catch(err=>{pending=null;onError(err);throw err});
   return pending;
  };
 return {
  isReady:()=>ready,
  preload,
  enter:(scene,difficulty='all')=>{
   if(!scene||typeof scene!=='string')return Promise.reject(Error('LEARNING_SCENE_REQUIRED'));
   if(entering)return entering;
   entering=preload().then(()=>open(scene,difficulty)).finally(()=>{entering=null});
   return entering;
  }
 };
}
