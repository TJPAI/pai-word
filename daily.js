// Enforce fixed daily new-word quota per scene; due reviews remain unlimited.
(function(){
  const oldSave=save;
  function dayKey(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function ensureDaily(){
    const k=dayKey();
    if(!state.daily || state.daily.date!==k){
      state.daily={date:k,assigned:{}};
    }
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
  function findUnitByKey(k){
    const [word,sid]=k.split('::');
    const w=WORDS.find(x=>x.w===word);
    return w&&w.s[sid]?{w,sid,s:w.s[sid]}:null;
  }
  queueFor=function(scene){
    const due=dueUnits(scene);
    const dueSet=new Set(due.map(u=>unitKey(u.w,u.sid)));
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
    oldSave();render();
  };

  // Add extra new words only to the selected scene. This must not change the
  // user's global daily-new-word setting or assignments in other scenes.
  window.addSceneNewWords=function(scene,n=10){
    ensureDaily();
    const current=assignedKeys(scene);
    const used=new Set(current);
    const extra=allUnits(scene)
      .filter(u=>!state.records[unitKey(u.w,u.sid)]&&!used.has(unitKey(u.w,u.sid)))
      .slice(0,n)
      .map(u=>unitKey(u.w,u.sid));
    state.daily.assigned[scene]=[...current,...extra];
    oldSave();
    return extra.length;
  };

  const baseRenderPanel=renderPanel;
  renderPanel=function(kind){
    if(kind!=='settings')return baseRenderPanel(kind);
    return `<div class="screen panel-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>设置</h2></div><div class="panel-block"><div class="setting-row"><span>每日新词</span><select onchange="setNewPerDay(+this.value)">${[10,20,30,50].map(n=>`<option value="${n}" ${state.newPerDay===n?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="panel-block muted">新词数量固定；到期复习不设上限。</div></div>`;
  };

  ensureDaily();
})();
