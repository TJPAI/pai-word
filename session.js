// Session progression for dynamic due/new queues.
state.sessionDone=state.sessionDone||0;
state.sessionTotal=state.sessionTotal||0;

currentUnit=function(){const q=currentQueue();return q.length?q[0]:null};

openScene=function(scene){
  state.scene=scene;
  state.revealed=false;
  state.view='study';
  state.sessionDone=0;
  state.sessionTotal=queueFor(scene).length;
  save();render();
  setTimeout(()=>{const u=currentUnit();if(u)speak(u.w.w)},120);
};

rateKnown=function(known){
  const u=currentUnit();if(!u)return;
  const k=unitKey(u.w,u.sid),now=Date.now(),prev=state.records[k]||{interval:0,reps:0};
  let due,interval;
  if(known){
    const prevDays=prev.interval?prev.interval/86400000:0;
    const days=prev.reps?Math.max(3,Math.round(prevDays*2.4)):3;
    interval=days*86400000;due=now+interval;
    state.stats.known=(state.stats.known||0)+1;
  }else{
    interval=10*60000;due=now+interval;
    state.stats.unknown=(state.stats.unknown||0)+1;
  }
  state.records[k]={due,interval,reps:(prev.reps||0)+1,last:now,lastKnown:known};
  state.sessionDone=(state.sessionDone||0)+1;
  save();
  const btn=document.querySelector(known?'.known':'.unknown');
  btn?.classList.add('flash');
  document.querySelector('.word-hero')?.classList.add('fade-out');
  setTimeout(()=>{
    state.revealed=false;save();render();
    setTimeout(()=>{const n=currentUnit();if(n)speak(n.w.w)},90);
  },130);
};

const baseRenderStudy=renderStudy;
renderStudy=function(){
  const u=currentUnit();
  if(!u)return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${SCENES[state.scene]}</div><div class="study-progress">完成</div></div><div class="done"><div><h2>今天完成了</h2><p>本场景当前没有待学项目。</p><button class="primary-btn" onclick="goScenes()">返回场景</button></div></div></div>`;
  const total=Math.max(state.sessionTotal||1,(state.sessionDone||0)+1);
  const pos=Math.min((state.sessionDone||0)+1,total);
  return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${SCENES[state.scene]}</div><div class="study-progress">${pos} / ${total}</div></div><div class="study-body" onclick="reveal()"><div class="word-hero"><div class="word-line"><div class="word">${u.w.w}</div><button class="speak-btn" onclick="speak('${u.w.w}');event.stopPropagation()">🔊</button></div><div class="ipa">${u.w.ipa}</div>${state.revealed?'':'<div class="tap-hint">轻点空白处显示答案</div>'}</div>${state.revealed?answerHtml(u):''}</div><div class="rating"><button class="unknown" onclick="rateKnown(false)">不知道</button><button class="known" onclick="rateKnown(true)">知道</button></div></div>`;
};

render();
