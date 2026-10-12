// Do not initialize queues or render the legacy data before the release is ready.
(async function(){
  const app=document.getElementById('app');
  function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(new Error('运行文件加载失败：'+src));document.body.appendChild(el)})}
  try{
    if(state.srsSchema!=='ku_id-v1'&&Object.keys(state.records||{}).some(k=>k.includes('::')))
      for(const src of ['lexicon-core-001.js','lexicon-core-002.js','lexicon-core-003.js'])await script(src);
    await loadCore13000();
    for(const src of ['daily.js?v=core13000-1','ipa-accent.js?v=core13000-1','app-runtime.js?v=core13000-1'])await script(src);
    state.view='scenes';state.scene=null;state.revealed=false;
    render();app.removeAttribute('role');
  }catch(error){
    console.error('[PAI Word load]',error);
    app.replaceChildren();const message=document.createElement('p');message.textContent='词库加载失败：'+error.message;
    const retry=document.createElement('button');retry.textContent='重新加载';retry.onclick=()=>location.reload();app.append(message,retry);
  }
})();
