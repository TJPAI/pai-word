// PAI Word production runtime: one owner for learning flow, review, answer UI,
// settings, listening mode, speech and swipe behavior.
(function(){
  state.reviewDone=state.reviewDone||0;
  state.reviewTotal=state.reviewTotal||0;
  state.sessionDone=state.sessionDone||0;
  state.sessionTotal=state.sessionTotal||0;
  state.studyBrowseIndex=Number.isInteger(state.studyBrowseIndex)?state.studyBrowseIndex:0;
  state.reviewBrowseIndex=Number.isInteger(state.reviewBrowseIndex)?state.reviewBrowseIndex:0;
  state.showCollocations=state.showCollocations!==false;
  state.showExamples=state.showExamples!==false;
  state.showCompare=state.showCompare!==false;
  state.hideWord=state.hideWord===true;
  state.voiceAccent=state.voiceAccent==='gb'?'gb':'us';

  function escapeHtml(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')}
  function byKey(k){const [word,sid]=String(k||'').split('::');const w=WORDS.find(x=>x.w===word);return w&&w.s[sid]?{w,sid,s:w.s[sid],k}:null}
  function clampIndex(i,len){return len?Math.max(0,Math.min(Number(i)||0,len-1)):0}
  function assignedKeys(scene){queueFor(scene);return state.daily?.assigned?.[scene]||[]}
  function newQueue(scene){return assignedKeys(scene).filter(k=>!state.records[k]).map(byKey).filter(Boolean)}
  function studyQueue(){return state.scene?newQueue(state.scene):[]}
  function studyUnit(){const q=studyQueue();state.studyBrowseIndex=clampIndex(state.studyBrowseIndex,q.length);return q[state.studyBrowseIndex]||null}
  function allDueReviews(){
    const now=Date.now(),out=[];
    for(const scene of Object.keys(SCENES))for(const u of allUnits(scene)){
      const k=unitKey(u.w,u.sid),r=state.records[k];
      if(r&&r.due<=now)out.push({...u,k,due:r.due});
    }
    return out.sort((a,b)=>a.due-b.due);
  }
  function reviewQueue(){return allDueReviews()}
  function reviewUnit(){const q=reviewQueue();state.reviewBrowseIndex=clampIndex(state.reviewBrowseIndex,q.length);return q[state.reviewBrowseIndex]||null}
  function newCount(scene){return newQueue(scene).length}
  function reviewCount(){return reviewQueue().length}
  function currentVisibleUnit(){
    if(state.view==='review')return reviewUnit();
    if(state.view==='freeReview')return byKey(state.freeKeys?.[0]);
    return studyUnit();
  }
  function scheduleRecord(u,known,factor=2.4){
    const k=unitKey(u.w,u.sid),now=Date.now(),prev=state.records[k]||{interval:0,reps:0};
    let interval,due;
    if(known){
      const prevDays=prev.interval?prev.interval/86400000:0;
      const days=prev.reps?Math.max(3,Math.round(prevDays*factor)):3;
      interval=days*86400000;due=now+interval;state.stats.known=(state.stats.known||0)+1;
    }else{
      interval=10*60000;due=now+interval;state.stats.unknown=(state.stats.unknown||0)+1;
    }
    state.records[k]={...prev,due,interval,reps:(prev.reps||0)+1,last:now,lastKnown:known};
  }

  // Speech
  let speechVoices=[];
  function refreshVoices(){if('speechSynthesis' in window)speechVoices=speechSynthesis.getVoices()||[]}
  refreshVoices();
  if('speechSynthesis' in window&&speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',refreshVoices);
  window.speak=function(text,rate=.84){
    if(!('speechSynthesis' in window)||!text)return;
    const synth=speechSynthesis,lang=state.voiceAccent==='gb'?'en-GB':'en-US';
    refreshVoices();
    const exact=speechVoices.find(v=>String(v.lang).toLowerCase()===lang.toLowerCase());
    const regional=speechVoices.find(v=>String(v.lang).toLowerCase().startsWith(state.voiceAccent==='gb'?'en-gb':'en-us'));
    const fallback=speechVoices.find(v=>String(v.lang).toLowerCase().startsWith('en'));
    synth.cancel();
    const u=new SpeechSynthesisUtterance(String(text));u.lang=lang;u.rate=rate;u.voice=exact||regional||fallback||null;
    window.__paiUtterance=u;if(synth.paused)synth.resume();setTimeout(()=>synth.speak(u),20);
  };
  function speakCurrent(delay=60){const u=currentVisibleUnit();if(u)setTimeout(()=>speak(u.w.w),delay)}

  // Synonym comparison parsing for the compact per-word format.
  function normalizeText(value){return String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' -]/g,' ')}
  const irregularForms={'win':['won'],'build':['built'],'lead':['led'],'run':['ran'],'fall':['fell','fallen'],'grow':['grew','grown'],'send':['sent'],'spend':['spent'],'find':['found'],'take':['took','taken'],'make':['made'],'come':['came'],'become':['became'],'write':['wrote','written'],'choose':['chose','chosen'],'rise':['rose','risen'],'hold':['held'],'sell':['sold'],'buy':['bought'],'teach':['taught'],'catch':['caught'],'think':['thought'],'bring':['brought'],'leave':['left'],'meet':['met'],'pay':['paid'],'say':['said'],'tell':['told'],'keep':['kept'],'feel':['felt'],'mean':['meant'],'lose':['lost'],'stand':['stood'],'understand':['understood'],'begin':['began','begun'],'break':['broke','broken'],'drive':['drove','driven']};
  function tokenForms(token){const t=token.toLowerCase(),forms=new Set([t]);(irregularForms[t]||[]).forEach(x=>forms.add(x));if(t.length>=3){forms.add(t+'s');forms.add(t+'ed');forms.add(t+'ing');if(t.endsWith('e')){forms.add(t.slice(0,-1)+'ed');forms.add(t.slice(0,-1)+'ing')}if(t.endsWith('y')){forms.add(t.slice(0,-1)+'ies');forms.add(t.slice(0,-1)+'ied')}}return [...forms]}
  function wordMatchesSentence(word,sentence){const w=normalizeText(word).trim(),s=' '+normalizeText(sentence)+' ';if(!w||!s.trim())return false;return w.split(/\s+/).filter(Boolean).every(p=>tokenForms(p).some(f=>s.includes(' '+f+' ')))}
  function comparisonBriefs(words,note){
    const parts=String(note||'').split(/[；;]/).map(x=>x.trim()).filter(Boolean);
    return words.map((word,i)=>{
      const lw=word.toLowerCase();let part=parts.find(p=>p.toLowerCase().startsWith(lw+' ')||p.toLowerCase().startsWith(lw+'是')||p.toLowerCase().startsWith(lw+'：'));
      if(!part)part=parts[i]||'';if(part.toLowerCase().startsWith(lw))part=part.slice(word.length).trim();
      return part.replace(/^[:：]\s*/,'').replace(/^是\s*/,'');
    });
  }
  function contrastData(u){
    const c=u.s.compare;if(!c||!Array.isArray(c.words)||!Array.isArray(c.examples))return{items:[]};
    const words=c.words,briefs=comparisonBriefs(words,c.note||''),mapped=[];
    c.examples.slice(0,3).forEach(text=>{const hits=words.filter(word=>wordMatchesSentence(word,text));if(hits.length===1&&!mapped.some(x=>x.word===hits[0]))mapped.push({word:hits[0],text})});
    return{items:words.map((word,i)=>{const example=mapped.find(x=>x.word===word);return example?{word,brief:briefs[i]||'',text:example.text}:null}).filter(Boolean)};
  }

  window.answerHtml=function(u){
    const compare=contrastData(u),enabledCount=[state.showCollocations,state.showExamples,state.showCompare].filter(Boolean).length;
    const pos=u.w.pos?`<span class="pos-chip">${escapeHtml(u.w.pos)}</span>`:'';
    const reminder=u.s.x?`<div class="key-reminder"><span>提醒</span>${escapeHtml(u.s.x)}</div>`:'';
    const collocations=state.showCollocations?`<div class="answer-section"><div class="answer-label">高频搭配</div><div class="collocations">${escapeHtml(u.s.c)}</div></div>`:'';
    const examples=state.showExamples?`<div class="answer-section examples-section">${u.s.e.map((e,i)=>`<div class="example"><span class="example-num">${i+1}.</span><span>${escapeHtml(e)}</span><button type="button" class="example-play" data-example-audio data-speak="${escapeHtml(e)}" aria-label="播放例句 ${i+1}">🔊</button></div>`).join('')}</div>`:'';
    const comparison=state.showCompare?`<div class="answer-section"><div class="answer-label">近义区分</div>${compare.items.length?`<div class="contrast-examples">${compare.items.map(item=>`<div class="contrast-item"><div class="contrast-summary"><span class="contrast-word">${escapeHtml(item.word)}</span><span>：${escapeHtml(item.brief)}</span></div><div class="contrast-sentence">${escapeHtml(item.text)}</div></div>`).join('')}</div>`:''}</div>`:'';
    return `<div class="answer density-${enabledCount}" onclick="event.stopPropagation()"><div class="answer-section"><div class="answer-label">释义 / 词源</div><div class="definition-line">${pos}<div class="definition">${escapeHtml(u.s.m)}</div></div><div class="root merged-root">${escapeHtml(u.w.root)}</div>${reminder}</div>${collocations}${examples}${comparison}</div>`;
  };

  // Settings actions
  window.toggleAnswerOption=function(key){if(!['showCollocations','showExamples','showCompare'].includes(key))return;state[key]=!state[key];save();render()};
  window.toggleHideWord=function(){state.hideWord=!state.hideWord;save();render()};
  window.setVoiceAccent=function(value){state.voiceAccent=value==='gb'?'gb':'us';save();render()};

  // Navigation and rating
  window.openReview=function(){const q=reviewQueue();state.view='review';state.scene=null;state.revealed=false;state.reviewDone=0;state.reviewTotal=q.length;state.reviewBrowseIndex=0;save();render();speakCurrent(100)};
  window.learnMore=function(scene,n=10){if(typeof addSceneNewWords==='function')addSceneNewWords(scene,n);state.scene=scene;state.view='study';state.revealed=false;state.studyBrowseIndex=0;state.sessionDone=0;state.sessionTotal=newQueue(scene).length;save();render();speakCurrent(100)};
  window.openScene=function(scene){state.scene=scene;state.view='study';state.revealed=false;state.studyBrowseIndex=0;state.sessionDone=0;state.sessionTotal=newQueue(scene).length;save();render();speakCurrent(100)};
  window.currentQueue=function(){return studyQueue()};
  window.currentUnit=function(){return studyUnit()};
  window.rateKnown=function(known){const u=studyUnit();if(!u)return;const before=state.studyBrowseIndex||0;scheduleRecord(u,known);state.sessionDone++;state.revealed=false;state.studyBrowseIndex=clampIndex(before,studyQueue().length);save();animateRating(known);setTimeout(()=>{render();speakCurrent(90)},130)};
  window.rateReview=function(known){const u=reviewUnit();if(!u)return;const before=state.reviewBrowseIndex||0;scheduleRecord(u,known);state.reviewDone++;state.revealed=false;state.reviewBrowseIndex=clampIndex(before,reviewQueue().length);save();animateRating(known);setTimeout(()=>{render();speakCurrent(90)},130)};
  function animateRating(known){document.querySelector(known?'.known':'.unknown')?.classList.add('flash');document.querySelector('.word-hero')?.classList.add('fade-out')}
  window.reveal=function(){if(Date.now()<(window.__paiSwipeUntil||0))return;if(!['study','review','freeReview'].includes(state.view))return;const was=!!state.revealed,word=document.querySelector('.word')?.textContent?.trim()||'';state.revealed=!state.revealed;save();render();if(was&&word)setTimeout(()=>speak(word),60)};
  window.swipeWord=function(direction){const q=state.view==='review'?reviewQueue():studyQueue();if(!q.length)return;const key=state.view==='review'?'reviewBrowseIndex':'studyBrowseIndex',next=clampIndex((state[key]||0)+direction,q.length);if(next===state[key])return;state[key]=next;state.revealed=false;save();render();speakCurrent(60)};

  // Free review and zero state
  function assignedNewCount(scene){return (state.daily?.assigned?.[scene]||[]).filter(k=>!state.records[k]).length}
  function remainingUnseen(scene){return allUnits(scene).filter(u=>!state.records[unitKey(u.w,u.sid)])}
  function allSceneNewZero(){return Object.keys(SCENES).every(s=>assignedNewCount(s)===0)}
  function dueCount(){return reviewCount()}
  function hasStudied(){return Object.keys(state.records).some(k=>byKey(k))}
  function extraScenes(){return Object.keys(SCENES).filter(s=>remainingUnseen(s).length>0)}
  function freeKeys(){return Object.keys(state.records).filter(k=>byKey(k)).sort((a,b)=>{const A=state.records[a],B=state.records[b],wa=A.lastKnown===false?0:1,wb=B.lastKnown===false?0:1;return wa!==wb?wa-wb:(A.last||0)-(B.last||0)})}
  window.toggleExtraScenes=function(){state.showExtraScenes=!state.showExtraScenes;save();render()};
  window.continueScene=function(scene){state.showExtraScenes=false;learnMore(scene,10)};
  window.openFreeReview=function(){state.freeKeys=freeKeys();state.freeDone=0;state.freeTotal=state.freeKeys.length;state.view='freeReview';state.revealed=false;save();render();speakCurrent(100)};
  window.rateFreeReview=function(known){const u=byKey(state.freeKeys?.[0]);if(!u)return;scheduleRecord(u,known,2.2);state.freeKeys.shift();state.freeDone=(state.freeDone||0)+1;state.revealed=false;save();animateRating(known);setTimeout(()=>{render();speakCurrent(90)},130)};

  function heroHtml(u){const hidden=state.hideWord&&!state.revealed?' listen-only':'';return `<div class="word-hero${hidden}"><div class="word-line"><div class="word">${escapeHtml(u.w.w)}</div><button class="speak-btn" onclick="speak('${escapeHtml(u.w.w)}');event.stopPropagation()">🔊</button></div><div class="ipa">${escapeHtml(u.w.ipa)}</div>${state.revealed?'':'<div class="tap-hint">轻点空白处显示答案</div>'}</div>`}
  function studyShell(title,progress,u,ratingHtml){return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${title}</div><div class="study-progress">${progress}</div></div><div class="study-body" onclick="reveal()">${heroHtml(u)}${state.revealed?answerHtml(u):''}</div>${ratingHtml}</div>`}
  function ratingHtml(reviewType){const fn=reviewType==='review'?'rateReview':reviewType==='free'?'rateFreeReview':'rateKnown';return `<div class="rating"><button class="unknown" onclick="${fn}(false)">不知道</button><button class="known" onclick="${fn}(true)">知道</button></div>`}

  function renderStudy(){const q=studyQueue(),u=studyUnit();if(!u){const hasAny=allUnits(state.scene).length>0;return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${SCENES[state.scene]}</div><div class="study-progress">完成</div></div><div class="done"><div><h2>${hasAny?'今日新词已完成':'该场景词库正在建设'}</h2><p>${hasAny?'你可以返回场景页复习，或再学 10 个新词。':'目前还没有可学习词条。'}</p>${hasAny?`<button class="primary-btn" onclick="learnMore('${state.scene}',10)">再学 10 个</button><button class="secondary-btn" onclick="goScenes()">返回场景</button>`:`<button class="primary-btn" onclick="goScenes()">返回场景</button>`}</div></div></div>`}return studyShell(SCENES[state.scene],`${state.studyBrowseIndex+1} / ${q.length}`,u,ratingHtml('study'))}
  function renderReview(){const q=reviewQueue(),u=reviewUnit();if(!u)return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">复习</div><div class="study-progress">完成</div></div><div class="done"><div><h2>复习完成</h2><p>当前没有到期内容。</p><button class="primary-btn" onclick="goScenes()">返回场景</button></div></div></div>`;return studyShell(`复习 · ${SCENES[u.sid]}`,`${state.reviewBrowseIndex+1} / ${q.length}`,u,ratingHtml('review'))}
  function renderFreeReview(){const u=byKey(state.freeKeys?.[0]);if(!u)return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">自由复习</div><div class="study-progress">完成</div></div><div class="done"><div><h2>自由复习完成</h2><p>已经把当前已学内容过了一遍。</p><button class="primary-btn" onclick="goScenes()">返回场景</button></div></div></div>`;const total=Math.max(state.freeTotal||1,(state.freeDone||0)+1),pos=Math.min((state.freeDone||0)+1,total);return studyShell(`自由复习 · ${SCENES[u.sid]}`,`${pos} / ${total}`,u,ratingHtml('free'))}
  function renderScenes(){
    if(allSceneNewZero()&&dueCount()===0){const extras=extraScenes(),studied=hasStudied();return `<div class="screen scene-screen"><div class="scene-head"><h1>场景背单词</h1><div class="scene-tools"><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><div class="zero-panel"><h2>今天已完成</h2><p>当前没有到期复习，今天分配的新词也已完成。</p><div class="zero-actions">${extras.length?`<button class="primary-btn" onclick="toggleExtraScenes()">继续学 10 个</button>`:''}${studied?`<button class="secondary-btn" onclick="openFreeReview()">自由复习</button>`:''}</div>${state.showExtraScenes&&extras.length?`<div class="extra-scenes"><div class="extra-title">选择场景</div>${extras.map(s=>`<button onclick="continueScene('${s}')"><span>${SCENES[s]}</span><b>${Math.min(10,remainingUnseen(s).length)}</b></button>`).join('')}</div>`:''}</div><div class="scene-grid dimmed">${Object.entries(SCENES).map(([id,name])=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${name}</span><span class="scene-count">0</span></button>`).join('')}</div></div>`}
    const rc=reviewCount();return `<div class="screen scene-screen"><div class="scene-head"><h1>场景背单词</h1><div class="scene-tools"><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><button class="review-entry ${rc?'has-review':''}" onclick="openReview()"><span>复习</span><b>${rc}</b></button><div class="scene-grid">${Object.entries(SCENES).map(([id,name])=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${name}</span><span class="scene-count">${newCount(id)}</span></button>`).join('')}</div><div class="scene-note">场景数字只表示今日新词；到期内容统一进入“复习”。</div></div>`;
  }
  function renderPanel(kind){
    if(kind==='stats'){const total=Object.keys(state.records).length,known=state.stats.known||0,unknown=state.stats.unknown||0;return `<div class="screen panel-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>统计</h2></div><div class="panel-block"><div class="stat-row"><span>已学习义项</span><b>${total}</b></div><div class="stat-row"><span>知道</span><b>${known}</b></div><div class="stat-row"><span>不知道</span><b>${unknown}</b></div></div><div class="panel-block muted">统计按“单词 × 场景义项”记录。</div></div>`}
    return `<div class="screen panel-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>设置</h2></div><div class="panel-block"><div class="setting-row"><span>每日新词</span><select onchange="setNewPerDay(+this.value)">${[10,20,30,50].map(n=>`<option value="${n}" ${state.newPerDay===n?'selected':''}>${n}</option>`).join('')}</select></div><div class="setting-row"><span>发音口音</span><select onchange="setVoiceAccent(this.value)"><option value="us" ${state.voiceAccent==='us'?'selected':''}>美音</option><option value="gb" ${state.voiceAccent==='gb'?'selected':''}>英音</option></select></div><div class="setting-row"><span>隐藏单词（听音模式）</span><button class="switch ${state.hideWord?'on':''}" onclick="toggleHideWord()"><i></i></button></div><div class="setting-row"><span>显示高频搭配</span><button class="switch ${state.showCollocations?'on':''}" onclick="toggleAnswerOption('showCollocations')"><i></i></button></div><div class="setting-row"><span>显示 3 个例句</span><button class="switch ${state.showExamples?'on':''}" onclick="toggleAnswerOption('showExamples')"><i></i></button></div><div class="setting-row"><span>显示近义区分</span><button class="switch ${state.showCompare?'on':''}" onclick="toggleAnswerOption('showCompare')"><i></i></button></div></div><div class="panel-block muted">新词数量固定；到期复习不设上限。</div></div>`;
  }
  function fitAnswer(){const answer=document.querySelector('.answer'),rating=document.querySelector('.rating');if(!answer||!rating)return;answer.classList.remove('fit-medium','fit-roomy');const gap=rating.getBoundingClientRect().top-answer.getBoundingClientRect().bottom;if(gap>170)answer.classList.add('fit-roomy');else if(gap>85)answer.classList.add('fit-medium')}

  window.render=function(){
    const html=state.view==='study'?renderStudy():state.view==='review'?renderReview():state.view==='freeReview'?renderFreeReview():state.view==='stats'?renderPanel('stats'):state.view==='settings'?renderPanel('settings'):renderScenes();
    document.getElementById('app').innerHTML=html;requestAnimationFrame(fitAnswer);
  };

  document.addEventListener('click',event=>{const btn=event.target.closest('[data-example-audio]');if(!btn)return;event.preventDefault();event.stopPropagation();const text=btn.getAttribute('data-speak');if(text)speak(text,.9)},true);
  let sx=0,sy=0,st=0;
  document.addEventListener('touchstart',e=>{if(!e.touches||e.touches.length!==1)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now()},{passive:true});
  document.addEventListener('touchend',e=>{if(!['study','review'].includes(state.view))return;if(!e.changedTouches||e.changedTouches.length!==1||e.target.closest('button,select,a'))return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy,dt=Date.now()-st;if(dt>700||Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.25)return;e.preventDefault();window.__paiSwipeUntil=Date.now()+350;swipeWord(dx<0?1:-1)},{passive:false});
})();
