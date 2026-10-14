// Unified horizontal navigation for study/review/today.
(function(){
  const DAY=86400000,TEN_MIN=10*60000;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const keyOf=u=>u?unitKey(u.w,u.sid):'';
  const byKey=k=>window.PAI_CORE?.byKU?.get(k)||null;
  const baseRender=window.render,baseReveal=window.reveal,baseOpenToday=window.openToday,baseSwipeWord=window.swipeWord;
  const clamp=(i,n)=>n?Math.max(0,Math.min(Number(i)||0,n-1)):0;

  function todayQueue(){return window.PAI_SRS_V2?.todayQueue?.()||[]}
  function todayUnit(){const q=todayQueue();state.todayBrowseIndex=clamp(state.todayBrowseIndex,q.length);return q[state.todayBrowseIndex]||null}
  function dueUnits(){
    const now=Date.now(),out=[];
    for(const [k,r] of Object.entries(state.records||{})){if(!r||r.due>now)continue;const u=byKey(k);if(u)out.push({u,due:r.due||0})}
    return out.sort((a,b)=>a.due-b.due||a.u.w.rank-b.u.w.rank).map(x=>x.u);
  }
  function reviewUnit(){const q=dueUnits();state.reviewBrowseIndex=clamp(state.reviewBrowseIndex,q.length);return q[state.reviewBrowseIndex]||null}
  function visibleUnit(){if(state.view==='today')return todayUnit();if(state.view==='review')return reviewUnit();if(state.view==='study'&&typeof currentUnit==='function')return currentUnit();return null}
  function pendingFor(u){return !!u&&state.pendingUnknownKey===keyOf(u)}
  function saveState(){if(typeof save==='function')save()}
  function speakCurrent(){const u=visibleUnit();if(u&&typeof speak==='function')setTimeout(()=>speak(u.w.w),70)}

  function scheduleToday(u,known){
    const k=keyOf(u),now=Date.now(),prev=state.records?.[k]||null;
    const interval=window.PAI_SRS_V2?.intervalFor?window.PAI_SRS_V2.intervalFor(prev,known):(known?DAY:TEN_MIN);
    state.records=state.records||{};state.stats=state.stats||{known:0,unknown:0};
    state.records[k]={...(prev||{}),due:now+interval,interval,reps:(prev?.reps||0)+1,last:now,lastKnown:known,srsPolicy:'two-button-v2'};
    if(known)state.stats.known=(state.stats.known||0)+1;else state.stats.unknown=(state.stats.unknown||0)+1;
  }
  function markFresh(u){const k=keyOf(u);if(k&&!state.records?.[k]&&typeof markDailyNewComplete==='function')markDailyNewComplete(k)}

  window.openToday=function(){
    if(typeof baseOpenToday==='function')baseOpenToday();
    state.todayBrowseIndex=0;state.pendingUnknownKey=null;state.revealed=false;state.todayTotal=todayQueue().length;saveState();render();speakCurrent();
  };
  window.rateToday=function(known){
    const u=todayUnit();if(!u)return;
    if(!known&&!state.revealed){state.pendingUnknownKey=keyOf(u);state.revealed=true;saveState();render();return}
    if(pendingFor(u))known=false;
    markFresh(u);scheduleToday(u,known);state.todayDone=(state.todayDone||0)+1;state.pendingUnknownKey=null;state.revealed=false;
    state.todayBrowseIndex=clamp(state.todayBrowseIndex,todayQueue().length);saveState();setTimeout(()=>{render();speakCurrent()},130);
  };
  window.swipeToday=function(direction){
    const q=todayQueue(),u=todayUnit();if(q.length<2||!u||pendingFor(u))return;
    const next=clamp((state.todayBrowseIndex||0)+direction,q.length);if(next===state.todayBrowseIndex)return;
    state.todayBrowseIndex=next;state.revealed=false;saveState();render();speakCurrent();
  };
  window.reveal=function(){
    if(state.view!=='today')return baseReveal();
    const u=todayUnit();if(!u||pendingFor(u))return;
    const was=!!state.revealed,word=u.w.w;state.revealed=!state.revealed;saveState();render();if(was&&word&&typeof speak==='function')setTimeout(()=>speak(word),60);
  };

  function fastAnswer(u){
    const type=String(u?.s?.kuType||'sense').toLowerCase();if(type!=='sense')return answerHtml(u);
    const pos=u.s?.pos||u.w?.pos||'',examples=Array.isArray(u.s?.e)?u.s.e.filter(Boolean):[],reminder=String(u.s?.x||'').trim();
    const first=examples[0]?`<div class="answer-section fast-example"><div class="answer-label">例句</div><div>${esc(examples[0])}</div></div>`:'';
    return `<div class="answer fast-answer" onclick="event.stopPropagation()"><div class="answer-section"><div class="answer-label">释义</div><div class="definition-line">${pos?`<span class="pos-chip">${esc(pos)}</span>`:''}<div class="definition">${esc(u.s?.m||'')}</div></div>${reminder?`<div class="key-reminder"><span>提醒</span>${esc(reminder)}</div>`:''}</div>${first}</div>`;
  }
  function todayRating(u){return pendingFor(u)?'<div class="rating pending-unknown"><button class="unknown" onclick="rateToday(false)">看完了 · 10分钟后再来</button></div>':'<div class="rating"><button class="unknown" onclick="rateToday(false)">不知道</button><button class="known" onclick="rateToday(true)">知道</button></div>'}
  function renderToday(){
    const q=todayQueue(),u=todayUnit();
    if(!u)return '<div class="screen study-screen today-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">今日学习</div><div class="study-progress">完成</div></div><div class="done"><div><h2>今日任务已完成</h2><p>到期复习、新词和强化知识单元已经处理完。</p><button class="primary-btn" onclick="goScenes()">返回首页</button></div></div></div>';
    const pos=Math.min((state.todayBrowseIndex||0)+1,Math.max(1,q.length));
    const hidden=state.hideWord&&!state.revealed?' listen-only':'';
    const hero=`<div class="word-hero${hidden}"><div class="word-line"><div class="word">${esc(u.w.w)}</div><button class="speak-btn" data-word-audio data-speak="${esc(u.w.w)}" aria-label="播放单词">🔊</button></div><div class="ipa">${esc(u.w.ipa||u.w.ipaUS||'美音音标待补充')}</div>${state.revealed?'':'<div class="tap-hint">轻点空白处显示答案</div>'}</div>`;
    return `<div class="screen study-screen today-screen ${state.revealed?'revealed':''}"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">今日学习</div><div class="study-progress">${pos} / ${Math.max(1,q.length)}</div></div><div class="study-body" onclick="reveal()">${hero}${state.revealed?fastAnswer(u):''}</div>${todayRating(u)}</div>`;
  }
  window.render=function(){if(state.view==='today'){document.getElementById('app').innerHTML=renderToday();return}baseRender()};

  let sx=0,sy=0,st=0;
  document.addEventListener('touchstart',e=>{if(!e.touches||e.touches.length!==1)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now()},true);
  document.addEventListener('touchend',e=>{
    if(!['study','review','today'].includes(state.view)||!e.changedTouches||e.changedTouches.length!==1||e.target.closest('button,select,a'))return;
    const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy,dt=Date.now()-st;
    if(dt>700||Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.25)return;
    const u=visibleUnit();if(pendingFor(u)){e.preventDefault();e.stopImmediatePropagation();return}
    e.preventDefault();e.stopImmediatePropagation();window.__paiSwipeUntil=Date.now()+350;
    const direction=dx<0?1:-1;
    if(state.view==='today')window.swipeToday(direction);else if(typeof baseSwipeWord==='function')window.swipeWord(direction);
  },{capture:true,passive:false});

  window.PAI_SWIPE_V2_QA={todayUnit,reviewUnit,visibleUnit};
})();
