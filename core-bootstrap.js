(async function(){
 const app=document.getElementById('app');
 function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src+'?v=tap-v8';el.onload=resolve;el.onerror=()=>reject(Error('应用文件加载失败'));document.body.appendChild(el)})}
 try{
  await loadLearningCatalog();
  await script('learning-runtime.js');
  state.view='scenes';state.revealed=false;render();app.removeAttribute('role');
  const lemma=new URLSearchParams(location.search).get('word'),w=window.PAI_CORE.byLemma.get(lemma)?.[0];if(w)openLexiconWord(w.rank);
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').then(()=>{window.PAI_LOCAL_LEXICON.shellReady=true}).catch(()=>{});
 }catch(e){app.innerHTML='<div class="screen"><h1>PAI Word</h1><p id="load-error"></p><button onclick="location.reload()">重新加载</button></div>';document.getElementById('load-error').textContent=e.message;console.error(e)}
})();