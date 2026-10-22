// Development-only Core20K boot option. ?core20k=1; falls back to existing catalog on any error.
// Disposable Core20K text cache. Separate database; never shares KU/SRS/settings/home stores.
const CACHE_DB='pai-word-core20k-text-cache-v1';
const CACHE_KEY='core20k-runtime-json-v1';
async function cacheText(operation,value){
 if(!globalThis.indexedDB)return null;
 return new Promise(resolve=>{
  let settled=false;const finish=v=>{if(!settled){settled=true;resolve(v)}};
  try{
   const req=indexedDB.open(CACHE_DB,1);
   req.onupgradeneeded=()=>req.result.createObjectStore('assets');
   req.onerror=()=>finish(null);
   req.onblocked=()=>finish(null);
   req.onsuccess=()=>{
    const db=req.result;
    try{
     const tx=db.transaction('assets',operation==='read'?'readonly':'readwrite');
     const store=tx.objectStore('assets');
     if(operation==='read'){
      const get=store.get(CACHE_KEY);get.onsuccess=()=>finish(get.result||null);get.onerror=()=>finish(null);
     }else{store.put(value,CACHE_KEY)}
     tx.addEventListener('complete',()=>{db.close();if(operation==='write')finish(true)},{once:true});
     tx.addEventListener('abort',()=>{db.close();finish(null)},{once:true});
    }catch{db.close();finish(null)}
   };
  }catch{finish(null)}
 });
}
export async function tryInstallCore20K({url='data/core20k-runtime.json.gz',fetcher=fetch}={}){
  const started=performance.now();
  const timing={};
  const mark=label=>{timing[label]=Math.round(performance.now()-started);window.PAI_CORE20K_LOAD_TIMINGS={...timing}};
  // Fetch the runtime adapter concurrently with the compressed lexicon.
  const adapterReady=import('./core20k-unified-runtime-adapter.mjs');
  const {buildCore20KRuntime}=await adapterReady;
  // Cache identity includes the asset URL and a release marker. Bump the app VERSION
  // or set PAI_CORE20K_ASSET_VERSION whenever the underlying gz changes.
  const identity=String(new URL(url,document.baseURI).href)+'|'+String(window.PAI_CORE20K_ASSET_VERSION||window.PAI_APP_VERSION||'');
  let core=null,raw=null,fromCache=false;
  try{
   const saved=await cacheText('read');
   if(saved?.identity===identity&&typeof saved.raw==='string'){
    const candidate=buildCore20KRuntime(JSON.parse(saved.raw));
    if(candidate.qa.words===20000&&candidate.qa.activeKU>=16000&&candidate.qa.playableSense>=12000){core=candidate;fromCache=true;mark('cacheHit')}
   }
  }catch(error){console.warn('Core20K cache invalid; fetching canonical asset',error)}
  if(!core){
   const response=await fetcher(url,{cache:'default'});
   if(!response.ok)throw Error('CORE20K_DATA_HTTP_'+response.status);
   const buffer=await response.arrayBuffer();mark('download');
   if(typeof DecompressionStream!=='undefined')raw=await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
   else if(typeof window.PAI_ENSURE_PAKO==='function'){await window.PAI_ENSURE_PAKO();raw=new TextDecoder().decode(window.pako.ungzip(new Uint8Array(buffer)))}
   else if(window.pako?.ungzip)raw=new TextDecoder().decode(window.pako.ungzip(new Uint8Array(buffer)));
   else throw Error('CORE20K_GZIP_NOT_SUPPORTED');
   mark('decompressed');
   core=buildCore20KRuntime(JSON.parse(raw));mark('indexed');
  }
  if(core.qa.words!==20000||core.qa.activeKU<16000||core.qa.playableSense<12000)throw Error('CORE20K_INCOMPLETE_DATA');
  window.PAI_CORE20K_CACHE_STATUS=fromCache?'hit':'miss';
  // Non-blocking best-effort write only after full validation.
  if(!fromCache&&raw)void cacheText('write',{identity,raw}).catch(()=>{});
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
