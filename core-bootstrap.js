(async function(){
 const VERSION='tap-v60-uncapped-scenes';window.PAI_APP_VERSION=VERSION;
 const app=document.getElementById('app');
 function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src+'?v='+VERSION;el.onload=resolve;el.onerror=()=>reject(Error('应用文件加载失败: '+src));document.body.appendChild(el)})}
 try{
  await loadLearningCatalog();
  await script('learning-runtime.js');
  await script('audio-compat.js');
  await script('scene500-integrated.js');
  await script('scene-search.js');
  await script('home-dashboard.js');
  await script('round-policy.js');
  state.view='scenes';state.revealed=false;render();app.removeAttribute('role');
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
 }catch(e){app.innerHTML='<div class="screen"><h1>PAI Word</h1><p id="load-error"></p><button onclick="location.reload()">重新加载</button></div>';document.getElementById('load-error').textContent=e.message;console.error(e)}
})();