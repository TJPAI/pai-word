// One-tap global daily-learning flow across scenes. Reviews remain on the existing review path.
(function(){
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const labels={sense:'释义',grammar:'语法',collocation:'搭配',contrast:'辨析',pronunciation:'发音',usage:'用法',risk:'易错',morphology:'词形',polysemy:'多义',discourse:'语篇',pragmatics:'语用',degree:'程度',number:'数词',adverb:'副词',word_order:'语序'};
  function ensureDaily(){if(typeof globalNewRemaining==='function')globalNewRemaining();return state.daily||{newWordKeys:[],reinforcementKeys:[]}}
  function remaining(list){return (list||[]).filter(k=>!state.records[k]&&window.PAI_CORE.byKU.has(k))}
  function interleavedKeys(){
    const d=ensureDaily(),fresh=remaining(d.newWordKeys),rein=remaining(d.reinforcementKeys);if(!rein.length)return fresh;if(!fresh.length)return rein;
    const every=Math.max(1,Math.round(fresh.length/rein.length)),out=[];let i=0,j=0;
    while(i<fresh.length||j<rein.length){for(let n=0;n<every&&i<fresh.length;n++)out.push(fresh[i++]);if(j<rein.length)out.push(rein[j++])}
    return out;
  }
  function current(){const k=interleavedKeys()[0];return k?window.PAI_CORE.byKU.get(k):null}
  function role(u){const k=u?.k||u?.s?.ku_id,d=ensureDaily();return d.newWordKeys?.includes(k)?'new':'reinforcement'}
  function cue(u){
    const r=role(u),scene=(typeof SCENES!=='undefined'&&SCENES[u.s.scene])||u.s.scene||'';
    if(r==='new')return {badge:['新词',u.s.pos||u.w.pos||'',scene].filter(Boolean).join(' · '),title:'释义'};
    const type=String(u.s.kuType||'sense').toLowerCase();return {badge:labels[type]||'强化',title:u.s.kuTitle||labels[type]||'知识点'};
  }
  function schedule(u,known){
    const k=unitKey(u.w,u.sid),now=Date.now(),prev=state.records[k]||{interval:0,reps:0};let interval,due;
    if(known){const prevDays=prev.interval?prev.interval/86400000:0,days=prev.reps?Math.max(3,Math.round(prevDays*2.4)):3;interval=days*86400000;due=now+interval;state.stats.known=(state.stats.known||0)+1}
    else{interval=10*60000;due=now+interval;state.stats.unknown=(state.stats.unknown||0)+1}
    state.records[k]={...prev,due,interval,reps:(prev.reps||0)+1,last:now,lastKnown:known};
  }
  function hero(u){
    const c=cue(u),hidden=state.hideWord&&!state.revealed?' listen-only':'';
    return `<div class="word-hero${hidden}"><div class="word-line"><div class="word">${esc(u.w.w)}</div><button class="speak-btn" data-word-audio data-speak="${esc(u.w.w)}" aria-label="播放单词">🔊</button></div><div class="ipa">${esc(u.w.ipa||'美音音标待补充')}</div>${state.revealed?'':`<div class="ku-front-prompt"><span class="pos-chip">${esc(c.badge)}</span><span class="ku-cue-title">${esc(c.title)}</span></div><div class="tap-hint">轻点空白处显示答案</div>`}</div>`;
  }
  function renderToday(){
    const q=interleavedKeys(),u=q[0];
    if(!u)return document.getElementById('app').innerHTML='<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">今日学习</div><div class="study-progress">完成</div></div><div class="done"><div><h2>今日学习完成</h2><p>新词与强化知识点均已完成；到期内容请在“复习”中继续。</p><button class="primary-btn" onclick="goScenes()">返回场景</button></div></div></div>';
    const done=state.todayDone||0,total=Math.max(done+q.length,state.todayTotal||0),r=role(u),scene=(typeof SCENES!=='undefined'&&SCENES[u.s.scene])||u.s.scene||'';
    document.getElementById('app').innerHTML=`<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">今日学习 · ${r==='new'?'新词':'强化'} · ${esc(scene)}</div><div class="study-progress">${Math.min(done+1,total)} / ${total}</div></div><div class="study-body" onclick="revealToday()">${hero(u)}${state.revealed?answerHtml(u):''}</div><div class="rating"><button class="unknown" onclick="rateToday(false)">不知道</button><button class="known" onclick="rateToday(true)">知道</button></div></div>`;
  }
  window.openTodayStudy=function(){const q=interleavedKeys();state.view='todayStudy';state.scene=null;state.revealed=false;state.todayDone=0;state.todayTotal=q.length;save();render();if(q[0])setTimeout(()=>speak(q[0].w.w),80)};
  window.revealToday=function(){if(state.view!=='todayStudy')return;const u=current();if(!u)return;const was=!!state.revealed;state.revealed=!state.revealed;save();render();if(was)setTimeout(()=>speak(u.w.w),50)};
  window.rateToday=function(known){const u=current();if(!u)return;const k=unitKey(u.w,u.sid);if(typeof markDailyNewComplete==='function')markDailyNewComplete(k);schedule(u,known);state.todayDone=(state.todayDone||0)+1;state.revealed=false;save();document.querySelector(known?'.known':'.unknown')?.classList.add('flash');setTimeout(()=>{render();const next=current();if(next)speak(next.w.w)},110)};
  function injectEntry(){
    if(state.view!=='scenes'||document.querySelector('[data-today-study]'))return;const d=ensureDaily(),nw=remaining(d.newWordKeys).length,rf=remaining(d.reinforcementKeys).length,total=nw+rf;if(!total)return;
    const target=document.querySelector('.review-entry')||document.querySelector('.scene-grid');if(!target)return;
    const button=document.createElement('button');button.className='review-entry has-review';button.dataset.todayStudy='1';button.onclick=openTodayStudy;button.innerHTML=`<span>今日学习 · ${nw} 新词${rf?` + ${rf} 强化`:''}</span><b>${total}</b>`;target.parentNode.insertBefore(button,target);
  }
  const baseRender=window.render;
  window.render=function(){if(state.view==='todayStudy'){renderToday();return}baseRender();injectEntry()};
})();
