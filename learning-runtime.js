// SOURCE: daily.js
// Daily policy V2: newPerDay means NEW WORDS. Extra KUs are scheduled as a separate reinforcement budget.
(function(){
  const oldSave=save;
  const ASSIGNMENT_POLICY='selected-scene-words-v3';
  const REINFORCEMENT_RATIO=.30;
  function dayKey(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  const scopeLimit=()=>13000;
  const reinforcementQuota=()=>Math.max(3,Math.round(state.newPerDay*REINFORCEMENT_RATIO));
  function ensureProgress(){
    const date=dayKey();
    if(!state.dailyNewProgress||state.dailyNewProgress.date!==date)state.dailyNewProgress={date,completed:[],newWordsCompleted:[],reinforcementCompleted:[]};
    const p=state.dailyNewProgress;
    p.completed=Array.isArray(p.completed)?p.completed:[];
    // One-time same-day compatibility with the old KU-count policy: do not unexpectedly grant a second full quota.
    p.newWordsCompleted=Array.isArray(p.newWordsCompleted)?p.newWordsCompleted:[...p.completed];
    p.reinforcementCompleted=Array.isArray(p.reinforcementCompleted)?p.reinforcementCompleted:[];
    return p;
  }
  function primaryKey(w){return Object.keys(w.s||{})[0]||null}
  function wordIntroduced(w){return Object.keys(w.s||{}).some(k=>state.records[k])}
  function primaryUnit(w){const key=primaryKey(w);return key?findUnitByKey(key):null}
  function pickNewWords(limit){
    if(limit<=0)return[];
    const picked=[];
    for(const w of window.PAI_CORE.words){
      if(picked.length>=limit)break;
      if(wordIntroduced(w))continue;
      const k=Object.keys(w.s||{}).find(k=>w.s[k].scene===(state.selectedScene||'daily'));const u=k?findUnitByKey(k):null;if(u)picked.push(u);
    }
    return picked;
  }
  const TYPE_ORDER=Object.freeze({sense:0,risk:1,contrast:2,grammar:3,usage:4,collocation:5,pronunciation:6,polysemy:7,morphology:8,discourse:9,pragmatics:10});
  function pickReinforcement(limit){
    if(limit<=0)return[];
    const candidates=[];
    for(const w of window.PAI_CORE.words){
      if(!wordIntroduced(w))continue;
      const primary=primaryKey(w);
      for(const [k] of Object.entries(w.s||{})){
        if(k===primary||state.records[k])continue;
        if(w.s[k].scene!==(state.selectedScene||'daily')||w.s[k].kuType!=='sense')continue;
        const u=findUnitByKey(k);if(u)candidates.push(u);
      }
    }
    candidates.sort((a,b)=>((TYPE_ORDER[a.s.kuType]??20)-(TYPE_ORDER[b.s.kuType]??20))||(a.w.rank-b.w.rank)||String(a.k).localeCompare(String(b.k)));
    const picked=[],seenWords=new Set();
    for(const u of candidates){
      if(picked.length>=limit)break;
      if(seenWords.has(u.w.rank))continue;
      seenWords.add(u.w.rank);picked.push(u);
    }
    return picked;
  }
  function blankAssignments(){return Object.fromEntries(Object.keys(SCENES).map(scene=>[scene,[]]))}
  function addAssigned(assigned,u){const scene=u.s.scene in assigned?u.s.scene:'general';(assigned[scene]||(assigned[scene]=[])).push(unitKey(u.w,u.sid))}
  function buildAssignments(){
    const assigned=blankAssignments(),p=ensureProgress();
    const remainingWords=Math.max(0,state.newPerDay-p.newWordsCompleted.length);
    const remainingReinforcement=Math.max(0,reinforcementQuota()-p.reinforcementCompleted.length);
    const newWords=pickNewWords(remainingWords),reinforcement=pickReinforcement(remainingReinforcement);
    newWords.forEach(u=>addAssigned(assigned,u));reinforcement.forEach(u=>addAssigned(assigned,u));
    state.daily={
      date:dayKey(),scene:state.selectedScene||'daily',assigned,quota:state.newPerDay,wordQuota:state.newPerDay,reinforcementQuota:reinforcementQuota(),
      newWordKeys:newWords.map(u=>unitKey(u.w,u.sid)),reinforcementKeys:reinforcement.map(u=>unitKey(u.w,u.sid)),
      lexiconLimit:scopeLimit(),policy:ASSIGNMENT_POLICY
    };
    oldSave();return state.daily;
  }
  function ensureDaily(){
    ensureProgress();const d=state.daily;
    if(!d||d.date!==dayKey()||d.wordQuota!==state.newPerDay||d.reinforcementQuota!==reinforcementQuota()||d.lexiconLimit!==scopeLimit()||d.policy!==ASSIGNMENT_POLICY||!d.assigned||d.scene!==(state.selectedScene||'daily'))return buildAssignments();
    for(const scene of Object.keys(SCENES))d.assigned[scene]=d.assigned[scene]||[];
    d.newWordKeys=Array.isArray(d.newWordKeys)?d.newWordKeys:[];d.reinforcementKeys=Array.isArray(d.reinforcementKeys)?d.reinforcementKeys:[];
    return d;
  }
  function assignedKeys(scene){ensureDaily();return state.daily.assigned[scene]||[]}

  queueFor=function(scene){
    const due=dueUnits(scene),dueSet=new Set(due.map(u=>unitKey(u.w,u.sid)));
    const fresh=assignedKeys(scene).filter(k=>!state.records[k]).map(findUnitByKey).filter(Boolean).filter(u=>!dueSet.has(unitKey(u.w,u.sid)));
    return [...due,...fresh];
  };
  todayCount=function(scene){return queueFor(scene).length};

  window.markDailyNewComplete=function(k){
    if(!k)return;const p=ensureProgress(),d=ensureDaily();
    if(!p.completed.includes(k))p.completed.push(k);
    const u=findUnitByKey(k);
    if(u&&!wordIntroduced(u.w)&&!p.newWordsCompleted.includes(k))p.newWordsCompleted.push(k);
    if(d.reinforcementKeys.includes(k)&&!p.reinforcementCompleted.includes(k))p.reinforcementCompleted.push(k);
    oldSave();
  };
  window.setNewPerDay=function(n){
    state.newPerDay=[10,20,30,50].includes(n)?n:20;
    state.daily=null;buildAssignments();
    if(typeof render==='function')render();
  };
  // Deliberately does not exceed today's word/reinforcement budgets. Kept for compatibility with the old runtime.
  window.addSceneNewWords=function(){ensureDaily();return 0};
  window.rebuildDailyAssignments=function(){state.daily=null;return buildAssignments()};
  window.globalNewRemaining=function(){ensureDaily();return state.daily.newWordKeys.filter(k=>!state.records[k]).length};
  window.globalNewCompleted=function(){return ensureProgress().newWordsCompleted.length};
  window.globalNewAssigned=function(){return globalNewCompleted()+globalNewRemaining()};
  window.globalReinforcementRemaining=function(){ensureDaily();return state.daily.reinforcementKeys.filter(k=>!state.records[k]).length};
  window.globalReinforcementCompleted=function(){return ensureProgress().reinforcementCompleted.length};
  window.dailyPolicyQA=function(){ensureDaily();return {policy:ASSIGNMENT_POLICY,newWordQuota:state.daily.wordQuota,reinforcementQuota:state.daily.reinforcementQuota,newWords:state.daily.newWordKeys.length,reinforcement:state.daily.reinforcementKeys.length,totalFresh:Object.values(state.daily.assigned).flat().length}};
  // Intentionally lazy: product-v2 repairs V26.7I scene metadata before the first assignment is generated.
})();


;
// SOURCE: app-runtime.js
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
  function byKey(k){return findUnitByKey(k)}
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
    const c=u.s.compare;if(Array.isArray(c?.items))return{items:c.items.map(x=>({word:x.word,brief:x.brief_zh,text:x.example_en,zh:x.example_zh}))};
    if(!c||!Array.isArray(c.words)||!Array.isArray(c.examples))return{items:[]};
    const words=c.words,briefs=comparisonBriefs(words,c.note||''),mapped=[];
    c.examples.slice(0,3).forEach(text=>{const hits=words.filter(word=>wordMatchesSentence(word,text));if(hits.length===1&&!mapped.some(x=>x.word===hits[0]))mapped.push({word:hits[0],text})});
    return{items:words.map((word,i)=>{const example=mapped.find(x=>x.word===word);return example?{word,brief:briefs[i]||'',text:example.text}:null}).filter(Boolean)};
  }

  window.answerHtml=function(u){
    const compare=contrastData(u),enabledCount=[state.showCollocations,state.showExamples,state.showCompare].filter(Boolean).length;
    const pos=(u.s.pos||u.w.pos)?`<span class="pos-chip">${escapeHtml(u.s.pos||u.w.pos)}</span>`:'';
    const otherMeanings=(u.w.allSenses||[]).filter(s=>!s[4]).map(s=>s[2]);
    const extra=otherMeanings.length?`<details class="answer-section"><summary>其他释义</summary>${otherMeanings.map(m=>`<div>${escapeHtml(m)}</div>`).join('')}</details>`:'';
    const reminder=u.s.x?`<div class="key-reminder"><span>提醒</span>${escapeHtml(u.s.x)}</div>`:'';
    const collocations=state.showCollocations&&u.s.c?`<div class="answer-section"><div class="answer-label">${u.w.allSenses?.length>1?'词条搭配（含不同义项）':'高频搭配'}</div><div class="collocations">${escapeHtml(u.s.c)}</div></div>`:'';
    const examples=state.showExamples&&u.s.e.length?`<div class="answer-section examples-section"><div class="answer-label">${u.w.allSenses?.length>1?'词条例句（含不同义项）':'例句'}</div>${u.s.e.map((e,i)=>`<div class="example"><span class="example-num">${i+1}.</span><span>${escapeHtml(e)}</span><button type="button" class="example-play" data-example-audio data-speak="${escapeHtml(u.s.exampleAudio?.[i]||e)}" aria-label="播放例句 ${i+1}">🔊</button></div>`).join('')}</div>`:'';
    const comparison=state.showCompare&&compare.items.length?`<div class="answer-section"><div class="answer-label">近义 / 易混词辨析</div>${compare.items.length?`<div class="contrast-examples">${compare.items.map(item=>`<div class="contrast-item"><div class="contrast-summary"><span class="contrast-word">${escapeHtml(item.word)}</span><span>：${escapeHtml(item.brief)}</span></div><div class="contrast-sentence">${escapeHtml(item.text)}${item.zh?`<div class="contrast-translation">${escapeHtml(item.zh)}</div>`:''}</div></div>`).join('')}</div>`:'<span class="muted">待补充</span>'}</div>`:'';
    return `<div class="answer density-${enabledCount}" onclick="event.stopPropagation()"><div class="answer-section"><div class="answer-label">释义</div><div class="definition-line">${pos}<div class="definition">${escapeHtml(u.s.m)}</div></div>${u.w.root?`<div class="root merged-root">${escapeHtml(u.w.root)}</div>`:''}${reminder}</div>${extra}${collocations}${examples}${comparison}</div>`;
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
  function allSceneNewZero(){return Object.keys(SCENES).every(s=>newCount(s)===0)}
  function dueCount(){return reviewCount()}
  function hasStudied(){return Object.keys(state.records).some(k=>byKey(k))}
  function extraScenes(){return Object.keys(SCENES).filter(s=>remainingUnseen(s).length>0)}
  function freeKeys(){return Object.keys(state.records).filter(k=>byKey(k)).sort((a,b)=>{const A=state.records[a],B=state.records[b],wa=A.lastKnown===false?0:1,wb=B.lastKnown===false?0:1;return wa!==wb?wa-wb:(A.last||0)-(B.last||0)})}
  window.toggleExtraScenes=function(){state.showExtraScenes=!state.showExtraScenes;save();render()};
  window.continueScene=function(scene){state.showExtraScenes=false;learnMore(scene,10)};
  window.openFreeReview=function(){state.freeKeys=freeKeys();state.freeDone=0;state.freeTotal=state.freeKeys.length;state.view='freeReview';state.revealed=false;save();render();speakCurrent(100)};
  window.rateFreeReview=function(known){const u=byKey(state.freeKeys?.[0]);if(!u)return;scheduleRecord(u,known,2.2);state.freeKeys.shift();state.freeDone=(state.freeDone||0)+1;state.revealed=false;save();animateRating(known);setTimeout(()=>{render();speakCurrent(90)},130)};

  function heroHtml(u){const hidden=state.hideWord&&!state.revealed?' listen-only':'';return `<div class="word-hero${hidden}"><div class="word-line"><div class="word">${escapeHtml(u.w.w)}</div><button class="speak-btn" data-word-audio data-speak="${escapeHtml(u.w.w)}" aria-label="播放单词">🔊</button></div><div class="ipa">${escapeHtml(u.w.ipa||'本口音音标待补充')}</div>${state.revealed?'':'<div class="tap-hint">轻点空白处显示答案</div>'}</div>`}
  function studyShell(title,progress,u,ratingHtml){return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${title}</div><div class="study-progress">${progress}</div></div><div class="study-body" onclick="reveal()">${heroHtml(u)}${state.revealed?answerHtml(u):''}</div>${ratingHtml}</div>`}
  function ratingHtml(reviewType){const fn=reviewType==='review'?'rateReview':reviewType==='free'?'rateFreeReview':'rateKnown';return `<div class="rating"><button class="unknown" onclick="${fn}(false)">不知道</button><button class="known" onclick="${fn}(true)">知道</button></div>`}

  function renderWordPreview(){const u=byKey(state.previewKU);if(!u)return renderScenes();return studyShell('词条预览','',u,'<div class="scene-note">此预览不会修改学习进度。辨析为编辑稿，外部核验待完成。</div>')}

  function renderStudy(){const q=studyQueue(),u=studyUnit();if(!u){const hasAny=allUnits(state.scene).length>0;return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${SCENES[state.scene]}</div><div class="study-progress">完成</div></div><div class="done"><div><h2>${hasAny?'今日新词已完成':'该场景词库正在建设'}</h2><p>${hasAny?'你可以返回场景页复习，或再学 10 个新词。':'目前还没有可学习词条。'}</p>${hasAny?`<button class="primary-btn" onclick="learnMore('${state.scene}',10)">再学 10 个</button><button class="secondary-btn" onclick="goScenes()">返回场景</button>`:`<button class="primary-btn" onclick="goScenes()">返回场景</button>`}</div></div></div>`}return studyShell(SCENES[state.scene],`${state.studyBrowseIndex+1} / ${q.length}`,u,ratingHtml('study'))}
  function renderReview(){const q=reviewQueue(),u=reviewUnit();if(!u)return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">复习</div><div class="study-progress">完成</div></div><div class="done"><div><h2>复习完成</h2><p>当前没有到期内容。</p><button class="primary-btn" onclick="goScenes()">返回场景</button></div></div></div>`;return studyShell(`复习 · ${SCENES[u.s.scene]}`,`${state.reviewBrowseIndex+1} / ${q.length}`,u,ratingHtml('review'))}
  function renderFreeReview(){const u=byKey(state.freeKeys?.[0]);if(!u)return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">自由复习</div><div class="study-progress">完成</div></div><div class="done"><div><h2>自由复习完成</h2><p>已经把当前已学内容过了一遍。</p><button class="primary-btn" onclick="goScenes()">返回场景</button></div></div></div>`;const total=Math.max(state.freeTotal||1,(state.freeDone||0)+1),pos=Math.min((state.freeDone||0)+1,total);return studyShell(`自由复习 · ${SCENES[u.s.scene]}`,`${pos} / ${total}`,u,ratingHtml('free'))}
  function renderScenes(){
    if(allSceneNewZero()&&dueCount()===0){const extras=extraScenes(),studied=hasStudied();return `<div class="screen scene-screen"><div class="scene-head"><h1>场景背单词</h1><div class="scene-tools"><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><div class="zero-panel"><h2>今天已完成</h2><p>当前没有到期复习，今天分配的新词也已完成。</p><div class="zero-actions">${extras.length?`<button class="primary-btn" onclick="toggleExtraScenes()">继续学 10 个</button>`:''}${studied?`<button class="secondary-btn" onclick="openFreeReview()">自由复习</button>`:''}</div>${state.showExtraScenes&&extras.length?`<div class="extra-scenes"><div class="extra-title">选择场景</div>${extras.map(s=>`<button onclick="continueScene('${s}')"><span>${SCENES[s]}</span><b>${Math.min(10,remainingUnseen(s).length)}</b></button>`).join('')}</div>`:''}</div><div class="scene-grid dimmed">${Object.entries(SCENES).map(([id,name])=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${name}</span><span class="scene-count">0</span></button>`).join('')}</div></div>`}
    const rc=reviewCount();return `<div class="screen scene-screen"><div class="scene-head"><h1>场景背单词</h1><div class="scene-tools"><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><button class="review-entry ${rc?'has-review':''}" onclick="openReview()"><span>复习</span><b>${rc}</b></button><div class="scene-grid">${Object.entries(SCENES).map(([id,name])=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${name}</span><span class="scene-count">${newCount(id)}</span></button>`).join('')}</div><div class="scene-note">Core-13000 V25.5 · 13,000 词<br>场景数字表示今日新词；未定稿场景归入待分类。<br>部分音标、词源及近义辨析尚待补充；收录不代表已完成外部核验。</div></div>`;
  }
  function renderPanel(kind){
    if(kind==='stats'){const total=Object.keys(state.records).filter(k=>byKey(k)).length,known=state.stats.known||0,unknown=state.stats.unknown||0;return `<div class="screen panel-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>统计</h2></div><div class="panel-block"><div class="stat-row"><span>已学习义项</span><b>${total}</b></div><div class="stat-row"><span>旧版待确认记录</span><b>${Object.keys(state.legacySrsPending||{}).length}</b></div><div class="stat-row"><span>知道</span><b>${known}</b></div><div class="stat-row"><span>不知道</span><b>${unknown}</b></div></div><div class="panel-block muted">统计按知识单元记录；旧版无法唯一对应的进度已保留待确认。</div></div>`}
    return `<div class="screen panel-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>设置</h2></div><div class="panel-block"><div class="setting-row"><span>每日新词</span><select onchange="setNewPerDay(+this.value)">${[10,20,30,50].map(n=>`<option value="${n}" ${state.newPerDay===n?'selected':''}>${n}</option>`).join('')}</select></div><div class="setting-row"><span>发音口音</span><select onchange="setVoiceAccent(this.value)"><option value="us" ${state.voiceAccent==='us'?'selected':''}>美音</option><option value="gb" ${state.voiceAccent==='gb'?'selected':''}>英音</option></select></div><div class="setting-row"><span>隐藏单词（听音模式）</span><button class="switch ${state.hideWord?'on':''}" onclick="toggleHideWord()"><i></i></button></div><div class="setting-row"><span>显示高频搭配</span><button class="switch ${state.showCollocations?'on':''}" onclick="toggleAnswerOption('showCollocations')"><i></i></button></div><div class="setting-row"><span>显示 3 个例句</span><button class="switch ${state.showExamples?'on':''}" onclick="toggleAnswerOption('showExamples')"><i></i></button></div><div class="setting-row"><span>显示近义 / 易混词辨析</span><button class="switch ${state.showCompare?'on':''}" onclick="toggleAnswerOption('showCompare')"><i></i></button></div></div><div class="panel-block muted">新词数量固定；到期复习不设上限。</div></div>`;
  }
  function fitAnswer(){const answer=document.querySelector('.answer'),rating=document.querySelector('.rating');if(!answer||!rating)return;answer.classList.remove('fit-medium','fit-roomy');const gap=rating.getBoundingClientRect().top-answer.getBoundingClientRect().bottom;if(gap>170)answer.classList.add('fit-roomy');else if(gap>85)answer.classList.add('fit-medium')}

  window.render=function(){
    const html=state.view==='wordPreview'?renderWordPreview():state.view==='study'?renderStudy():state.view==='review'?renderReview():state.view==='freeReview'?renderFreeReview():state.view==='stats'?renderPanel('stats'):state.view==='settings'?renderPanel('settings'):renderScenes();
    document.getElementById('app').innerHTML=html;requestAnimationFrame(fitAnswer);
  };

  document.addEventListener('click',event=>{const btn=event.target.closest('[data-example-audio],[data-word-audio]');if(!btn)return;event.preventDefault();event.stopPropagation();const text=btn.getAttribute('data-speak');if(text){if(state.view==='learning'&&window.PAI_TAP_FLOW?.snapshot().phase==='repeat'){if(!btn.hasAttribute('data-example-audio'))return;window.PAI_TAP_FLOW.interruptRepeatForExample()}speak(text,btn.hasAttribute('data-word-audio')?.84:.9)}},true);
  let sx=0,sy=0,st=0;
  document.addEventListener('touchstart',e=>{if(!e.touches||e.touches.length!==1)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now()},{passive:true});
  document.addEventListener('touchend',e=>{if(!['study','review'].includes(state.view))return;if(!e.changedTouches||e.changedTouches.length!==1||e.target.closest('button,select,a'))return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy,dt=Date.now()-st;if(dt>700||Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.25)return;e.preventDefault();window.__paiSwipeUntil=Date.now()+350;swipeWord(dx<0?1:-1)},{passive:false});
})();


;
// SOURCE: ku-content-ui.js
// V26.7I KU teaching-card UI + KU-specific recall cue.
(function(){
  const base=window.answerHtml;if(typeof base!=='function')return;
  const style=document.createElement('style');style.textContent='.ku-head{display:flex;align-items:center;gap:8px;margin-bottom:12px}.ku-title{font-weight:700}.ku-rule{font-size:1.05rem;line-height:1.65}.ku-pattern{margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.035);line-height:1.55}.ku-pattern .answer-label{margin-bottom:5px}.ku-context{margin-top:8px}.ku-context summary{cursor:pointer}.ku-front-prompt{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;margin-top:10px;font-size:.92rem}.ku-front-prompt .ku-cue-title{font-weight:650}';document.head.appendChild(style);
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const labels={sense:'释义',grammar:'语法',collocation:'搭配',contrast:'辨析',pronunciation:'发音',usage:'用法',risk:'易错',morphology:'词形',polysemy:'多义',discourse:'语篇',pragmatics:'语用',degree:'程度',number:'数词',adverb:'副词',word_order:'语序'};
  window.answerHtml=function(u){
    const kc=u?.kuContent,type=String(u?.s?.kuType||'sense').toLowerCase();
    if(!kc?.content_zh||type==='sense')return base(u);
    const label=labels[type]||u.s.kuTitle||'知识点',title=u.s.kuTitle&&u.s.kuTitle!==label?u.s.kuTitle:'';
    const pattern=kc.pattern_or_example?`<div class="ku-pattern"><div class="answer-label">模式 / 例子</div><div>${esc(kc.pattern_or_example)}</div></div>`:'';
    const context=u.s?.m?`<details class="answer-section ku-context"><summary>相关义项</summary><div class="definition">${esc(u.s.m)}</div></details>`:'';
    return `<div class="answer ku-answer" onclick="event.stopPropagation()"><div class="answer-section ku-primary"><div class="ku-head"><span class="pos-chip">${esc(label)}</span>${title?`<span class="ku-title">${esc(title)}</span>`:''}</div><div class="definition ku-rule">${esc(kc.content_zh)}</div>${pattern}</div>${context}</div>`;
  };
  function unitForCurrentView(){
    if(!window.PAI_CORE?.byKU)return null;
    if(state.view==='study'&&typeof currentUnit==='function')return currentUnit();
    if(state.view==='freeReview')return window.PAI_CORE.byKU.get(state.freeKeys?.[0])||null;
    if(state.view==='review'){
      const now=Date.now(),due=[];
      for(const [k,r] of Object.entries(state.records||{})){const u=window.PAI_CORE.byKU.get(k);if(u&&r?.due<=now)due.push({u,due:r.due})}
      due.sort((a,b)=>a.due-b.due);const i=Math.max(0,Math.min(Number(state.reviewBrowseIndex)||0,Math.max(0,due.length-1)));return due[i]?.u||null;
    }
    return null;
  }
  function addRecallCue(){
    if(state.revealed||!['study','review','freeReview'].includes(state.view))return;
    const u=unitForCurrentView(),hero=document.querySelector('.word-hero');if(!u||!hero||hero.querySelector('.ku-front-prompt'))return;
    const type=String(u.s?.kuType||'sense').toLowerCase(),label=labels[type]||'知识点';
    let title='',meta='';
    if(type==='sense'){
      const scene=(typeof SCENES!=='undefined'&&SCENES[u.s?.scene])||u.s?.scene||'';title='释义';meta=[u.s?.pos||u.w?.pos||'',scene].filter(Boolean).join(' · ');
    }else{
      title=u.s?.kuTitle||label;meta=label;
    }
    const cue=document.createElement('div');cue.className='ku-front-prompt';cue.innerHTML=`<span class="pos-chip">${esc(meta||label)}</span><span class="ku-cue-title">${esc(title)}</span>`;
    const hint=hero.querySelector('.tap-hint');hint?hero.insertBefore(cue,hint):hero.appendChild(cue);
  }
  const baseRender=window.render;
  if(typeof baseRender==='function')window.render=function(){baseRender();addRecallCue()};
})();

;
// SOURCE: tap-flow.js
// Experimental timing policy; response speed is not a calibrated memory score.
(function(){
 const defaults={goodWithin:1,hardWithin:3,goodShow:1,hardShow:3,againShow:15,repeatCount:5,repeatGap:1};
 const labels={goodWithin:'想起了：点击阈值（秒）',hardWithin:'模糊：点击阈值（秒）',goodShow:'想起了：答案展示（秒）',hardShow:'模糊：答案展示（秒）',againShow:'没想起：答案展示（秒）',repeatCount:'重读次数',repeatGap:'每遍读完后的间隔（秒）'};
 function config(){const c={...defaults,...state.tapTiming};for(const k of Object.keys(defaults)){const n=Number(c[k]);c[k]=Number.isFinite(n)?Math.min(k==='repeatCount'?20:60,Math.max(k==='repeatGap'?0:.1,n)):defaults[k]}c.repeatCount=Math.max(1,Math.round(c.repeatCount));c.hardWithin=Math.max(c.goodWithin,c.hardWithin);return c}
 let phase='idle',generation=0,timers=new Set(),began=0,responseMs=null,grade=null,repeated=0,speechError=false,visibleKey=null;
 function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn()},ms);timers.add(id);return id}
 function cancel(){generation++;for(const t of timers)clearTimeout(t);timers.clear();phase='idle';visibleKey=null;if('speechSynthesis'in window)speechSynthesis.cancel()}
 function ready(k){cancel();visibleKey=k;began=Date.now();responseMs=null;grade=null;repeated=0;speechError=false;phase='question'}
 function classify(ms){const c=config();return ms<=c.goodWithin*1000?'good':ms<=c.hardWithin*1000?'hard':'again'}
 function valid(g){return generation===g&&state.view==='learning'&&window.currentUnit?.()?.k===visibleKey}
 function finish(g){if(!valid(g))return;phase='committing';window.rateLearning(grade)}
 function render(){if(typeof window.render==='function')window.render()}
 function speakRepeated(g){
  if(!valid(g))return;const c=config();repeated++;render();let done=false;
  const complete=()=>{if(done)return;done=true;if(!valid(g))return;if(repeated>=c.repeatCount)later(()=>finish(g),c.repeatGap*1000);else later(()=>speakRepeated(g),c.repeatGap*1000)};
  if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined'){speechError=true;render();later(complete,1000);return}
  const synth=speechSynthesis;synth.cancel();const u=new SpeechSynthesisUtterance(currentUnit().w.w);u.lang='en-US';u.rate=.84;u.voice=(synth.getVoices()||[]).find(v=>String(v.lang).toLowerCase()==='en-us')||null;
  u.onend=complete;u.onerror=()=>{speechError=true;render();complete()};window.__paiUtterance=u;
  try{if(synth.paused)synth.resume();synth.speak(u)}catch(_){speechError=true;render();complete()}
  later(()=>{if(!done&&valid(g)){speechError=true;synth.cancel();complete()}},10000);
 }
 function interruptRepeatForExample(){
  if(phase!=='repeat')return false;
  generation++;for(const timer of timers)clearTimeout(timer);timers.clear();
  phase='committing';
  // Commit the overridden 'again' exactly once before the example begins speaking.
  // Do not cancel speech here; the example player owns the speech interruption.
  window.rateLearning(grade);
  return true;
 }
 function tap(){
  if(document.querySelector('.learning-screen.previous-answer')){
   const u=window.getBrowsedUnit?.();if(!u)return;
   cancel();phase='browse-repeat';const g=generation;let count=0;
   const next=()=>{if(g!==generation||state.view!=='learning'||!document.querySelector('.learning-screen.previous-answer'))return;if(count>=config().repeatCount){phase='idle';return}count++;if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined'){later(next,1000);return}const utterance=new SpeechSynthesisUtterance(u.w.w);utterance.lang='en-US';utterance.rate=.84;let done=false;const completed=()=>{if(done)return;done=true;later(next,config().repeatGap*1000)};utterance.onend=completed;utterance.onerror=completed;speechSynthesis.cancel();speechSynthesis.speak(utterance);later(completed,10000)};next();return;
  }
  if(state.view!=='learning'||!currentUnit()||document.hidden)return;
  if(phase==='question'){responseMs=Math.max(0,Date.now()-began);grade=classify(responseMs);phase='answer';state.revealed=true;const g=generation,c=config();render();later(()=>finish(g),c[grade+'Show']*1000)}
  else if(phase==='answer'){
   for(const t of timers)clearTimeout(t);timers.clear();generation++;grade='again';phase='repeat';repeated=0;
   // Do not partially mutate SRS/daily state here. The rating is committed once, through rateLearning(),
   // after the final repetition. If navigation/backgrounding cancels the repetition, no half-commit remains.
   speakRepeated(generation);
  }
 }
 window.setTapTiming=(k,value,refresh=true)=>{if(!(k in defaults)||value==='')return;state.tapTiming={...config(),[k]:Number(value)};state.tapTiming=config();save();if(refresh)render()};
 window.resetTapTiming=()=>{state.tapTiming={...defaults};save();render()};
 function settings(){const c=config();return `<div class="panel-block timing-settings"><h3>点击节奏 · 实测设置</h3><p class="muted">题面出现后开始计时。答案页点空白会记为没想起，并重读后切词。</p>${Object.keys(defaults).map(k=>`<label class="setting-row"><span>${labels[k]}</span><input type="number" aria-label="${labels[k]}" min="${k==='repeatGap'?0:k==='repeatCount'?1:.1}" max="${k==='repeatCount'?20:60}" step="${k==='repeatCount'?1:.1}" value="${c[k]}" oninput="setTapTiming('${k}',this.value,false)" onchange="setTapTiming('${k}',this.value)"></label>`).join('')}<button class="text-btn" onclick="resetTapTiming()">恢复默认节奏</button></div>`}
 function hint(){if(phase==='question')return '想好后，轻点屏幕空白处';if(phase==='repeat')return `${speechError?'系统发音不可用 · ':''}重读 ${repeated} / ${config().repeatCount} · 已标记没想起`;if(phase==='answer')return `${{good:'想起了',hard:'模糊',again:'没想起'}[grade]} · ${config()[grade+'Show']}秒后自动下一词；点空白重读并记为没想起`;return ''}
 window.PAI_TAP_FLOW={ready,cancel,tap,interruptRepeatForExample,config,classify,settings,hint,snapshot:()=>({phase,responseMs,grade,repeated})};
 document.addEventListener('click',e=>{
  if(state.view!=='learning'||!e.target.closest('.learning-screen')||e.target.closest('button,a,input,select,textarea,summary,details,[data-word-audio],[data-example-audio]'))return;
  if(!e.target.matches('.learning-screen,.study-body,.word-hero,.word-line,.answer,.answer-section,.examples-section,.session-footnote,.recall-note'))return;
  if(window.getSelection?.()?.toString()||Date.now()<(window.__paiTapSuppressUntil||0))return;tap();
 },true);
 document.addEventListener('keydown',e=>{if(e.code!=='Space'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)||state.view!=='learning')return;e.preventDefault();tap()});
 let touch=null;document.addEventListener('touchstart',e=>{if(e.touches?.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});document.addEventListener('touchmove',e=>{if(touch&&e.touches?.[0]&&(Math.abs(e.touches[0].clientX-touch.x)>10||Math.abs(e.touches[0].clientY-touch.y)>10))window.__paiTapSuppressUntil=Date.now()+600},{passive:true});
 let swipeStart=null;
 document.addEventListener('touchstart',e=>{if(state.view==='learning'&&e.touches?.length===1)swipeStart={x:e.touches[0].clientX,y:e.touches[0].clientY,time:Date.now()};else swipeStart=null},{passive:true});
 document.addEventListener('touchend',e=>{if(!swipeStart||state.view!=='learning'||e.changedTouches?.length!==1)return;const x=e.changedTouches[0].clientX-swipeStart.x,y=e.changedTouches[0].clientY-swipeStart.y,dt=Date.now()-swipeStart.time;swipeStart=null;if(dt>700||Math.abs(x)<65||Math.abs(x)<Math.abs(y)*1.3||e.target.closest('button,a,input,select,textarea'))return;window.__paiTapSuppressUntil=Date.now()+700;window.browseAnswer?.(x>0?-1:1)},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(state.view!=='learning'||!currentUnit()||document.querySelector('.learning-screen.previous-answer'))return;if(document.hidden){cancel();state.revealed=false}else{ready(currentUnit().k);render()}});
})();
;
// SOURCE: learning-app.js
// One owner for today's study, scene batches, reviews and in-session relearning.
(function(){
 const DAY=86400000,core=window.PAI_CORE,byKey=k=>core.byKU.get(k),key=u=>u.k;
 const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const primary=w=>Object.keys(w.s)[0];
 const category=id=>id==='function'?'专项':id.startsWith('core')?'词频分层':'场景';
 const date=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
 state.selectedScene=SCENES[state.selectedScene]?state.selectedScene:'daily';
 state.learningSession=state.learningSession||null;
 let active=false,loading=false,error='',startedAt=0,token=0,previousUnit=null;
 const due=()=>Object.entries(state.records).filter(([k,r])=>byKey(k)&&(r.learningPending||r.lastKnown===false||r.due<=Date.now())).sort((a,b)=>(b[1].learningPending?1:0)-(a[1].learningPending?1:0)||a[1].due-b[1].due).map(([k])=>k);
 const fresh=()=>{globalNewRemaining();return [...state.daily.newWordKeys,...state.daily.reinforcementKeys].filter(k=>!state.records[k])};
 const unit=()=>byKey(state.learningSession?.queue[0]);
 const unlearned=id=>{const units=core.byScene.get(id)||[],introduced=new Set(units.filter(u=>state.records[u.k]).map(u=>u.w.rank)),seen=new Set();return units.filter(u=>{if(introduced.has(u.w.rank)||seen.has(u.w.rank))return false;seen.add(u.w.rank);return true})};
 function persist(){save()}
 function current(){return active?unit():null}window.currentUnit=current;
 window.currentQueue=()=>active?(state.learningSession?.queue||[]).map(byKey).filter(Boolean):[];
 function statusText(){const s=window.PAI_LOCAL_LEXICON;return s.offlineReady?'全部词包已缓存':`已缓存 ${s.loadedChunks} / ${s.totalChunks} 个词包；学习时按需下载`}
 async function showCurrent(auto=true){browseIndex=null;browsedUnit=null;++browseToken;PAI_TAP_FLOW.cancel();const id=++token,u=unit();error='';loading=!!u&&!u.w.loaded;render();if(!u)return;try{await ensureUnits([u.k]);if(id!==token)return;loading=false;startedAt=Date.now();PAI_TAP_FLOW.ready(u.k);render();if(auto&&!state.hideWord)speak(u.w.w);if(auto&&state.hideWord)speak(u.w.w);const next=state.learningSession.queue.slice(1,5);ensureUnits(next).catch(()=>{})}catch(e){if(id!==token)return;loading=false;error=e.message;render()}}
 function start(keys,title,kind){previousUnit=null;browseIndex=null;const uniq=[...new Set(keys)].filter(byKey);state.learningSession={date:date(),kind,title,queue:uniq,total:uniq.length,completed:[],seen:{},attempts:0};active=true;state.view='learning';state.revealed=false;persist();showCurrent()}
 window.openToday=()=>start([...due(),...fresh()],`${SCENES[state.selectedScene]} · 今日学习`,'today');
 window.openReview=()=>start(due(),'优先复习','review');
 window.openFreeReview=()=>start(Object.keys(state.records).filter(byKey),'自由复习','free');
 window.openScene=id=>{state.selectedScene=id;rebuildDailyAssignments();start([...due().filter(k=>byKey(k).s.scene===id),...unlearned(id).slice(0,10).map(u=>u.k)],SCENES[id]+' · 定向学习','scene')};
 window.resumeLearning=()=>{previousUnit=null;active=true;state.view='learning';state.revealed=false;showCurrent()};
 window.selectLearningScene=id=>{state.selectedScene=id;rebuildDailyAssignments();persist();render()};
 window.goScenes=()=>{previousUnit=null;browseIndex=null;++browseToken;PAI_TAP_FLOW.cancel();++token;active=false;loading=false;error='';state.view='scenes';state.revealed=false;if('speechSynthesis'in window)speechSynthesis.cancel();persist();render()};
 window.openPanel=kind=>{previousUnit=null;PAI_TAP_FLOW.cancel();active=false;state.view=kind;persist();render()};
 window.reveal=()=>{if(!active||loading||error||!unit())return;PAI_TAP_FLOW.tap()};
 window.retryLearningLoad=()=>showCurrent(false);
 let browseIndex=null,browseToken=0,browsedUnit=null;
 window.getBrowsedUnit=()=>browsedUnit;
 window.browseAnswer=async direction=>{
  if(!active||loading||error||!unit())return false;
  const s=state.learningSession;
  const items=[...s.completed.map(k=>byKey(k)).filter(Boolean),...s.queue.map(k=>byKey(k)).filter(Boolean)];
  const unique=[];const seen=new Set();
  for(const u of items){if(!seen.has(u.k)){seen.add(u.k);unique.push(u)}}
  if(!unique.length)return false;
  const currentIndex=unique.findIndex(u=>u.k===unit().k);
  const index=browseIndex===null?currentIndex:browseIndex;
  const next=index+direction;
  if(next<0||next>=unique.length)return false;
  const u=unique[next],id=++browseToken;
  PAI_TAP_FLOW.cancel();++token;
  try{await ensureUnits([u.k]);if(id!==browseToken||state.view!=='learning')return false;
   browseIndex=next;browsedUnit=u;state.revealed=true;
   const host=document.querySelector('.learning-screen'),body=host?.querySelector('.study-body');
   if(!host||!body)return false;
   body.innerHTML=`<div class="word-hero"><div class="word-line"><div class="word">${esc(u.w.w)}</div><button class="speak-btn" data-word-audio data-speak="${esc(u.w.w)}" aria-label="播放单词">🔊</button></div><div class="ipa">${esc(u.w.ipaUS)}</div></div>${answerHtml(u)}`;
   host.classList.add('revealed','previous-answer');
   host.querySelector('.recall-note').textContent='滑动浏览答案 · 右滑上一词 / 左滑下一词';
   speak(u.w.w);return true;
  }catch(_){return false}
 };
 window.rateLearning=grade=>{
  if(!active||loading||error||!unit()||!state.revealed||!['again','hard','good'].includes(grade))return;
  const session=state.learningSession,u=unit(),k=u.k,now=Date.now(),prev=state.records[k];previousUnit=u;
  if(!prev)markDailyNewComplete(k);
  const seen=session.seen[k]||0;session.seen[k]=seen+1;session.attempts++;
  // New material gets a second retrieval; mistakes never disappear behind a timer.
  const repeat=grade!=='good'||(!prev&&seen===0);
  const r={...(prev||{}),last:now,lastKnown:grade==='good',lastGrade:grade,reps:(prev?.reps||0)+1,responseMs:PAI_TAP_FLOW.snapshot().responseMs??Math.max(0,now-startedAt),learningPending:repeat,srsPolicy:'session-retrieval-v3'};
  if(repeat){r.due=now;r.interval=0;}else{const prior=prev?.lastStableInterval||prev?.interval||0;const days=session.kind==='free'&&prior>0?prior/DAY:prior<DAY?1:prior<3*DAY?3:Math.max(3,Math.round(prior/DAY*(prev?.lastGrade==='hard'?1.5:2.3)));r.interval=days*DAY;r.lastStableInterval=r.interval;r.due=session.kind==='free'&&prev?.due>now?prev.due:now+r.interval}
  if(repeat&&prev?.interval>0)r.lastStableInterval=grade==='again'?0:prev.interval;
  state.records[k]=r;rebuildDailyAssignments();state.stats[grade==='good'?'known':'unknown']=(state.stats[grade==='good'?'known':'unknown']||0)+1;
  session.queue.shift();if(repeat)session.queue.splice(Math.min(4,session.queue.length),0,k);else if(!session.completed.includes(k))session.completed.push(k);
  state.revealed=false;persist();showCurrent();
 };
 function top(title,progress=''){return `<div class="study-top"><button class="back-btn" aria-label="返回首页" onclick="goScenes()">‹</button><div class="study-scene">${esc(title)}</div><div class="study-progress">${progress}</div></div>`}
 function home(){
  const n=fresh().length,r=due().length,completed=globalNewCompleted(),resume=state.learningSession?.queue?.length;
  const cards=ids=>ids.map(id=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${esc(SCENES[id])}</span><span class="scene-count"><b>${unlearned(id).length}</b><small>未学词</small></span></button>`).join('');
  return `<div class="screen scene-screen"><div class="scene-head"><h1>PAI Word</h1><div class="scene-tools"><button class="text-btn" onclick="openLexicon()">词库</button><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><p class="home-intro">选一个场景，先回忆，再看答案。</p><section class="today-plan"><label for="scene-choice">今日新词来源</label><select id="scene-choice" onchange="selectLearningScene(this.value)">${Object.entries(SCENES).map(([id,name])=>`<option value="${id}" ${id===state.selectedScene?'selected':''}>${category(id)} · ${esc(name)}</option>`).join('')}</select><p>今日已接触 ${completed} 个新词 · 待学 ${state.daily.newWordKeys.filter(k=>!state.records[k]).length} 个</p><button class="primary-btn" onclick="openToday()">${n||r?'开始今日学习':'今日分配已完成'}${n||r?` · ${n+r} 项`:''}</button>${resume?`<button class="secondary-btn" onclick="resumeLearning()">继续上次学习 · 剩余 ${resume} 项</button>`:''}<button class="text-btn" onclick="openReview()">优先复习 ${r} 项</button></section><h2 class="group-title">按场景学习</h2><div class="scene-grid">${cards(Object.keys(SCENES).filter(id=>category(id)==='场景'))}</div><h2 class="group-title">基础与词频分层</h2><p class="scene-note">以下词汇尚未完成场景细分，按词频范围学习。功能词单独练习。</p><div class="scene-grid">${cards(Object.keys(SCENES).filter(id=>category(id)!=='场景'&&(core.byScene.get(id)||[]).length))}</div><p class="scene-note">内容持续校订中；收录数量不代表已完成词典核验。<br>${statusText()}</p></div>`;
 }
 function learning(){
  const s=state.learningSession,u=unit();if(!s)return home();
  if(!u)return `<div class="screen study-screen">${top(s.title,'完成')}<div class="done"><div><h2>本轮回忆已完成</h2><p>${s.completed.length} 项已通过本轮回忆，共作答 ${s.attempts} 次。<br>本轮错词已重新出现；长期记忆仍需后续复习。</p>${s.kind==='scene'?`<p>此分类还有 ${unlearned(state.selectedScene).length} 个未接触词。</p><button class="primary-btn" onclick="openScene('${state.selectedScene}')">再学 10 个</button>`:''}<button class="secondary-btn" onclick="goScenes()">返回首页</button></div></div></div>`;
  const progress=`已完成 ${s.completed.length} / ${s.total}`;
  if(loading||error)return `<div class="screen study-screen">${top(s.title,progress)}<div class="done" role="status"><div><p>${error?esc(error):'正在准备本轮词卡…'}</p>${error?'<button class="primary-btn" onclick="retryLearningLoad()">重试下载</button>':'<div class="skeleton-line"></div>'}</div></div></div>`;
  const hidden=state.hideWord&&!state.revealed?' listen-only':'';
  const repeat=s.seen[u.k]>0;
  const label=u.s.kuType==='sense'?'回忆这个词的含义':u.s.kuTitle;
  return `<div class="screen study-screen learning-screen ${state.revealed?'revealed':''}">${top(s.title,progress)}<div class="study-body"><div class="word-hero${hidden}"><div class="word-line"><div class="word">${esc(u.w.w)}</div><button class="speak-btn" data-word-audio data-speak="${esc(u.w.w)}" aria-label="播放单词">🔊</button></div><div class="ipa">${esc(u.w.ipaUS)}</div>${/^(the|a|an|and|to|of)$/.test(u.w.w)?'<small class="muted">功能词读音会随重读与连读语境变化。</small>':''}<p class="recall-cue">${repeat?'本轮再回忆 · ':''}${esc(label)}</p></div>${state.revealed?answerHtml(u):''}</div><p class="recall-note" aria-live="polite">${esc(PAI_TAP_FLOW.hint())}</p><div class="session-footnote">新词与错词会在本轮再次出现。点击节奏可在设置中调整。</div></div>`;
 }
 let query='';window.openLexicon=()=>{active=false;state.view='lexicon';render()};
 const results=()=>{const q=query.trim().toLowerCase();return core.words.filter(w=>!q||w.w.toLowerCase().includes(q)||Object.values(w.s).some(s=>s.m.includes(q))).sort((a,b)=>(a.w.toLowerCase()===q?-1:0)-(b.w.toLowerCase()===q?-1:0)||a.rank-b.rank).slice(0,60)};
 const resultHtml=()=>results().map(w=>`<button class="lex-row" onclick="openLexiconWord(${w.rank})"><span class="lex-main"><b>${esc(w.w)}</b><small>${esc(w.pos)}</small></span><span class="lex-gloss">${esc(w.s[primary(w)].m)}</span></button>`).join('')||'<p>没有找到词条。</p>';
 window.updateLexiconSearch=v=>{query=v;document.getElementById('lex-results').innerHTML=resultHtml()};
 window.openLexiconWord=async rank=>{state.lexiconWordRank=rank;state.previewKU=primary(core.words[rank-1]);state.view='lexiconWord';loading=true;error='';render();try{await ensureUnits(Object.keys(core.words[rank-1].s))}catch(e){error=e.message}loading=false;render()};
 window.selectLexiconSense=k=>{state.previewKU=k;render()};
 function lexicon(){return `<div class="screen lex-screen">${top('词库浏览')}<p class="scene-note">共收录 ${core.words.length.toLocaleString()} 词；内容校验尚未全部完成。</p><input aria-label="搜索词库" class="lex-search" placeholder="搜索英文或中文释义" value="${esc(query)}" oninput="updateLexiconSearch(this.value)"><div id="lex-results">${resultHtml()}</div></div>`}
 function detail(){const w=core.words[state.lexiconWordRank-1],u=byKey(state.previewKU);return `<div class="screen lex-word-screen">${top('词条')}<button class="text-btn" onclick="openLexicon()">返回搜索</button><div class="lex-word-head"><div><h1>${esc(w.w)}</h1><div class="ipa">${esc(w.ipaUS||'')}</div></div><button class="speak-btn" data-word-audio data-speak="${esc(w.w)}" aria-label="播放单词">🔊</button></div>${loading?'<p>正在加载词条…</p>':error?`<p>${esc(error)}</p><button onclick="openLexiconWord(${w.rank})">重试</button>`:`<div class="sense-picker">${Object.values(w.s).map(s=>`<button class="sense-chip ${s.ku_id===u.k?'active':''}" onclick="selectLexiconSense('${s.ku_id}')">${esc(s.kuTitle||s.pos)} · ${esc(s.m)}</button>`).join('')}</div>${answerHtml(u)}`}<p class="scene-note">浏览不改变学习进度。发音使用设备提供的美音语音。</p></div>`}
 const previousRender=window.render;
 window.render=function(){const app=document.getElementById('app');if(state.view==='scenes')app.innerHTML=home();else if(state.view==='learning')app.innerHTML=learning();else if(state.view==='lexicon')app.innerHTML=lexicon();else if(state.view==='lexiconWord')app.innerHTML=detail();else{previousRender();if(state.view==='settings'){for(const row of document.querySelectorAll('.setting-row')){if(row.textContent.includes('发音口音'))row.innerHTML='<span>发音</span><b>美音 · 系统语音</b>';if(row.textContent.includes('显示 3 个例句'))row.querySelector('span').textContent='显示可用例句'}const panel=document.querySelector('.panel-screen');panel.insertAdjacentHTML('beforeend',PAI_TAP_FLOW.settings());panel.insertAdjacentHTML('beforeend',`<div class="panel-block"><p>${statusText()}</p><button class="secondary-btn" onclick="downloadOfflineLexicon()" ${window.PAI_LOCAL_LEXICON.downloading?'disabled':''}>${window.PAI_LOCAL_LEXICON.downloading?'正在缓存…':'下载全部词包供离线使用'}</button>${window.PAI_LOCAL_LEXICON.error?`<p>${esc(window.PAI_LOCAL_LEXICON.error)}</p>`:''}</div>`)} }
 };
 window.addEventListener('pai-offline-status',()=>{if(state.view==='settings')render()});
 window.PAI_LEARNING_QA={due,fresh,unlearned,current:unit};
})();
