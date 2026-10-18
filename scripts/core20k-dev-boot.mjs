// Development-only Core20K boot option. ?core20k=1; falls back to existing catalog on any error.
export async function tryInstallCore20K({url='data/core20k-runtime.json.gz',fetcher=fetch}={}){
  const response=await fetcher(url,{cache:'no-store'});
  if(!response.ok)throw Error('CORE20K_DATA_HTTP_'+response.status);
  const buffer=await response.arrayBuffer();
  let raw;
  if(typeof DecompressionStream!=='undefined')raw=await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  else if(window.pako?.ungzip)raw=new TextDecoder().decode(window.pako.ungzip(new Uint8Array(buffer)));
  else throw Error('CORE20K_GZIP_NOT_SUPPORTED');
  const {buildCore20KRuntime}=await import('./core20k-unified-runtime-adapter.mjs');
  const core=buildCore20KRuntime(JSON.parse(raw));
  if(core.qa.words!==20000||core.qa.activeKU<16000||core.qa.playableSense<12000)throw Error('CORE20K_INCOMPLETE_DATA');
  const previous=window.PAI_CORE;
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
  }catch(error){window.PAI_CORE=previous;throw error}
}
