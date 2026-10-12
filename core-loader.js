// Core-13000 adapter: canonical KU identity, indexed queues, offline-first local lexicon cache.
(function(){
  const ROOT='data/core13000-v25.5/';
  const DB_NAME='pai-word-lexicon-v1',DB_VERSION=1,ASSET_STORE='assets',META_STORE='meta';
  const DOMAIN_SCENE=Object.freeze({
    daily_communication:'daily',housing:'daily',family:'daily',food:'daily',
    business:'work',work:'work',academic_research:'academic',education:'academic',science:'academic',
    travel:'travel',driving_transport:'travel',relationships:'social',emotion:'social',
    technology:'tech',ai_internet:'tech',engineering_manufacturing:'tech',science_technology:'tech',
    health:'health',medicine_health:'health',finance_economy:'finance',shopping:'finance',
    public_safety:'public',law:'public',society:'public',public_affairs_politics:'public',
    law_public:'public',law_politics_society:'public',city:'public',news_media:'public',
    arts_culture:'culture',entertainment:'culture',sport:'culture'
  });
  const norm=value=>String(value||'').trim().replace(/[；;。\s]/g,'');
  let dbPromise=null;
  const localStatus={supported:'indexedDB' in window,persistent:false,manifestSource:'network',manifestCached:false,assetSources:{},offlineReady:false,release:null,updateAvailable:false,shellReady:false};
  window.PAI_LOCAL_LEXICON=localStatus;

  function openDB(){
    if(!localStatus.supported)return Promise.resolve(null);
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(ASSET_STORE))db.createObjectStore(ASSET_STORE);if(!db.objectStoreNames.contains(META_STORE))db.createObjectStore(META_STORE)};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('本地词库存储初始化失败'));
    }).catch(error=>{console.warn('[PAI local lexicon] IndexedDB unavailable',error);localStatus.supported=false;return null});
    return dbPromise;
  }
  async function idbGet(store,key){
    const db=await openDB();if(!db)return null;
    return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),req=tx.objectStore(store).get(key);req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>reject(req.error)}).catch(()=>null);
  }
  async function idbPut(store,key,value){
    const db=await openDB();if(!db)return false;
    return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value,key);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)}).catch(error=>{console.warn('[PAI local lexicon] cache write failed',key,error);return false});
  }
  async function idbDelete(store,key){
    const db=await openDB();if(!db)return false;
    return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(key);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)}).catch(()=>false);
  }
  async function requestPersistence(){
    try{if(navigator.storage?.persist){localStatus.persistent=await navigator.storage.persist()}}catch(_){localStatus.persistent=false}
  }
  async function sha256(data){
    if(!crypto.subtle)throw new Error('请通过 HTTPS 或 localhost 打开应用');
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
  }
  async function verifyBytes(data,bytes,sha,file){
    const view=data instanceof Uint8Array?data:new Uint8Array(data);
    if(view.length!==bytes)throw new Error(file+' 文件大小不符');
    if(await sha256(view)!==sha)throw new Error(file+' 校验失败');
    return view;
  }
  async function fetchNetworkBytes(file,bytes,sha){
    const response=await fetch(ROOT+file,{cache:'no-cache'});
    if(!response.ok)throw new Error(file+' HTTP '+response.status);
    return verifyBytes(await response.arrayBuffer(),bytes,sha,file);
  }
  async function fetchBytes(file,bytes,sha){
    const key=file+'@'+sha,cached=await idbGet(ASSET_STORE,key);
    if(cached?.bytes){
      try{
        const data=await verifyBytes(cached.bytes,bytes,sha,file);localStatus.assetSources[file]='local';return data;
      }catch(error){console.warn('[PAI local lexicon] dropping invalid cache',file,error);await idbDelete(ASSET_STORE,key)}
    }
    const data=await fetchNetworkBytes(file,bytes,sha);
    const saved=await idbPut(ASSET_STORE,key,{bytes:data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),bytesLength:data.byteLength,sha,savedAt:Date.now()});
    localStatus.assetSources[file]=saved?'network+cached':'network';
    return data;
  }
  function validManifest(manifest){return manifest&&manifest.release==='Core-13000 V25.5'&&manifest.word_count===13000&&Array.isArray(manifest.packs)&&manifest.packs.length===4}
  async function loadManifest(){
    const cached=await idbGet(META_STORE,'manifest');
    if(validManifest(cached)){localStatus.manifestSource='local';localStatus.manifestCached=true;localStatus.release=cached.release;return cached}
    const response=await fetch(ROOT+'manifest.json',{cache:'no-cache'});if(!response.ok)throw new Error('manifest HTTP '+response.status);
    const manifest=await response.json();if(!validManifest(manifest))throw new Error('词库版本不符');
    localStatus.manifestCached=await idbPut(META_STORE,'manifest',manifest);localStatus.manifestSource=localStatus.manifestCached?'network+cached':'network';localStatus.release=manifest.release;return manifest;
  }
  async function checkManifestUpdate(current){
    try{
      const response=await fetch(ROOT+'manifest.json',{cache:'no-store'});if(!response.ok)return;
      const latest=await response.json();if(!validManifest(latest))return;
      const sig=m=>JSON.stringify([m.release,m.word_count,m.packs?.map(p=>[p.sha256,p.fallback_sha256]),m.comparisons?.sha256]);
      if(sig(latest)!==sig(current)){localStatus.updateAvailable=true;await idbPut(META_STORE,'manifest',latest)}
    }catch(_){/* Offline is expected; local data remains authoritative for this launch. */}
  }
  async function loadPack(pack,manifest){
    let format='brotli';
    try{new DecompressionStream(format)}catch(_){format='gzip'}
    const fallback=format==='gzip';
    const file=fallback?pack.fallback_file:pack.file;
    const data=await fetchBytes(file,fallback?pack.fallback_bytes:pack.bytes,fallback?pack.fallback_sha256:pack.sha256);
    const raw=await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream(format))).arrayBuffer();
    if(raw.byteLength!==pack.raw_bytes)throw new Error(pack.file+' 解压大小不符');
    const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
    if(payload.v!==manifest.schema_version||payload.release!==manifest.release||JSON.stringify(payload.columns)!==JSON.stringify(manifest.columns)||payload.words?.length!==pack.words)throw new Error(pack.file+' 结构不符');
    for(let i=0;i<payload.words.length;i++)if(payload.words[i][0]!==pack.rank_start+i)throw new Error('词序不连续');
    if(pack.rank_end!==pack.rank_start+pack.words-1)throw new Error('包范围不符');
    return {words:payload.words,format,file};
  }
  function adapt(rows){
    const words=[],byKU=new Map(),byScene=new Map(Object.keys(SCENES).map(k=>[k,[]])),byLemma=new Map();
    let missingKU=0,missingIPA=0;
    for(const row of rows){
      const [rank,lemma,pos,uk,us,senses,collocations,examples,usage]=row;
      if(!lemma||!Array.isArray(senses)||!senses.length||!Array.isArray(examples)||!Array.isArray(collocations)||!Array.isArray(usage))throw new Error('词条结构无效');
      const w={rank,w:lemma,pos:pos||'',ipaUK:uk||'',ipaUS:us||'',ipa:us||uk||'',root:'',s:{},allSenses:senses};
      if(!uk&&!us)missingIPA++;
      for(const sense of senses){
        const [sense_id,sensePos,zh,domain,ku_id]=sense;
        if(!sense_id||!zh)throw new Error('义项结构无效');
        if(!ku_id){missingKU++;continue}
        if(byKU.has(ku_id))throw new Error('重复 ku_id：'+ku_id);
        const scene=DOMAIN_SCENE[domain]||'unclassified';
        const s={sense_id,ku_id,pos:sensePos||pos||'',domain,scene,m:zh,
          c:collocations.map(([en,cn])=>en+(cn?' — '+cn:'')).join(' · '),
          e:examples.map(([en,cn])=>en+(cn?'\n'+cn:'')),exampleAudio:examples.map(e=>e[0]),x:usage.join('；')};
        w.s[ku_id]=s;const u={w,sid:ku_id,s,k:ku_id};byKU.set(ku_id,u);byScene.get(scene).push(u);
      }
      if(!Object.keys(w.s).length)throw new Error('词条无可学习知识单元：'+lemma);
      words.push(w);const entries=byLemma.get(lemma)||[];entries.push(w);byLemma.set(lemma,entries);
    }
    return {words,byKU,byScene,byLemma,missingKU,missingIPA};
  }
  async function loadComparisons(core,manifest){
    const spec=manifest.comparisons;if(!spec)return 0;
    const raw=await fetchBytes(spec.file,spec.bytes,spec.sha256);
    const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
    if(data.schema_version!=='1.0'||data.release!==manifest.release||!Array.isArray(data.entries)||data.entries.length!==spec.entries)throw new Error('辨析数据结构不符');
    const seen=new Set();
    for(const entry of data.entries){
      const unit=core.byKU.get(entry.ku_id);
      if(!unit||seen.has(entry.ku_id)||entry.sense_id!==unit.s.sense_id||entry.lemma!==unit.w.w||entry.sense_zh!==unit.s.m)throw new Error('辨析义项绑定不符');
      if(!Array.isArray(entry.items)||entry.items.length!==3||new Set(entry.items.map(x=>x.word)).size!==3||!entry.items.some(x=>x.word===unit.w.w))throw new Error('辨析需包含三个不同词及当前单词');
      if(entry.items.some(x=>['word','brief_zh','example_en','example_zh'].some(k=>typeof x[k]!=='string'||!x[k].trim())))throw new Error('辨析内容缺失');
      if(entry.verification!=='EDITORIAL_DRAFT_EXTERNAL_CHECK_PENDING')throw new Error('辨析核验状态不符');
      unit.s.compare={items:entry.items,verification:entry.verification};seen.add(entry.ku_id);
    }
    return seen.size;
  }
  function migrate(core,legacy){
    if(state.srsSchema==='ku_id-v1')return;
    const backupKey=STORAGE+'::before-ku-id-v1';
    const original=localStorage.getItem(STORAGE)||JSON.stringify(state);
    if(localStorage.getItem(backupKey)===null)localStorage.setItem(backupKey,original);
    const records=Object.fromEntries(Object.entries(state.records||{}).filter(([key])=>core.byKU.has(key))),pending={...(state.legacySrsPending||{})},legacyWords=new Map(legacy.map(w=>[w.w,w]));
    for(const [key,record] of Object.entries(state.records||{})){
      if(core.byKU.has(key))continue;
      const [lemma,scene,...rest]=key.split('::'),oldSense=legacyWords.get(lemma)?.s[scene];
      const candidates=!rest.length&&oldSense?(core.byLemma.get(lemma)||[]).flatMap(w=>Object.values(w.s)).filter(s=>s.scene===scene&&norm(s.m)===norm(oldSense.m)):[];
      if(candidates.length===1&&!records[candidates[0].ku_id])records[candidates[0].ku_id]=record;
      else pending[key]={record,reason:candidates.length?'ambiguous_or_collision':'no_exact_sense_match'};
    }
    const next={...state,records,srsSchema:'ku_id-v1',lexiconRelease:'Core-13000 V25.5',legacySrsPending:pending,srsMigration:{backupKey,migrated:Object.keys(records).length,pending:Object.keys(pending).length},daily:null,freeKeys:[],view:'scenes',scene:null};
    localStorage.setItem(STORAGE,JSON.stringify(next));Object.assign(state,next);
  }
  window.loadCore13000=async function(){
    requestPersistence();
    const manifest=await loadManifest();
    const packs=await Promise.all(manifest.packs.map(p=>loadPack(p,manifest))),rows=packs.flatMap(p=>p.words);
    if(rows.length!==13000||rows.some((row,i)=>row[0]!==i+1))throw new Error('13,000 词连续性校验失败');
    SCENES.unclassified='通用词汇 · 待分类';
    const core=adapt(rows),comparisonUnits=await loadComparisons(core,manifest);migrate(core,WORDS);
    WORDS.splice(0,WORDS.length,...core.words);window.PAI_CORE=core;
    const requiredFiles=[...packs.map(p=>p.file),...(manifest.comparisons?[manifest.comparisons.file]:[])];
    localStatus.offlineReady=localStatus.supported&&localStatus.manifestCached&&requiredFiles.every(file=>['local','network+cached'].includes(localStatus.assetSources[file]));
    window.PAI_CORE_QA={release:manifest.release,words:WORDS.length,units:core.byKU.size,missingKU:core.missingKU,missingIPA:core.missingIPA,comparisonUnits,formats:packs.map(p=>p.format),sceneCounts:Object.fromEntries([...core.byScene].map(([k,v])=>[k,v.length])),migration:state.srsMigration,localLexicon:{...localStatus}};
    setTimeout(()=>checkManifestUpdate(manifest),0);
    return window.PAI_CORE_QA;
  };
})();
