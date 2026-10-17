// Per-round study policy overlay.
// Daily new-word budget remains owned by state.newPerDay / daily.js.
// This overlay adds an independent state.wordsPerRound session-size setting and
// is deliberately loaded last so it is the final policy owner for scene sessions.
(function(){
  const DAILY_ALLOWED=new Set([25,50,100,200]);
  const ROUND_ALLOWED=new Set([10,25,50]);
  const BASE_POOL={
    cs018:'daily',cs043:'travel',cs044:'travel',cs046:'travel',cs047:'travel',cs049:'travel',
    cs057:'health',cs062:'academic',cs064:'academic',cs073:'work',cs076:'work',cs079:'work',
    cs081:'tech',cs088:'tech',cs090:'tech',cs092:'academic',cs096:'academic',cs468:'public',
    cs206:'work',cs215:'work',cs223:'work',cs254:'tech',cs321:'academic'
  };
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

  // Scene500 has no artificial vocabulary-size cap. The full controlled fallback
  // candidate universe remains available; difficulty selects a slice and daily /
  // per-round settings alone control how many fresh words enter a study session.
  function expandScene500Pools(){
    if(!window.PAI_CORE?.byScene||!window.PAI_SCENE500?.sceneIds)return;
    for(const scene of window.PAI_SCENE500.sceneIds){
      const base=BASE_POOL[scene];if(!base)continue;
      const existing=[...(allUnits(scene)||[])],seen=new Set(existing.map(unitKeyOf));
      const fallback=[...(window.PAI_CORE.byScene.get(base)||[])].sort((a,b)=>(Number(a?.w?.rank)||999999)-(Number(b?.w?.rank)||999999));
      for(const u of fallback){
        const k=unitKeyOf(u);if(seen.has(k))continue;
        seen.add(k);existing.push(u);
      }
      window.PAI_CORE.byScene.set(scene,existing);
    }
    if(window.PAI_SCENE500)window.PAI_SCENE500.internalPoolExpanded=true;
  }
  expandScene500Pools();

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
      const difficulty=state.scene500DifficultyByScene?.[scene]||'all',out=[],seen=new Set();
      for(const u of (allUnits(scene)||[])){
        if(!rankAllowed(Number(u?.w?.rank)||999999,difficulty))continue;
        const k=unitKeyOf(u);if(seen.has(k)||state.records?.[k])continue;
        seen.add(k);out.push(k);if(out.length>=limit)break;
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

  // Override the legacy daily setter because the bundled runtime only accepts 10/20/30/50.
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
        if(el.textContent.includes('新词数量固定')||el.textContent.includes('每轮新词数量固定')||el.textContent.includes('每日新词控制'))el.textContent='每日新词控制全天新词总量；每轮单词数控制单次学习的新词上限；场景词库本身不设数量上限；到期复习不占新词额度。';
      }
    }
    return out;
  };
})();