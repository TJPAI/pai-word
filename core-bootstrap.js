// Do not initialize queues or render the legacy data before the release is ready.
(async function(){
  const app=document.getElementById('app');
  function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(new Error('运行文件加载失败：'+src));document.body.appendChild(el)})}
  function registerOfflineShell(){
    if(!('serviceWorker' in navigator))return;
    navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{
      if(window.PAI_LOCAL_LEXICON){window.PAI_LOCAL_LEXICON.shellReady=true;window.dispatchEvent(new CustomEvent('pai-offline-status'))}
    }).catch(error=>console.warn('[PAI Word] service worker unavailable',error));
  }
  try{
    if(state.srsSchema!=='ku_id-v1'&&Object.keys(state.records||{}).some(k=>k.includes('::')))
      for(const src of ['lexicon-core-001.js','lexicon-core-002.js','lexicon-core-003.js'])await script(src);
    await loadCore13000();

    const v21=new URLSearchParams(location.search).get('v21')==='1';
    if(v21){
      for(const src of ['learning-evidence.js?v=3','v21-legacy-import.js?v=1','v21-content.js?v=1','v21-app-v2.js?v=1'])await script(src);
      await window.PAI_V21_LEGACY_IMPORT.run();
      await window.PAI_V21_APP.boot();
      app.removeAttribute('role');registerOfflineShell();return;
    }

    for(const src of ['daily.js?v=core13000-4','ipa-accent.js?v=core13000-1','app-runtime.js?v=core13000-2','product-v2.js?v=core13000-2'])await script(src);
    state.view='scenes';state.scene=null;state.revealed=false;
    const previewWord=new URLSearchParams(location.search).get('word');
    const preview=window.PAI_CORE.byLemma.get(previewWord)?.[0];
    if(preview){state.view='wordPreview';state.previewKU=Object.keys(preview.s)[0];state.revealed=true;}
    render();app.removeAttribute('role');registerOfflineShell();
  }catch(error){
    console.error('[PAI Word load]',error);
    app.replaceChildren();const message=document.createElement('p');message.textContent='词库加载失败：'+error.message;
    const retry=document.createElement('button');retry.textContent='重新加载';retry.onclick=()=>location.reload();app.append(message,retry);
  }
})();
