// Isolated V2.1 pilot UI. Activated only with ?v21=1 on the development branch.
(function(){
  const E=window.PAI_EVIDENCE,C=window.PAI_V21_CONTENT;
  const app=document.getElementById('app');
  let session=null,clockTaskId=null,clockStart=0,clockAccum=0,clockVisible=!document.hidden,busy=false;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const unitByKu=()=>new Map(C.units.map(x=>[x.ku_id,x]));
  const targetSpec=(spec,targetId)=>spec.targets.find(t=>t.target_id===targetId);
  const itemSpec=(spec,itemId)=>spec.items.find(i=>i.item_id===itemId);
  const nowIso=()=>new Date().toISOString();

  function taskId(prefix){return E.makeId(prefix)}
  function makeTask(kind,spec,target,item=null,extra={}){
    return {task_id:taskId('task'),event_id:E.makeId('evt'),kind,ku_id:spec.ku_id,target_id:target.target_id,target_type:target.type,item_id:item?.item_id||null,item_version:item?.item_version||null,...extra};
  }
  function targetPayload(task){return {target_id:task.target_id,ku_id:task.ku_id,type:task.target_type,content_version:C.version}}

  function resetClockFor(task){
    if(clockTaskId===task?.task_id)return;
    clockTaskId=task?.task_id||null;clockAccum=0;clockVisible=!document.hidden;clockStart=performance.now();
  }
  function visibilityChanged(){
    const now=performance.now();
    if(document.hidden&&clockVisible){clockAccum+=Math.min(now-clockStart,60000);clockVisible=false}
    else if(!document.hidden&&!clockVisible){clockVisible=true;clockStart=now}
  }
  document.addEventListener('visibilitychange',visibilityChanged);
  function activeDuration(){const now=performance.now(),raw=clockAccum+(clockVisible?Math.min(now-clockStart,60000):0);return Math.max(0,Math.round(raw))}

  function speak(text){
    if(!text||!('speechSynthesis' in window))return;
    speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(String(text));utter.lang=state.voiceAccent==='gb'?'en-GB':'en-US';utter.rate=.86;speechSynthesis.speak(utter);
  }

  async function chooseRecallItem(spec,target,state){
    const candidates=spec.items.filter(i=>i.target_id===target.target_id&&i.type==='recall_context');
    const seen=new Set(state?.seen_item_ids||[]);
    return candidates.find(i=>i.role==='transfer'&&!seen.has(i.item_id))||candidates.find(i=>i.role==='practice'&&!seen.has(i.item_id))||candidates[0]||null;
  }
  async function chooseChoiceItem(spec,target,state){
    const candidates=spec.items.filter(i=>i.target_id===target.target_id&&i.type==='choice');
    const seen=new Set(state?.seen_item_ids||[]);
    return candidates.find(i=>i.role==='transfer'&&!seen.has(i.item_id))||candidates.find(i=>i.role==='practice'&&!seen.has(i.item_id))||candidates[0]||null;
  }

  async function buildTasks(){
    const tasks=[],pending=[];
    for(const spec of C.units){
      const meaning=spec.targets.find(t=>t.type==='meaning'),mState=await E.getTarget(meaning.target_id),recall=await chooseRecallItem(spec,meaning,mState);
      if(!mState||mState.status==='unmeasured')tasks.push(makeTask('learn',spec,meaning,null,{reason:'new'}));
      if(recall)pending.push(makeTask('recall',spec,meaning,recall,{role:recall.role}));
      if(tasks.length===2&&pending.length)tasks.push(pending.shift());
    }
    if(pending.length){tasks.push(pending.shift());if(pending.length)tasks.push(pending.shift())}
    const apply=C.units.find(x=>x.lemma==='apply'),usage=apply?.targets.find(t=>t.type==='usage');
    if(apply&&usage){const uState=await E.getTarget(usage.target_id),item=await chooseChoiceItem(apply,usage,uState);if(item)tasks.push(makeTask('use',apply,usage,item,{role:item.role}))}
    tasks.push(...pending);
    return tasks;
  }

  async function createSession(continuationOf=null){
    const tasks=await buildTasks(),id=E.makeId('session');
    const s={session_id:id,status:'active',context_id:'work-study',goal:'工作学习',budget_ms:300000,index:0,tasks,created_at:nowIso(),started_at:nowIso(),active_duration:0,continuation_of:continuationOf||null,version:'v2.1-pilot'};
    await E.saveSession(s);await E.putMeta('active_session_id',id);return s;
  }

  function currentTask(){return session?.tasks?.[session.index]||null}
  function specFor(task){return unitByKu().get(task.ku_id)}
  function itemFor(task){const spec=specFor(task);return task.item_id?itemSpec(spec,task.item_id):null}

  function scheduleRetry(task,sessionDraft){
    if(task.retry||sessionDraft.tasks.some(t=>t.retry_for===task.task_id))return;
    const spec=specFor(task),target=targetSpec(spec,task.target_id);
    const reteach=makeTask('learn',spec,target,null,{reason:'recovery',retry_for:task.task_id});
    const retry=makeTask(task.kind,spec,target,itemFor(task),{retry:true,retry_for:task.task_id,role:task.role});
    const insertAt=sessionDraft.index+1;
    sessionDraft.tasks.splice(insertAt,0,reteach);
    const retryAt=Math.min(insertAt+3,sessionDraft.tasks.length);
    sessionDraft.tasks.splice(retryAt,0,retry);
    if(task.target_type==='meaning')sessionDraft.tasks=sessionDraft.tasks.filter((t,i)=>i<=sessionDraft.index||t.ku_id!==task.ku_id||t.target_type!=='usage'||t.retry_for);
  }

  async function commitTask(task,eventFields,{advance=true,mutateSession=null}={}){
    if(busy)return;busy=true;
    try{
      const draft=structuredClone(session);
      if(mutateSession)mutateSession(draft);
      if(advance)draft.index=Math.min(draft.index+1,draft.tasks.length);
      const event=E.makeEvent({event_id:task.event_id,session_id:draft.session_id,ku_id:task.ku_id,target_id:task.target_id,item_id:task.item_id,item_version:task.item_version,event_type:eventFields.event_type,result:eventFields.result,evidence_type:eventFields.evidence_type,hint_used:!!eventFields.hint_used,active_duration:activeDuration(),content_version:C.version,context_id:draft.context_id});
      const result=await E.commit({event,target:targetPayload(task),session:draft});
      session=draft;
      if(!result.duplicate)session.active_duration=(session.active_duration||0)+(event.active_duration||0);
      if(session.index>=session.tasks.length)await finishSession();else render();
    }finally{busy=false}
  }

  async function completeLearn(){const task=currentTask();if(!task)return;await commitTask(task,{event_type:'exposure',result:'exposed',evidence_type:'instructional_exposure'});}
  async function revealRecall(){const task=currentTask();if(!task||task.kind!=='recall')return;task.revealed=true;task.revealed_at=nowIso();await E.saveSession(session);render();}
  async function rateRecall(recalled){
    const task=currentTask();if(!task)return;
    const target=await E.getTarget(task.target_id),prevAt=target?.last_event_at?Date.parse(target.last_event_at):0,delayed=prevAt&&Date.now()-prevAt>=12*3600000;
    await commitTask(task,{event_type:'recall',result:recalled?'recalled':'not_recalled',evidence_type:delayed?'delayed_self_recall':'self_recall'},
      {mutateSession:draft=>{if(!recalled)scheduleRetry(task,draft)}});
  }

  async function answerChoice(index){
    const task=currentTask(),item=itemFor(task);if(!task||task.kind!=='use'||task.answered||!item)return;
    const correct=Number(index)===item.answer_index,draft=structuredClone(session),dTask=draft.tasks[draft.index];
    dTask.answered=true;dTask.selected_index=Number(index);dTask.correct=correct;dTask.feedback=item.explanation;
    if(!correct)scheduleRetry(dTask,draft);
    const target=await E.getTarget(task.target_id),prevAt=target?.last_event_at?Date.parse(target.last_event_at):0,delayed=prevAt&&Date.now()-prevAt>=12*3600000;
    const event=E.makeEvent({event_id:task.event_id,session_id:draft.session_id,ku_id:task.ku_id,target_id:task.target_id,item_id:task.item_id,item_version:task.item_version,event_type:'objective_answer',result:correct?'correct':'incorrect',evidence_type:delayed?'delayed_objective':'objective',hint_used:false,active_duration:activeDuration(),content_version:C.version,context_id:draft.context_id});
    busy=true;
    try{const result=await E.commit({event,target:targetPayload(task),session:draft});session=draft;if(!result.duplicate)session.active_duration=(session.active_duration||0)+(event.active_duration||0);render();}finally{busy=false}
  }
  async function continueAfterChoice(){if(!session)return;session.index=Math.min(session.index+1,session.tasks.length);await E.saveSession(session);if(session.index>=session.tasks.length)await finishSession();else render();}

  async function finishSession(){
    session.status='completed';session.completed_at=nowIso();await E.saveSession(session);await E.putMeta('active_session_id',null);renderEnd();
  }
  async function pauseSession(){if(!session)return;await E.saveSession(session);renderHome(true)}
  async function continueFive(){const previous=session?.session_id||null;session=await createSession(previous);render()}

  async function summary(){
    const events=await E.listEventsBySession(session.session_id),newTargets=new Set(events.filter(e=>e.event_type==='exposure').map(e=>e.target_id)),practiced=new Set(events.filter(e=>e.event_type!=='exposure').map(e=>e.target_id)),failures=events.filter(e=>['not_recalled','incorrect'].includes(e.result)).length;
    return {newCount:newTargets.size,practiceCount:practiced.size,failures,activeMs:events.reduce((n,e)=>n+(e.active_duration||0),0)};
  }

  function header(title='PAI Word'){return `<div class="v21-top"><div><b>${esc(title)}</b><span>工作学习</span></div>${session?.status==='active'?'<button class="v21-link" onclick="PAI_V21_APP.pause()">暂停</button>':''}</div>`}
  function renderHome(resumable=false){
    app.innerHTML=`<main class="v21-screen">${header()}<section class="v21-hero"><div class="v21-kicker">当前学习目标</div><h1>工作学习</h1><p>系统会混合安排少量新内容、必要复习和再次检索。</p>${resumable&&session?.status==='active'?'<button class="v21-primary" onclick="PAI_V21_APP.resume()">继续本次学习</button>':'<button class="v21-primary" onclick="PAI_V21_APP.startSession()">开始 · 5 分钟</button>'}<div class="v21-secondary"><button disabled>查词</button><button disabled>进度</button><button disabled>设置</button></div></section><p class="v21-note">V2.1 隔离试验：当前只启用少量审核内容，不代表 Core-13000 已具备完整增强练习。</p></main>`;
  }
  function renderLearn(task,spec){
    const t=spec.teaching,target=task.target_type;
    app.innerHTML=`<main class="v21-screen">${header('学一下')}<section class="v21-card"><div class="v21-word"><h1>${esc(spec.lemma)}</h1><button class="v21-audio" onclick="PAI_V21_APP.speak('${esc(spec.lemma)}')">🔊</button></div><div class="v21-core">${esc(target==='usage'?t.usage:t.meaning)}</div>${target==='meaning'?`<div class="v21-usage"><b>重点用法</b>${esc(t.usage)}</div>`:''}<div class="v21-example"><span>${esc(t.example_en)}</span><small>${esc(t.example_zh)}</small></div><button class="v21-primary" onclick="PAI_V21_APP.completeLearn()">学好了，继续</button><p class="v21-note">这一步只记录“接触/学习过”，不会记作成功回忆。</p></section></main>`;
  }
  function renderRecall(task,spec,item){
    app.innerHTML=`<main class="v21-screen">${header('想一下')}<section class="v21-card"><div class="v21-task-label">先在心中回答，再揭晓</div><h2>${esc(item.prompt)}</h2>${task.revealed?`<div class="v21-answer"><span>答案</span><b>${esc(item.answer)}</b><p>${esc(spec.teaching.meaning)}</p></div><p class="v21-note">请按揭晓前的真实情况选择。</p><div class="v21-actions"><button class="v21-danger" onclick="PAI_V21_APP.rateRecall(false)">没想起</button><button class="v21-primary" onclick="PAI_V21_APP.rateRecall(true)">想起了</button></div>`:'<button class="v21-primary" onclick="PAI_V21_APP.revealRecall()">查看答案</button>'}</section></main>`;
  }
  function renderUse(task,spec,item){
    const answered=task.answered;
    app.innerHTML=`<main class="v21-screen">${header('用一下')}<section class="v21-card"><div class="v21-task-label">根据语境选择最合适的表达</div><h2>${esc(item.prompt)}</h2><div class="v21-options">${item.options.map((o,i)=>`<button ${answered?'disabled':''} class="${answered?(i===item.answer_index?'correct':(i===task.selected_index?'wrong':'')):''}" onclick="PAI_V21_APP.answerChoice(${i})">${esc(o)}</button>`).join('')}</div>${answered?`<div class="v21-feedback ${task.correct?'ok':'bad'}"><b>${task.correct?'答对了':'这里需要再巩固'}</b><p>${esc(task.feedback)}</p></div><button class="v21-primary" onclick="PAI_V21_APP.continueAfterChoice()">继续</button>`:''}</section></main>`;
  }

  function render(){
    if(!session||session.status!=='active'){renderHome(false);return}
    const task=currentTask();if(!task){finishSession();return}
    resetClockFor(task);const spec=specFor(task),item=itemFor(task);
    if(!spec){app.innerHTML='<p>学习内容绑定失败。</p>';return}
    if(task.kind==='learn')renderLearn(task,spec);else if(task.kind==='recall')renderRecall(task,spec,item);else renderUse(task,spec,item);
  }

  async function renderEnd(){
    const s=await summary();
    app.innerHTML=`<main class="v21-screen">${header('本次完成')}<section class="v21-hero"><h1>本次任务完成</h1><div class="v21-summary"><div><b>${s.newCount}</b><span>新接触目标</span></div><div><b>${s.practiceCount}</b><span>练习目标</span></div><div><b>${s.failures}</b><span>仍需巩固</span></div></div><p>完成本次任务不等于已经长期掌握。</p><button class="v21-primary" onclick="PAI_V21_APP.continueFive()">继续 5 分钟</button><button class="v21-plain" onclick="PAI_V21_APP.endToHome()">结束</button><small class="v21-note">记录的前台有效操作时间约 ${Math.round(s.activeMs/1000)} 秒；后台时间不计入。</small></section></main>`;
  }

  async function boot(){
    C.validateAgainstCore();await E.openDB();
    const activeId=await E.getMeta('active_session_id');
    if(activeId){const saved=await E.getSession(activeId);if(saved?.status==='active'){session=saved;render();return}}
    renderHome(false);
  }

  window.PAI_V21_APP={
    boot,
    async startSession(){session=await createSession();render()},
    resume(){render()},pause:pauseSession,completeLearn,revealRecall,rateRecall,answerChoice,continueAfterChoice,continueFive,speak,
    endToHome(){session=null;renderHome(false)}
  };
})();
