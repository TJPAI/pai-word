// Independent home-only renderer. No learning-runtime, no global render override.
// Caller supplies an authoritative budget summary; never fabricate learning stats.
const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const levels=['all','basic','common','advanced','high'];
const labels={all:'全部',basic:'基础',common:'常用',advanced:'进阶',high:'高阶'};
export function buildLightHomeView({index,query='',difficulty='all',results=[],budget,continueScene=null}){
 if(index?.schema!=='pai-word-v21-home-index-v1'||Object.keys(index.scenes||{}).length!==500)throw Error('HOME_INDEX_REQUIRED');
 if(!budget||!Number.isFinite(budget.dailyCompleted)||!Number.isFinite(budget.dailyLimit)||!Number.isFinite(budget.roundLimit)||!Number.isFinite(budget.due)||!Number.isFinite(budget.reinforcementRemaining))throw Error('AUTHORITATIVE_HOME_BUDGET_REQUIRED');
 const level=levels.includes(difficulty)?difficulty:'all';
 const rows=results.map(id=>({id,scene:index.scenes[id]})).filter(r=>r.scene);
 const items=rows.map(({id,scene},i)=>`<button class="scene-result" data-scene-id="${esc(id)}"><span class="scene-result-no">${String(i+1).padStart(2,'0')}</span><span class="scene-result-main"><b>${esc(scene.name)}</b><small>${esc(scene.desc)}</small></span><span class="scene-result-count"><b>${scene.counts[level]}</b><small>可学 KU</small><em>Top100</em></span></button>`).join('');
 const recommendation=query.trim()?(rows.length?`<section class="scene-results"><div class="scene-results-head"><h3>为你推荐</h3><span>${labels[level]}</span></div>${items}</section>`:'<div class="scene-search-empty">没有找到当前可直接学习的匹配场景。可换一种说法，或先浏览场景目录。</div>'):'';
 const last=continueScene&&index.scenes[continueScene]?continueScene:null;
 return `<div class="home-dashboard"><div class="home-shell"><header class="home-topbar"><div class="home-brand"><h1>PAI Word</h1><p>场景化高效英语词汇学习</p></div><div class="home-actions"><button data-home-action="stats" class="home-quiet-btn">统计</button><button data-home-action="settings" class="home-quiet-btn">设置</button></div></header><main class="home-focus"><section class="continue-card"><div><span class="eyebrow">继续学习</span><h2>${esc(last?index.scenes[last].name:'开始一个场景')}</h2><p>今日新词 ${budget.dailyCompleted}/${budget.dailyLimit} · 每轮 ${budget.roundLimit}${budget.reinforcementRemaining?` · 强化 ${budget.reinforcementRemaining}`:''}${budget.due?` · 到期 ${budget.due}`:''}</p></div><div class="continue-actions">${last?`<button class="continue-primary" data-scene-id="${esc(last)}">继续</button>`:''}</div></section><section class="scene-search-card"><div class="scene-search-title"><span class="eyebrow">Scene500</span><h2>你现在想学什么？</h2><p>直接说一句你想学习的场景。</p></div><textarea id="scene-query" class="scene-query" rows="3" placeholder="我要去美国参加学术会议，还要坐飞机和住酒店。">${esc(query)}</textarea><div class="scene-search-controls"><label>难度<select id="scene-difficulty">${levels.map(d=>`<option value="${d}"${level===d?' selected':''}>${labels[d]}</option>`).join('')}</select></label><button class="find-scenes" data-home-action="search">找场景</button></div>${recommendation}</section></main></div></div>`;
}
export function mountLightHome({element,index,state,budget,search,onScene,onAction}){
 if(!element||typeof search!=='function'||typeof onScene!=='function'||typeof onAction!=='function')throw Error('HOME_CALLBACKS_REQUIRED');
 const show=()=>{
  const q=state.sceneSearchUi?.query||'',d=state.sceneSearchUi?.difficulty||'all';
  element.innerHTML=buildLightHomeView({index,query:q,difficulty:d,results:state.sceneSearchUi?.resultIds||[],budget,continueScene:(state.scene500Recent||[])[0]});
 };
 show();
 element.addEventListener('click',event=>{
  const scene=event.target.closest('[data-scene-id]');if(scene&&element.contains(scene)){onScene(scene.dataset.sceneId,element.querySelector('#scene-difficulty')?.value||'all');return}
  const action=event.target.closest('[data-home-action]');if(!action||!element.contains(action))return;
  if(action.dataset.homeAction==='search'){
   const query=element.querySelector('#scene-query')?.value.trim()||'';
   const difficulty=element.querySelector('#scene-difficulty')?.value||'all';
   state.sceneSearchUi={query,difficulty,resultIds:search(query,difficulty).map(s=>s.id)};
   show();
  }else onAction(action.dataset.homeAction);
 });
 element.addEventListener('change',event=>{
  if(event.target.id!=='scene-difficulty')return;
  const query=element.querySelector('#scene-query')?.value.trim()||'';
  const difficulty=event.target.value;
  state.sceneSearchUi={query,difficulty,resultIds:query?search(query,difficulty).map(s=>s.id):[]};
  show();
 });
 return {render:show};
}
