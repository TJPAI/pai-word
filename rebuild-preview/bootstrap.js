(async function(){
 const VERSION='core20k-v21-light-home-2';window.PAI_APP_VERSION=VERSION;
 const app=document.getElementById('app'),scripts=new Map();
 function script(src){if(!scripts.has(src))scripts.set(src,new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src+'?v='+VERSION;el.onload=resolve;el.onerror=()=>{el.remove();scripts.delete(src);reject(Error('应用文件加载失败: '+src))};document.body.appendChild(el)}));return scripts.get(src)}
 let homeRender,engineRender,initializing=false,runtimeLoaded=false,policyLoaded=false,entry,metadata,index,panels;
 const render=()=>{if(initializing)return;if(state.view==='scenes')return homeRender?.();if(['settings','stats'].includes(state.view))return panels?.render(state.view);return engineRender?.()};
 function notice(text,retry){let box=document.getElementById('learning-load-status');if(!box){box=document.createElement('div');box.id='learning-load-status';box.setAttribute('role','status');box.style.cssText='position:fixed;bottom:16px;left:5%;width:90%;box-sizing:border-box;padding:14px;background:white;border:1px solid #cbd5e1;border-radius:12px;z-index:100';document.body.appendChild(box)}box.textContent=text;if(retry){const b=document.createElement('button');b.textContent='重试';b.onclick=retry;box.appendChild(b)}}
 let navigation=null;
 function intent(kind,scene,difficulty='all'){
  if(!window.PAI_PREVIEW_WRITABLE){notice(window.PAI_PREVIEW_WRITE_REASON,()=>location.reload());return Promise.resolve()}
  if(navigation)return navigation;
  notice('正在准备学习内容…');
  navigation=entry.enter(kind,JSON.stringify({scene,difficulty})).then(()=>document.getElementById('learning-load-status')?.remove()).catch(e=>{console.error(e);notice('学习内容加载失败：'+e.message,()=>intent(kind,scene,difficulty))}).finally(()=>{navigation=null});
  return navigation;
 }
 try{
  await window.acquirePreviewWriter();
  const [{prepareLightweightHome,installLightweightSceneCatalog},{inspectHomeBudget},{createLearningEntry},{createLightPanels}]=await Promise.all([import('./light-home-startup.mjs'),import('./light-home-budget.mjs'),import('./learning-entry.mjs'),import('./light-home-view.mjs')]);
  async function loadMetadata(){
   const compressed=typeof DecompressionStream!=='undefined';
   const response=await fetch('rebuild-preview/data/home-ku-metadata-v1.json'+(compressed?'.gz':''),{cache:'default'});
   if(!response.ok)throw Error('首页统计索引加载失败');
   return compressed?JSON.parse(await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text()):response.json();
  }
  const [prepared,loadedMetadata]=await Promise.all([prepareLightweightHome(),loadMetadata()]);index=prepared.index;metadata=loadedMetadata;
  if(metadata.sourceHash!==index.sourceHash)throw Error('首页数据版本不一致，请刷新重试');
  installLightweightSceneCatalog(prepared);
  const budget=()=>inspectHomeBudget(state,{kuMetadata:metadata});budget();
  window.PAI_HOME_BUDGET=budget;window.studyBudgetSummary=budget;
  panels=createLightPanels({element:app,getState:()=>state,budget,save,home:()=>{state.view='scenes';render()}});
  window.render=()=>panels.render(state.view);
  await script('rebuild-preview/scene-search.js');await script('rebuild-preview/home-dashboard.js');homeRender=window.render;window.render=render;
  function bindHomeActions(){
   window.openPanel=kind=>{if(!['settings','stats'].includes(kind))return;if(engineActions.openPanel)return engineActions.openPanel(kind);state.view=kind;render()};
   window.openReview=()=>intent('review');window.openReinforcement=()=>intent('reinforcement');window.resumeLearning=()=>intent('resume');
  }
  window.PAI_DEFERRED_LEARNING_ENTRY={enter:(scene,difficulty)=>intent('scene',scene,difficulty)};
  const engineActions={};bindHomeActions();
  function captureEngine(){engineRender=window.render;for(const k of ['openScene','resumeLearning','openReview','openReinforcement','openPanel'])if(typeof window[k]==='function')engineActions[k]=window[k]}
  entry=createLearningEntry({load:async()=>{
   initializing=true;
   try{
    if(!window.PAI_CORE){const {tryInstallCore20K}=await import('../scripts/core20k-dev-boot.mjs');await tryInstallCore20K()}
    if(!window.PAI_SCENE500_TOP100||window.PAI_SCENE500_TOP100.error){const {installScene500Top100}=await import('../scripts/scene500-top100-loader.mjs');await installScene500Top100()}
    await window.PAI_SCENE500_TOP100_READY;
    if(!runtimeLoaded){await script('rebuild-preview/learning-runtime.js');runtimeLoaded=true;captureEngine()}
    await script('audio-compat.js');
    if(!policyLoaded){const originalRender=engineRender;window.render=()=>{if(!initializing)originalRender?.()};Object.assign(window,engineActions);await script('rebuild-preview/round-policy.js');policyLoaded=true;captureEngine()}
    window.studyBudgetSummary=budget;
    window.PAI_ENGINE_READY=true;
   }finally{initializing=false;window.render=render;bindHomeActions()}
  },open:async(kind,arg)=>{
   const {scene,difficulty}=JSON.parse(arg);
   if(kind==='scene'){
    state.scene500Recent=[scene,...(state.scene500Recent||[]).filter(id=>id!==scene)].slice(0,5);
    state.scene500DifficultyByScene={...state.scene500DifficultyByScene,[scene]:difficulty};
    return engineActions.openScene(scene);
   }
   return engineActions[{resume:'resumeLearning',review:'openReview',reinforcement:'openReinforcement'}[kind]]();
  }});
  // Restore from the complete projection before the single first home DOM commit.
  const q=state.sceneSearchUi?.query||'',d=state.sceneSearchUi?.difficulty||'all';
  state.sceneSearchUi={query:q,difficulty:d,resultIds:q?PAI_SCENE_SEARCH.search(q,d,5).map(s=>s.id):[]};
  state.view='scenes';homeRender();if(!window.PAI_PREVIEW_WRITABLE)notice(window.PAI_PREVIEW_WRITE_REASON,()=>location.reload());document.body.classList.add('pai-boot-ready');
  window.PAI_HOME_READY_MS=performance.now();performance.mark('pai-home-interactive');
  // Notify preview worker only after valid metadata, search and home DOM are ready.
  const notifyOfflineHomeReady=()=>{const controller=navigator.serviceWorker?.controller;if(controller?.scriptURL?.includes('/rebuild-preview/sw.js'))controller.postMessage({type:'PAI_HOME_BOOT_OK'})};
  window.PAI_STARTUP_REPORT=()=>({version:VERSION,homeInteractiveMs:window.PAI_HOME_READY_MS,engineReady:!!window.PAI_ENGINE_READY,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,transferSize:r.transferSize,duration:r.duration}))});
  if('serviceWorker'in navigator){notifyOfflineHomeReady();navigator.serviceWorker.register(new URL('rebuild-preview/sw.js',document.baseURI),{scope:new URL('rebuild-preview/',document.baseURI).pathname,updateViaCache:'none'}).then(()=>{notifyOfflineHomeReady();navigator.serviceWorker.addEventListener('controllerchange',notifyOfflineHomeReady,{once:true})}).catch(console.warn)}
 }catch(e){document.body.classList.add('pai-boot-ready');app.replaceChildren();const h=document.createElement('h1');h.textContent='PAI Word';const p=document.createElement('p');p.textContent='首页加载失败：'+e.message;const b=document.createElement('button');b.textContent='重新加载';b.onclick=()=>location.reload();app.append(h,p,b);console.error(e)}
})();
