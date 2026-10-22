// Load a searchable KU inventory first; hydrate only the requested 250-word chunks.
(function(){
 const ROOT='data/learning-v3/',VERSION='learning-v3.1';let manifest,dbPromise;
 const status=window.PAI_LOCAL_LEXICON={supported:'indexedDB' in window,offlineReady:false,shellReady:false,loadedChunks:0,totalChunks:52};
 function db(){return dbPromise||(dbPromise=new Promise(resolve=>{if(!status.supported)return resolve(null);const r=indexedDB.open('pai-word-lazy-v3',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets');r.onsuccess=()=>resolve(r.result);r.onerror=()=>{status.supported=false;resolve(null)}}))}
 async function cached(key,value){const d=await db();if(!d)return null;return new Promise(resolve=>{const t=d.transaction('assets',value===undefined?'readonly':'readwrite'),s=t.objectStore('assets');if(value===undefined){const r=s.get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)}else{s.put(value,key);t.oncomplete=()=>resolve(true);t.onerror=()=>resolve(null)}})}
 const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
 async function gunzip(bytes){
  if(typeof DecompressionStream!=='undefined')return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  if(typeof window.PAI_ENSURE_PAKO==='function'){await window.PAI_ENSURE_PAKO();return window.pako.ungzip(bytes)};
  if(window.pako&&typeof window.pako.ungzip==='function')return window.pako.ungzip(bytes);
  throw Error('当前浏览器缺少 gzip 解压能力，请更新 Safari 或使用 Chrome');
 }
 async function asset(a){let text=await cached(a.sha256);if(!text||text.length!==a.bytes||await digest(text)!==a.sha256){const r=await fetch(ROOT+a.file);if(!r.ok)throw Error('词包未下载，请联网后重试');text=await r.text();if(text.length!==a.bytes||await digest(text)!==a.sha256)throw Error('词包校验失败');await cached(a.sha256,text)}const bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));const raw=await gunzip(bytes);if(raw.byteLength!==a.rawBytes)throw Error('词包结构错误');return JSON.parse(new TextDecoder().decode(raw))}
 const loaded=new Set(),stored=new Set(),pending=new Map();
 async function chunk(i){if(loaded.has(i))return;if(pending.has(i))return pending.get(i);const p=(async()=>{const rows=await asset(manifest.chunks[i]);for(const full of rows){const w=window.PAI_CORE.words[full.rank-1];if(!w||w.w!==full.w)throw Error('词包索引不一致');for(const [k,s] of Object.entries(full.s)){Object.assign(w.s[k],s);const u=window.PAI_CORE.byKU.get(k);if(full.rich[k])u.kuContent=full.rich[k]}Object.assign(w,{ipa:full.ipaUS,ipaUS:full.ipaUS,ipaUK:full.ipaUK,root:full.root,allSenses:full.allSenses,loaded:true})}loaded.add(i);stored.add(i);await cached('stored-'+VERSION,[...stored]);status.loadedChunks=stored.size;status.offlineReady=stored.size===manifest.chunks.length;window.dispatchEvent(new CustomEvent('pai-offline-status'))})().finally(()=>pending.delete(i));pending.set(i,p);return p}
 window.ensureUnits=async keys=>{const chunks=new Set(keys.map(k=>window.PAI_CORE.byKU.get(k)).filter(Boolean).map(u=>Math.floor((u.w.rank-1)/manifest.chunkSize)));await Promise.all([...chunks].map(chunk))};
 window.downloadOfflineLexicon=async()=>{status.downloading=true;status.error=null;window.dispatchEvent(new CustomEvent('pai-offline-status'));try{for(let i=0;i<manifest.chunks.length;i++)await chunk(i)}catch(e){status.error=e.message}finally{status.downloading=false;window.dispatchEvent(new CustomEvent('pai-offline-status'))}};
 window.loadLearningCatalog=async()=>{
  manifest=await cached('manifest-'+VERSION);if(!manifest){const r=await fetch(ROOT+'manifest.json');if(!r.ok)throw Error('目录加载失败');manifest=await r.json();if(manifest.release!==VERSION)throw Error('目录版本不一致');await cached('manifest-'+VERSION,manifest)}
  for(const i of (await cached('stored-'+VERSION)||[]))stored.add(i);status.loadedChunks=stored.size;status.offlineReady=stored.size===manifest.chunks.length;const rows=await asset(manifest.catalog);if(rows.length!==13000)throw Error('目录词数不符');
  for(const k of Object.keys(SCENES))delete SCENES[k];Object.assign(SCENES,manifest.scenes);
  const core={words:[],byKU:new Map(),byScene:new Map(Object.keys(SCENES).map(k=>[k,[]])),byLemma:new Map()};
  rows.forEach(([rank,lemma,pos,senses],i)=>{if(rank!==i+1)throw Error('目录词序错误');const w={rank,w:lemma,pos,s:{},ipa:'',loaded:false};for(const [k,scene,kuType,kuTitle,sp,m]of senses){if(core.byKU.has(k))throw Error('重复 KU');const s={ku_id:k,scene,kuType,kuTitle,pos:sp,m,e:[],c:'',x:''};w.s[k]=s;const u={w,sid:k,k,s};core.byKU.set(k,u);core.byScene.get(scene).push(u)}core.words.push(w);core.byLemma.set(lemma,[...(core.byLemma.get(lemma)||[]),w])});
  if(core.byKU.size!==16616)throw Error('目录 KU 数错误');window.PAI_CORE=core;WORDS.splice(0,WORDS.length,...core.words);
  // Preserve legacy data and all canonical progress; never drop unrecognized records.
  if(state.srsSchema!=='ku_id-v2'){const key=STORAGE+'::before-learning-v3';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));state.legacySrsPending=state.legacySrsPending||{};for(const[k,r]of Object.entries(state.records)){if(!core.byKU.has(k)){state.legacySrsPending[k]={record:r,reason:'requires_identity_review'};delete state.records[k]}}state.srsSchema='ku_id-v2'}
  window.PAI_CORE_QA={release:VERSION,words:core.words.length,units:core.byKU.size};state.voiceAccent='us';save();return core;
 };
})();

// Development-only 20K switch. No effect without ?core20k=1.
if((window.PAI_CORE20K_ROOT===true||new URLSearchParams(location.search).get('core20k')==='1')){
 const legacyLoad=window.loadLearningCatalog;
 window.loadLearningCatalog=async function(){
  try{
   const {tryInstallCore20K}=await import('./scripts/core20k-dev-boot.mjs');
   const core=await tryInstallCore20K();
   window.PAI_CORE20K_BOOT={ok:true,words:core.qa.words};
   return core;
  }catch(error){
   window.PAI_CORE20K_BOOT={ok:false,error:String(error?.message||error)};
   throw Error('Core20K test loading failed: '+String(error?.message||error));
  }
 };
}
