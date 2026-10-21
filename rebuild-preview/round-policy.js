// Final study policy overlay.
// Scene500 data/pools are owned by scene500-integrated.js.
// This file is the only owner for scene-session sizing, daily/round limits and manual grading overrides.
(function(){
  const DAILY_ALLOWED=new Set([25,50,100,200]);
  const ROUND_ALLOWED=new Set([10,25,50]);
  let normalized=false;
  if(!DAILY_ALLOWED.has(Number(state.newPerDay))){state.newPerDay=50;normalized=true}
  if(!ROUND_ALLOWED.has(Number(state.wordsPerRound))){state.wordsPerRound=10;normalized=true}
  if(normalized)save();

  const roundSize=()=>ROUND_ALLOWED.has(Number(state.wordsPerRound))?Number(state.wordsPerRound):10;
  const dailyLimit=()=>DAILY_ALLOWED.has(Number(state.newPerDay))?Number(state.newPerDay):50;
  const dailyCompleted=()=>Math.max(0,Number(window.globalNewCompleted?.()||0));
  const dailyRemaining=()=>Math.max(0,dailyLimit()-dailyCompleted());
  const freshLimit=()=>Math.min(roundSize(),dailyRemaining());
  const isScene500=scene=>(window.PAI_SCENE500?.sceneIds||[]).includes(scene);
  const rankAllowed=(rank,difficulty)=>difficulty==='basic'?rank<=4000:difficulty==='common'?rank>4000&&rank<=8000:difficulty==='advanced'?rank>8000&&rank<=11000:difficulty==='high'?rank>11000:true;
  const unitKeyOf=u=>unitKey(u.w,u.sid);

  if(state.scene500Pilot){delete state.scene500Pilot;save()}

  function sceneMemberKeys(scene){return new Set((allUnits(scene)||[]).map(unitKeyOf))}
  function dueKeys(scene){
    const allDue=window.PAI_LEARNING_QA?.due?.()||[];
    if(isScene500(scene)){
      const members=sceneMemberKeys(scene),difficulty=state.scene500DifficultyByScene?.[scene]||'all';return allDue.filter(k=>members.has(k)&&rankAllowed(Number(window.PAI_CORE?.byKU?.get(k)?.w?.rank)||999999,difficulty));
    }
    return allDue.filter(k=>window.PAI_CORE?.byKU?.get(k)?.s?.scene===scene);
  }

  function freshKeys(scene,excluded=new Set()){
    const limit=freshLimit();if(limit<=0)return[];
    if(isScene500(scene)){
      const difficulty=state.scene500DifficultyByScene?.[scene]||'all',out=[],seenWords=new Set();
      for(const u of (allUnits(scene)||[])){
        if(!rankAllowed(Number(u?.w?.rank)||999999,difficulty))continue;
        const k=unitKeyOf(u),wordKey=u.w?.rank??u.w?.w;
        if(excluded.has(k)||seenWords.has(wordKey)||state.records?.[k])continue;
        if(Object.keys(u.w?.s||{}).some(id=>state.records?.[id]))continue;
        seenWords.add(wordKey);out.push(k);if(out.length>=limit)break;
      }
      return out;
    }
    const units=window.PAI_LEARNING_QA?.unlearned?.(scene)||[];
    const out=[],seenWords=new Set();
    for(const u of units){
      const wordKey=u.w?.rank??u.w?.w;if(excluded.has(u.k)||seenWords.has(wordKey))continue;
      seenWords.add(wordKey);out.push(u.k);if(out.length>=limit)break;
    }
    return out;
  }

  // Compute the full scene queue before the learning runtime starts.
  // Never replace a live queue or call resumeLearning a second time.
  window.PAI_SCENE_SESSION_KEYS=function(scene){
    const due=dueKeys(scene),fresh=freshKeys(scene),seen=new Set(due);
    return [...due,...fresh.filter(k=>!seen.has(k))];
  };

  function reinforcementKeys(){
    window.globalReinforcementRemaining?.();
    const keys=Array.isArray(state.daily?.reinforcementKeys)?state.daily.reinforcementKeys:[];
    return keys.filter(k=>window.PAI_CORE?.byKU?.has(k)&&!state.records?.[k]);
  }
  window.openReinforcement=function(){
    const keys=reinforcementKeys().slice(0,roundSize());if(!keys.length)return;
    state.learningSession={date:new Date().toISOString().slice(0,10),kind:'reinforcement',title:'知识强化',queue:keys,total:keys.length,completed:[],seen:{},attempts:0};
    state.view='learning';state.revealed=false;save();
    if(typeof window.resumeLearning==='function')window.resumeLearning();
    else if(typeof render==='function')render();
  };

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
  window.studyBudgetSummary=()=>({
    dailyLimit:dailyLimit(),
    dailyCompleted:dailyCompleted(),
    dailyRemaining:dailyRemaining(),
    roundLimit:roundSize(),
    reinforcementRemaining:reinforcementKeys().length,
    due:Math.max(0,Number(window.PAI_LEARNING_QA?.due?.().length||0))
  });

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
        if(!rows.some(x=>x.querySelector('span')?.textContent?.trim()==='每轮单词数')){
          const options=[10,25,50].map(n=>`<option value="${n}" ${roundSize()===n?'selected':''}>${n}</option>`).join('');
          dailyRow.insertAdjacentHTML('afterend',`<div class="setting-row"><span>每轮单词数</span><select onchange="setWordsPerRound(+this.value)">${options}</select></div>`);
        }
      }
      for(const el of document.querySelectorAll('.panel-block.muted')){
        if(el.textContent.includes('新词数量固定')||el.textContent.includes('每轮新词数量固定')||el.textContent.includes('每日新词控制'))el.textContent='每日新词限制全天新词数量；每轮单词数限制本轮KU总数，到期复习优先占位，新词填补剩余名额。到期复习与强化不占每日新词额度。';
      }
    }
    return out;
  };
})();
