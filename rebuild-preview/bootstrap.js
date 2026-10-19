(async function(){
 const VERSION='core20k-budget-20261019c';window.PAI_APP_VERSION=VERSION;
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
  // Suspend transient home renders until the final home renderer is installed.
  // This preserves the initial lightweight loading markup without a cover or white screen.
  const originalInnerHTML=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  let suppressInterimHome=true;
  Object.defineProperty(app,'innerHTML',{
   configurable:true,
   get(){return originalInnerHTML.get.call(this)},
   set(value){
    if(suppressInterimHome&&typeof state!=='undefined'&&state.view==='scenes')return;
    return originalInnerHTML.set.call(this,value);
   }
  });
  await script('rebuild-preview/learning-runtime.js');
  await script('audio-compat.js');
  await script('scene500-integrated.js');
  await script('scene500-sense-review.js');
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
  await script('scene-search.js');
  await script('home-dashboard.js');
  await script('rebuild-preview/round-policy.js');
  // Canonical Scene500 Top100 is integrated into the existing search and learning UI.
  suppressInterimHome=false;
  delete app.innerHTML;
  state.view='scenes';state.revealed=false;render();app.removeAttribute('role');document.body.classList.add('pai-boot-ready');
  // Explicit, visible data provenance in opt-in testing; never label a 13K page as 20K.
  if((window.PAI_CORE20K_ROOT===true||new URLSearchParams(location.search).get('core20k')==='1')){
   const qa=window.PAI_CORE_QA;
   if(qa?.release!=='Core20K-dev'||qa.words!==20000)throw Error('Core20K mode missing verified runtime');
   const flag=document.createElement('div');
   flag.id='pai-core20k-test-status';
   flag.setAttribute('role','status');
   flag.style.cssText='position:fixed;right:8px;top:env(safe-area-inset-top, 8px);z-index:9999;background:#12372b;color:white;border-radius:8px;padding:5px 9px;font:12px system-ui;pointer-events:none';
   flag.textContent='Core20K TEST · '+qa.words.toLocaleString()+'词 · '+qa.playable.toLocaleString()+'可学Sense';
   document.body.appendChild(flag);
  }
  const lemma=new URLSearchParams(location.search).get('word'),w=window.PAI_CORE.byLemma.get(lemma)?.[0];if(w)openLexiconWord(w.rank);
  if('serviceWorker'in navigator){
   navigator.serviceWorker.addEventListener('message',e=>{
    if(e.data?.type!=='PAI_SHELL_UPDATED')return;
    const next=String(e.data.version||'');
    if(!next||next===VERSION)return;
    const k='pai-shell-reloaded-'+next;
    if(!sessionStorage.getItem(k)){sessionStorage.setItem(k,'1');location.reload()}
   });
   navigator.serviceWorker.register('./sw.js?v='+VERSION).then(()=>{window.PAI_LOCAL_LEXICON.shellReady=true}).catch(()=>{});
  }
 }catch(e){delete app.innerHTML;app.style.visibility='visible';document.body.classList.add('pai-boot-ready');app.innerHTML='<div class="screen"><h1>PAI Word</h1><p id="load-error"></p><button onclick="location.reload()">重新加载</button></div>';document.getElementById('load-error').textContent=e.message;console.error(e)}
})();