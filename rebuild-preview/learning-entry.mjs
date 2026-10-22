// Stage-B boundary: serialize initialization and duplicate taps without owning SRS.
export function createLearningEntry({load,open,onError=()=>{}}){
 if(typeof load!=='function'||typeof open!=='function')throw Error('LEARNING_ENTRY_DEPENDENCIES');
 let pending=null,ready=false;
 const openings=new Map();
 const preload=()=>{
  if(ready)return Promise.resolve();
  if(!pending)pending=Promise.resolve().then(load).then(()=>{ready=true}).catch(error=>{
   pending=null;
   onError(error);
   throw error;
  });
  return pending;
 };
 const enter=(scene,difficulty='all')=>{
  if(!scene||typeof scene!=='string')return Promise.reject(Error('LEARNING_SCENE_REQUIRED'));
  const key=JSON.stringify([scene,difficulty]);
  if(openings.has(key))return openings.get(key);
  // Store synchronously so quick successive taps join the same operation.
  const operation=preload().then(()=>open(scene,difficulty));
  openings.set(key,operation);
  // An unsuccessful open must be retryable; a successful one must not block future
  // intentional sessions once the first open has settled.
  operation.finally(()=>{if(openings.get(key)===operation)openings.delete(key)}).catch(()=>{});
  return operation;
 };
 return {isReady:()=>ready,preload,enter};
}
