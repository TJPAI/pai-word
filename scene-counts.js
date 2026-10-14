// Product-only scene count semantics: show total vocabulary inventory separately from today's queue.
// Loaded after product-v2.js so repaired V26.7I scene metadata is already final.
(function(){
  function sceneWordTotal(scene){
    const units=window.PAI_CORE?.byScene?.get(scene)||[];
    return new Set(units.map(u=>u?.w?.rank??u?.w?.w).filter(v=>v!==undefined&&v!==null)).size;
  }
  function decorateSceneCounts(){
    if(state.view!=='scenes')return;
    const cards=[...document.querySelectorAll('.scene-card')];
    Object.entries(SCENES).forEach(([id],index)=>{
      const card=cards[index];if(!card)return;
      const count=card.querySelector('.scene-count');if(!count)return;
      const total=sceneWordTotal(id);
      const today=typeof todayCount==='function'?todayCount(id):0;
      count.innerHTML=`<b>${total} 词</b><small>今日 ${today}</small>`;
      count.setAttribute('aria-label',`${total} 个词，今日 ${today} 个学习任务`);
    });
  }
  window.PAI_SCENE_COUNTS={sceneWordTotal,decorateSceneCounts};
  const baseRender=window.render;
  window.render=function(){baseRender();decorateSceneCounts()};
  const style=document.createElement('style');
  style.textContent='.scene-count{display:flex;flex-direction:column;align-items:center;gap:2px}.scene-count b{font-size:17px;font-weight:650;color:#222}.scene-count small{font-size:12px;font-weight:500;color:#888}';
  document.head.appendChild(style);
  render();
})();
