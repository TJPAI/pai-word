// PAI Word fast daily flow + two-button SRS v2.
// Loaded after product-v2.js so it can wrap the final product render without changing KU identity.
(function(){
  const DAY=86400000, TEN_MIN=10*60000;
  const LABELS={sense:'释义',grammar:'语法',collocation:'搭配',contrast:'辨析',pronunciation:'发音',usage:'用法',risk:'易错',morphology:'词形',polysemy:'多义',discourse:'语篇',pragmatics:'语用',degree:'程度',number:'数词',adverb:'副词',word_order:'语序'};
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const keyOf=u=>u?unitKey(u.w,u.sid):'';
  const byKey=k=>window.PAI_CORE?.byKU?.get(k)||null;

  function ensureDailyReady(){
    if(typeof globalNewRemaining==='function')globalNewRemaining();
    if(typeof globalReinforcementRemaining==='function')globalReinforcementRemaining();
  }
  function dueToday(){
    const now=Date.now(),out=[];
    for(const [k,r] of Object.entries(state.records||{})){
      if(!r||r.due>now)continue;
      const u=byKey(k);if(u)out.push({u,due:r.due||0});
    }
    return out.sort((a,b)=>a.due-b.due||a.u.w.rank-b.u.w.rank).map(x=>x.u);
  }
  function freshToday(){
    ensureDailyReady();
    const keys=[...(state.daily?.newWordKeys||[]),...(state.daily?.reinforcementKeys||[])];
    const seen=new Set(),out=[];
    for(const k of keys){
      if(seen.has(k)||state.records?.[k])continue;
      seen.add(k);const u=byKey(k);if(u)out.push(u);
    }
    return out;
  }
  function todayQueue(){
    const seen=new Set(),out=[];
    for(const u of [...dueToday(),...freshToday()]){
      const k=keyOf(u);if(!k||seen.has(k))continue;seen.add(k);out.push(u);
    }
    return out;
  }

  function intervalFor(prev,known){
    if(!known)return TEN_MIN;
    if(!prev||!prev.reps||prev.lastKnown===false)return DAY;
    const prevDays=Math.max(0,(prev.interval||0)/DAY);
    if(prevDays<2)return 3*DAY;
    return Math.max(3,Math.round(prevDays*2.3))*DAY;
  }
  function schedule(u,known,{free=false}={}){
    const k=keyOf(u);if(!k)return null;
    const now=Date.now(),prev=state.records?.[k]||null;
    state.records=state.records||{};state.stats=state.stats||{known:0,unknown:0};
    if(free&&known&&prev){
      state.records[k]={...prev,lastFreeReview:now,lastFreeKnown:true};
      state.stats.known=(state.stats.known||0)+1;
      return state.records[k];
    }
    const interval=intervalFor(prev,known),due=now+interval;
    state.records[k]={...(prev||{}),due,interval,reps:(prev?.reps||0)+1,last:now,lastKnown:known,srsPolicy:'two-button-v2'};
    if(known)state.stats.known=(state.stats.known||0)+1;
    else state.stats.unknown=(state.stats.unknown||0)+1;
    return state.records[k];
  }
  window.PAI_SRS_V2={intervalFor,todayQueue};

  function markFresh(u){
    const k=keyOf(u);
    if(k&&!state.records?.[k]&&typeof markDailyNewComplete==='function')markDailyNewComplete(k);
  }
  function saveAndAdvance(){
    state.revealed=false;
    if(typeof save==='function')save();
    setTimeout(()=>{render();const u=todayQueue()[0];if(u&&typeof speak==='function')speak(u.w.w)},130);
  }

  window.openToday=function(){
    const q=todayQueue();
    state.view='today';state.scene=null;state.todayDone=0;state.todayTotal=q.length;state.revealed=false;
    if(typeof save==='function')save();render();
    if(q[0]&&typeof speak==='function')setTimeout(()=>speak(q[0].w.w),90);
  };
  window.rateToday=function(known){
    const u=todayQueue()[0];if(!u)return;
    markFresh(u);schedule(u,known);state.todayDone=(state.todayDone||0)+1;saveAndAdvance();
  };

  // Replace formal study/review scheduling with the same v2 policy.
  window.rateKnown=function(known){
    const u=typeof currentUnit==='function'?currentUnit():null;if(!u)return;
    markFresh(u);schedule(u,known);state.sessionDone=(state.sessionDone||0)+1;state.revealed=false;
    if(typeof save==='function')save();setTimeout(()=>{render();const n=typeof currentUnit==='function'?currentUnit():null;if(n&&typeof speak==='function')speak(n.w.w)},130);
  };
  function currentDueReview(){
    return dueToday()[Math.max(0,Math.min(Number(state.reviewBrowseIndex)||0,Math.max(0,dueToday().length-1)))]||null;
  }
  window.rateReview=function(known){
    const u=currentDueReview();if(!u)return;
    schedule(u,known);state.reviewDone=(state.reviewDone||0)+1;state.revealed=false;state.reviewBrowseIndex=0;
    if(typeof save==='function')save();setTimeout(()=>{render();const n=currentDueReview();if(n&&typeof speak==='function')speak(n.w.w)},130);
  };
  window.rateFreeReview=function(known){
    const u=byKey(state.freeKeys?.[0]);if(!u)return;
    schedule(u,known,{free:true});state.freeKeys.shift();state.freeDone=(state.freeDone||0)+1;state.revealed=false;
    if(typeof save==='function')save();setTimeout(()=>{render();const n=byKey(state.freeKeys?.[0]);if(n&&typeof speak==='function')speak(n.w.w)},130);
  };

  const baseReveal=window.reveal;
  window.reveal=function(){
    if(state.view!=='today')return baseReveal();
    const was=!!state.revealed,word=todayQueue()[0]?.w?.w||'';
    state.revealed=!state.revealed;if(typeof save==='function')save();render();
    if(was&&word&&typeof speak==='function')setTimeout(()=>speak(word),60);
  };

  function cueHtml(u){
    const type=String(u?.s?.kuType||'sense').toLowerCase(),label=LABELS[type]||'知识点';
    if(type==='sense'){
      const scene=(typeof SCENES!=='undefined'&&SCENES[u.s?.scene])||u.s?.scene||'';
      const meta=[u.s?.pos||u.w?.pos||'',scene].filter(Boolean).join(' · ');
      return `<div class="ku-front-prompt"><span class="pos-chip">${esc(meta||label)}</span><span class="ku-cue-title">释义</span></div>`;
    }
    return `<div class="ku-front-prompt"><span class="pos-chip">${esc(label)}</span><span class="ku-cue-title">${esc(u.s?.kuTitle||label)}</span></div>`;
  }
  function renderToday(){
    const q=todayQueue(),u=q[0],total=Math.max(state.todayTotal||0,(state.todayDone||0)+q.length);
    if(!u)return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">今日学习</div><div class="study-progress">完成</div></div><div class="done"><div><h2>今日任务已完成</h2><p>到期复习、新词和强化知识单元已经处理完。</p><button class="primary-btn" onclick="goScenes()">返回首页</button></div></div></div>`;
    const pos=Math.min((state.todayDone||0)+1,Math.max(1,total));
    const hidden=state.hideWord&&!state.revealed?' listen-only':'';
    const hero=`<div class="word-hero${hidden}"><div class="word-line"><div class="word">${esc(u.w.w)}</div><button class="speak-btn" data-word-audio data-speak="${esc(u.w.w)}" aria-label="播放单词">🔊</button></div><div class="ipa">${esc(u.w.ipa||u.w.ipaUS||'美音音标待补充')}</div>${state.revealed?'':cueHtml(u)+'<div class="tap-hint">轻点空白处显示答案</div>'}</div>`;
    const rating='<div class="rating"><button class="unknown" onclick="rateToday(false)">不知道</button><button class="known" onclick="rateToday(true)">知道</button></div>';
    return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">今日学习</div><div class="study-progress">${pos} / ${Math.max(1,total)}</div></div><div class="study-body" onclick="reveal()">${hero}${state.revealed?answerHtml(u):''}</div>${rating}</div>`;
  }

  const baseRender=window.render;
  window.render=function(){
    if(state.view==='today'){
      document.getElementById('app').innerHTML=renderToday();return;
    }
    baseRender();
    if(state.view!=='scenes')return;
    const count=todayQueue().length;if(!count)return;
    const host=document.querySelector('.review-entry')||document.querySelector('.scene-grid');
    if(!host||document.querySelector('[data-today-flow]'))return;
    const html=`<button class="review-entry has-review today-entry" data-today-flow onclick="openToday()"><span>今日学习 <small>先复习 · 再新学</small></span><b>${count}</b></button>`;
    host.insertAdjacentHTML('beforebegin',html);
  };

  // goScenes is defined in mobile.js; clear transient daily-flow state without changing its behavior.
  const baseGoScenes=window.goScenes;
  window.goScenes=function(){state.todayDone=0;state.todayTotal=0;return baseGoScenes()};

  const style=document.createElement('style');
  style.textContent='.today-entry{margin-bottom:10px}.today-entry small{font-size:.75rem;font-weight:500;opacity:.7;margin-left:6px}';
  document.head.appendChild(style);
  render();
})();
