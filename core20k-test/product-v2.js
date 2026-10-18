// Product layer: Core-13000 V26.7I scope, deterministic scene repair, lexicon browse/search.
(function(){
  const FULL_LIMIT=13000;
  const RELEASE='Core-13000 V26.7I';
  const MODEL_TECH_KUS=new Set(['w_0491_model_ku01','w_0491_model_ku02','w_0491_model_ku03','w_0491_model_ku04','w_0491_model_ku05','w_0491_model_ku06','w_0491_model_ku07']);
  SCENES.general='通用基础 · 待细分';
  function repairScenes(){
    const next=new Map(Object.keys(SCENES).map(k=>[k,[]]));
    let moved=0;
    for(const u of window.PAI_CORE.byKU.values()){
      const d=u.s.domain,k=u.k||u.s.ku_id;let scene=u.s.scene;
      if(d==='time_space_abstract')scene='general';
      else if(d==null)scene=MODEL_TECH_KUS.has(k)?'tech':'daily';
      else if(d==='media_communication')scene='public';
      else if(d==='general')scene='daily';
      else if(d==='animals_plants')scene=k==='w_1823_stable_ku_s02'?'daily':'public';
      if(scene!==u.s.scene)moved++;
      u.s.scene=scene;
      if(!next.has(scene))next.set(scene,[]);
      next.get(scene).push(u);
    }
    if((next.get('unclassified')||[]).length===0){next.delete('unclassified');delete SCENES.unclassified}
    window.PAI_CORE.byScene=next;
    const counts=Object.fromEntries([...next].map(([k,v])=>[k,v.length]));
    window.PAI_CORE_QA.sceneCounts=counts;
    window.PAI_CORE_QA.sceneRepair={policy:'v267i-existing-metadata-v1',moved,unclassified:counts.unclassified||0,general:counts.general||0};
  }
  repairScenes();
  state.voiceAccent='us';
  const previousLimit=state.lexiconLimit;
  state.lexiconLimit=FULL_LIMIT;
  if(typeof rebuildDailyAssignments==='function'&&(previousLimit!==FULL_LIMIT||state.daily?.lexiconLimit!==FULL_LIMIT||!state.daily?.assigned?.general))rebuildDailyAssignments();

  const searchIndex=window.PAI_CORE.words.map(w=>({
    w,
    lemma:String(w.w||'').toLowerCase(),
    zh:Object.values(w.s||{}).map(s=>s.m||'').join(' '),
    senses:Object.values(w.s||{}).length
  }));
  const byRank=new Map(window.PAI_CORE.words.map(w=>[w.rank,w]));
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  function offlineText(){
    const s=window.PAI_LOCAL_LEXICON||{};
    if(!s.supported)return '本地词库不可用';
    if(s.offlineReady&&s.shellReady)return '完整词库已保存在本机 · 可离线启动';
    if(s.offlineReady)return '完整词库已保存在本机 · 离线启动缓存初始化中';
    return '首次联网使用后会将完整 13,000 词保存到本机';
  }
  function refreshOfflineStatus(){document.querySelectorAll('[data-offline-status]').forEach(el=>{el.textContent=offlineText()})}
  window.addEventListener('pai-offline-status',refreshOfflineStatus);
  function resultItems(query){
    const q=String(query||'').trim().toLowerCase();
    if(!q)return searchIndex.slice(0,80);
    const exact=[],prefix=[],contains=[];
    for(const x of searchIndex){
      if(x.lemma===q)exact.push(x);
      else if(x.lemma.startsWith(q))prefix.push(x);
      else if(x.lemma.includes(q)||x.zh.includes(q))contains.push(x);
      if(exact.length+prefix.length+contains.length>=120)break;
    }
    return [...exact,...prefix,...contains].slice(0,80);
  }
  function resultHtml(query){
    const items=resultItems(query);
    if(!items.length)return '<div class="lex-empty">没有找到匹配词条</div>';
    return items.map(({w,senses})=>{
      const first=Object.values(w.s||{})[0];
      return `<button class="lex-row" onclick="openLexiconWord(${w.rank})"><span class="lex-main"><b>${esc(w.w)}</b><small>#${w.rank} · ${esc(w.pos||first?.pos||'')}</small></span><span class="lex-gloss">${esc(first?.m||'释义待补充')}</span><span class="lex-meta">${senses} KU</span></button>`;
    }).join('');
  }
  function renderLexicon(){
    const q=state.lexiconQuery||'';
    return `<div class="screen lex-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>词库浏览</h2></div><div class="lex-scope">${RELEASE} · 13,000 词 · 16,616 KU<br><span data-offline-status>${esc(offlineText())}</span></div><div class="lex-search-wrap"><input id="lex-search" class="lex-search" type="search" autocomplete="off" autocapitalize="none" placeholder="搜索英文或中文释义" value="${esc(q)}" oninput="updateLexiconSearch(this.value)"></div><div class="lex-results" id="lex-results">${resultHtml(q)}</div></div>`;
  }
  function currentWord(){return byRank.get(state.lexiconWordRank||1)||null}
  function renderLexiconWord(){
    const w=currentWord();if(!w)return renderLexicon();
    const units=Object.values(w.s||{});
    const selected=window.PAI_CORE.byKU.get(state.previewKU||units[0]?.ku_id);
    const current=selected&&selected.w.rank===w.rank?selected:(units[0]?window.PAI_CORE.byKU.get(units[0].ku_id):null);
    const ipa=w.ipaUS||'美音音标待补充';
    const tabs=units.map(s=>`<button class="sense-chip ${current?.s.ku_id===s.ku_id?'active':''}" onclick="selectLexiconSense('${esc(s.ku_id)}')"><span>${esc(s.kuType&&s.kuType!=='sense'?s.kuTitle||s.kuType:s.pos||w.pos||'')}</span>${esc(s.m)}</button>`).join('');
    return `<div class="screen lex-word-screen"><div class="study-top"><button class="back-btn" onclick="openLexicon()">‹</button><div class="study-scene">词条</div><div class="study-progress">#${w.rank}</div></div><div class="lex-word-head"><div><h1>${esc(w.w)}</h1><div class="ipa">${esc(ipa)}</div></div><button class="speak-btn" data-word-audio data-speak="${esc(w.w)}">🔊</button></div><div class="sense-picker"><div class="answer-label">选择知识单元</div>${tabs}</div>${current?answerHtml(current):'<div class="lex-empty">该词暂无可学习 KU。</div>'}<div class="scene-note">词条浏览不会写入学习记录。当前仅支持美音；“通用基础”场景仍待进一步细分。</div></div>`;
  }

  window.openLexicon=function(reset=false){state.view='lexicon';if(reset)state.lexiconQuery='';save();render()};
  window.updateLexiconSearch=function(value){state.lexiconQuery=value;const el=document.getElementById('lex-results');if(el)el.innerHTML=resultHtml(value)};
  window.openLexiconWord=function(rank){state.lexiconWordRank=Number(rank);const w=byRank.get(state.lexiconWordRank);state.previewKU=Object.values(w?.s||{})[0]?.ku_id||null;state.view='lexiconWord';save();render()};
  window.selectLexiconSense=function(ku){state.previewKU=ku;save();render()};

  const oldRateKnown=window.rateKnown;
  window.rateKnown=function(known){const u=typeof currentUnit==='function'?currentUnit():null;if(u&&!state.records[unitKey(u.w,u.sid)]&&typeof markDailyNewComplete==='function')markDailyNewComplete(unitKey(u.w,u.sid));return oldRateKnown(known)};
  window.setVoiceAccent=function(){state.voiceAccent='us';save();render()};

  function cleanupRenderedUI(){
    const note=document.querySelector('.scene-note');
    if(state.view==='scenes'&&note)note.innerHTML=`${RELEASE} · 13,000 词 · 16,616 KU<br>“通用基础”承接尚待细分的抽象/时空类词汇；当前仅支持美音。`;
    if(state.view==='settings'){
      for(const row of document.querySelectorAll('.setting-row')){
        const label=row.querySelector('span')?.textContent?.trim();
        if(label==='发音口音')row.innerHTML='<span>发音</span><b>美音</b>';
        if(label==='显示近义 / 易混词辨析')row.remove();
      }
    }
    for(const section of document.querySelectorAll('.answer-section')){
      const label=section.querySelector('.answer-label')?.textContent?.trim();
      if(label==='近义 / 易混词辨析'&&section.querySelector('.muted'))section.remove();
    }
  }

  const oldRender=window.render;
  window.render=function(){
    if(state.view==='lexicon'){document.getElementById('app').innerHTML=renderLexicon();cleanupRenderedUI();return}
    if(state.view==='lexiconWord'){document.getElementById('app').innerHTML=renderLexiconWord();cleanupRenderedUI();return}
    oldRender();
    const screen=document.querySelector('.screen');if(!screen)return;
    document.querySelectorAll('button[onclick^="learnMore("]').forEach(btn=>btn.remove());
    if(state.view==='scenes'){
      const tools=document.querySelector('.scene-tools');
      if(tools&&!tools.querySelector('[data-lexicon]'))tools.insertAdjacentHTML('afterbegin','<button class="text-btn" data-lexicon onclick="openLexicon(true)">词库</button>');
      const head=document.querySelector('.scene-head');
      if(head&&!document.querySelector('.scope-strip'))head.insertAdjacentHTML('afterend',`<div class="scope-strip"><div><b>${RELEASE}</b><span>13,000 词 · 16,616 KU · 今日新词全应用合计 ${state.newPerDay} 个 · 复习不限额</span><span data-offline-status>${esc(offlineText())}</span></div></div>`);
      if(typeof globalNewRemaining==='function'&&globalNewRemaining()===0){document.querySelectorAll('button[onclick^="toggleExtraScenes("]').forEach(btn=>btn.remove());document.querySelector('.extra-scenes')?.remove()}
    }
    if(state.view==='settings'){
      const muted=[...document.querySelectorAll('.panel-block.muted')].at(-1);if(muted)muted.innerHTML=`使用 ${RELEASE}。每日新词额度为全应用合计；到期复习不受新词额度限制。<br><span data-offline-status>${esc(offlineText())}</span>`;
    }
    if(state.view==='stats'){
      const block=document.querySelector('.panel-block');if(block&&!block.querySelector('[data-scope-stat]'))block.insertAdjacentHTML('afterbegin',`<div class="stat-row" data-scope-stat><span>学习词库</span><b>13,000 / 16,616 KU</b></div><div class="stat-row"><span>本地词库</span><b data-offline-status>${esc(offlineText())}</b></div>`);
    }
    cleanupRenderedUI();
  };
  render();
})();
