(async function(){
 const VERSION='core20k-fast-welcome-p0-20261025';window.PAI_APP_VERSION=VERSION;
 // Core20K dataset is independent of UI revisions. Change this token ONLY when
 // data/core20k-runtime.json.gz changes; otherwise retain the verified text cache.
 window.PAI_CORE20K_ASSET_VERSION='core20k-runtime-dataset-v1';
 const app=document.getElementById('app');
 const bootStarted=performance.now(),timings={};
 const mark=label=>{timings[label]=Math.round(performance.now()-bootStarted);window.PAI_BOOT_TIMINGS={...timings}};
 mark('bootstrap');
 // Test-only destructive reset. Clear app state after pending writes settle.
 window.PAI_RESET_TEST_SYSTEM=async()=>{
  if(!confirm('重置系统将永久删除本浏览器内 PAI Word 的所有学习记录、复习进度、设置及首页快照。确定继续？'))return;
  if(!confirm('最后确认：这些测试数据无法恢复。是否重置为全新系统？'))return;
  const button=document.activeElement;if(button&&'disabled'in button)button.disabled=true;
  try{
   // Stop all future state writes in this document before deleting the database.
   window.PAI_RESET_IN_PROGRESS=true;
   window.PAI_SAVE_DEFERRED=true;
   const settled=await window.PAI_PERSISTENCE_FLUSH?.();
   if(settled?.some(item=>item.status==='rejected'))throw Error('尚有未完成的持久化写入');
   window.PAI_KU_STORAGE_READY=false;
   window.PAI_KU_DURABLE_DB?.close();
   await new Promise((resolve,reject)=>{
    const req=indexedDB.deleteDatabase(window.PAI_KU_DURABLE_DB_NAME||'pai-word-preview-ku-durable-v2');
    let done=false;
    const timeout=setTimeout(()=>{
     if(done)return;
     done=true;
     reject(Error('数据库删除被其他标签页阻塞。请关闭其他 PAI Word 页面后重试。'));
    },5000);
    const finish=(error)=>{
     if(done)return;
     done=true;clearTimeout(timeout);
     if(error)reject(error);else resolve();
    };
    req.onsuccess=()=>finish();
    req.onerror=()=>finish(req.error||Error('数据库删除失败'));
    req.onblocked=()=>{window.PAI_RESET_BLOCKED=true};
   });
   localStorage.removeItem('pai-word-core20k-rebuild-preview-v21');
   localStorage.removeItem('pai-word-welcome-seen-v1');
   for(const key of Object.keys(localStorage))if(key.startsWith('pai-word-preview-v2-'))localStorage.removeItem(key);
   for(const key of Object.keys(sessionStorage))if(key.startsWith('pai-word-preview-v2-'))sessionStorage.removeItem(key);
   // Verify no stale legacy state can re-seed a newly initialized database.
   if(localStorage.getItem('pai-word-core20k-rebuild-preview-v21')!==null)throw Error('旧学习数据仍存在');
   sessionStorage.setItem('pai-word-preview-reset-check','1');
   location.replace(location.pathname+'?resetFresh='+Date.now());
  }catch(error){alert('重置未完成：'+String(error?.message||error));window.PAI_RESET_IN_PROGRESS=false;window.PAI_SAVE_DEFERRED=false;if(button&&'disabled'in button)button.disabled=false}
 };

 // Read-only visual snapshot: never trust restored markup for actions or learning state.
 const SNAPSHOT_KEY='pai-word-preview-v2-home-visual';
 let snapshotVisible=false;
 try{
  localStorage.removeItem(SNAPSHOT_KEY);
  const saved=null; // No cached HTML restoration.
  if(saved?.schema===1&&typeof saved.html==='string'&&saved.html.length<180000&&saved.html.startsWith('<div class="home-dashboard">')){
   const safe=document.createElement('div');safe.innerHTML=saved.html;
   // Cached markup is visual only; normalize historical CTA wording before first paint.
   safe.querySelectorAll('.continue-primary').forEach(button=>{button.textContent='继续学习'});
   safe.querySelectorAll('script,iframe,object,embed,form').forEach(node=>node.remove());
   safe.querySelectorAll('*').forEach(node=>{for(const attr of [...node.attributes])if(attr.name.startsWith('on'))node.removeAttribute(attr.name)});
   safe.querySelectorAll('button,input,textarea,select,a').forEach(node=>{node.setAttribute('disabled','');node.setAttribute('tabindex','-1')});
   app.replaceChildren(...safe.childNodes);
   app.setAttribute('aria-busy','true');
   document.body.classList.add('pai-snapshot-visible');
   snapshotVisible=true;mark('snapshotPaint');
  }
 }catch(error){console.warn('Visual snapshot unavailable',error)}
 window.PAI_SAVE_HOME_VISUAL=()=>{}; // Always render genuine state.


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
 async function json(src){const r=await fetch(src+'?v='+VERSION,{cache:'default'});if(!r.ok)throw Error('数据文件加载失败: '+src);return r.json()}
 async function sceneMembership(){
  try{return await json('data/scene500-playable-membership-v2.json')}
  catch(v2Error){
   console.warn('Scene500 membership V2 unavailable; falling back to V1.',v2Error);
   return json('data/scene500-playable-membership-v1.json');
  }
 }
 // Start read-only network requests before the first dependency script loads.
 // The data is applied only after catalog initialization and durable-state restore.
  const sceneInputsReady=Promise.all([
   json('data/scene500-ranked-membership-policy-v1.json'),
   sceneMembership()
  ]).then(values=>({values}),error=>({error}));
 try{
  await script('rebuild-preview/ku-durable-store.js');
  // Read-only Scene500 fetches may overlap IndexedDB restore; attach rejection handlers
  // immediately so a slow storage operation never leaves an unhandled rejection.

  const storageStarted=performance.now();
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
   if(sessionStorage.getItem('pai-word-preview-reset-check')==='1'){
    const actual=await window.PAI_KU_DURABLE.read(durableDB);
    const actualSettings=await window.PAI_KU_DURABLE.readSettings(durableDB);
    const actualHome=await window.PAI_KU_DURABLE.readHome(durableDB);
    const checks={
     records:Object.keys(actual?.snapshot?.records||{}).length===0,
     settings:!actualSettings||Object.keys(actualSettings).length===0,
     home:!actualHome||Object.keys(actualHome).length===0,
     legacy:localStorage.getItem('pai-word-core20k-rebuild-preview-v21')===null
    };
    window.PAI_LAST_RESET_QA={passed:Object.values(checks).every(Boolean),checks,at:Date.now()};
    sessionStorage.removeItem('pai-word-preview-reset-check');
    if(!window.PAI_LAST_RESET_QA.passed){
     console.error('PAI_RESET_QA_FAILED',window.PAI_LAST_RESET_QA);
     const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name).join(', ');
     window.PAI_RESET_QA_WARNING='系统重置校验未通过：'+failed+'。请勿继续学习，先反馈此信息。';
     window.addEventListener('load',()=>{
      const notice=document.createElement('div');
      notice.setAttribute('role','alert');
      notice.style.cssText='position:fixed;top:12px;left:12px;right:12px;z-index:2147483647;padding:14px;border-radius:10px;background:#7f1d1d;color:#fff;font:14px system-ui';
      notice.textContent=window.PAI_RESET_QA_WARNING;
      document.body.appendChild(notice);
     },{once:true});
    }
   }
   window.PAI_KU_STORAGE_READY=true;
   mark('storageReady');timings.storageDurationMs=Math.round(performance.now()-storageStarted);
  }catch(storageError){
   window.PAI_KU_STORAGE_READY=false;
   window.PAI_KU_STORAGE_FATAL=true;
   console.warn('Durable KU storage unavailable; rating writes must not silently succeed',storageError);
  }
  const catalogStarted=performance.now();
  const catalogReady=loadLearningCatalog();
  await catalogReady;mark('catalog');timings.catalogDurationMs=Math.round(performance.now()-catalogStarted);
  // Base learning scripts depend on the restored Core catalog, not the two
  // Scene500 membership responses. Run them while those network requests settle.
  const scriptDurations={};
  async function loadTimedScript(src){
   const before=performance.now();
   await script(src);
   scriptDurations[src]=Math.round(performance.now()-before);
  }
  for(const src of ['rebuild-preview/memory-schedulers.js','rebuild-preview/learning-runtime.js','audio-compat.js'])await loadTimedScript(src);
  mark('baseScriptsReady');
  const sceneInputs=await sceneInputsReady;
  if(sceneInputs.error)throw sceneInputs.error;
  [window.PAI_SCENE500_MEMBERSHIP_POLICY,window.PAI_SCENE500_MEMBERSHIP]=sceneInputs.values;
  mark('memberships');
  // Keep dependency-sensitive Scene500 overlays in their established order.
  for(const src of ['scene500-integrated.js','scene500-sense-review.js','scene-search.js','rebuild-preview/home-dashboard.js','rebuild-preview/round-policy.js'])await loadTimedScript(src);
  window.PAI_BOOT_SCRIPT_DURATIONS=scriptDurations;
  mark('startupScripts');
  // Canonical Scene500 Top100 is integrated into the existing search and learning UI.
  const preboot=window.PAI_PREVIEW_PENDING_SEARCH;
  const typed=document.getElementById('scene-query')?.value||'';
  const difficulty=document.getElementById('scene-difficulty')?.value||'all';
  state.sceneSearchUi={...(state.sceneSearchUi||{}),query:preboot?.query||state.sceneSearchUi?.query||typed||'',difficulty:preboot?.difficulty||state.sceneSearchUi?.difficulty||difficulty,resultIds:preboot?.query?[]:(state.sceneSearchUi?.resultIds||[])};
  state.view='scenes';state.revealed=false;
  // Assemble final home content behind the boot gate; expose it only once.

  // The app must never become visible with missing CSS, even when styles load asynchronously.
  await window.PAI_APP_STYLES_READY;
  // Restore persisted recommendation IDs exactly; only explicit user actions rerank.
  render();
  mark('homeRendered');
  // A successful full reset starts as a new user, including first-run welcome.
  if(window.PAI_LAST_RESET_QA?.passed)window.PAI_SHOW_WELCOME_AFTER_RESET?.();
  app.removeAttribute('role');app.removeAttribute('aria-busy');document.body.classList.remove('pai-snapshot-visible');document.body.classList.add('pai-boot-ready');
  window.dispatchEvent(new Event('pai-home-ready'));
  // Restore the snapshot first; reconcile real progress/recents after first paint.
  requestAnimationFrame(()=>window.PAI_HOME_RECONCILE?.({rerank:false}));
  // Warm the existing catalog module after the home has painted; do not delay first interaction.
  // scene-catalog.js wraps window.render, so it must never load before home runtime is ready.
  if(window.PAI_WELCOME_VISIBLE || window.PAI_WELCOME_OPEN_CATALOG_ON_READY){
    if(!catalogScriptPromise)catalogScriptPromise=script('rebuild-preview/scene-catalog.js').catch(error=>{catalogScriptPromise=null;console.warn('Catalog warmup failed',error)});
    if(window.PAI_WELCOME_OPEN_CATALOG_ON_READY){
      window.PAI_WELCOME_OPEN_CATALOG_ON_READY=false;
      void window.PAI_OPEN_CATALOG_LAZY();
    }
  }

  // Read-only diagnostics: available from the console; never persist or alter study state.
  window.PAI_STARTUP_REPORT=()=>{
   const t=window.PAI_BOOT_TIMINGS||{},c=window.PAI_CORE20K_LOAD_TIMINGS||{};
   const nav=performance.getEntriesByType('navigation')[0];
   const start=nav?.startTime||0;
   return {version:VERSION,homeReadyMs:t.homeRendered??null,
    stagesMs:{...t},scriptLoadMs:{...(window.PAI_BOOT_SCRIPT_DURATIONS||{})},core20kMs:{...c},
    navigationMs:nav?{domContentLoaded:Math.round(nav.domContentLoadedEventEnd-start),loadEvent:Math.round(nav.loadEventEnd-start)}:null,learningEntry:window.PAI_LAST_LEARNING_ENTRY||null,learningEntrySamples:[...(window.PAI_LEARNING_ENTRY_SAMPLES||[])]};
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
    if(typeof window.PAI_HOME_RECONCILE==='function')window.PAI_HOME_RECONCILE();
    // Restore only a query that previously had no usable results. Never rerank
    // an existing recommendation snapshot or erase an in-progress IME draft.
    if(state.view==='scenes' && state.sceneSearchUi?.query &&
       (document.getElementById('scene-query')?.value||'').trim()===state.sceneSearchUi.query.trim() &&
       (!Array.isArray(state.sceneSearchUi.resultIds)||!state.sceneSearchUi.resultIds.length))
      window.restoreScene500Recommendations?.();
    // Snapshot recommendation positions stay fixed until an explicit search.
   }catch(error){console.warn('Optional Scene500 data unavailable; homepage remains usable',error)}
  })();
  // Inventory and audit are not required to present or use the home screen.
  // Run after the first complete paint, without triggering another home render.
  const runDeferredMetadata=async()=>{try{
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

  }catch(error){console.warn('Deferred Scene500 metadata unavailable',error)}};
  // Inventory and review audit do not participate in the home/learning boot.
  // Prefer browser idle time; Safari fallback defers work beyond first paint.
  if(typeof requestIdleCallback==='function')requestIdleCallback(()=>void runDeferredMetadata(),{timeout:8000});
  else setTimeout(()=>void runDeferredMetadata(),2200);
  const lemma=new URLSearchParams(location.search).get('word'),w=window.PAI_CORE.byLemma.get(lemma)?.[0];if(w)openLexiconWord(w.rank);
  // V2.1 isolation: preview must never register the shared root-scope worker.
  // Dedicated scoped offline support will be introduced after worker isolation tests.
  window.PAI_PREVIEW_OFFLINE_STATUS='scoped_worker_registering';
  // Service worker registration is not needed to render or interact with the
  // already loaded home. Postpone browser worker startup until after first paint.
  if('serviceWorker' in navigator){
    const registerPreviewWorker=()=>{
      const previewUrl=new URL('rebuild-preview/',document.baseURI);
      const workerUrl=new URL('sw.js',previewUrl);
      navigator.serviceWorker.register(workerUrl.href,{scope:previewUrl.pathname,updateViaCache:'none'})
        .then(reg=>{window.PAI_PREVIEW_OFFLINE_STATUS='scoped_worker_registered';
          if(!navigator.serviceWorker.controller||!navigator.serviceWorker.controller.scriptURL.startsWith(previewUrl.href))
            window.PAI_PREVIEW_OFFLINE_STATUS='scoped_worker_waiting_for_control';
        })
        .catch(error=>{window.PAI_PREVIEW_OFFLINE_STATUS='scoped_worker_failed';console.warn('Preview worker unavailable',error)});
    };
    window.PAI_PREVIEW_OFFLINE_STATUS='scoped_worker_deferred';
    if(typeof requestIdleCallback==='function')requestIdleCallback(registerPreviewWorker,{timeout:6000});
    else setTimeout(registerPreviewWorker,1600);
  }
 }catch(e){app.style.visibility='visible';document.body.classList.add('pai-boot-ready');app.innerHTML='<div class="screen"><h1>PAI Word</h1><p id="load-error"></p><button onclick="location.reload()">重新加载</button></div>';document.getElementById('load-error').textContent=e.message;console.error(e)}
})();