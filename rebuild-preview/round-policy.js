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
  const freshLimit=()=>roundSize(); // Daily total is informational, never a learning cap.
  const isScene500=scene=>(window.PAI_SCENE500?.sceneIds||[]).includes(scene);
  const rankAllowed=(rank,difficulty)=>difficulty==='basic'?rank<=4000:difficulty==='common'?rank>4000&&rank<=8000:difficulty==='advanced'?rank>8000&&rank<=11000:difficulty==='high'?rank>11000:true;
  const unitKeyOf=u=>unitKey(u.w,u.sid);

  if(state.scene500Pilot){delete state.scene500Pilot;save()}

  function sceneMemberKeys(scene){return new Set((allUnits(scene)||[]).map(unitKeyOf))}
  function dueKeys(scene){
    const allDue=window.PAI_LEARNING_QA?.due?.()||[];
    if(isScene500(scene)){
      const members=sceneMemberKeys(scene),difficulty=state.scene500DifficultyByScene?.[scene]||'all',seenWords=new Set();
      return allDue.filter(k=>{
        const word=window.PAI_CORE?.byKU?.get(k)?.w;
        if(!members.has(k)||!rankAllowed(Number(word?.rank)||999999,difficulty))return false;
        const lemma=word?.rank??word?.w??k;
        if(seenWords.has(lemma))return false;
        seenWords.add(lemma);return true;
      });
    }
    const seenWords=new Set();
    return allDue.filter(k=>{
      const u=window.PAI_CORE?.byKU?.get(k);
      if(u?.s?.scene!==scene)return false;
      const lemma=u.w?.rank??u.w?.w??k;
      if(seenWords.has(lemma))return false;
      seenWords.add(lemma);return true;
    });
  }

  function freshKeys(scene,excluded=new Set()){
    const limit=freshLimit();
    if(isScene500(scene)){
      const difficulty=state.scene500DifficultyByScene?.[scene]||'all',out=[],seenWords=new Set();
      for(const k of excluded){const word=window.PAI_CORE?.byKU?.get(k)?.w;if(word)seenWords.add(word.rank??word.w)}
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
    for(const k of excluded){const word=window.PAI_CORE?.byKU?.get(k)?.w;if(word)seenWords.add(word.rank??word.w)}
    for(const u of units){
      const wordKey=u.w?.rank??u.w?.w;if(excluded.has(u.k)||seenWords.has(wordKey))continue;
      seenWords.add(wordKey);out.push(u.k);if(out.length>=limit)break;
    }
    return out;
  }

  const baseOpenScene=window.openScene;
  window.openScene=function(scene){
    if(window.PAI_RESUME_SCENE_BOOKMARK?.(scene))return;
    // Opening the same scene must not recreate its unfinished KU queue.
    const pending=state.learningSession;
    if(pending?.kind==='scene'&&Array.isArray(pending.queue)&&pending.queue.length&&
       (pending.scene500SceneId||state.selectedScene)===scene&&
       pending.queue.every(k=>window.PAI_CORE?.byKU?.has(k))){
      window.resumeLearning?.();return;
    }
    if(isScene500(scene)&&typeof window.PAI_START_POLICY_SESSION==='function'){
      state.selectedScene=scene;
      window.rebuildDailyAssignments?.();
      const due=dueKeys(scene).slice(0,roundSize()),seen=new Set(due);
      const fresh=freshKeys(scene,seen).filter(k=>!seen.has(k)).slice(0,Math.max(0,roundSize()-due.length));
      const keys=[...due,...fresh];
      const result=window.PAI_START_POLICY_SESSION(keys,SCENES[scene]+' · 定向学习','scene');
      if(state.learningSession){state.learningSession.scene500SceneId=scene;state.learningSession.scene500Difficulty=state.scene500DifficultyByScene?.[scene]||'all';save();}
      return result;
    }
    const result=baseOpenScene(scene);
    if(state.learningSession?.kind==='scene'){
      const due=dueKeys(scene).slice(0,roundSize()),seen=new Set(due);
      const fresh=freshKeys(scene,seen).filter(k=>!seen.has(k)).slice(0,Math.max(0,roundSize()-due.length));
      const keys=[...due,...fresh];
      state.learningSession.scene500SceneId=scene;
      state.learningSession.scene500Difficulty=state.scene500DifficultyByScene?.[scene]||'all';
      state.learningSession.queue=keys;
      state.learningSession.total=keys.length;
      state.learningSession.completed=[];
      state.learningSession.seen={};
      state.learningSession.attempts=0;
      save();
      window.resumeLearning?.();
    }
    return result;
  };

  function reinforcementKeys(){
    window.globalReinforcementRemaining?.();
    const keys=Array.isArray(state.daily?.reinforcementKeys)?state.daily.reinforcementKeys:[];
    return keys.filter(k=>window.PAI_CORE?.byKU?.has(k)&&!state.records?.[k]);
  }
  window.openReinforcement=function(){
    const keys=[],seenWords=new Set();
    for(const k of reinforcementKeys()){
      const word=window.PAI_CORE?.byKU?.get(k)?.w;
      const lemma=word?.rank??word?.w??k;
      if(seenWords.has(lemma))continue;
      seenWords.add(lemma);keys.push(k);
      if(keys.length>=roundSize())break;
    }
    if(!keys.length)return;
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

  // Grading correction stays in TapFlow until the scheduled final commit.
  // Do not override TapFlow.correct with immediate SRS writes.

  const baseRender=window.render;
  window.render=function(){
    const out=baseRender();
    if(state.view==='settings'){
      const rows=[...document.querySelectorAll('.setting-row')];
      // Batch size is a user setting, independent of any discontinued daily quota.
      const batchRow=rows.find(x=>x.querySelector('span')?.textContent?.trim()==='每轮单词数');
      const options=[10,25,50].map(n=>`<option value="${n}" ${roundSize()===n?'selected':''}>${n}</option>`).join('');
      if(batchRow){
        const select=batchRow.querySelector('select');
        if(select){select.innerHTML=options;select.setAttribute('onchange','setWordsPerRound(+this.value)')}
      }else{
        const settingsRoot=document.querySelector('.setting-row')?.parentElement;
        if(settingsRoot)settingsRoot.insertAdjacentHTML('beforeend',`<div class="setting-row"><span>每轮单词数</span><select onchange="setWordsPerRound(+this.value)">${options}</select></div>`);
      }
      for(const el of document.querySelectorAll('.panel-block.muted')){
        if(el.textContent.includes('新词数量固定')||el.textContent.includes('每轮新词数量固定')||el.textContent.includes('每日新词控制'))el.textContent='每日新词只用于统计，不限制学习数量；每轮单词数可选择10、25或50。';
      }
    }
    return out;
  };
})();
