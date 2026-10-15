(async function(){
 const app=document.getElementById('app');
 function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src+'?v=lexicon-v4';el.onload=resolve;el.onerror=()=>reject(Error('应用文件加载失败：'+src));document.body.appendChild(el)})}
 try{
  await loadLearningCatalog();
  if(!SCENES[state.selectedScene]){state.selectedScene=window.PAI_DEFAULT_SCENE||Object.keys(SCENES)[0];state.daily=null;save()}
  for(const src of ['daily.js','app-runtime.js','ku-content-ui.js','tap-flow.js','scene-review-v4.js','learning-app.js'])await script(src);
  await script('v4-ui.js');
  state.view='scenes';state.revealed=false;render();app.removeAttribute('role');
  const lemma=new URLSearchParams(location.search).get('word'),w=window.PAI_CORE.byLemma.get(lemma)?.[0];if(w)openLexiconWord(w.rank);
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').then(()=>{window.PAI_LOCAL_LEXICON.shellReady=true}).catch(()=>{});
 }catch(e){app.innerHTML='<div class="screen"><h1>PAI Word</h1><p id="load-error"></p><button onclick="location.reload()">重新加载</button></div>';document.getElementById('load-error').textContent=e.message;console.error(e)}
})();
