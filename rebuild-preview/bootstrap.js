(async function(){
 const VERSION='core20k-v21-catalog-restored-20261022';window.PAI_APP_VERSION=VERSION;
 const app=document.getElementById('app');
 const bootStarted=performance.now(),timings={};
 const mark=label=>{timings[label]=Math.round(performance.now()-bootStarted);window.PAI_BOOT_TIMINGS={...timings}};
 mark('bootstrap');

 function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.async=false;el.src=src+'?v='+VERSION;el.onload=resolve;el.onerror=()=>reject(Error('应用文件加载失败: '+src));document.body.appendChild(el)})}
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
  let durableDB=null;
  try{
   durableDB=await window.PAI_KU_DURABLE.open();
   const previous=await window.PAI_KU_DURABLE.initialize(durableDB,state);
   window.PAI_KU_DURABLE_VERSION=previous.version;
   // Restore each domain independently; a missing KU snapshot must not hide saved home/settings.
   if(previous?.snapshot?.records)state={...state,...previous.snapshot};
   const settings=await window.PAI_KU_DURABLE.readSettings(durableDB);
   if(settings&&typeof settings==='object')state={...state,...settings};
   const home=await window.PAI_KU_DURABLE.readHome(durableDB);
   if(home&&typeof home==='object'){
    for(const key of ['sceneSearchUi','scene500Recent','scene500DifficultyByScene'])if(Object.prototype.hasOwnProperty.call(home,key))state[key]=home[key];
   }
   state.view='scenes';state.revealed=false;
   window.PAI_KU_DURABLE_DB=durableDB;
   window.PAI_KU_STORAGE_READY=true;
  }catch(storageError){
   window.PAI_KU_STORAGE_READY=false;
   window.PAI_KU_STORAGE_FATAL=true;
   console.warn('Durable KU storage unavailable; rating writes must not silently succeed',storageError);
  }
  const catalogReady=loadLearningCatalog();
  const policyReady=json('data/scene500-ranked-membership-policy-v1.json');
  const membershipReady=sceneMembership();
  await catalogReady;mark('catalog');
  [window.PAI_SCENE500_MEMBERSHIP_POLICY,window.PAI_SCENE500_MEMBERSHIP]=await Promise.all([policyReady,membershipReady]);mark('memberships');
  // Non-async dynamic scripts execute in insertion order while downloads can overlap.
  // Never change order: each runtime overlay wraps state and render from its predecessor.
  const runtimeScripts=[
   'rebuild-preview/memory-schedulers.js',
   'rebuild-preview/learning-runtime.js',
   'audio-compat.js',
   'scene500-integrated.js',
   'scene500-sense-review.js',
   'scene-search.js',
   'rebuild-preview/home-dashboard.js',
   'rebuild-preview/scene-catalog.js',
   'rebuild-preview/round-policy.js'
  ];
  await Promise.all(runtimeScripts.map(src=>script(src)));
  mark('startupScripts');
  // Canonical Scene500 Top100 is integrated into the existing search and learning UI.
  const preboot=window.PAI_PREVIEW_PENDING_SEARCH;
  const typed=document.getElementById('scene-query')?.value||'';
  const difficulty=document.getElementById('scene-difficulty')?.value||'all';
  state.sceneSearchUi={...(state.sceneSearchUi||{}),query:preboot?.query||state.sceneSearchUi?.query||typed||'',difficulty:preboot?.difficulty||state.sceneSearchUi?.difficulty||difficulty,resultIds:preboot?.query?[]:(state.sceneSearchUi?.resultIds||[])};
  state.view='scenes';state.revealed=false;
  // Assemble final home content behind the boot gate; expose it only once.

  // Preserve the saved search during bootstrap; refresh it again once Top100 is ready.
  if(state.sceneSearchUi?.query&&typeof window.restoreScene500Recommendations==='function'){
   window.restoreScene500Recommendations();
   mark('recommendationsAfterPacks');
  }

  if(!state.sceneSearchUi?.query)render();
  mark('homeRendered');app.removeAttribute('role');document.body.classList.add('pai-boot-ready');
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
    if(window.PAI_SCENE500_TOP100_READY){
     await window.PAI_SCENE500_TOP100_READY;
     if(state.view==='scenes'&&typeof window.restoreScene500Recommendations==='function')window.restoreScene500Recommendations();
    }
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