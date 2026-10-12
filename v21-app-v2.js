// PAI Word V2.1 isolated pilot UI. Activated only with ?v21=1.
(function(){
  const E=window.PAI_EVIDENCE,C=window.PAI_V21_CONTENT,app=document.getElementById('app');
  let session=null,busy=false,clockTask=null,clockStart=0,clockAccum=0,clockVisible=!document.hidden;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const nowIso=()=>new Date().toISOString();
  const specs=()=>new Map(C.units.map(u=>[u.ku_id,u]));
  const specFor=t=>specs().get(t.ku_id);
  const targetFor=(s,id)=>s.targets.find(t=>t.target_id===id);
  const itemFor=t=>{const s=specFor(t);return t.item_id?s.items.find(i=>i.item_id===t.item_id):null};
  const targetPayload=t=>({target_id:t.target_id,ku_id:t.ku_id,type:t.target_type,content_version:C.version});

  function onVisibility(){const now=performance.now();if(document.hidden&&clockVisible){clockAccum+=Math.min(now-clockStart,60000);clockVisible=false}else if(!document.hidden&&!clockVisible){clockVisible=true;clockStart=now}}
  document.addEventListener('visibilitychange',onVisibility);
  function resetClock(task){if(clockTask===task?.task_id)return;clockTask=task?.task_id||null;clockAccum=0;clockVisible=!document.hidden;clockStart=performance.now()}
  function activeMs(){return Math.max(0,Math.round(clockAccum+(clockVisible?Math.min(performance.now()-clockStart,60000):0)))}

  function mkTask(kind,spec,target,item=null,extra={}){return {task_id:E.makeId('task'),event_id:E.makeId('evt'),kind,ku_id:spec.ku_id,target_id:target.target_id,target_type:target.type,item_id:item?.item_id||null,item_version:item?.item_version||null,...extra}}
  function pickItem(spec,target,state,type){
    const list=spec.items.filter(i=>i.target_id===target.target_id&&i.type===type),seen=new Set(state?.seen_item_ids||[]);
    const practice=list.find(i=>i.role==='practice'),transfer=list.find(i=>i.role==='transfer');
    const transferReady=['independent_recall','delayed_verified'].includes(state?.status);
    if(practice&&(!seen.has(practice.item_id)||!transferReady))return practice;
    if(transfer&&transferReady&&!seen.has(transfer.item_id))return transfer;
    return practice||transfer||list[0]||null;
  }

  async function buildTasks(){
    const tasks=[],pending=[];
    for(const spec of C.units){
      const meaning=spec.targets.find(t=>t.type==='meaning'),state=await E.getTarget(meaning.target_id),item=pickItem(spec,meaning,state,'recall_context');
      if(!state||state.status==='unmeasured')tasks.push(mkTask('learn',spec,meaning,null,{reason:'new'}));
      if(item)pending.push(mkTask('recall',spec,meaning,item,{role:item.role}));
      if(tasks.filter(t=>t.kind==='learn').length===2&&pending.length&&!tasks.some(t=>t.kind==='recall'))tasks.push(pending.shift());
    }
    if(pending.length)tasks.push(pending.shift());
    const apply=C.units.find(u=>u.lemma==='apply'),usage=apply?.targets.find(t=>t.type==='usage');
    if(apply&&usage){const state=await E.getTarget(usage.target_id),item=pickItem(apply,usage,state,'choice');if(item)tasks.push(mkTask('use',apply,usage,item,{role:item.role}))}
    tasks.push(...pending);
    return tasks;
  }

  async function newSession(previous=null){
    const s={session_id:E.makeId('session'),status:'active',context_id:'work-study',goal:'工作学习',budget_ms:300000,index:0,tasks:await buildTasks(),created_at:nowIso(),started_at:nowIso(),active_duration:0,budget_reached:false,continuation_of:previous,version:'v2.1-pilot'};
    await E.saveSession(s);await E.putMeta('active_session_id',s.session_id);return s;
  }
  const currentTask=()=>session?.tasks?.[session.index]||null;

  function addRecovery(draft,task){
    if(task.retry||draft.tasks.some(t=>t.retry_for===task.task_id))return;
    const spec=specFor(task),target=targetFor(spec,task.target_id),reteach=mkTask('learn',spec,target,null,{reason:'recovery',retry_for:task.task_id}),retry=mkTask(task.kind,spec,target,itemFor(task),{retry:true,retry_for:task.task_id,role:task.role});
    if(task.target_type==='meaning')draft.tasks=draft.tasks.filter((t,i)=>i<=draft.index||t.ku_id!==task.ku_id||t.target_type!=='usage');
    const immediate=draft.index+1;draft.tasks.splice(immediate,0,reteach);
    const later=Math.min(immediate+2,draft.tasks.length);draft.tasks.splice(later,0,retry);
  }
  function markBudgetIfNeeded(draft){if(draft.index<draft.tasks.length&&(draft.active_duration||0)>=(draft.budget_ms||300000))draft.budget_reached=true}

  async function commitTask(task,fields,mutator=null,advance=true){
    if(busy)return;busy=true;
    try{
      const draft=structuredClone(session),duration=activeMs();
      if(mutator)mutator(draft);
      if(advance)draft.index=Math.min(draft.index+1,draft.tasks.length);
      draft.active_duration=(draft.active_duration||0)+duration;markBudgetIfNeeded(draft);
      const event=E.makeEvent({event_id:task.event_id,session_id:draft.session_id,ku_id:task.ku_id,target_id:task.target_id,item_id:task.item_id,item_version:task.item_version,event_type:fields.event_type,result:fields.result,evidence_type:fields.evidence_type,hint_used:!!fields.hint_used,active_duration:duration,content_version:C.version,context_id:draft.context_id});
      const result=await E.commit({event,target:targetPayload(task),session:draft});session=draft;
      if(result.duplicate){const stored=await E.getSession(draft.session_id);if(stored)session=stored}
      if(session.index>=session.tasks.length)await finish();else if(session.budget_reached)await renderEnd('budget');else render();
    }finally{busy=false}
  }

  async function completeLearn(){const t=currentTask();if(t)await commitTask(t,{event_type:'exposure',result:'exposed',evidence_type:'instructional_exposure'})}
  async function revealRecall(){const t=currentTask();if(!t||t.kind!=='recall'||busy)return;t.revealed=true;t.revealed_at=nowIso();await E.saveSession(session);render()}
  async function rateRecall(ok){
    const t=currentTask();if(!t||busy)return;
    const state=await E.getTarget(t.target_id),last=state?.last_event_at?Date.parse(state.last_event_at):0,delayed=!!last&&Date.now()-last>=12*3600000;
    await commitTask(t,{event_type:'recall',result:ok?'recalled':'not_recalled',evidence_type:delayed?'delayed_self_recall':'self_recall'},ok?null:d=>addRecovery(d,t));
  }
  async function answerChoice(index){
    const t=currentTask(),item=itemFor(t);if(!t||t.kind!=='use'||t.answered||!item||busy)return;busy=true;
    try{
      const correct=Number(index)===item.answer_index,draft=structuredClone(session),dt=draft.tasks[draft.index],duration=activeMs();
      dt.answered=true;dt.selected_index=Number(index);dt.correct=correct;dt.feedback=item.explanation;
      if(!correct)addRecovery(draft,dt);
      draft.active_duration=(draft.active_duration||0)+duration;
      const state=await E.getTarget(t.target_id),last=state?.last_event_at?Date.parse(state.last_event_at):0,delayed=!!last&&Date.now()-last>=12*3600000;
      const event=E.makeEvent({event_id:t.event_id,session_id:draft.session_id,ku_id:t.ku_id,target_id:t.target_id,item_id:t.item_id,item_version:t.item_version,event_type:'objective_answer',result:correct?'correct':'incorrect',evidence_type:delayed?'delayed_objective':'objective',hint_used:false,active_duration:duration,content_version:C.version,context_id:draft.context_id});
      const result=await E.commit({event,target:targetPayload(t),session:draft});session=draft;if(result.duplicate){const stored=await E.getSession(draft.session_id);if(stored)session=stored}render();
    }finally{busy=false}
  }
  async function continueChoice(){
    const t=currentTask();if(!t?.answered||busy)return;
    session.index=Math.min(session.index+1,session.tasks.length);markBudgetIfNeeded(session);await E.saveSession(session);
    if(session.index>=session.tasks.length)await finish();else if(session.budget_reached)await renderEnd('budget');else render();
  }

  async function finish(){session.status='completed';session.completed_at=nowIso();session.budget_reached=false;await E.saveSession(session);await E.putMeta('active_session_id',null);await renderEnd('complete')}
  async function pause(){if(session){await E.saveSession(session);renderHome(true)}}
  async function summary(){const events=await E.listEventsBySession(session.session_id);return {newCount:new Set(events.filter(e=>e.event_type==='exposure').map(e=>e.target_id)).size,practiceCount:new Set(events.filter(e=>e.event_type!=='exposure').map(e=>e.target_id)).size,failures:events.filter(e=>['not_recalled','incorrect'].includes(e.result)).length,activeMs:events.reduce((n,e)=>n+(e.active_duration||0),0)}}

  function speak(text){if(!text||!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text));u.lang=state.voiceAccent==='gb'?'en-GB':'en-US';u.rate=.86;speechSynthesis.speak(u)}
  function header(title='PAI Word'){return `<div class="v21-top"><div><b>${esc(title)}</b><span>工作学习</span></div>${session?.status==='active'&&!session?.budget_reached?'<button class="v21-link" onclick="PAI_V21_APP.pause()">暂停</button>':''}</div>`}
  function renderHome(resume=false){app.innerHTML=`<main class="v21-screen">${header()}<section class="v21-hero"><div class="v21-kicker">当前学习目标</div><h1>工作学习</h1><p>系统会混合安排少量新内容、必要复习和再次检索。</p>${resume&&session?.status==='active'?'<button class="v21-primary" onclick="PAI_V21_APP.resume()">继续本次学习</button>':'<button class="v21-primary" onclick="PAI_V21_APP.startSession()">开始 · 5 分钟</button>'}<div class="v21-secondary"><button disabled>查词</button><button disabled>进度</button><button disabled>设置</button></div></section><p class="v21-note">V2.1 隔离试验：增强评分仅覆盖少量人工审阅内容，不代表 Core-13000 已全部具备增强练习。</p></main>`}
  function renderLearn(t,s){const d=s.teaching;app.innerHTML=`<main class="v21-screen">${header('学一下')}<section class="v21-card"><div class="v21-word"><h1>${esc(s.lemma)}</h1><button class="v21-audio" onclick="PAI_V21_APP.speak('${esc(s.lemma)}')">🔊</button></div><div class="v21-core">${esc(t.target_type==='usage'?d.usage:d.meaning)}</div>${t.target_type==='meaning'?`<div class="v21-usage"><b>重点用法</b>${esc(d.usage)}</div>`:''}<div class="v21-example"><span>${esc(d.example_en)}</span><small>${esc(d.example_zh)}</small></div><button class="v21-primary" onclick="PAI_V21_APP.completeLearn()">学好了，继续</button><p class="v21-note">首次教学只记录接触，不记作成功检索。</p></section></main>`}
  function renderRecall(t,s,item){app.innerHTML=`<main class="v21-screen">${header('想一下')}<section class="v21-card"><div class="v21-task-label">先在心中回答，再揭晓</div><h2>${esc(item.prompt)}</h2>${t.revealed?`<div class="v21-answer"><span>答案</span><b>${esc(item.answer)}</b><p>${esc(s.teaching.meaning)}</p></div><p class="v21-note">请按揭晓前的真实情况选择。</p><div class="v21-actions"><button class="v21-danger" onclick="PAI_V21_APP.rateRecall(false)">没想起</button><button class="v21-primary" onclick="PAI_V21_APP.rateRecall(true)">想起了</button></div>`:'<button class="v21-primary" onclick="PAI_V21_APP.revealRecall()">查看答案</button>'}</section></main>`}
  function renderUse(t,s,item){const a=t.answered;app.innerHTML=`<main class="v21-screen">${header('用一下')}<section class="v21-card"><div class="v21-task-label">根据语境选择最合适的表达</div><h2>${esc(item.prompt)}</h2><div class="v21-options">${item.options.map((o,i)=>`<button ${a?'disabled':''} class="${a?(i===item.answer_index?'correct':(i===t.selected_index?'wrong':'')):''}" onclick="PAI_V21_APP.answerChoice(${i})">${esc(o)}</button>`).join('')}</div>${a?`<div class="v21-feedback"><b>${t.correct?'答对了':'这里需要再巩固'}</b><p>${esc(t.feedback)}</p></div><button class="v21-primary" onclick="PAI_V21_APP.continueChoice()">继续</button>`:''}</section></main>`}
  function render(){
    if(!session||session.status!=='active'){renderHome(false);return}
    if(session.budget_reached){renderEnd('budget');return}
    const t=currentTask();if(!t){finish();return}resetClock(t);const s=specFor(t),item=itemFor(t);if(!s){app.innerHTML='<p>学习内容绑定失败。</p>';return}
    if(t.kind==='learn')renderLearn(t,s);else if(t.kind==='recall')renderRecall(t,s,item);else renderUse(t,s,item)
  }
  async function renderEnd(mode='complete'){
    const x=await summary(),budget=mode==='budget';
    app.innerHTML=`<main class="v21-screen">${header(budget?'5 分钟到了':'本次完成')}<section class="v21-hero"><h1>${budget?'当前任务已完成':'本次任务完成'}</h1><div class="v21-summary"><div><b>${x.newCount}</b><span>新接触目标</span></div><div><b>${x.practiceCount}</b><span>练习目标</span></div><div><b>${x.failures}</b><span>仍需巩固</span></div></div><p>${budget?'没有打断当前作答。可以继续当前学习上下文，或现在结束。':'完成本次任务不等于已经长期掌握。'}</p><button class="v21-primary" onclick="PAI_V21_APP.continueFive()">继续 5 分钟</button><button class="v21-plain" onclick="PAI_V21_APP.endToHome()">结束</button><small class="v21-note">记录的前台有效操作时间约 ${Math.round(x.activeMs/1000)} 秒；后台时间不计入，单个无交互前台片段最多计 60 秒。</small></section></main>`
  }

  async function boot(){C.validateAgainstCore();await E.openDB();const id=await E.getMeta('active_session_id');if(id){const saved=await E.getSession(id);if(saved?.status==='active'){session=saved;render();return}}renderHome(false)}
  async function continueFive(){
    if(session?.status==='active'&&session.budget_reached){session.budget_ms=(session.budget_ms||300000)+300000;session.budget_reached=false;await E.saveSession(session);render();return}
    const prev=session?.session_id||null;session=await newSession(prev);render();
  }
  async function endToHome(){
    if(session?.status==='active'){session.status='ended';session.completed_at=nowIso();session.budget_reached=false;await E.saveSession(session);await E.putMeta('active_session_id',null)}
    session=null;renderHome(false);
  }
  window.PAI_V21_APP={boot,async startSession(){session=await newSession();render()},resume(){render()},pause,completeLearn,revealRecall,rateRecall,answerChoice,continueChoice,speak,continueFive,endToHome};
})();
