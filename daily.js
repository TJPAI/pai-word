// Global daily assignment policy. New items share one app-wide quota; due reviews are unlimited.
(function(){
  const oldSave=save;
  function dayKey(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  const scopeLimit=()=>13000;
  function ensureProgress(){
    const date=dayKey();
    if(!state.dailyNewProgress||state.dailyNewProgress.date!==date)state.dailyNewProgress={date,completed:[]};
    state.dailyNewProgress.completed=Array.isArray(state.dailyNewProgress.completed)?state.dailyNewProgress.completed:[];
    return state.dailyNewProgress;
  }
  function freshPool(){
    const seen=new Set(),out=[];
    for(const scene of Object.keys(SCENES))for(const u of allUnits(scene)){
      const k=unitKey(u.w,u.sid);
      if(seen.has(k)||state.records[k])continue;
      seen.add(k);out.push(u);
    }
    return out.sort((a,b)=>(a.w.rank-b.w.rank)||String(a.s.sense_id).localeCompare(String(b.s.sense_id)));
  }
  function buildAssignments(){
    const assigned=Object.fromEntries(Object.keys(SCENES).map(scene=>[scene,[]])),progress=ensureProgress();
    const remaining=Math.max(0,state.newPerDay-progress.completed.length),picked=freshPool().slice(0,remaining);
    for(const u of picked)assigned[u.s.scene]?.push(unitKey(u.w,u.sid));
    state.daily={date:dayKey(),assigned,quota:state.newPerDay,lexiconLimit:scopeLimit()};
    oldSave();
    return state.daily;
  }
  function ensureDaily(){
    ensureProgress();const d=state.daily;
    if(!d||d.date!==dayKey()||d.quota!==state.newPerDay||d.lexiconLimit!==scopeLimit()||!d.assigned)return buildAssignments();
    for(const scene of Object.keys(SCENES))d.assigned[scene]=d.assigned[scene]||[];
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
    const p=ensureProgress();if(k&&!p.completed.includes(k)){p.completed.push(k);oldSave()}
  };
  window.setNewPerDay=function(n){
    state.newPerDay=[10,20,30,50].includes(n)?n:20;
    state.daily=null;buildAssignments();
    if(typeof render==='function')render();
  };
  // Deliberately does not exceed the global daily quota. Kept for compatibility with the old runtime.
  window.addSceneNewWords=function(){ensureDaily();return 0};
  window.rebuildDailyAssignments=function(){state.daily=null;return buildAssignments()};
  window.globalNewRemaining=function(){ensureDaily();return Object.values(state.daily.assigned).flat().filter(k=>!state.records[k]).length};
  window.globalNewCompleted=function(){return ensureProgress().completed.length};
  window.globalNewAssigned=function(){ensureDaily();return globalNewCompleted()+Object.values(state.daily.assigned).flat().filter(k=>!state.records[k]).length};
  ensureDaily();
})();
