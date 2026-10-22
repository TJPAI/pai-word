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
 return `<div class="home-dashboard"><div class="home-shell"><header class="home-topbar"><div class="home-brand"><h1>PAI Word</h1><p>场景化高效英语词汇学习</p></div><div class="home-actions"><button data-home-action="stats" class="home-quiet-btn">统计</button><button data-home-action="settings" class="home-quiet-btn">设置</button></div></header><main class="home-focus"><section class="continue-card"><div><span class="eyebrow">继续学习</span><h2>${esc(last?index.scenes[last].name:'开始一个场景')}</h2><p>今日新词 ${budget.dailyCompleted}/${budget.dailyLimit} · 每轮 ${budget.roundLimit}${budget.reinforcementRemaining?` · 强化 ${budget.reinforcementRemaining}`:''}${budget.due?` · 到期 ${budget.due}`:''}</p></div><div class="continue-actions">${last?`<button class="continue-primary" data-scene-id="${esc(last)}">继续</button>`:''}</div></section><section class="scene-search-card"><div class="scene-search-title"><span class="eyebrow">Scene500</span><h2>你现在想学什么？</h2><p>直接说一句你想学习的场景。</p></div><textarea id="scene-query" class="scene-query" rows="3" placeholder="我要去美国参加学术会议，还要坐飞机和住酒店。">${esc(query)}</textarea><div class="scene-search-controls"><label>难度<select id="scene-difficulty">${levels.map(d=>`<option value="${d}"${level===d?' selected':''}>${labels[d]}</option>`).join('')}</select></label><button class="find-scenes" data-home-action="search">找场景</button></div>${recommendation}</section><div class="browse-link"><button type="button" data-home-action="catalog">浏览场景目录 →</button></div></main></div></div>`;
}
const categoryNames=['日常起居与家庭生活','餐饮与食品','购物与消费','出行与城市交通','旅行与旅游','学校与学习','大学与学术研究','工作与职场','求职与职业发展','商务与企业经营','数字生活与互联网','科技、AI与工程','医疗与健康','运动与健身','娱乐、文化与休闲','社交、人际与情感','公共服务、法律与社会生活','语言功能与沟通任务','自然、环境与世界','认知、表达与高级思维'];
function catalogView(index,{category=0,query=''}={},difficulty='all'){
 const d=levels.includes(difficulty)?difficulty:'all',q=query.trim().toLowerCase();
 const rows=Object.entries(index.scenes).filter(([id,s])=>q?[id,s.name,s.desc,...s.tags].join(' ').toLowerCase().includes(q):Math.floor((Number(id.slice(1))-1)/25)===category);
 return `<section class="scene-catalog" style="max-width:820px;margin:0 auto;padding:16px"><header class="catalog-head"><button type="button" data-home-action="back">← 返回</button><h2>浏览场景目录</h2></header><div class="catalog-tools"><input id="catalog-query" type="search" autocomplete="off" placeholder="搜索500个场景" value="${esc(query)}"><button type="button" data-home-action="catalog-search">搜索</button><select id="scene-difficulty" aria-label="难度">${levels.map(x=>`<option value="${x}" ${x===d?'selected':''}>${labels[x]}</option>`).join('')}</select></div><nav class="catalog-cats" aria-label="场景大类" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0">${categoryNames.map((name,i)=>`<button type="button" data-catalog-category="${i}" aria-pressed="${!q&&i===category}">${String(i+1).padStart(2,'0')} ${esc(name)}</button>`).join('')}</nav><p>${q?'搜索结果 '+rows.length+' 个':esc(categoryNames[category])+' · '+rows.length+' 个场景'}</p><div class="catalog-items" style="display:grid;gap:8px">${rows.map(([id,scene])=>`<button type="button" data-scene-id="${id}" style="text-align:left;padding:12px"><b>${id} · ${esc(scene.name)}</b> <small>${scene.counts[d]} 可学 KU</small></button>`).join('')}</div></section>`;
}
export function mountLightHome({element,index,state,budget,search,onScene,onAction,persist}){
 if(!element||typeof search!=='function'||typeof onScene!=='function'||typeof onAction!=='function'||typeof persist!=='function')throw Error('HOME_CALLBACKS_REQUIRED');
 let catalogOpen=false,cat={category:0,query:''};
 const show=()=>{
  const q=state.sceneSearchUi?.query||'',d=state.sceneSearchUi?.difficulty||'all';
  if(catalogOpen){element.innerHTML=catalogView(index,cat,d);return}
  element.innerHTML=buildLightHomeView({index,query:q,difficulty:d,results:state.sceneSearchUi?.resultIds||[],budget,continueScene:(state.scene500Recent||[])[0]});
 };
 show();
 element.addEventListener('click',event=>{
  const scene=event.target.closest('[data-scene-id]');if(scene&&element.contains(scene)){onScene(scene.dataset.sceneId,element.querySelector('#scene-difficulty')?.value||'all');return}
  const category=event.target.closest('[data-catalog-category]');
  if(category&&catalogOpen){cat={category:Number(category.dataset.catalogCategory),query:''};show();return}
  const action=event.target.closest('[data-home-action]');if(!action||!element.contains(action))return;
  if(action.dataset.homeAction==='catalog'){catalogOpen=true;show();return}
  if(action.dataset.homeAction==='back'){catalogOpen=false;show();return}
  if(action.dataset.homeAction==='catalog-search'){cat.query=element.querySelector('#catalog-query')?.value||'';show();return}
  if(action.dataset.homeAction==='search'){
   const query=element.querySelector('#scene-query')?.value.trim()||'';
   const difficulty=element.querySelector('#scene-difficulty')?.value||'all';
   state.sceneSearchUi={query,difficulty,resultIds:search(query,difficulty).map(s=>s.id)};
   persist(state);show();
  }else onAction(action.dataset.homeAction);
 });
 // Preserve unsubmitted drafts without replacing the textarea during Chinese IME.
 // Only the explicit search button computes/replaces the recommendation list.
 const captureDraft=event=>{
  if(event.target.id!=='scene-query'||event.target.isComposing)return;
  const query=event.target.value;
  const current=state.sceneSearchUi||{};
  state.sceneSearchUi={...current,query,resultIds:query===current.query?current.resultIds:[]};
  persist(state);
 };
 element.addEventListener('compositionend',captureDraft);
 element.addEventListener('change',captureDraft);
 element.addEventListener('change',event=>{
  if(event.target.id!=='scene-difficulty')return;
  if(catalogOpen){state.sceneSearchUi={...(state.sceneSearchUi||{}),difficulty:event.target.value};persist(state);show();return}
  const query=element.querySelector('#scene-query')?.value.trim()||'';
  const difficulty=event.target.value;
  state.sceneSearchUi={query,difficulty,resultIds:query?search(query,difficulty).map(s=>s.id):[]};
  persist(state);show();
 });
 return {render:show};
}
