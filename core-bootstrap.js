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
    if(!['ku_id-v1','ku_id-v2'].includes(state.srsSchema)&&Object.keys(state.records||{}).some(k=>k.includes('::')))
      for(const src of ['lexicon-core-001.js','lexicon-core-002.js','lexicon-core-003.js'])await script(src);
    await loadCore13000();
    // Optional teaching-content enhancement: never block the verified core runtime.
    try{await script('ku-content.js?v=v267i-kucontent-1');if(window.PAI_KU_CONTENT_READY)await window.PAI_KU_CONTENT_READY}catch(error){console.warn('[PAI Word] KU content enhancement skipped',error)}
    for(const src of ['daily.js?v=core13000-4','ipa-accent.js?v=core13000-1','app-runtime.js?v=core13000-2','ku-content-ui.js?v=v267i-kucontent-2','product-v2.js?v=v267i-product-1'])await script(src);
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
