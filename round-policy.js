// Per-round study policy overlay.
// Keeps the legacy state.newPerDay field for localStorage compatibility, but
// interprets it in the Scene500 experience as words per round.
(function(){
  const ALLOWED=new Set([10,20,30,50]);
  const roundSize=()=>ALLOWED.has(Number(state.newPerDay))?Number(state.newPerDay):20;
  const isScene500=scene=>(window.PAI_SCENE500?.sceneIds||[]).includes(scene);
  const rankAllowed=(rank,difficulty)=>difficulty==='basic'?rank<=4000:difficulty==='common'?rank>4000&&rank<=8000:difficulty==='advanced'?rank>8000&&rank<=11000:difficulty==='high'?rank>11000:true;
  const unitKeyOf=u=>unitKey(u.w,u.sid);

  function roundKeys(scene){
    const difficulty=state.scene500DifficultyByScene?.[scene]||'all';
    const out=[],seen=new Set();
    for(const u of (allUnits(scene)||[])){
      if(!rankAllowed(Number(u?.w?.rank)||999999,difficulty))continue;
      const k=unitKeyOf(u);
      if(seen.has(k)||state.records?.[k])continue;
      seen.add(k);out.push(k);
      if(out.length>=roundSize())break;
    }
    return out;
  }

  // The newer learning runtime has its own hard-coded slice(0,10). Let it create
  // the session, then replace that scene session queue with the requested round size.
  const baseOpenScene=window.openScene;
  window.openScene=function(scene){
    const result=baseOpenScene(scene);
    if(isScene500(scene)&&state.learningSession?.kind==='scene'){
      const keys=roundKeys(scene);
      state.learningSession.queue=keys;
      state.learningSession.total=keys.length;
      state.learningSession.completed=[];
      state.learningSession.seen={};
      state.learningSession.attempts=0;
      state.studyBrowseIndex=0;
      save();
      // Restart on the first unit so the UI/progress immediately reflect the expanded round.
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

  // Manual recall correction should be immediate. The underlying tap-flow used to
  // reschedule another 2/4/6-second timer, which made the three buttons feel dead.
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

  // Patch legacy settings copy after every render without disturbing the learning UI.
  const baseRender=window.render;
  window.render=function(){
    const out=baseRender();
    if(state.view==='settings'){
      const rows=[...document.querySelectorAll('.setting-row')];
      const row=rows.find(x=>x.querySelector('span')?.textContent?.trim()==='每日新词'||x.querySelector('span')?.textContent?.trim()==='每轮单词数');
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
