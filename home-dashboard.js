// Scene500 sentence-search home only. Study/question/answer/settings/review flows remain owned by learning-runtime.js.
(function(){
  const baseRender=window.render;
  if(typeof baseRender!=='function')return;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const searchApi=()=>window.PAI_SCENE_SEARCH;
  function dueCount(){const now=Date.now();let n=0;for(const [k,r] of Object.entries(state.records||{})){if(window.PAI_CORE?.byKU?.has(k)&&r?.due<=now)n++}return n}
  function learnedCount(){let n=0;for(const k of Object.keys(state.records||{}))if(window.PAI_CORE?.byKU?.has(k))n++;return n}
  function lastScene(){const id=(state.scene500Recent||[])[0]||null;return id&&SCENES[id]?{id,name:SCENES[id]}:null}
  function playable(){return (window.PAI_SCENE500?.specs||[]).filter(s=>!['cs206','cs215','cs223','cs254','cs321'].includes(s.id))}
  function firstPlayable(){return playable().find(s=>(searchApi()?.wordCount(s.id,'all')||0)>0)?.id||null}
  function difficultyLabel(v){return({all:'全部',basic:'基础',common:'常用',advanced:'进阶',high:'高阶'})[v]||'全部'}
  function ui(){state.sceneSearchUi=state.sceneSearchUi||{query:'',difficulty:'all',resultIds:[]};return state.sceneSearchUi}
  function resultRows(){const s=ui();if(!s.query||!s.resultIds?.length)return[];return s.resultIds.map(id=>playable().find(x=>x.id===id)).filter(Boolean).map(x=>({...x,wordCount:searchApi()?.wordCount(x.id,s.difficulty)||0}))}
  function resultHtml(){
    const s=ui(),rows=resultRows();
    if(!s.query)return'';
    if(!rows.length)return '<div class="scene-search-empty">没有找到当前可直接学习的匹配场景。可换一种说法，或先浏览场景目录。</div>';
    return `<section class="scene-results"><div class="scene-results-head"><h3>为你推荐</h3><span>${esc(difficultyLabel(s.difficulty))}</span></div>${rows.map((r,i)=>`<button class="scene-result" onclick="PAI_SCENE_SEARCH.open('${esc(r.id)}','${esc(s.difficulty)}')"><span class="scene-result-no">${String(i+1).padStart(2,'0')}</span><span class="scene-result-main"><b>${esc(r.name)}</b><small>${esc(r.desc||'')}</small></span><span class="scene-result-count">${r.wordCount}<small>词</small></span></button>`).join('')}</section>`;
  }
  function recentHtml(){
    const rows=searchApi()?.recent?.()||[];if(!rows.length)return'';
    return `<section class="home-recent"><div class="home-section-head"><h3>最近学习</h3></div><div class="recent-row">${rows.slice(0,3).map(s=>`<button onclick="PAI_SCENE_SEARCH.open('${esc(s.id)}','${esc(searchApi()?.recentDifficulty?.(s.id)||'all')}')">${esc(s.name)}</button>`).join('')}</div></section>`;
  }
  function renderHome(){
    const due=dueCount(),learned=learnedCount(),last=lastScene(),fallback=firstPlayable(),s=ui();
    const continueId=last?.id||fallback,continueDifficulty=last?searchApi()?.recentDifficulty?.(last.id)||'all':'all';
    return `<div class="home-dashboard"><div class="home-shell">
      <header class="home-topbar"><div class="home-brand"><h1>PAI Word</h1><p>场景化高效英语词汇学习</p></div><div class="home-actions"><button class="home-quiet-btn" onclick="openPanel('stats')">统计</button><button class="home-quiet-btn" onclick="openPanel('settings')">设置</button></div></header>
      <main class="home-focus">
        <section class="continue-card"><div><span class="eyebrow">继续学习</span><h2>${esc(last?.name||'开始一个场景')}</h2><p>${due?`有 ${due} 个到期 KU 待复习`:`已学习 ${learned.toLocaleString()} 个 KU`}</p></div><div class="continue-actions">${continueId?`<button class="continue-primary" onclick="PAI_SCENE_SEARCH.open('${esc(continueId)}','${esc(continueDifficulty)}')">继续</button>`:''}${due?`<button class="continue-review" onclick="openReview()">复习 ${due}</button>`:''}</div></section>
        <section class="scene-search-card"><div class="scene-search-title"><span class="eyebrow">Scene500</span><h2>你现在想学什么？</h2><p>直接说一句你的场景，例如“我要去美国参加学术会议，还要坐飞机和住酒店”。</p></div>
          <textarea id="scene-query" class="scene-query" rows="3" placeholder="我要去美国参加学术会议，还要坐飞机和住酒店。">${esc(s.query||'')}</textarea>
          <div class="scene-search-controls"><label>难度<select id="scene-difficulty"><option value="all" ${s.difficulty==='all'?'selected':''}>全部</option><option value="basic" ${s.difficulty==='basic'?'selected':''}>基础</option><option value="common" ${s.difficulty==='common'?'selected':''}>常用</option><option value="advanced" ${s.difficulty==='advanced'?'selected':''}>进阶</option><option value="high" ${s.difficulty==='high'?'selected':''}>高阶</option></select></label><button class="find-scenes" onclick="findScene500()">找场景</button></div>
          ${resultHtml()}
        </section>
        ${recentHtml()}
        <div class="browse-link"><a href="scene500-demo.html">浏览场景目录 →</a><span>目录展示 Scene500 节点组合出的 120 个场景；未审核 KU 不会自动进入学习。</span></div>
      </main>
    </div></div>`;
  }
  window.findScene500=function(){
    const q=document.getElementById('scene-query')?.value?.trim()||'';
    const difficulty=document.getElementById('scene-difficulty')?.value||'all';
    const results=searchApi()?.search(q,difficulty,5)||[];
    state.sceneSearchUi={query:q,difficulty,resultIds:results.map(x=>x.id)};save();render();
    requestAnimationFrame(()=>document.querySelector('.scene-results,.scene-search-empty')?.scrollIntoView({block:'nearest',behavior:'smooth'}));
  };
  window.render=function(){if(state.view==='scenes'){document.getElementById('app').innerHTML=renderHome();return}return baseRender()};
})();
