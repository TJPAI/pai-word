// PAI Word manifest-driven lexicon loader. Catalog first; hydrate only requested KU chunks.
(function(){
 const ROOT='data/learning-v3/';
 let manifest,dbPromise,chunkByFile=new Map();
 const status=window.PAI_LOCAL_LEXICON={supported:'indexedDB' in window,offlineReady:false,shellReady:false,loadedChunks:0,totalChunks:0,release:null};
 function db(){return dbPromise||(dbPromise=new Promise(resolve=>{if(!status.supported)return resolve(null);const r=indexedDB.open('pai-word-lexicon-cache-v4',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets');r.onsuccess=()=>resolve(r.result);r.onerror=()=>{status.supported=false;resolve(null)}}))}
 async function cached(key,value){const d=await db();if(!d)return null;return new Promise(resolve=>{const t=d.transaction('assets',value===undefined?'readonly':'readwrite'),s=t.objectStore('assets');if(value===undefined){const r=s.get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)}else{s.put(value,key);t.oncomplete=()=>resolve(true);t.onerror=()=>resolve(null)}})}
 const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
 const validManifest=m=>m&&typeof m.release==='string'&&Number.isInteger(m.wordCount)&&Number.isInteger(m.kuCount)&&m.taxonomy&&m.taxonomy.majors&&m.taxonomy.minors&&Array.isArray(m.chunks)&&m.catalog;
 async function loadManifest(){
  let fresh=null;
  try{const r=await fetch(ROOT+'manifest.json',{cache:'no-cache'});if(r.ok){fresh=await r.json();if(!validManifest(fresh))throw Error('manifest 结构不符');await cached('manifest:last',fresh);await cached('manifest:'+fresh.release,fresh)}}catch(e){console.warn('[PAI lexicon] manifest network fallback',e)}
  const m=fresh||await cached('manifest:last');if(!validManifest(m))throw Error('目录加载失败');return m;
 }
 async function asset(a){
  const cacheKey='asset:'+a.sha256;let text=await cached(cacheKey);
  if(typeof text!=='string'||text.length!==a.bytes||await digest(text)!==a.sha256){const r=await fetch(ROOT+a.file);if(!r.ok)throw Error(a.file+' 未下载，请联网后重试');text=(await r.text()).trim();if(text.length!==a.bytes||await digest(text)!==a.sha256)throw Error(a.file+' 校验失败');await cached(cacheKey,text)}
  const bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));const raw=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();if(raw.byteLength!==a.rawBytes)throw Error(a.file+' 解压大小不符');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
 }
 const loaded=new Set(),stored=new Set(),pending=new Map();
 function updateWordLoaded(w){w.loaded=Object.values(w.s).every(s=>s.__loaded===true)}
 async function chunk(file){
  if(loaded.has(file))return;if(pending.has(file))return pending.get(file);const meta=chunkByFile.get(file);if(!meta)throw Error('manifest 中找不到分包：'+file);
  const p=(async()=>{const rows=await asset(meta);let kus=0;for(const full of rows){const ku=full.ku||{},k=ku.ku_id,u=window.PAI_CORE.byKU.get(k);if(!u)throw Error('分包包含目录外 KU：'+k);if(u.w.rank!==full.rank||u.w.w!==full.w)throw Error('词包索引不一致：'+k);if(u.chunkFile!==file)throw Error('KU 分包索引不一致：'+k);const s=u.s;Object.assign(s,ku,{ku_id:k,scene:u.owner,lexiconScene:ku.scene||null,track:ku.track||null,e:Array.isArray(ku.e)?ku.e.filter(Boolean):[],c:ku.c||'',x:ku.x||'',exampleAudio:(ku.e||[]).map(e=>String(e).split('\n')[0]).filter(Boolean),__loaded:true});Object.assign(u.w,{ipaUS:full.ipaUS||u.w.ipaUS||'',ipaUK:full.ipaUK||u.w.ipaUK||''});u.w.ipa=u.w.ipaUS||u.w.ipaUK||'';updateWordLoaded(u.w);kus++}if(kus!==meta.kus)throw Error(file+' KU 数不符');loaded.add(file);stored.add(file);await cached('stored:'+manifest.release,[...stored]);status.loadedChunks=stored.size;status.offlineReady=stored.size===manifest.chunks.length;window.dispatchEvent(new CustomEvent('pai-offline-status'))})().finally(()=>pending.delete(file));pending.set(file,p);return p;
 }
 window.ensureUnits=async keys=>{const files=new Set(keys.map(k=>window.PAI_CORE.byKU.get(k)?.chunkFile).filter(Boolean));await Promise.all([...files].map(chunk))};
 window.downloadOfflineLexicon=async()=>{status.downloading=true;status.error=null;window.dispatchEvent(new CustomEvent('pai-offline-status'));try{for(const c of manifest.chunks)await chunk(c.file)}catch(e){status.error=e.message}finally{status.downloading=false;window.dispatchEvent(new CustomEvent('pai-offline-status'))}};
 function makeChunkIndex(m,rows){
  chunkByFile=new Map(m.chunks.map(c=>[c.file,c]));
  const sceneFile=new Map();for(const id of Object.keys(m.taxonomy.minors)){const target='scene-'+id.replace(/\./g,'-')+'.json.b64',meta=chunkByFile.get(target);if(!meta)throw Error('场景分包缺失：'+id);sceneFile.set(id,target)}
  const trackIds=Object.keys(m.trackKuCounts||{}),trackFiles=new Map(trackIds.map(t=>[t,m.chunks.filter(c=>c.file.startsWith('track-'+t+'-')).sort((a,b)=>a.file.localeCompare(b.file))]));
  const trackPos=new Map(trackIds.map(t=>[t,0])),boundaries=new Map();for(const t of trackIds){let end=0;boundaries.set(t,trackFiles.get(t).map(c=>({file:c.file,end:end+=c.kus})))}
  const result=new Map();for(const row of rows)for(const sense of row[3]){const [k,owner]=sense;if(sceneFile.has(owner)){result.set(k,sceneFile.get(owner));continue}if(!trackPos.has(owner))throw Error('未知 KU 归属：'+owner);const pos=trackPos.get(owner);trackPos.set(owner,pos+1);const b=boundaries.get(owner).find(x=>pos<x.end);if(!b)throw Error('轨分包容量不足：'+owner);result.set(k,b.file)}
  for(const t of trackIds)if(trackPos.get(t)!==Number(m.trackKuCounts[t]||0))throw Error('轨计数不符：'+t);return result;
 }
 window.loadLearningCatalog=async()=>{
  manifest=await loadManifest();status.release=manifest.release;status.totalChunks=manifest.chunks.length;
  if(typeof window.activateLexiconStorage==='function')window.activateLexiconStorage(manifest.release);
  for(const file of (await cached('stored:'+manifest.release)||[]))if(manifest.chunks.some(c=>c.file===file))stored.add(file);status.loadedChunks=stored.size;status.offlineReady=stored.size===manifest.chunks.length;
  const rows=await asset(manifest.catalog);if(rows.length!==manifest.wordCount)throw Error('目录词数不符');
  for(const k of Object.keys(SCENES))delete SCENES[k];
  const tracks={function:'功能词',academic:'学术词',core1:'核心高频 · 1–1000',core3:'核心高频 · 1001–3000',core6:'核心高频 · 3001–6000',core13:'核心高频 · 6001–13000',core20:'核心高频 · 13001–20000'};
  for(const [id,meta] of Object.entries(manifest.taxonomy.minors))SCENES[id]=meta.zh||meta.en||id;for(const id of Object.keys(manifest.trackKuCounts||{}))SCENES[id]=tracks[id]||id;
  const kuChunk=makeChunkIndex(manifest,rows),core={words:[],byKU:new Map(),byScene:new Map(Object.keys(SCENES).map(k=>[k,[]])),byLemma:new Map()};
  rows.forEach(([rank,lemma,pos,senses],i)=>{if(rank!==i+1)throw Error('目录词序错误');const w={rank,w:lemma,pos:pos||'',s:{},ipa:'',ipaUS:'',ipaUK:'',loaded:false,allSenses:senses};for(const [k,owner,kuType,kuTitle,sp,m]of senses){if(core.byKU.has(k))throw Error('重复 KU：'+k);if(!core.byScene.has(owner))throw Error('目录归属不存在：'+owner);const s={ku_id:k,scene:owner,lexiconScene:manifest.taxonomy.minors[owner]?owner:null,track:manifest.trackKuCounts?.[owner]!==undefined?owner:null,kuType:kuType||'sense',kuTitle:kuTitle||'释义',pos:sp||pos||'',m:m||'',e:[],c:'',x:'',__loaded:false};w.s[k]=s;const u={w,sid:k,k,s,owner,chunkFile:kuChunk.get(k)};if(!u.chunkFile)throw Error('KU 缺少分包索引：'+k);core.byKU.set(k,u);core.byScene.get(owner).push(u)}core.words.push(w);core.byLemma.set(lemma,[...(core.byLemma.get(lemma)||[]),w])});
  if(core.byKU.size!==manifest.kuCount)throw Error('目录 KU 数错误');window.PAI_CORE=core;WORDS.splice(0,WORDS.length,...core.words);
  window.PAI_TAXONOMY=manifest.taxonomy;window.PAI_SCENE_KU_COUNTS=manifest.sceneKuCounts||{};window.PAI_TRACK_KU_COUNTS=manifest.trackKuCounts||{};window.PAI_TRACK_IDS=new Set(Object.keys(manifest.trackKuCounts||{}));window.PAI_DEFAULT_SCENE=Object.keys(manifest.taxonomy.minors)[0]||Object.keys(SCENES)[0];window.PAI_MANIFEST=manifest;
  window.PAI_CORE_QA={release:manifest.release,words:core.words.length,units:core.byKU.size,majors:Object.keys(manifest.taxonomy.majors).length,minors:Object.keys(manifest.taxonomy.minors).length,chunks:manifest.chunks.length,sceneCounts:manifest.sceneKuCounts,trackCounts:manifest.trackKuCounts};
  save();return core;
 };
})();
