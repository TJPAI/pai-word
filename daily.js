// Daily assignment policy only. UI is owned by app-runtime.js.
(function(){
  const oldSave=save;
  function dayKey(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function ensureDaily(){
    const k=dayKey();
    if(!state.daily||state.daily.date!==k)state.daily={date:k,assigned:{}};
    state.daily.assigned=state.daily.assigned||{};
  }
  function assignedKeys(scene){
    ensureDaily();
    if(!state.daily.assigned[scene]){
      const fresh=allUnits(scene).filter(u=>!state.records[unitKey(u.w,u.sid)]);
      state.daily.assigned[scene]=fresh.slice(0,state.newPerDay).map(u=>unitKey(u.w,u.sid));
      oldSave();
    }
    return state.daily.assigned[scene];
  }


  queueFor=function(scene){
    const due=dueUnits(scene),dueSet=new Set(due.map(u=>unitKey(u.w,u.sid)));
    const fresh=assignedKeys(scene)
      .filter(k=>!state.records[k])
      .map(findUnitByKey)
      .filter(Boolean)
      .filter(u=>!dueSet.has(unitKey(u.w,u.sid)));
    return [...due,...fresh];
  };
  todayCount=function(scene){return queueFor(scene).length};

  window.setNewPerDay=function(n){
    state.newPerDay=n;
    ensureDaily();
    for(const scene of Object.keys(SCENES)){
      const current=state.daily.assigned[scene]||[];
      if(current.length<n){
        const used=new Set(current);
        const extra=allUnits(scene)
          .filter(u=>!state.records[unitKey(u.w,u.sid)]&&!used.has(unitKey(u.w,u.sid)))
          .slice(0,n-current.length)
          .map(u=>unitKey(u.w,u.sid));
        state.daily.assigned[scene]=[...current,...extra];
      }
    }
    oldSave();
    if(typeof render==='function')render();
  };

  window.addSceneNewWords=function(scene,n=10){
    ensureDaily();
    const current=assignedKeys(scene),used=new Set(current);
    const extra=allUnits(scene)
      .filter(u=>!state.records[unitKey(u.w,u.sid)]&&!used.has(unitKey(u.w,u.sid)))
      .slice(0,n)
      .map(u=>unitKey(u.w,u.sid));
    state.daily.assigned[scene]=[...current,...extra];
    oldSave();
    return extra.length;
  };

  ensureDaily();
})();
