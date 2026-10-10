// Mobile flow v2: separate review from new learning and handle zero states clearly.
(function(){
  state.reviewDone=state.reviewDone||0;
  state.reviewTotal=state.reviewTotal||0;

  function byKey(k){
    const [word,sid]=k.split('::');
    const w=WORDS.find(x=>x.w===word);
    return w&&w.s[sid]?{w,sid,s:w.s[sid]}:null;
  }

  function assignedKeys(scene){
    // daily.js assigns today's fixed new-word quota lazily.
    queueFor(scene);
    return state.daily?.assigned?.[scene]||[];
  }

  function newQueue(scene){
    return assignedKeys(scene).filter(k=>!state.records[k]).map(byKey).filter(Boolean);
  }

  function allDueReviews(){
    const now=Date.now();
    const out=[];
    for(const scene of Object.keys(SCENES)){
      for(const u of allUnits(scene)){
        const k=unitKey(u.w,u.sid),r=state.records[k];
        if(r&&r.due<=now)out.push({...u,k,due:r.due});
      }
    }
    return out.sort((a,b)=>a.due-b.due);
  }

  function newCount(scene){return newQueue(scene).length}
  function reviewCount(){return allDueReviews().length}

  window.openReview=function(){
    const q=allDueReviews();
    state.view='review';state.scene=null;state.revealed=false;
    state.reviewDone=0;state.reviewTotal=q.length;
    save();render();
    setTimeout(()=>{const u=allDueReviews()[0];if(u)speak(u.w.w)},100);
  };

  window.learnMore=function(scene,n=10){
    state.newPerDay=(state.newPerDay||20)+n;
    if(typeof setNewPerDay==='function')setNewPerDay(state.newPerDay);
    state.scene=scene;state.view='study';state.revealed=false;
    state.sessionDone=0;state.sessionTotal=newQueue(scene).length;
    save();render();
    setTimeout(()=>{const u=newQueue(scene)[0];if(u)speak(u.w.w)},100);
  };

  openScene=function(scene){
    state.scene=scene;state.view='study';state.revealed=false;
    state.sessionDone=0;state.sessionTotal=newQueue(scene).length;
    save();render();
    setTimeout(()=>{const u=newQueue(scene)[0];if(u)speak(u.w.w)},100);
  };

  currentQueue=function(){return state.scene?newQueue(state.scene):[]};
  currentUnit=function(){const q=currentQueue();return q[0]||null};

  const baseRate=rateKnown;
  rateKnown=function(known){
    // session.js already advances correctly because currentUnit always uses first remaining new item.
    return baseRate(known);
  };

  window.rateReview=function(known){
    const u=allDueReviews()[0];if(!u)return;
    const k=unitKey(u.w,u.sid),now=Date.now(),prev=state.records[k]||{interval:0,reps:0};
    let interval,due;
    if(known){
      const prevDays=prev.interval?prev.interval/86400000:1;
      const days=Math.max(3,Math.round(prevDays*2.4));
      interval=days*86400000;due=now+interval;state.stats.known=(state.stats.known||0)+1;
    }else{
      interval=10*60000;due=now+interval;state.stats.unknown=(state.stats.unknown||0)+1;
    }
    state.records[k]={...prev,due,interval,reps:(prev.reps||0)+1,last:now,lastKnown:known};
    state.reviewDone=(state.reviewDone||0)+1;state.revealed=false;save();
    const btn=document.querySelector(known?'.known':'.unknown');btn?.classList.add('flash');
    document.querySelector('.word-hero')?.classList.add('fade-out');
    setTimeout(()=>{render();setTimeout(()=>{const n=allDueReviews()[0];if(n)speak(n.w.w)},90)},130);
  };

  renderScenes=function(){
    const rc=reviewCount();
    return `<div class="screen scene-screen">
      <div class="scene-head"><h1>场景背单词</h1><div class="scene-tools"><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div>
      <button class="review-entry ${rc?'has-review':''}" onclick="openReview()"><span>复习</span><b>${rc}</b></button>
      <div class="scene-grid">${Object.entries(SCENES).map(([id,name])=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${name}</span><span class="scene-count">${newCount(id)}</span></button>`).join('')}</div>
      <div class="scene-note">场景数字只表示今日新词；到期内容统一进入“复习”。</div>
    </div>`;
  };

  renderStudy=function(){
    const u=currentUnit();
    if(!u){
      const hasAny=allUnits(state.scene).length>0;
      return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${SCENES[state.scene]}</div><div class="study-progress">完成</div></div>
      <div class="done"><div><h2>${hasAny?'今日新词已完成':'该场景词库正在建设'}</h2><p>${hasAny?'你可以返回场景页复习，或再学 10 个新词。':'目前还没有可学习词条。随着正式词库扩充会自动开放。'}</p>${hasAny?`<button class="primary-btn" onclick="learnMore('${state.scene}',10)">再学 10 个</button><button class="secondary-btn" onclick="goScenes()">返回场景</button>`:`<button class="primary-btn" onclick="goScenes()">返回场景</button>`}</div></div></div>`;
    }
    const total=Math.max(state.sessionTotal||1,(state.sessionDone||0)+1),pos=Math.min((state.sessionDone||0)+1,total);
    return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${SCENES[state.scene]}</div><div class="study-progress">${pos} / ${total}</div></div><div class="study-body" onclick="reveal()"><div class="word-hero"><div class="word-line"><div class="word">${u.w.w}</div><button class="speak-btn" onclick="speak('${u.w.w}');event.stopPropagation()">🔊</button></div><div class="ipa">${u.w.ipa}</div>${state.revealed?'':'<div class="tap-hint">轻点空白处显示答案</div>'}</div>${state.revealed?answerHtml(u):''}</div><div class="rating"><button class="unknown" onclick="rateKnown(false)">不知道</button><button class="known" onclick="rateKnown(true)">知道</button></div></div>`;
  };

  function renderReview(){
    const q=allDueReviews(),u=q[0];
    if(!u)return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">复习</div><div class="study-progress">完成</div></div><div class="done"><div><h2>复习完成</h2><p>当前没有到期内容。</p><button class="primary-btn" onclick="goScenes()">返回场景</button></div></div></div>`;
    const total=Math.max(state.reviewTotal||q.length,(state.reviewDone||0)+1),pos=Math.min((state.reviewDone||0)+1,total);
    return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">复习 · ${SCENES[u.sid]}</div><div class="study-progress">${pos} / ${total}</div></div><div class="study-body" onclick="reveal()"><div class="word-hero"><div class="word-line"><div class="word">${u.w.w}</div><button class="speak-btn" onclick="speak('${u.w.w}');event.stopPropagation()">🔊</button></div><div class="ipa">${u.w.ipa}</div>${state.revealed?'':'<div class="tap-hint">轻点空白处显示答案</div>'}</div>${state.revealed?answerHtml(u):''}</div><div class="rating"><button class="unknown" onclick="rateReview(false)">不知道</button><button class="known" onclick="rateReview(true)">知道</button></div></div>`;
  }

  const baseRenderPanel=renderPanel;
  renderPanel=function(kind){
    if(kind!=='settings')return baseRenderPanel(kind);
    state.includeRecent=state.includeRecent!==false;
    return `<div class="screen panel-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>设置</h2></div><div class="panel-block"><div class="setting-row"><span>每日新词</span><select onchange="setNewPerDay(+this.value)">${[10,20,30,50].map(n=>`<option value="${n}" ${state.newPerDay===n?'selected':''}>${n}</option>`).join('')}</select></div><div class="setting-row"><span>包含近期增频词</span><button class="switch ${state.includeRecent?'on':''}" onclick="state.includeRecent=!state.includeRecent;save();render()"><i></i></button></div></div><div class="panel-block muted">新词数量固定；到期复习不设上限。近期增频词会按所属场景混入正常学习流。</div></div>`;
  };

  render=function(){
    let html=state.view==='study'?renderStudy():state.view==='review'?renderReview():state.view==='stats'?renderPanel('stats'):state.view==='settings'?renderPanel('settings'):renderScenes();
    document.getElementById('app').innerHTML=html;
  };

  render();
})();
