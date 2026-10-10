// All-zero continuation flow: keep the app usable after today's queue is finished.
(function(){
  function keyToUnit(k){
    const [word,sid]=k.split('::');
    const w=WORDS.find(x=>x.w===word);
    return w&&w.s[sid]?{w,sid,s:w.s[sid],k}:null;
  }
  function assignedNewCount(scene){
    const keys=state.daily?.assigned?.[scene]||[];
    return keys.filter(k=>!state.records[k]).length;
  }
  function remainingUnseen(scene){
    return allUnits(scene).filter(u=>!state.records[unitKey(u.w,u.sid)]);
  }
  function allSceneNewZero(){return Object.keys(SCENES).every(s=>assignedNewCount(s)===0)}
  function dueCount(){
    const now=Date.now();let n=0;
    for(const s of Object.keys(SCENES))for(const u of allUnits(s)){
      const r=state.records[unitKey(u.w,u.sid)];if(r&&r.due<=now)n++;
    }
    return n;
  }
  function hasStudied(){return Object.keys(state.records).some(k=>keyToUnit(k))}
  function extraScenes(){return Object.keys(SCENES).filter(s=>remainingUnseen(s).length>0)}

  window.toggleExtraScenes=function(){state.showExtraScenes=!state.showExtraScenes;save();render()};
  window.continueScene=function(scene){
    state.showExtraScenes=false;
    if(typeof learnMore==='function')learnMore(scene,10);
  };

  function freeKeys(){
    return Object.keys(state.records).filter(k=>keyToUnit(k)).sort((a,b)=>{
      const A=state.records[a],B=state.records[b];
      const weakA=A.lastKnown===false?0:1,weakB=B.lastKnown===false?0:1;
      if(weakA!==weakB)return weakA-weakB;
      return (A.last||0)-(B.last||0);
    });
  }
  window.openFreeReview=function(){
    state.freeKeys=freeKeys();state.freeDone=0;state.freeTotal=state.freeKeys.length;
    state.view='freeReview';state.revealed=false;save();render();
    setTimeout(()=>{const u=keyToUnit(state.freeKeys?.[0]);if(u)speak(u.w.w)},100);
  };
  window.rateFreeReview=function(known){
    const k=state.freeKeys?.[0],u=k&&keyToUnit(k);if(!u)return;
    const now=Date.now(),prev=state.records[k]||{interval:0,reps:0};
    let interval,due;
    if(known){const days=Math.max(3,Math.round(((prev.interval||86400000)/86400000)*2.2));interval=days*86400000;due=now+interval;state.stats.known=(state.stats.known||0)+1}
    else{interval=10*60000;due=now+interval;state.stats.unknown=(state.stats.unknown||0)+1}
    state.records[k]={...prev,due,interval,reps:(prev.reps||0)+1,last:now,lastKnown:known};
    state.freeKeys.shift();state.freeDone=(state.freeDone||0)+1;state.revealed=false;save();
    document.querySelector(known?'.known':'.unknown')?.classList.add('flash');
    document.querySelector('.word-hero')?.classList.add('fade-out');
    setTimeout(()=>{render();setTimeout(()=>{const n=keyToUnit(state.freeKeys?.[0]);if(n)speak(n.w.w)},90)},130);
  };

  function renderFreeReview(){
    const u=keyToUnit(state.freeKeys?.[0]);
    if(!u)return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">自由复习</div><div class="study-progress">完成</div></div><div class="done"><div><h2>自由复习完成</h2><p>已经把当前已学内容过了一遍。</p><button class="primary-btn" onclick="goScenes()">返回场景</button></div></div></div>`;
    const total=Math.max(state.freeTotal||1,(state.freeDone||0)+1),pos=Math.min((state.freeDone||0)+1,total);
    return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">自由复习 · ${SCENES[u.sid]}</div><div class="study-progress">${pos} / ${total}</div></div><div class="study-body" onclick="reveal()"><div class="word-hero"><div class="word-line"><div class="word">${u.w.w}</div><button class="speak-btn" onclick="speak('${u.w.w}');event.stopPropagation()">🔊</button></div><div class="ipa">${u.w.ipa}</div>${state.revealed?'':'<div class="tap-hint">轻点空白处显示答案</div>'}</div>${state.revealed?answerHtml(u):''}</div><div class="rating"><button class="unknown" onclick="rateFreeReview(false)">不知道</button><button class="known" onclick="rateFreeReview(true)">知道</button></div></div>`;
  }

  const baseScenes=renderScenes;
  renderScenes=function(){
    if(!(allSceneNewZero()&&dueCount()===0))return baseScenes();
    const extras=extraScenes(),studied=hasStudied();
    return `<div class="screen scene-screen"><div class="scene-head"><h1>场景背单词</h1><div class="scene-tools"><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><div class="zero-panel"><h2>今天已完成</h2><p>当前没有到期复习，今天分配的新词也已完成。</p><div class="zero-actions">${extras.length?`<button class="primary-btn" onclick="toggleExtraScenes()">继续学 10 个</button>`:''}${studied?`<button class="secondary-btn" onclick="openFreeReview()">自由复习</button>`:''}</div>${state.showExtraScenes&&extras.length?`<div class="extra-scenes"><div class="extra-title">选择场景</div>${extras.map(s=>`<button onclick="continueScene('${s}')"><span>${SCENES[s]}</span><b>${Math.min(10,remainingUnseen(s).length)}</b></button>`).join('')}</div>`:''}</div><div class="scene-grid dimmed">${Object.entries(SCENES).map(([id,name])=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${name}</span><span class="scene-count">0</span></button>`).join('')}</div></div>`;
  };

  const baseRender=render;
  render=function(){
    if(state.view==='freeReview'){document.getElementById('app').innerHTML=renderFreeReview();return}
    baseRender();
  };
  render();
})();
