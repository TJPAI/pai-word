// Final study policy overlay.
// Daily new-word budget remains owned by state.newPerDay / daily.js.
// This overlay owns the independent per-round size and the final Scene500 session policy.
(function(){
  const DAILY_ALLOWED=new Set([25,50,100,200]);
  const ROUND_ALLOWED=new Set([10,25,50]);

  if(!DAILY_ALLOWED.has(Number(state.newPerDay)))state.newPerDay=50;
  if(!ROUND_ALLOWED.has(Number(state.wordsPerRound)))state.wordsPerRound=10;

  const roundSize=()=>ROUND_ALLOWED.has(Number(state.wordsPerRound))?Number(state.wordsPerRound):10;
  const dailyLimit=()=>DAILY_ALLOWED.has(Number(state.newPerDay))?Number(state.newPerDay):50;
  const dailyCompleted=()=>Math.max(0,Number(window.globalNewCompleted?.()||0));
  const dailyRemaining=()=>Math.max(0,dailyLimit()-dailyCompleted());
  const freshLimit=()=>Math.min(roundSize(),dailyRemaining());
  const isScene500=scene=>(window.PAI_SCENE500?.sceneIds||[]).includes(scene);
  const rankAllowed=(rank,difficulty)=>difficulty==='basic'?rank<=4000:difficulty==='common'?rank>4000&&rank<=8000:difficulty==='advanced'?rank>8000&&rank<=11000:difficulty==='high'?rank>11000:true;
  const unitKeyOf=u=>unitKey(u.w,u.sid);

  function primaryUnitForLemma(lemma){
    const words=window.PAI_CORE?.byLemma?.get(lemma)||[];
    for(const w of words){
      const entries=Object.entries(w.s||{});
      const sense=entries.find(([,s])=>String(s.kuType||'sense').toLowerCase()==='sense')||entries[0];
      if(sense){const u=window.PAI_CORE.byKU.get(sense[0]);if(u)return u}
    }
    return null;
  }

  // The temporary Scene500 bridge used broad parent categories as backfill. That is
  // useful for candidate generation, but it is not honest enough to be shown or learned
  // as if every parent-category word belonged to the small scene. Runtime therefore keeps
  // only explicitly curated scene lemmas playable until reviewed Scene500×KU mappings land.
  function installTruthfulScene500Pools(){
    if(!window.PAI_CORE?.byScene||!window.PAI_SCENE500?.specs)return;
    for(const spec of window.PAI_SCENE500.specs){
      const units=[],seenWords=new Set();
      for(const lemma of spec.lemmas||[]){
        const u=primaryUnitForLemma(lemma);if(!u)continue;
        const wordKey=u.w?.rank??u.w?.w;if(seenWords.has(wordKey))continue;
        seenWords.add(wordKey);units.push(u);
      }
      window.PAI_CORE.byScene.set(spec.id,units);
    }
    // Remove legacy full-scene assignment caches. The final session policy below creates
    // only the actual round queue, so persisting hundreds/thousands of candidate KU keys
    // is unnecessary and can pressure Safari localStorage.
    if(state.scene500Pilot){delete state.scene500Pilot;save()}
    window.PAI_SCENE500.playableVocabulary='curated_scene_lemmas_only';
    window.PAI_SCENE500.broadBackfillPlayable=false;
  }
  installTruthfulScene500Pools();

  function sceneMemberKeys(scene){return new Set((allUnits(scene)||[]).map(unitKeyOf))}
  function dueKeys(scene){
    const allDue=window.PAI_LEARNING_QA?.due?.()||[];
    if(isScene500(scene)){
      const members=sceneMemberKeys(scene);return allDue.filter(k=>members.has(k));
    }
    return allDue.filter(k=>window.PAI_CORE?.byKU?.get(k)?.s?.scene===scene);
  }

  function freshKeys(scene){
    const limit=freshLimit();if(limit<=0)return[];
    if(isScene500(scene)){
      const difficulty=state.scene500DifficultyByScene?.[scene]||'all',out=[],seenWords=new Set();
      for(const u of (allUnits(scene)||[])){
        if(!rankAllowed(Number(u?.w?.rank)||999999,difficulty))continue;
        const k=unitKeyOf(u),wordKey=u.w?.rank??u.w?.w;
        if(seenWords.has(wordKey)||state.records?.[k])continue;
        // Treat a headword as introduced if any of its KUs already has progress.
        if(Object.keys(u.w?.s||{}).some(id=>state.records?.[id]))continue;
        seenWords.add(wordKey);out.push(k);if(out.length>=limit)break;
      }
      return out;
    }
    const units=window.PAI_LEARNING_QA?.unlearned?.(scene)||[];
    return units.slice(0,limit).map(u=>u.k);
  }

  const baseOpenScene=window.openScene;
  window.openScene=function(scene){
    const result=baseOpenScene(scene);
    if(state.learningSession?.kind==='scene'){
      const due=dueKeys(scene),fresh=freshKeys(scene),seen=new Set(due);
      const keys=[...due,...fresh.filter(k=>!seen.has(k))];
      state.learningSession.queue=keys;
      state.learningSession.total=keys.length;
      state.learningSession.completed=[];
      state.learningSession.seen={};
      state.learningSession.attempts=0;
      state.studyBrowseIndex=0;
      save();
      if(typeof window.resumeLearning==='function')window.resumeLearning();
      else if(typeof render==='function')render();
    }
    return result;
  };

  // Override the legacy daily setter because the bundled runtime still accepts the old presets.
  window.setNewPerDay=function(n){
    n=Number(n);if(!DAILY_ALLOWED.has(n))n=50;
    state.newPerDay=n;
    state.daily=null;
    window.PAI_LEARNING_QA?.fresh?.();
    save();
    if(typeof render==='function')render();
  };
  window.setWordsPerRound=function(n){
    n=Number(n);if(!ROUND_ALLOWED.has(n))n=10;
    state.wordsPerRound=n;
    save();
    if(typeof render==='function')render();
  };
  window.wordsPerRound=roundSize;
  window.dailyNewRemaining=dailyRemaining;

  // Manual grading is authoritative and advances immediately.
  if(window.PAI_TAP_FLOW?.correct){
    const baseCorrect=window.PAI_TAP_FLOW.correct.bind(window.PAI_TAP_FLOW);
    window.PAI_TAP_FLOW.correct=function(score){
      if(!['again','hard','good'].includes(score))return baseCorrect(score);
      const u=window.getVisibleLearningUnit?.();
      if(state.view!=='learning'||!state.revealed||!u)return baseCorrect(score);
      window.PAI_TAP_FLOW.cancel?.();
      return window.rateLearning?.(score,u.k);
    };
  }

  // Settings UI: keep daily and per-round controls independent.
  const baseRender=window.render;
  window.render=function(){
    const out=baseRender();
    if(state.view==='settings'){
      const rows=[...document.querySelectorAll('.setting-row')];
      const dailyRow=rows.find(x=>x.querySelector('span')?.textContent?.trim()==='每日新词');
      if(dailyRow){
        const dailySelect=dailyRow.querySelector('select');
        if(dailySelect){
          dailySelect.innerHTML=[25,50,100,200].map(n=>`<option value="${n}" ${dailyLimit()===n?'selected':''}>${n}</option>`).join('');
          dailySelect.setAttribute('onchange','setNewPerDay(+this.value)');
        }
        const options=[10,25,50].map(n=>`<option value="${n}" ${roundSize()===n?'selected':''}>${n}</option>`).join('');
        dailyRow.insertAdjacentHTML('afterend',`<div class="setting-row"><span>每轮单词数</span><select onchange="setWordsPerRound(+this.value)">${options}</select></div>`);
      }
      for(const el of document.querySelectorAll('.panel-block.muted')){
        if(el.textContent.includes('新词数量固定')||el.textContent.includes('每轮新词数量固定')||el.textContent.includes('每日新词控制'))el.textContent='每日新词控制全天新词总量；每轮单词数控制单次学习的新词上限；场景本身不设人工数量上限；到期复习不占新词额度。';
      }
    }
    return out;
  };
})();
