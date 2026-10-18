// Canonical S001-S500 Top100 pilot. Separate from legacy cs demo scenes.
(function(){
 const enabled=new URLSearchParams(location.search).get('core20k')==='1';
 if(!enabled)return;
 const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 async function init(){
  const {parseScene500Taxonomy}=await import('./scripts/scene500-v40-taxonomy.mjs');
  const response=await fetch('data/scene500-taxonomy-20x25-v1.txt');
  if(!response.ok)throw Error('Scene500 taxonomy failed');
  const scenes=parseScene500Taxonomy(await response.text());
  const opts=scenes.map(s=>'<option value="'+s.id+'">'+s.id+' '+esc(s.name)+'</option>').join('');
  const baseRender=window.render;
  const inventory=window.PAI_SCENE500_V40_INVENTORY?.scenes||{};
  window.render=function(){
   const result=baseRender();
   for(const old of document.querySelectorAll('.scene-results,.scene-search-card'))old.hidden=true;
   if(state.view==='scenes'||state.view==='home'){
    const host=document.querySelector('.home-dashboard')||document.querySelector('#app');
    if(host&&!document.querySelector('#scene500-top100-panel')){
     const el=document.createElement('section');el.id='scene500-top100-panel';el.style.cssText='margin:16px;padding:16px;border:1px solid #9995;border-radius:12px';
     el.innerHTML='<h3>Scene500 · Top100（试验）</h3><p>每场景固定检查原始排名前100；实际可学数量由 KU 门禁决定，每轮学习数量独立设置。通用 Sense 不代表场景词义已审核。</p><select id="scene500-top100-id" style="max-width:100%;padding:8px">'+opts+'</select> <button id="scene500-top100-start" style="padding:8px">学习此场景</button><p id="scene500-top100-status" role="status"></p>';
     host.prepend(el);
     const selector=el.querySelector('select');
     const status=el.querySelector('#scene500-top100-status');
     const showScope=()=>{const id=selector.value;const n=inventory[id]?.candidates;status.textContent='场景 '+id+'：Top100 排名范围，完整候选池 '+(Number.isFinite(n)?n:'约1000')+'；点击学习后校验实际可学数量。';};
     selector.addEventListener('change',showScope);showScope();
     // The legacy cs demo recommendation list only has ten seed words per scene.
     // Hide it in explicit Core20K Top100 testing to avoid presenting stale 10-word counts.
     for(const old of host.querySelectorAll('.scene-results,.scene-search-card'))old.hidden=true;
     el.querySelector('button').onclick=async()=>{
      const btn=el.querySelector('button'),label=el.querySelector('#scene500-top100-status'),id=el.querySelector('select').value;
      btn.disabled=true;label.textContent='正在校验 Top100…';
      try{
       const {loadSceneTop100}=await import('./scripts/scene500-top100-runtime.mjs');
       const qa=await loadSceneTop100(window.PAI_CORE,id);
       const units=window.PAI_CORE.byScene.get(id);
       const eligible=units.filter(u=>!state.records?.[u.k]);
       // Scene vocabulary is the entire eligible subset of V4 ranks 1–100.
       // wordsPerRound is a study preference, never a Scene500 vocabulary cap.
       const queue=eligible.map(u=>u.k);
       label.textContent='Top100：当前可学 '+qa.playable+'；暂不可学 '+qa.blocked+'；未学 '+queue.length+'（不是10词上限）';
       if(!queue.length)return;
       state.selectedScene=id;
       state.learningSession={date:new Date().toISOString().slice(0,10),kind:'scene',title:scenes.find(s=>s.id===id).name+' · Top100',queue,total:queue.length,completed:[],seen:{},attempts:0};
       state.view='learning';state.revealed=false;
       save();window.resumeLearning();
      }catch(e){label.textContent='无法开始：'+String(e.message||e)}finally{btn.disabled=false}
     };
    }
   }
   return result;
  };
  window.render();
 }
 init().catch(e=>console.error('Scene500 Top100 init',e));
})();
