(async function(){
 const VERSION='core20k-v21-scene38';window.PAI_APP_VERSION=VERSION;
 const app=document.getElementById('app');
 function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src+'?v='+VERSION;el.onload=resolve;el.onerror=()=>reject(Error('应用文件加载失败: '+src));document.body.appendChild(el)})}
 async function json(src){const r=await fetch(src+'?v='+VERSION,{cache:'no-store'});if(!r.ok)throw Error('数据文件加载失败: '+src);return r.json()}
 async function sceneMembership(){
  try{return await json('data/scene500-playable-membership-v2.json')}
  catch(v2Error){
   console.warn('Scene500 membership V2 unavailable; falling back to V1.',v2Error);
   return json('data/scene500-playable-membership-v1.json');
  }
 }
 try{
  await loadLearningCatalog();
  window.PAI_SCENE500_MEMBERSHIP_POLICY=await json('data/scene500-ranked-membership-policy-v1.json');
  window.PAI_SCENE500_MEMBERSHIP=await sceneMembership();
  await script('rebuild-preview/learning-runtime.js');
  await script('audio-compat.js');
  await script('scene500-integrated.js');
  await script('scene500-sense-review.js');
  await script('scene-search.js');
  await script('rebuild-preview/home-dashboard.js');
  await script('rebuild-preview/round-policy.js');
  // Canonical Scene500 Top100 is integrated into the existing search and learning UI.
  const preboot=window.PAI_PREVIEW_PENDING_SEARCH;
  const typed=document.getElementById('scene-query')?.value||'';
  const difficulty=document.getElementById('scene-difficulty')?.value||'all';
  state.sceneSearchUi={...(state.sceneSearchUi||{}),query:preboot?.query||typed||state.sceneSearchUi?.query||'',difficulty:preboot?.difficulty||state.sceneSearchUi?.difficulty||difficulty,resultIds:preboot?.query?[]:(state.sceneSearchUi?.resultIds||[])};
  state.view='scenes';state.revealed=false;render();app.removeAttribute('role');document.body.classList.add('pai-boot-ready');
  if(state.sceneSearchUi?.query&&typeof window.restoreScene500Recommendations==='function')window.restoreScene500Recommendations();
  // Optional packs must never replace an already usable homepage with a fatal loading screen.
  try{
  // Non-critical Scene500 packs and inventory load after first interactive home render.
  if((window.PAI_CORE20K_ROOT===true||new URLSearchParams(location.search).get('core20k')==='1')){
   const {installScene500Top100}=await import(new URL('scripts/scene500-top100-loader.mjs',document.baseURI).href);
   await installScene500Top100();
  }
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

  }catch(error){console.warn('Optional Scene500 data unavailable; homepage remains usable',error)}

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