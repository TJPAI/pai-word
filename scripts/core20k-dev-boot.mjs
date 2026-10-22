// Development-only Core20K boot option. ?core20k=1; falls back to existing catalog on any error.
export async function tryInstallCore20K({url='data/core20k-runtime.json.gz',fetcher=fetch}={}){
  const started=performance.now();
  const timing={};
  const mark=label=>{timing[label]=Math.round(performance.now()-started);window.PAI_CORE20K_LOAD_TIMINGS={...timing}};
  // Fetch the runtime adapter concurrently with the compressed lexicon.
  const adapterReady=import('./core20k-unified-runtime-adapter.mjs');
  const response=await fetcher(url,{cache:'default'});
  if(!response.ok)throw Error('CORE20K_DATA_HTTP_'+response.status);
  const buffer=await response.arrayBuffer();mark('download');
  let raw;
  if(typeof DecompressionStream!=='undefined')raw=await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  else {
   // Safari versions without DecompressionStream use a lazy fallback only when learning starts.
   if(!window.pako?.ungzip){
     window.PAI_CORE20K_PAKO_PROMISE ||= new Promise((resolve,reject)=>{
       const script=document.createElement('script');
       script.src='https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako_inflate.min.js';
       script.onload=()=>window.pako?.ungzip?resolve(window.pako):reject(Error('CORE20K_GZIP_FALLBACK_MISSING'));
       script.onerror=()=>reject(Error('CORE20K_GZIP_FALLBACK_NETWORK'));
       document.head.appendChild(script);
     }).catch(error=>{window.PAI_CORE20K_PAKO_PROMISE=null;throw error});
     await window.PAI_CORE20K_PAKO_PROMISE;
   }
   raw=new TextDecoder().decode(window.pako.ungzip(new Uint8Array(buffer)));
  }
  mark('decompressed');
  const {buildCore20KRuntime}=await adapterReady;
  const core=buildCore20KRuntime(JSON.parse(raw));mark('indexed');
  if(core.qa.words!==20000||core.qa.activeKU<16000||core.qa.playableSense<12000)throw Error('CORE20K_INCOMPLETE_DATA');
  const previous=window.PAI_CORE, previousWords=[...WORDS], previousScenes={...SCENES};
  const previousEnsure=window.ensureUnits, previousOffline=window.downloadOfflineLexicon;
  const previousStatus=window.PAI_LOCAL_LEXICON, previousQA=window.PAI_CORE_QA;
  try{
    for(const k of Object.keys(SCENES))delete SCENES[k];
    SCENES.daily='每日学习';
    window.PAI_CORE=core;
    WORDS.splice(0,WORDS.length,...core.words);
    window.ensureUnits=async()=>{};
    window.downloadOfflineLexicon=async()=>{};
    window.PAI_LOCAL_LEXICON={supported:true,offlineReady:true,shellReady:false,loadedChunks:1,totalChunks:1,release:'Core20K-dev'};
    window.PAI_CORE_QA={release:'Core20K-dev',words:core.qa.words,units:core.qa.activeKU,playable:core.qa.playableSense};
    return core;
  }catch(error){
    window.PAI_CORE=previous;WORDS.splice(0,WORDS.length,...previousWords);
    for(const k of Object.keys(SCENES))delete SCENES[k];Object.assign(SCENES,previousScenes);
    window.ensureUnits=previousEnsure;window.downloadOfflineLexicon=previousOffline;
    window.PAI_LOCAL_LEXICON=previousStatus;window.PAI_CORE_QA=previousQA;
    throw error;
  }
}
