(async function(){
 const VERSION='core20k-v21-perf-background-reconcile-20261023';window.PAI_APP_VERSION=VERSION;
 const app=document.getElementById('app');
 const bootStarted=performance.now(),timings={};
 const mark=label=>{timings[label]=Math.round(performance.now()-bootStarted);window.PAI_BOOT_TIMINGS={...timings}};
 mark('bootstrap');
 // Read-only visual snapshot: never trust restored markup for actions or learning state.
 const SNAPSHOT_KEY='pai-word-home-visual-v1';
 let snapshotVisible=false;
 try{
  const saved=JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'null');
  if(saved?.schema===1&&typeof saved.html==='string'&&saved.html.length<180000&&saved.html.startsWith('<div class="home-dashboard">')){
   const safe=document.createElement('div');safe.innerHTML=saved.html;
   safe.querySelectorAll('script,iframe,object,embed,form').forEach(node=>node.remove());
   safe.querySelectorAll('*').forEach(node=>{for(const attr of [...node.attributes])if(attr.name.startsWith('on'))node.removeAttribute(attr.name)});
   safe.querySelectorAll('button,input,textarea,select,a').forEach(node=>{node.setAttribute('disabled','');node.setAttribute('tabindex','-1')});
   app.replaceChildren(...safe.childNodes);
   app.setAttribute('aria-busy','true');
   document.body.classList.add('pai-snapshot-visible');
   snapshotVisible=true;mark('snapshotPaint');
  }
 }catch(error){console.warn('Visual snapshot unavailable',error)}
 window.PAI_SAVE_HOME_VISUAL=html=>{
  try{if(typeof html==='string'&&html.length<180000)localStorage.setItem(SNAPSHOT_KEY,JSON.stringify({schema:1,html}))}catch(error){console.warn('Visual snapshot write skipped',error)}
 };


 function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.async=false;el.src=src+'?v='+VERSION;el.onload=resolve;el.onerror=()=>reject(Error('应用文件加载失败: '+src));document.body.appendChild(el)})}
 // Catalog is not required for the initial home paint. Install it at first use only.
 let catalogScriptPromise=null;
 window.PAI_OPEN_CATALOG_LAZY=async()=>{
  try{
   if(!catalogScriptPromise)catalogScriptPromise=script('rebuild-preview/scene-catalog.js').catch(error=>{catalogScriptPromise=null;throw error});
   await catalogScriptPromise;
   if(typeof window.openSceneCatalog!=='function')throw Error('场景目录初始化失败');
   window.openSceneCatalog();
  }catch(error){console.error('Scene500 catalog unavailable',error);alert('场景目录加载失败，请重试');}
 };
 // Independent version strip: survives home redraws, catalog navigation and failed SHA reads.
 window.PAI_PERF_SOURCE_SHA=null;
 if(location.pathname.includes('/perf-preview/')){
  const strip=document.createElement('aside');
  strip.id='pai-perf-version-strip';
  strip.setAttribute('aria-label','加速版部署版本');
  strip.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483000;background:#f1f5f9;color:#334155;border-bottom:1px solid #cbd5e1;padding:calc(5px + env(safe-area-inset-top)) 8px 5px;font:11px/1.45 system-ui,sans-serif;text-align:center;overflow-wrap:anywhere;pointer-events:none';
  strip.textContent='加速版 SHA：读取中…';
  document.body.appendChild(strip);
  void fetch(new URL('preview-source-sha.txt',document.baseURI),{cache:'no-store'})
   .then(response=>{if(!response.ok)throw Error('SHA_HTTP_'+response.status);return response.text()})
   .then(value=>{const sha=value.trim();if(!/^[0-9a-f]{40}$/.test(sha))throw Error('SHA_INVALID');window.PAI_PERF_SOURCE_SHA=sha;strip.textContent='加速版 SHA：'+sha})
   .catch(error=>{window.PAI_PERF_SHA_ERROR=String(error);strip.textContent='加速版 SHA：读取失败（请检查部署）'});
 }
 async function json(src){const r=await fetch(src+'?v='+VERSION,{cache:'default'});if(!r.ok)throw Error('数据文件加载失败: '+src);return r.json()}
 async function sceneMembership(){
  try{return await json('data/scene500-playable-membership-v2.json')}
  catch(v2Error){
   console.warn('Scene500 membership V2 unavailable; falling back to V1.',v2Error);
   return json('data/scene500-playable-membership-v1.json');
  }
 }
 try{
  await script('rebuild-preview/ku-durable-store.js');
  // Read-only Scene500 fetches may overlap IndexedDB restore; attach rejection handlers
  // immediately so a slow storage operation never leaves an unhandled rejection.
  const sceneInputsReady=Promise.all([
   json('data/scene500-ranked-membership-policy-v1.json'),
   sceneMembership()
  ]).then(values=>({values}),error=>({error}));
  let durableDB=null;
  try{
   durableDB=await window.PAI_KU_DURABLE.open();
   // Independent object stores: begin all three transactions together, but restore
   // the state in the original priority order only after every operation settles.
   const [previous,settings,home]=await Promise.all([
    window.PAI_KU_DURABLE.initialize(durableDB,state),
    window.PAI_KU_DURABLE.readSettings(durableDB),
    window.PAI_KU_DURABLE.readHome(durableDB)
   ]);
   window.PAI_KU_DURABLE_VERSION=previous.version;
   // Restore each domain independently; a missing KU snapshot must not hide saved home/settings.
   if(previous?.snapshot?.records)state={...state,...previous.snapshot};
   if(settings&&typeof settings==='object')state={...state,...settings};
   if(home&&typeof home==='object'){
    for(const key of ['sceneSearchUi','scene500Recent','scene500DifficultyByScene'])if(Object.prototype.hasOwnProperty.call(home,key))state[key]=home[key];
   }
   state.view='scenes';state.revealed=false;
   window.PAI_KU_DURABLE_DB=durableDB;
   window.PAI_KU_STORAGE_READY=true;
   mark('storageReady');
  }catch(storageError){
   window.PAI_KU_STORAGE_READY=false;
   window.PAI_KU_STORAGE_FATAL=true;
   console.warn('Durable KU storage unavailable; rating writes must not silently succeed',storageError);
  }
  const catalogReady=loadLearningCatalog();
  await catalogReady;mark('catalog');
  const sceneInputs=await sceneInputsReady;
  if(sceneInputs.error)throw sceneInputs.error;
  [window.PAI_SCENE500_MEMBERSHIP_POLICY,window.PAI_SCENE500_MEMBERSHIP]=sceneInputs.values;
  mark('memberships');
  // The HTML preloads runtime scripts in parallel. Execute sequentially here
  // so a load failure cannot run dependent scripts after an incomplete predecessor.
  await script('rebuild-preview/memory-schedulers.js');
  await script('rebuild-preview/learning-runtime.js');
  await script('audio-compat.js');
  await script('scene500-integrated.js');
  await script('scene500-sense-review.js');
  await script('scene-search.js');
  await script('rebuild-preview/home-dashboard.js');
  await script('rebuild-preview/round-policy.js');
  mark('startupScripts');
  // Canonical Scene500 Top100 is integrated into the existing search and learning UI.
  const preboot=window.PAI_PREVIEW_PENDING_SEARCH;
  const typed=document.getElementById('scene-query')?.value||'';
  const difficulty=document.getElementById('scene-difficulty')?.value||'all';
  state.sceneSearchUi={...(state.sceneSearchUi||{}),query:preboot?.query||state.sceneSearchUi?.query||typed||'',difficulty:preboot?.difficulty||state.sceneSearchUi?.difficulty||difficulty,resultIds:preboot?.query?[]:(state.sceneSearchUi?.resultIds||[])};
  state.view='scenes';state.revealed=false;
  // Assemble final home content behind the boot gate; expose it only once.

  // Restore persisted recommendation IDs exactly; only explicit user actions rerank.
  render();
  mark('homeRendered');app.removeAttribute('role');app.removeAttribute('aria-busy');document.body.classList.remove('pai-snapshot-visible');document.body.classList.add('pai-boot-ready');
  // Restore the snapshot first; reconcile real progress/recents after first paint.
  requestAnimationFrame(()=>window.PAI_HOME_RECONCILE?.({rerank:false}));
  // Read-only diagnostics: available from the console; never persist or alter study state.
  window.PAI_STARTUP_REPORT=()=>{
   const t=window.PAI_BOOT_TIMINGS||{},c=window.PAI_CORE20K_LOAD_TIMINGS||{};
   const nav=performance.getEntriesByType('navigation')[0];
   const start=nav?.startTime||0;
   return {version:VERSION,homeReadyMs:t.homeRendered??null,
    stagesMs:{...t},core20kMs:{...c},
    navigationMs:nav?{domContentLoaded:Math.round(nav.domContentLoadedEventEnd-start),loadEvent:Math.round(nav.loadEventEnd-start)}:null};
  };
  // Optional Top100 taxonomy runs only after the real homepage is visible.
  // Its shard-ready promise triggers the same recommendation refresh as before.
  void (async()=>{
   try{
    if(!(window.PAI_CORE20K_ROOT===true||new URLSearchParams(location.search).get('core20k')==='1'))return;
    const {installScene500Top100}=await import(new URL('scripts/scene500-top100-loader.mjs',document.baseURI).href);
    await installScene500Top100();
    if(window.PAI_SCENE500_TOP100_READY)await window.PAI_SCENE500_TOP100_READY;
    // Refresh count labels only after the entire Top100 dataset is ready.
    if(typeof window.PAI_HOME_RECONCILE==='function')window.PAI_HOME_RECONCILE({rerank:true});
    // Never rerank or replace the search draft during background data hydration.
   }catch(error){console.warn('Optional Scene500 data unavailable; homepage remains usable',error)}
  })();
  // Inventory and audit are not required to present or use the home screen.
  // Run after the first complete paint, without triggering another home render.
  setTimeout(async()=>{try{
  // Display coarse Scene500 inventory separately from reviewed learning membership.
  if((window.PAI_CORE20K_ROOT===true||new URLSearchParams(location.search).get('core20k')==='1')){
   try{
    const inventory=await json('data/scene500-v40-inventory.json');
    if(inventory.schema!=='pai-scene500-core20k-v40-inventory-v1'||Object.keys(inventory.scenes||{}).length!==500)throw Error('Scene500 inventory schema invalid');
    const counts=Object.fromEntries(Object.entries(inventory.scenes).map(([id,v])=>[id,v.candidates]));
    window.PAI_SCENE500_CANDIDATES={summary:{candidatesByScene:counts},version:'Scene500 V4.0 coarse',verifiedSense:false};
    window.PAI_SCENE500_V40_INVENTORY=inventory;
   }catch(error){console.warn('Scene500 V4 inventory unavailable; reviewed Scene500 remains usable',error)}
  }
  if((window.PAI_CORE20K_ROOT===true||new URLSearchParams(location.search).get('core20k')==='1')){
   const review=await json('data/scene500-review-index-b163-v1.json');
   const gate=await import(new URL('scripts/scene500-review-gate.mjs',document.baseURI).href);
   window.PAI_SCENE500_REVIEW_AUDIT=gate.validateReviewIndex(review);
  }

  }catch(error){console.warn('Deferred Scene500 metadata unavailable',error)}},0);
  const lemma=new URLSearchParams(location.search).get('word'),w=window.PAI_CORE.byLemma.get(lemma)?.[0];if(w)openLexiconWord(w.rank);
  // V2.1 isolation: preview must never register the shared root-scope worker.
  // Dedicated scoped offline support will be introduced after worker isolation tests.
  window.PAI_PREVIEW_OFFLINE_STATUS='scoped_worker_registering';
  if('serviceWorker' in navigator){
    const previewUrl=new URL('rebuild-preview/',document.baseURI);
    const workerUrl=new URL('sw.js',previewUrl);
    navigator.serviceWorker.register(workerUrl.href,{scope:previewUrl.pathname,updateViaCache:'none'})
      .then(reg=>{window.PAI_PREVIEW_OFFLINE_STATUS='scoped_worker_registered';
        // Existing root workers can control the first load. Scoped worker takes over after claim/reload.
        if(!navigator.serviceWorker.controller||!navigator.serviceWorker.controller.scriptURL.startsWith(previewUrl.href))
          window.PAI_PREVIEW_OFFLINE_STATUS='scoped_worker_waiting_for_control';
      })
      .catch(error=>{window.PAI_PREVIEW_OFFLINE_STATUS='scoped_worker_failed';console.warn('Preview worker unavailable',error)});
  }
 }catch(e){app.style.visibility='visible';document.body.classList.add('pai-boot-ready');app.innerHTML='<div class="screen"><h1>PAI Word</h1><p id="load-error"></p><button onclick="location.reload()">重新加载</button></div>';document.getElementById('load-error').textContent=e.message;console.error(e)}
})();