// Product layer: Core-5000 default scope, Core-13000 switch, lexicon browse/search.
(function(){
  const FULL_LIMIT=13000,DEFAULT_LIMIT=5000;
  state.lexiconLimit=state.lexiconLimit===FULL_LIMIT?FULL_LIMIT:DEFAULT_LIMIT;
  const baseAllUnits=window.allUnits;
  window.allUnits=function(scene){return (baseAllUnits(scene)||[]).filter(u=>u.w.rank<=state.lexiconLimit)};
  if(state.daily?.lexiconLimit!==state.lexiconLimit&&typeof rebuildDailyAssignments==='function')rebuildDailyAssignments();

  const searchIndex=window.PAI_CORE.words.map(w=>({
    w,
    lemma:String(w.w||'').toLowerCase(),
    zh:Object.values(w.s||{}).map(s=>s.m||'').join(' '),
    senses:Object.values(w.s||{}).length
  }));
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
      const first=Object.values(w.s||{})[0],outside=w.rank>state.lexiconLimit;
      return `<button class="lex-row" onclick="openLexiconWord(${w.rank})"><span class="lex-main"><b>${esc(w.w)}</b><small>#${w.rank} · ${esc(w.pos||first?.pos||'')}</small></span><span class="lex-gloss">${esc(first?.m||'释义待补充')}</span><span class="lex-meta">${senses}义${outside?' · 浏览':''}</span></button>`;
    }).join('');
  }
  function renderLexicon(){
    const q=state.lexiconQuery||'';
    return `<div class="screen lex-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>词库浏览</h2></div><div class="lex-scope">收录 13,000 词 · 当前学习范围前 ${state.lexiconLimit.toLocaleString()} 词</div><div class="lex-search-wrap"><input id="lex-search" class="lex-search" type="search" autocomplete="off" autocapitalize="none" placeholder="搜索英文或中文释义" value="${esc(q)}" oninput="updateLexiconSearch(this.value)"></div><div class="lex-results" id="lex-results">${resultHtml(q)}</div></div>`;
  }
  function currentWord(){return window.PAI_CORE.words[(state.lexiconWordRank||1)-1]||null}
  function renderLexiconWord(){
    const w=currentWord();if(!w)return renderLexicon();
    const units=Object.values(w.s||{});
    const selected=window.PAI_CORE.byKU.get(state.previewKU||units[0]?.ku_id);
    const current=selected&&selected.w.rank===w.rank?selected:(units[0]?window.PAI_CORE.byKU.get(units[0].ku_id):null);
    const ipa=state.voiceAccent==='gb'?(w.ipaUK||'英音音标待补充'):(w.ipaUS||w.ipaUK||'音标待补充');
    const outside=w.rank>state.lexiconLimit;
    const tabs=units.map(s=>`<button class="sense-chip ${current?.s.ku_id===s.ku_id?'active':''}" onclick="selectLexiconSense('${esc(s.ku_id)}')"><span>${esc(s.pos||w.pos||'')}</span>${esc(s.m)}</button>`).join('');
    return `<div class="screen lex-word-screen"><div class="study-top"><button class="back-btn" onclick="openLexicon()">‹</button><div class="study-scene">词条</div><div class="study-progress">#${w.rank}</div></div><div class="lex-word-head"><div><h1>${esc(w.w)}</h1><div class="ipa">${esc(ipa)}</div></div><button class="speak-btn" data-word-audio data-speak="${esc(w.w)}">🔊</button></div>${outside?'<div class="scope-warning">此词超出当前学习范围，仅浏览；切换范围不会删除已有进度。</div>':''}<div class="sense-picker"><div class="answer-label">选择义项</div>${tabs}</div>${current?answerHtml(current):'<div class="lex-empty">该词暂无可学习 KU。</div>'}<div class="scene-note">词条浏览不会写入学习记录。场景、音标、词源、辨析及外部核验仍可能待完善。</div></div>`;
  }

  window.openLexicon=function(reset=false){state.view='lexicon';if(reset)state.lexiconQuery='';save();render()};
  window.updateLexiconSearch=function(value){state.lexiconQuery=value;const el=document.getElementById('lex-results');if(el)el.innerHTML=resultHtml(value)};
  window.openLexiconWord=function(rank){state.lexiconWordRank=Number(rank);const w=window.PAI_CORE.words[state.lexiconWordRank-1];state.previewKU=Object.values(w?.s||{})[0]?.ku_id||null;state.view='lexiconWord';save();render()};
  window.selectLexiconSense=function(ku){state.previewKU=ku;save();render()};
  window.setLexiconLimit=function(limit){
    limit=Number(limit)===FULL_LIMIT?FULL_LIMIT:DEFAULT_LIMIT;
    if(state.lexiconLimit===limit)return;
    state.lexiconLimit=limit;state.daily=null;state.scene=null;state.view='scenes';state.revealed=false;
    if(typeof rebuildDailyAssignments==='function')rebuildDailyAssignments();else save();
    render();
  };

  const oldRender=window.render;
  window.render=function(){
    if(state.view==='lexicon'){document.getElementById('app').innerHTML=renderLexicon();return}
    if(state.view==='lexiconWord'){document.getElementById('app').innerHTML=renderLexiconWord();return}
    oldRender();
    const screen=document.querySelector('.screen');if(!screen)return;
    if(state.view==='scenes'){
      const tools=document.querySelector('.scene-tools');
      if(tools&&!tools.querySelector('[data-lexicon]'))tools.insertAdjacentHTML('afterbegin','<button class="text-btn" data-lexicon onclick="openLexicon(true)">词库</button>');
      const head=document.querySelector('.scene-head');
      if(head&&!document.querySelector('.scope-strip'))head.insertAdjacentHTML('afterend',`<div class="scope-strip"><div><b>学习范围</b><span>今日新词全应用合计 ${state.newPerDay} 个 · 复习不限额</span></div><div class="scope-toggle"><button class="${state.lexiconLimit===5000?'active':''}" onclick="setLexiconLimit(5000)">前 5,000</button><button class="${state.lexiconLimit===13000?'active':''}" onclick="setLexiconLimit(13000)">13,000</button></div></div>`);
      document.querySelectorAll('button[onclick^="learnMore("]').forEach(btn=>btn.remove());
      const note=document.querySelector('.scene-note');if(note)note.insertAdjacentHTML('afterbegin',`当前学习范围：前 ${state.lexiconLimit.toLocaleString()} 词 · 今日剩余新词 ${typeof globalNewRemaining==='function'?globalNewRemaining():'—'}<br>`);
    }
    if(state.view==='settings'){
      const blocks=document.querySelectorAll('.panel-block'),first=blocks[0];
      if(first&&!document.querySelector('[data-scope-setting]'))first.insertAdjacentHTML('afterbegin',`<div class="setting-row" data-scope-setting><span>学习词库范围</span><select onchange="setLexiconLimit(+this.value)"><option value="5000" ${state.lexiconLimit===5000?'selected':''}>核心前 5,000</option><option value="13000" ${state.lexiconLimit===13000?'selected':''}>全部 13,000</option></select></div>`);
      const muted=[...document.querySelectorAll('.panel-block.muted')].at(-1);if(muted)muted.textContent='每日新词额度为全应用合计；到期复习不受新词额度限制。切换词库范围不会删除已学 KU 进度。';
    }
    if(state.view==='stats'){
      const block=document.querySelector('.panel-block');if(block&&!block.querySelector('[data-scope-stat]'))block.insertAdjacentHTML('afterbegin',`<div class="stat-row" data-scope-stat><span>当前学习范围</span><b>${state.lexiconLimit.toLocaleString()}</b></div>`);
    }
  };
})();
