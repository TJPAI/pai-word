// Scene500 sentence-search home only. Study/question/answer/settings/review flows remain owned by learning-runtime.js.
(function(){
  const baseRender=window.render;
  if(typeof baseRender!=='function')return;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  const searchApi=()=>window.PAI_SCENE_SEARCH;
  const displayName=id=>window.PAI_SCENE_NAMES?.[id]||SCENES[id]||indexedScenes().byId.get(id)?.name||'';
  function dueCount(){
    const engineDue=window.PAI_LEARNING_QA?.due?.();
    if(Array.isArray(engineDue))return engineDue.length;
    const now=Date.now();let n=0;
    for(const [k,r] of Object.entries(state.records||{}))if(window.PAI_CORE?.byKU?.has(k)&&(r?.learningPending||r?.lastKnown===false||r?.due<=now))n++;
    return n;
  }
  function budget(){
    const b=window.studyBudgetSummary?.();
    if(b)return b;
    const dailyLimit=Number(state.newPerDay)||50,due=dueCount();
    return {dailyLimit,dailyCompleted:0,dailyRemaining:dailyLimit,roundLimit:Number(state.wordsPerRound)||10,reinforcementRemaining:0,due};
  }
  function lastScene(){const id=(state.scene500Recent||[])[0]||null;return id&&displayName(id)?{id,name:displayName(id)}:null}
  const excludedSceneIds=new Set(['cs206','cs215','cs223','cs254','cs321']);
  let sceneIndexSource=null,sceneIndex=null;
  function indexedScenes(){
    const source=window.PAI_SCENE500?.specs;
    if(source!==sceneIndexSource||!sceneIndex){
      sceneIndexSource=source;
      const list=(source||[]).filter(s=>!excludedSceneIds.has(s.id));
      sceneIndex={list,byId:new Map(list.map(s=>[s.id,s]))};
    }
    return sceneIndex;
  }
  function playable(){return indexedScenes().list}
  function inventory(id,difficulty='all'){return searchApi()?.inventory?.(id,difficulty)||{reviewedCount:searchApi()?.wordCount?.(id,difficulty)||0,candidateCount:null}}
  function firstPlayable(){return playable().find(s=>inventory(s.id,'all').reviewedCount>0)?.id||null}
  function difficultyLabel(v){return({all:'全部',basic:'基础',common:'常用',advanced:'进阶',high:'高阶'})[v]||'全部'}
  function ui(){state.sceneSearchUi=state.sceneSearchUi||{query:'',difficulty:'all',resultIds:[]};return state.sceneSearchUi}
  function resultRows(){
    const snapshot=ui();
    if(!snapshot.query||!Array.isArray(snapshot.resultIds))return [];
    // Preserve exactly the submitted result IDs/order. Scene specs and Top100
    // are hydrated later and must not replace names or drop snapshot rows.
    return snapshot.resultIds.slice(0,5).map(id=>{
      const name=window.PAI_SCENE_NAMES?.[id]||SCENES[id]||'';
      return name?{id,name,desc:'',...inventory(id,snapshot.difficulty)}:null;
    }).filter(Boolean);
  }
  function countHtml(r){
    if(window.PAI_SCENE500_TOP100?.loading)return '<span class="scene-result-count"><b>加载中</b><small>可学词数待计算</small></span>';
    if(window.PAI_SCENE500_TOP100?.error)return '<span class="scene-result-count"><b>不可用</b><small>场景词池加载失败</small></span>';
    if((window.PAI_CORE20K_ROOT===true||new URLSearchParams(location.search).get('core20k')==='1'))return '<span class="scene-result-count"><b>'+r.reviewedCount+'</b><small>可学 KU</small><em>Top100</em></span>';
    if(window.PAI_SCENE500_TOP100&&Number.isFinite(r.candidateCount))return `<span class="scene-result-count"><b>${r.candidateCount}</b><small>Top100</small><em>${r.reviewedCount} 可学·通用义</em></span>`;
    if(Number.isFinite(r.candidateCount))return `<span class="scene-result-count"><b>${r.candidateCount}</b><small>候选</small><em>${r.reviewedCount} 已审核</em></span>`;
    return `<span class="scene-result-count"><b>${r.reviewedCount}</b><small>已审核</small></span>`;
  }
  function resultHtml(){
    const s=ui(),rows=resultRows();
    if(!s.query)return'';
    if(!rows.length)return '<div class="scene-search-empty">没有找到当前可直接学习的匹配场景。可换一种说法，或先浏览场景目录。</div>';
    return `<section class="scene-results"><div class="scene-results-head"><h3>为你推荐</h3><span>${esc(difficultyLabel(s.difficulty))}</span></div>${rows.map((r,i)=>`<button class="scene-result" onclick="PAI_SCENE_SEARCH.open('${esc(r.id)}','${esc(s.difficulty)}')"><span class="scene-result-no">${String(i+1).padStart(2,'0')}</span><span class="scene-result-main"><b>${esc(r.name)}</b><small>${esc(r.desc||'')}</small></span>${countHtml(r)}</button>`).join('')}<p class="scene-results-note">当前“可学·通用义”仅表示已有唯一有效通用 Sense，不代表场景专属词义已审核。Top100 不等于每轮学习量。</p></section>`;
  }
  function recentHtml(){
    // Recent history is already persisted. Never filter it through an index that
    // changes while Scene500/Top100 data loads in the background.
    const ids=Array.isArray(state.scene500Recent)?state.scene500Recent:[];
    const rows=ids.map(id=>({id,name:displayName(id)})).filter(s=>s.name).slice(0,3);
    if(!rows.length)return'';
    return `<section class="home-recent"><div class="home-section-head"><h3>最近学习</h3></div><div class="recent-row">${rows.map(s=>`<button onclick="PAI_SCENE_SEARCH.open('${esc(s.id)}','${esc(searchApi()?.recentDifficulty?.(s.id)||'all')}')">${esc(s.name)}</button>`).join('')}</div></section>`;
  }
  function canResumeScene(scene){
    return !!(scene&&state.learningSession?.kind==='scene'&&state.selectedScene===scene&&state.learningSession.scene500Difficulty===(searchApi()?.recentDifficulty?.(scene)||'all')&&Array.isArray(state.learningSession.queue)&&state.learningSession.queue.length);
  }
  function renderHome(){
    const b=budget(),last=lastScene(),fallback=last?null:firstPlayable(),s=ui();
    const sceneLoad=window.PAI_SCENE500_TOP100?.error?'Scene500 词池加载失败，请刷新重试':'';
    const continueId=last?.id||fallback,continueDifficulty=last?searchApi()?.recentDifficulty?.(last.id)||'all':'all';
    const resume=canResumeScene(continueId);
    const status=`今日新词 ${b.dailyCompleted}/${b.dailyLimit} · 每轮 ${b.roundLimit}${b.reinforcementRemaining?` · 强化 ${b.reinforcementRemaining}`:''}${b.due?` · 到期 ${b.due}`:''}`;
    return `<div class="home-dashboard"><div class="home-shell">
      <header class="home-topbar"><div class="home-brand"><h1>PAI Word</h1><p>场景化高效英语词汇学习</p></div><div class="home-actions"><button class="home-quiet-btn" onclick="openPanel('stats')">统计</button><button class="home-quiet-btn" onclick="openPanel('settings')">设置</button></div></header>
      <main class="home-focus">${sceneLoad?`<p class="scene-note" role="status">${esc(sceneLoad)}</p>`:''}
        <section class="continue-card"><div><span class="eyebrow">继续学习</span><h2>${esc(last?.name||'开始一个场景')}</h2><p>${esc(status)}</p></div><div class="continue-actions">${continueId?`<button class="continue-primary" onclick="continueScene500('${esc(continueId)}','${esc(continueDifficulty)}')">${resume?'继续本轮':'继续'}</button>`:''}${b.reinforcementRemaining?`<button class="continue-review" onclick="openReinforcement()">强化 ${b.reinforcementRemaining}</button>`:''}${b.due?`<button class="continue-review" onclick="openReview()">复习 ${b.due}</button>`:''}</div></section>
        <section class="scene-search-card"><div class="scene-search-title"><span class="eyebrow">Scene500</span><h2>你现在想学什么？</h2><p>直接说一句你的场景，例如“我要去美国参加学术会议，还要坐飞机和住酒店”。</p></div>
          <textarea id="scene-query" class="scene-query" rows="3" placeholder="我要去美国参加学术会议，还要坐飞机和住酒店。">${esc(s.query||'')}</textarea>
          <div class="scene-search-controls"><label>难度<select id="scene-difficulty" onchange="refreshScene500Difficulty(this.value)"><option value="all" ${s.difficulty==='all'?'selected':''}>全部</option><option value="basic" ${s.difficulty==='basic'?'selected':''}>基础</option><option value="common" ${s.difficulty==='common'?'selected':''}>常用</option><option value="advanced" ${s.difficulty==='advanced'?'selected':''}>进阶</option><option value="high" ${s.difficulty==='high'?'selected':''}>高阶</option></select></label><button class="find-scenes" onclick="findScene500()">找场景</button></div>
          ${resultHtml()}
        </section>
        ${recentHtml()}
        <div class="browse-link"><button type="button" class="catalog-back" onclick="PAI_OPEN_CATALOG_LAZY()">浏览场景目录 →</button><span>Scene500 场景词池独立于“每轮单词数”；当前只让已审核 Sense/KU 直接进入学习。</span></div>
      </main>
    </div></div>`;
  }
  function runSceneSearch(q,difficulty,{restore=false}={}){
    // A saved recommendation must not be replaced by a transient empty index
    // during boot. Explicit user searches may legitimately have zero matches.
    const results=searchApi()?.search(q,difficulty,5)||[];
    const ids=results.map(x=>x.id);
    const previous=ui();
    const preserved=restore&&ids.length===0&&previous.query===q&&Array.isArray(previous.resultIds)&&previous.resultIds.length>0;
    state.sceneSearchUi={query:q,difficulty,resultIds:preserved?previous.resultIds:ids};
    if(!preserved)save();
    render();
  }
  window.restoreScene500Recommendations=function(){
    const s=ui(),q=(s.query||'').trim();
    if(!q)return;
    // Recalculate against the current Scene500 index, without scrolling the page.
    runSceneSearch(q,s.difficulty||'all',{restore:true});
  };
  window.findScene500=function(){
    const q=document.getElementById('scene-query')?.value?.trim()||'';
    const difficulty=document.getElementById('scene-difficulty')?.value||'all';
    runSceneSearch(q,difficulty);
    requestAnimationFrame(()=>document.querySelector('.scene-results,.scene-search-empty')?.scrollIntoView({block:'nearest',behavior:'smooth'}));
  };
  window.refreshScene500Difficulty=function(difficulty){
    const s=ui();
    const q=(document.getElementById('scene-query')?.value||s.query||'').trim();
    if(!s.query||!q){state.sceneSearchUi={...s,difficulty};save();return}
    runSceneSearch(q,difficulty||'all');
  };
  window.continueScene500=function(scene,difficulty='all'){
    if(canResumeScene(scene)&&state.learningSession.scene500Difficulty===difficulty&&typeof window.resumeLearning==='function')return window.resumeLearning();
    return searchApi()?.open(scene,difficulty);
  };
  window.PAI_HOME_DASHBOARD_RENDER=renderHome;
  window.render=function(){if(state.view==='scenes'){document.getElementById('app').innerHTML=renderHome();return}return baseRender()};
})();
