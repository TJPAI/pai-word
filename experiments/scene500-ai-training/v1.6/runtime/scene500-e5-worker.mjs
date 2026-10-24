let pipeline=null,env=null,extractorPromise=null,modelLoadMs=null;
self.addEventListener('error',event=>{try{self.postMessage({type:'fatal',error:String(event.message||'worker error')})}catch{}});
async function loadLibrary(){
 if(pipeline)return;
 const mod=await import('../vendor/transformers.min.js');
 pipeline=mod.pipeline;env=mod.env;
 env.allowRemoteModels=false;env.allowLocalModels=true;
 env.localModelPath=new URL('../models/',import.meta.url).href;
 env.backends.onnx.wasm.wasmPaths=new URL('../vendor/',import.meta.url).href;
}
function getExtractor(){
 if(!extractorPromise){
  const t0=performance.now();
  extractorPromise=loadLibrary().then(()=>pipeline('feature-extraction','multilingual-e5-small',{device:'wasm',dtype:'q8'})).then(ex=>{
   modelLoadMs=Math.round(performance.now()-t0);return ex;
  }).catch(error=>{extractorPromise=null;throw error});
 }
 return extractorPromise;
}
self.onmessage=async event=>{
 const {id,type,text}=event.data||{};
 try{
  if(type!=='warmup'&&type!=='encode')throw Error('Unknown worker message');
  const extractor=await getExtractor();
  if(type==='warmup'){self.postMessage({id,ok:true,modelLoadMs});return}
  if(typeof text!=='string'||!text.startsWith('query: '))throw Error('Expected prefixed query');
  const out=await extractor(text,{pooling:'mean',normalize:true});
  self.postMessage({id,ok:true,vector:Array.from(out.data),modelLoadMs});
 }catch(error){self.postMessage({id,ok:false,error:String(error?.message||error)})}
};
