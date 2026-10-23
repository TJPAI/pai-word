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
  const sceneCategories=['日常起居与家庭生活','餐饮与食品','购物与消费','出行与城市交通','旅行与旅游','学校与学习','大学与学术研究','工作与职场','求职与职业发展','商务与企业经营','数字生活与互联网','科技、AI与工程','医疗与健康','运动与健身','娱乐、文化与休闲','社交、人际与情感','公共服务、法律与社会生活','语言功能与沟通任务','自然、环境与世界','认知、表达与高级思维'];
  function stableSceneDescription(id){
    const canonical=/^S(\d{3})$/.exec(id);
    if(canonical){const n=Number(canonical[1]);if(n>=1&&n<=500)return sceneCategories[Math.floor((n-1)/25)]+' · 场景词汇';}
    return indexedScenes().byId.get(id)?.desc||'';
  }
  function resultRows(){
    const snapshot=ui();
    if(!snapshot.query||!Array.isArray(snapshot.resultIds))return [];
    return snapshot.resultIds.slice((Math.max(0,Number(snapshot.page)||0))*5,(Math.max(0,Number(snapshot.page)||0))*5+5).map(id=>{
      const name=window.PAI_SCENE_NAMES?.[id]||SCENES[id]||'';
      return name?{id,name,desc:stableSceneDescription(id),...inventory(id,snapshot.difficulty)}:null;
    }).filter(Boolean);
  }
  function countHtml(r){
    // Prefer actual locally available inventory. An optional background loader
    // must not mask existing counts or replace the scene labels with placeholders.
    const n=Number(r.reviewedCount);
    const known=Number.isFinite(n)&&n>=0;
    if((window.PAI_CORE20K_ROOT===true||new URLSearchParams(location.search).get('core20k')==='1'))
      return known&&n>0?`<span class="scene-result-count"><b>${n}</b><small>可学词</small></span>`:'';
    if(Number.isFinite(r.candidateCount))return `<span class="scene-result-count"><b>${r.candidateCount}</b><small>候选</small><em>${known?n:'—'} 已审核</em></span>`;
    return known&&n>0?`<span class="scene-result-count"><b>${n}</b><small>已审核</small></span>`:'';
  }
  function resultHtml(){
    const s=ui(),rows=resultRows();
    if(!s.query)return'';
    if(!rows.length){
      const reason=window.PAI_SCENE500_SEARCH_REPORT?.query===s.query?window.PAI_SCENE500_SEARCH_REPORT?.emptyReason:null;
      const msg=reason==='filtered_no_playable_scene'
        ?'找到了语义相关场景，但当前难度下尚无可直接学习的已审核词汇。请切换难度，或浏览场景目录。'
        :'没有找到相关的可学习场景。可尝试补充具体动作，例如“阅读物理论文”或“分析经济数据”。';
      return '<div class="scene-search-empty" role="status">'+esc(msg)+'</div>';
    }
    return `<section class="scene-results"><div class="scene-results-head"><h3>为你推荐</h3><span>${esc(difficultyLabel(s.difficulty))}</span></div>${rows.map((r,i)=>`<button class="scene-result" onclick="PAI_SCENE_SEARCH.open('${esc(r.id)}','${esc(s.difficulty)}')"><span class="scene-result-no">${String((Math.max(0,Number(s.page)||0))*5+i+1).padStart(2,'0')}</span><span class="scene-result-main"><b>${esc(r.name)}</b><small>${esc(r.desc||'')}</small></span><span class="pai-count-slot" data-scene-id="${esc(r.id)}">${countHtml(r)}</span></button>`).join('')}${s.resultIds.length>5?`<div class="scene-pages"><button onclick="PAI_SCENE_PAGE(-1)" ${(s.page||0)===0?'disabled':''}>上一页</button><span>${(s.page||0)+1} / ${Math.ceil(s.resultIds.length/5)}</span><button onclick="PAI_SCENE_PAGE(1)" ${((s.page||0)+1)*5>=s.resultIds.length?'disabled':''}>下一页</button></div>`:''}<p class="scene-results-note">当前“可学·通用义”仅表示已有唯一有效通用 Sense，不代表场景专属词义已审核。Top100 不等于每轮学习量。</p></section>`;
  }
  function recentHtml(){
    // Recent history is already persisted. Never filter it through an index that
    // changes while Scene500/Top100 data loads in the background.
    const ids=Array.isArray(state.scene500Recent)?state.scene500Recent:[];
    const rows=ids.map(id=>({id,name:displayName(id)})).filter(s=>s.name).slice(0,3);
    if(!rows.length)return'';
    return `<section class="home-recent"><div class="home-section-head"><h3>最近学习</h3></div><div class="recent-row">${rows.map(s=>`<button onclick="PAI_SCENE_SEARCH.open('${esc(s.id)}','${esc(searchApi()?.recentDifficulty?.(s.id)||'all')}')">${esc(s.name)}</button>`).join('')}</div></section>`;
  }
  function resumableScene(){
    const session=state.learningSession;
    const id=session?.scene500SceneId||state.selectedScene;
    if(!session||!Array.isArray(session.queue))return null;
    const cursor=window.PAI_LEARNING_CURSOR?.();
    const bookmarkValid=!!cursor?.ku_id&&cursor.scene_id===id&&[...(session.queue||[]),...(session.completed||[])].includes(cursor.ku_id);
    if(!session.queue.length&&!bookmarkValid)return null;
    if(!id||!displayName(id))return null;
    // Never present a stale or unresolvable queue as an active session.
    if(!session.queue.every(k=>window.PAI_CORE?.byKU?.has(k)))return null;
    return {id,name:displayName(id),difficulty:session.scene500Difficulty||searchApi()?.recentDifficulty?.(id)||'all'};
  }
  function canResumeScene(scene){
    return resumableScene()?.id===scene;
  }
  function renderHome(){
    const b=budget(),session=resumableScene(),last=lastScene(),display=session||last,s=ui();
    const sceneLoad=window.PAI_SCENE500_TOP100?.error?'Scene500 词池加载失败，请刷新重试':'';
    // Do not invent a default study target from an asynchronously hydrated scene index.
    const continueId=display?.id||null,continueDifficulty=session?.difficulty||(last?searchApi()?.recentDifficulty?.(last.id)||'all':'all');
    const resume=!!session;
    const status=`今日新学 ${b.dailyCompleted} 词 · 每批 ${b.roundLimit} KU${b.reinforcementRemaining?` · 强化 ${b.reinforcementRemaining}`:''}${b.due?` · 到期 ${b.due}`:''}`;
    return `<div class="home-dashboard"><div class="home-shell">
      <header class="home-topbar"><div class="home-brand"><h1>PAI Word</h1><p>场景化高效英语词汇学习</p><small id="pai-home-source-sha" style="display:block;margin-top:3px;font-size:10px;opacity:.45;line-height:1.3;overflow-wrap:anywhere" aria-label="当前部署提交"></small></div><div class="home-actions"><button class="home-quiet-btn" onclick="openPanel('stats')">统计</button><button class="home-quiet-btn" onclick="openPanel('settings')">设置</button></div></header>
      <main class="home-focus">${sceneLoad?`<p class="scene-note" role="status">${esc(sceneLoad)}</p>`:''}
        <section class="continue-card"><div><span class="eyebrow">继续学习</span><h2>${esc(display?.name||'开始一个场景')}</h2><p>${esc(status)}</p></div><div class="continue-actions">${continueId?`<button class="continue-primary" onclick="continueScene500('${esc(continueId)}','${esc(continueDifficulty)}')">继续学习</button>`:''}${b.reinforcementRemaining?`<button class="continue-review" onclick="openReinforcement()">强化 ${b.reinforcementRemaining}</button>`:''}${b.due?`<button class="continue-review" onclick="openReview()">复习 ${b.due}</button>`:''}</div></section>
        <section class="scene-search-card"><div class="scene-search-title"><span class="eyebrow">Scene500</span><h2>你现在想学什么？</h2><p>直接说一句你的场景，例如“我要去美国参加学术会议，还要坐飞机和住酒店”。</p></div>
          <textarea id="scene-query" class="scene-query" oninput="PAI_SCENE_QUERY_CHANGED()" oncompositionstart="PAI_SCENE_QUERY_CHANGED()" rows="3" placeholder="我要去美国参加学术会议，还要坐飞机和住酒店。">${esc(s.query||'')}</textarea>
          <div class="scene-search-controls"><label>难度<select id="scene-difficulty" onchange="refreshScene500Difficulty(this.value)"><option value="all" ${s.difficulty==='all'?'selected':''}>全部</option><option value="basic" ${s.difficulty==='basic'?'selected':''}>基础</option><option value="common" ${s.difficulty==='common'?'selected':''}>常用</option><option value="advanced" ${s.difficulty==='advanced'?'selected':''}>进阶</option><option value="high" ${s.difficulty==='high'?'selected':''}>高阶</option></select></label><button class="find-scenes" onclick="findScene500()">找场景</button></div>
          ${resultHtml()}
        </section>
        ${recentHtml()}
        <div class="browse-link"><button type="button" class="catalog-back" onclick="PAI_OPEN_CATALOG_LAZY()">浏览场景目录 →</button><span>Scene500 场景词池独立于“每轮单词数”；当前只让已审核 Sense/KU 直接进入学习。</span></div>
      </main>
    </div></div>`;
  }
  let querySerial=0,bridgePromise=null;
  window.PAI_SCENE_QUERY_CHANGED=()=>{
    querySerial++;
    const field=document.getElementById('scene-query');
    if(!field||field.value.trim()===(ui().query||'').trim())return;
    // Preserve focus and IME composition: remove only the stale results DOM.
    document.querySelector('.scene-search-card .scene-results, .scene-search-card .scene-search-empty, .scene-search-card .scene-search-pending')?.remove();
    state.sceneSearchUi={...ui(),query:'',resultIds:[],page:0};
  };
  const getBridge=()=>bridgePromise||(bridgePromise=import(new URL('rebuild-preview/scene500-recommendation-bridge.mjs?v=diagnostic-no-match-20261024',document.baseURI).href).catch(e=>{bridgePromise=null;throw e}));
  window.PAI_SCENE_PAGE=function(delta){
    if(state.view!=='scenes')return;
    const current=ui(),maximum=Math.max(0,Math.ceil((current.resultIds||[]).length/5)-1);
    const page=Math.min(maximum,Math.max(0,(Number(current.page)||0)+delta));
    if(page===(current.page||0))return;
    state.sceneSearchUi={...current,page};save();
    const old=document.querySelector('.scene-results');
    if(old)old.outerHTML=resultHtml();else render();
  };
  async function runSceneSearch(q,difficulty,{restore=false}={}){
    const ticket=++querySerial,previous=ui();
    if(!q){state.sceneSearchUi={query:'',difficulty,resultIds:[],page:0};save();render();return}
    state.sceneSearchUi={query:q,difficulty,resultIds:[],page:0};
    const oldResults=document.querySelector('.scene-search-card .scene-results, .scene-search-card .scene-search-empty, .scene-search-card .scene-search-pending');
    if(oldResults)oldResults.outerHTML='<p class="scene-search-pending" role="status">正在匹配场景…</p>';
    else document.querySelector('.scene-search-controls')?.insertAdjacentHTML('afterend','<p class="scene-search-pending" role="status">正在匹配场景…</p>');
    let ids=[],mode='legacy_fallback',cacheHit=false,engineSucceeded=false,emptyReason=null,unfilteredCandidateCount=null;
    const started=performance.now();
    if(new URLSearchParams(location.search).get('scene500engine')!=='0'){
      try{
        const bridge=await getBridge();
        const result=await bridge.recommend(q,{difficulty,inventory,eligibleSceneIds:indexedScenes().list.map(x=>x.id),limit:500});
        ids=result.ids;mode=result.mode;cacheHit=!!result.cacheHit;emptyReason=result.emptyReason||null;unfilteredCandidateCount=result.unfilteredCandidateCount??null;engineSucceeded=true;
      }catch(e){window.PAI_SCENE500_LAST_ERROR=String(e);bridgePromise=null}
    }
    if(ticket!==querySerial||state.view!=='scenes')return;
    if(!engineSucceeded){
      ids=(searchApi()?.search(q,difficulty,500)||[]).filter(x=>Number(inventory(x.id,difficulty).reviewedCount)>0).map(x=>x.id);
      mode='legacy_fallback';
    }
    // A fresh successful zero-result search is authoritative. Never resurrect
    // saved recommendations from an earlier snapshot during restoration.
    ids=[...new Set(ids)].filter(id=>Number(inventory(id,difficulty).reviewedCount)>0);
    state.sceneSearchUi={query:q,difficulty,resultIds:ids,page:restore&&previous.query===q?Math.min(previous.page||0,Math.max(0,Math.ceil(ids.length/5)-1)):0};
    window.PAI_SCENE500_SEARCH_REPORT={query:q,difficulty,mode,cacheHit,count:ids.length,emptyReason,unfilteredCandidateCount,elapsedMs:Math.round(performance.now()-started),at:Date.now()};
    save();render();
  }
  window.restoreScene500Recommendations=function(){
    const s=ui(),q=(s.query||'').trim();
    if(!q||s.resultIds?.length)return;
    void runSceneSearch(q,s.difficulty||'all',{restore:true});
  };
  window.findScene500=function(){
    const q=document.getElementById('scene-query')?.value?.trim()||'';
    const difficulty=document.getElementById('scene-difficulty')?.value||'all';
    void runSceneSearch(q,difficulty).then(()=>{
      if(state.view==='scenes'&&ui().query===q)
        requestAnimationFrame(()=>document.querySelector('.scene-results,.scene-search-empty')?.scrollIntoView({block:'nearest',behavior:'smooth'}));
    });
  };
  window.refreshScene500Difficulty=function(difficulty){
    const s=ui(),q=(document.getElementById('scene-query')?.value||s.query||'').trim();
    void runSceneSearch(q,difficulty||'all');
  };
  window.continueScene500=function(scene,difficulty='all'){
    // An unfinished, saved KU queue takes priority over opening a new scene.
    // Do not require difficulty/scene metadata to match: older sessions lack it.
    const session=state.learningSession,cursor=window.PAI_LEARNING_CURSOR?.(scene);
    const resumable=session?.queue?.length&&session.queue.every(k=>window.PAI_CORE?.byKU?.has(k));
    const bookmarked=cursor?.ku_id&&[...(session?.queue||[]),...(session?.completed||[])].includes(cursor.ku_id)&&window.PAI_CORE?.byKU?.has(cursor.ku_id);
    if(window.PAI_RESUME_SCENE_BOOKMARK?.(scene))return;
    if((resumable||bookmarked)&&typeof window.resumeLearning==='function' && (session?.scene500SceneId||state.selectedScene)===scene)return window.resumeLearning();
    return searchApi()?.open(scene,difficulty);
  };
  // Update text in place rather than reassigning innerHTML on every count.
  // Existing DOM nodes retain their layout, focus and accessibility identity.
  function reconcileCountSlots(root){
    let changed=false;
    for(const slot of root.querySelectorAll('.pai-count-slot[data-scene-id]')){
      const id=slot.getAttribute('data-scene-id');
      const html=countHtml(inventory(id,ui().difficulty));
      if(!html)continue; // Never replace a known snapshot value with empty data.
      const holder=document.createElement('span');holder.innerHTML=html;
      const next=holder.querySelector('.scene-result-count');
      const old=slot.querySelector('.scene-result-count');
      if(!next)continue;
      if(old&&old.children.length===next.children.length&&[...old.children].every((node,i)=>node.tagName===next.children[i].tagName)){
        for(let i=0;i<old.children.length;i++){
          if(old.children[i].textContent!==next.children[i].textContent){old.children[i].textContent=next.children[i].textContent;changed=true}
        }
      }else if(slot.innerHTML!==html){slot.replaceChildren(next);changed=true}
    }
    return changed;
  }
  window.PAI_HOME_REFRESH_COUNTS=function(){
    if(state.view!=='scenes')return;
    const root=document.getElementById('app');
    if(reconcileCountSlots(root))window.PAI_SAVE_HOME_VISUAL?.(root.innerHTML);
  };
  window.PAI_HOME_RECONCILE=function(){
    if(state.view!=='scenes')return;
    const root=document.getElementById('app');
    if(!root?.querySelector('.home-dashboard'))return;
    // Background refresh never reorders recommendation cards. Their identity,
    // numbering and position remain the same until a user explicitly searches.
    const next=document.createElement('div');next.innerHTML=renderHome();
    for(const selector of ['.continue-card','.home-recent']){
      const before=root.querySelector(selector),after=next.querySelector(selector);
      if(before&&after&&before.innerHTML!==after.innerHTML){
        if(selector==='.continue-card'){
          // Patch matching elements in place; preserve stable card and buttons.
          const oldTitle=before.querySelector('h2'),newTitle=after.querySelector('h2');
          const oldStatus=before.querySelector('p'),newStatus=after.querySelector('p');
          if(oldTitle&&newTitle&&oldTitle.textContent!==newTitle.textContent)oldTitle.textContent=newTitle.textContent;
          if(oldStatus&&newStatus&&oldStatus.textContent!==newStatus.textContent)oldStatus.textContent=newStatus.textContent;
          const oldActions=before.querySelector('.continue-actions'),newActions=after.querySelector('.continue-actions');
          if(oldActions&&newActions&&oldActions.innerHTML!==newActions.innerHTML)oldActions.innerHTML=newActions.innerHTML;
        }else before.innerHTML=after.innerHTML;
      }
      else if(before&&!after)before.remove();
      else if(after&&!before){
        if(selector==='.home-recent')root.querySelector('.browse-link')?.before(after);
        else root.querySelector('.scene-search-card')?.before(after);
      }
    }
    // Update the right-hand numbers only, retaining previous displayed values
    // until a valid replacement is ready; never blank a cached count.
    reconcileCountSlots(root);
    window.PAI_SAVE_HOME_VISUAL?.(root.innerHTML);
  };
  let displayedSourceSha='',sourceShaPromise=null;
  function updateSourceSha(){
    const node=document.getElementById('pai-home-source-sha');if(!node)return;
    if(displayedSourceSha){node.textContent=displayedSourceSha;return}
    if(sourceShaPromise)return;
    sourceShaPromise=fetch(new URL('preview-source-sha.txt',document.baseURI),{cache:'no-store'})
      .then(r=>{if(!r.ok)throw Error('SHA_HTTP_'+r.status);return r.text()})
      .then(raw=>{const sha=raw.trim();if(!/^[a-f0-9]{40}$/.test(sha))throw Error('SHA_INVALID');
        displayedSourceSha='SHA '+sha.slice(0,12);
        const label=document.getElementById('pai-home-source-sha');
        if(label)label.textContent=displayedSourceSha;
      }).catch(()=>{sourceShaPromise=null});
  }
  window.PAI_HOME_DASHBOARD_RENDER=renderHome;
  window.render=function(){if(state.view==='scenes'){
    const root=document.getElementById('app'),oldCounts=new Map();
    for(const slot of root.querySelectorAll('.pai-count-slot[data-scene-id]'))if(slot.innerHTML.trim())oldCounts.set(slot.getAttribute('data-scene-id'),slot.innerHTML);
    root.innerHTML=renderHome();
    for(const slot of root.querySelectorAll('.pai-count-slot[data-scene-id]'))if(!slot.innerHTML.trim()&&oldCounts.has(slot.getAttribute('data-scene-id')))slot.innerHTML=oldCounts.get(slot.getAttribute('data-scene-id'));
    window.PAI_SAVE_HOME_VISUAL?.(root.innerHTML);void updateSourceSha();return
  }return baseRender()};
})();
