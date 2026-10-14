// Daily policy V2: newPerDay means NEW WORDS. Extra KUs are scheduled as a separate reinforcement budget.
(function(){
  const oldSave=save;
  const ASSIGNMENT_POLICY='rank-first-words+reinforcement-v2';
  const REINFORCEMENT_RATIO=.30;
  function dayKey(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  const scopeLimit=()=>13000;
  const reinforcementQuota=()=>Math.max(3,Math.round(state.newPerDay*REINFORCEMENT_RATIO));
  function ensureProgress(){
    const date=dayKey();
    if(!state.dailyNewProgress||state.dailyNewProgress.date!==date)state.dailyNewProgress={date,completed:[],newWordsCompleted:[],reinforcementCompleted:[]};
    const p=state.dailyNewProgress;
    p.completed=Array.isArray(p.completed)?p.completed:[];
    // One-time same-day compatibility with the old KU-count policy: do not unexpectedly grant a second full quota.
    p.newWordsCompleted=Array.isArray(p.newWordsCompleted)?p.newWordsCompleted:[...p.completed];
    p.reinforcementCompleted=Array.isArray(p.reinforcementCompleted)?p.reinforcementCompleted:[];
    return p;
  }
  function primaryKey(w){return Object.keys(w.s||{})[0]||null}
  function wordIntroduced(w){const k=primaryKey(w);return !!(k&&state.records[k])}
  function primaryUnit(w){const key=primaryKey(w);return key?findUnitByKey(key):null}
  function pickNewWords(limit){
    if(limit<=0)return[];
    const picked=[];
    for(const w of window.PAI_CORE.words){
      if(picked.length>=limit)break;
      if(wordIntroduced(w))continue;
      const u=primaryUnit(w);if(u)picked.push(u);
    }
    return picked;
  }
  const TYPE_ORDER=Object.freeze({sense:0,risk:1,contrast:2,grammar:3,usage:4,collocation:5,pronunciation:6,polysemy:7,morphology:8,discourse:9,pragmatics:10});
  function pickReinforcement(limit){
    if(limit<=0)return[];
    const candidates=[];
    for(const w of window.PAI_CORE.words){
      if(!wordIntroduced(w))continue;
      const primary=primaryKey(w);
      for(const [k] of Object.entries(w.s||{})){
        if(k===primary||state.records[k])continue;
        const u=findUnitByKey(k);if(u)candidates.push(u);
      }
    }
    candidates.sort((a,b)=>((TYPE_ORDER[a.s.kuType]??20)-(TYPE_ORDER[b.s.kuType]??20))||(a.w.rank-b.w.rank)||String(a.k).localeCompare(String(b.k)));
    const picked=[],seenWords=new Set();
    for(const u of candidates){
      if(picked.length>=limit)break;
      if(seenWords.has(u.w.rank))continue;
      seenWords.add(u.w.rank);picked.push(u);
    }
    return picked;
  }
  function blankAssignments(){return Object.fromEntries(Object.keys(SCENES).map(scene=>[scene,[]]))}
  function addAssigned(assigned,u){const scene=u.s.scene in assigned?u.s.scene:'general';(assigned[scene]||(assigned[scene]=[])).push(unitKey(u.w,u.sid))}
  function buildAssignments(){
    const assigned=blankAssignments(),p=ensureProgress();
    const remainingWords=Math.max(0,state.newPerDay-p.newWordsCompleted.length);
    const remainingReinforcement=Math.max(0,reinforcementQuota()-p.reinforcementCompleted.length);
    const newWords=pickNewWords(remainingWords),reinforcement=pickReinforcement(remainingReinforcement);
    newWords.forEach(u=>addAssigned(assigned,u));reinforcement.forEach(u=>addAssigned(assigned,u));
    state.daily={
      date:dayKey(),assigned,quota:state.newPerDay,wordQuota:state.newPerDay,reinforcementQuota:reinforcementQuota(),
      newWordKeys:newWords.map(u=>unitKey(u.w,u.sid)),reinforcementKeys:reinforcement.map(u=>unitKey(u.w,u.sid)),
      lexiconLimit:scopeLimit(),policy:ASSIGNMENT_POLICY
    };
    oldSave();return state.daily;
  }
  function ensureDaily(){
    ensureProgress();const d=state.daily;
    if(!d||d.date!==dayKey()||d.wordQuota!==state.newPerDay||d.reinforcementQuota!==reinforcementQuota()||d.lexiconLimit!==scopeLimit()||d.policy!==ASSIGNMENT_POLICY||!d.assigned)return buildAssignments();
    for(const scene of Object.keys(SCENES))d.assigned[scene]=d.assigned[scene]||[];
    d.newWordKeys=Array.isArray(d.newWordKeys)?d.newWordKeys:[];d.reinforcementKeys=Array.isArray(d.reinforcementKeys)?d.reinforcementKeys:[];
    return d;
  }
  function assignedKeys(scene){ensureDaily();return state.daily.assigned[scene]||[]}

  queueFor=function(scene){
    const due=dueUnits(scene),dueSet=new Set(due.map(u=>unitKey(u.w,u.sid)));
    const fresh=assignedKeys(scene).filter(k=>!state.records[k]).map(findUnitByKey).filter(Boolean).filter(u=>!dueSet.has(unitKey(u.w,u.sid)));
    return [...due,...fresh];
  };
  todayCount=function(scene){return queueFor(scene).length};

  window.markDailyNewComplete=function(k){
    if(!k)return;const p=ensureProgress(),d=ensureDaily();
    if(!p.completed.includes(k))p.completed.push(k);
    if(d.newWordKeys.includes(k)&&!p.newWordsCompleted.includes(k))p.newWordsCompleted.push(k);
    if(d.reinforcementKeys.includes(k)&&!p.reinforcementCompleted.includes(k))p.reinforcementCompleted.push(k);
    oldSave();
  };
  window.setNewPerDay=function(n){
    state.newPerDay=[10,20,30,50].includes(n)?n:20;
    state.daily=null;buildAssignments();
    if(typeof render==='function')render();
  };
  // Deliberately does not exceed today's word/reinforcement budgets. Kept for compatibility with the old runtime.
  window.addSceneNewWords=function(){ensureDaily();return 0};
  window.rebuildDailyAssignments=function(){state.daily=null;return buildAssignments()};
  window.globalNewRemaining=function(){ensureDaily();return state.daily.newWordKeys.filter(k=>!state.records[k]).length};
  window.globalNewCompleted=function(){return ensureProgress().newWordsCompleted.length};
  window.globalNewAssigned=function(){return globalNewCompleted()+globalNewRemaining()};
  window.globalReinforcementRemaining=function(){ensureDaily();return state.daily.reinforcementKeys.filter(k=>!state.records[k]).length};
  window.globalReinforcementCompleted=function(){return ensureProgress().reinforcementCompleted.length};
  window.dailyPolicyQA=function(){ensureDaily();return {policy:ASSIGNMENT_POLICY,newWordQuota:state.daily.wordQuota,reinforcementQuota:state.daily.reinforcementQuota,newWords:state.daily.newWordKeys.length,reinforcement:state.daily.reinforcementKeys.length,totalFresh:Object.values(state.daily.assigned).flat().length}};
  // Intentionally lazy: product-v2 repairs V26.7I scene metadata before the first assignment is generated.
})();
