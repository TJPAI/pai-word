// Per-round study policy overlay.
// Keeps the legacy state.newPerDay field for localStorage compatibility, but
// interprets it as words per round. This file is deliberately loaded last so
// it is the final policy owner for scene-session sizing and manual grading.
(function(){
  const ALLOWED=new Set([10,20,30,50]);
  const DISPLAY_LIMIT=50;
  const BASE_POOL={
    cs018:'daily',cs043:'travel',cs044:'travel',cs046:'travel',cs047:'travel',cs049:'travel',
    cs057:'health',cs062:'academic',cs064:'academic',cs073:'work',cs076:'work',cs079:'work',
    cs081:'tech',cs088:'tech',cs090:'tech',cs092:'academic',cs096:'academic',cs468:'public',
    cs206:'work',cs215:'work',cs223:'work',cs254:'tech',cs321:'academic'
  };
  const roundSize=()=>ALLOWED.has(Number(state.newPerDay))?Number(state.newPerDay):20;
  const isScene500=scene=>(window.PAI_SCENE500?.sceneIds||[]).includes(scene);
  const rankAllowed=(rank,difficulty)=>difficulty==='basic'?rank<=4000:difficulty==='common'?rank>4000&&rank<=8000:difficulty==='advanced'?rank>8000&&rank<=11000:difficulty==='high'?rank>11000:true;
  const unitKeyOf=u=>unitKey(u.w,u.sid);

  // Scene500's initial MVP bridge used to stop after the first 50 rank-sorted
  // fallback units. That biased the pool toward basic words before difficulty
  // filtering, making advanced/high scenes appear empty. Expand the internal
  // controlled pool here, but keep all user-visible counts capped at 50.
  function expandScene500Pools(){
    if(!window.PAI_CORE?.byScene||!window.PAI_SCENE500?.sceneIds)return;
    for(const scene of window.PAI_SCENE500.sceneIds){
      const base=BASE_POOL[scene];if(!base)continue;
      const existing=[...(allUnits(scene)||[])],seen=new Set(existing.map(unitKeyOf));
      const fallback=[...(window.PAI_CORE.byScene.get(base)||[])].sort((a,b)=>(Number(a?.w?.rank)||999999)-(Number(b?.w?.rank)||999999));
      for(const difficulty of ['basic','common','advanced','high']){
        let added=0;
        for(const u of fallback){
          const rank=Number(u?.w?.rank)||999999;if(!rankAllowed(rank,difficulty))continue;
          const k=unitKeyOf(u);if(seen.has(k))continue;
          seen.add(k);existing.push(u);added++;
          if(added>=DISPLAY_LIMIT)break;
        }
      }
      window.PAI_CORE.byScene.set(scene,existing);
    }
    if(window.PAI_SCENE500)window.PAI_SCENE500.internalDifficultyPoolExpanded=true;
    if(window.PAI_SCENE_SEARCH?.wordCount){
      const baseWordCount=window.PAI_SCENE_SEARCH.wordCount.bind(window.PAI_SCENE_SEARCH);
      window.PAI_SCENE_SEARCH.wordCount=(id,d='all')=>Math.min(DISPLAY_LIMIT,baseWordCount(id,d));
    }
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
    if(isScene500(scene)){
      const difficulty=state.scene500DifficultyByScene?.[scene]||'all',out=[],seen=new Set();
      for(const u of (allUnits(scene)||[])){
        if(!rankAllowed(Number(u?.w?.rank)||999999,difficulty))continue;
        const k=unitKeyOf(u);if(seen.has(k)||state.records?.[k])continue;
        seen.add(k);out.push(k);if(out.length>=roundSize())break;
      }
      return out;
    }
    const units=window.PAI_LEARNING_QA?.unlearned?.(scene)||[];
    return units.slice(0,roundSize()).map(u=>u.k);
  }

  // The bundled learning runtime still contains a legacy scene slice(0,10).
  // Let it initialise its internal state, then replace the session with the
  // final per-round policy. Due reviews do not consume the fresh-word quota.
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
      // Restart on the first unit so the UI/progress immediately reflect the corrected round.
      if(typeof window.resumeLearning==='function')window.resumeLearning();
      else if(typeof render==='function')render();
    }
    return result;
  };

  // Keep the old setter as a compatibility API, but expose the new product term.
  window.setWordsPerRound=function(n){
    n=Number(n);if(!ALLOWED.has(n))n=20;
    state.newPerDay=n;
    state.daily=null;
    save();
    if(typeof render==='function')render();
  };
  window.setNewPerDay=function(n){return window.setWordsPerRound(n)};
  window.wordsPerRound=roundSize;

  // Manual recall correction is immediate. The underlying tap-flow schedules
  // another answer timer; cancelling it first makes the three explicit buttons
  // authoritative and advances without an artificial 2/4/6-second wait.
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

  // Patch legacy settings copy after every render without disturbing learning UI.
  const baseRender=window.render;
  window.render=function(){
    const out=baseRender();
    if(state.view==='settings'){
      const rows=[...document.querySelectorAll('.setting-row')];
      const row=rows.find(x=>['每日新词','每轮单词数'].includes(x.querySelector('span')?.textContent?.trim()));
      if(row){
        row.querySelector('span').textContent='每轮单词数';
        const select=row.querySelector('select');
        if(select)select.setAttribute('onchange','setWordsPerRound(+this.value)');
      }
      for(const el of document.querySelectorAll('.panel-block.muted')){
        if(el.textContent.includes('新词数量固定')||el.textContent.includes('每轮新词数量固定'))el.textContent='每轮新词数量固定；到期复习不计入每轮上限。';
      }
    }
    return out;
  };
})();
