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
  const scopeLimit=()=>window.PAI_CORE?.words?.length||13000;
  const unitIsPlayable=u=>!!u&&u.s?.playable!==false&&u.s?.requiresHydration!==true;
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
  function primaryKey(w){return Object.keys(w.s||{}).find(k=>unitIsPlayable(findUnitByKey(k)))||null}
  function wordIntroduced(w){return Object.keys(w.s||{}).some(k=>unitIsPlayable(findUnitByKey(k))&&state.records[k])}
  function primaryUnit(w){const key=primaryKey(w);return key?findUnitByKey(key):null}
  function pickNewWords(limit){
    if(limit<=0)return[];
    const picked=[];
    for(const w of window.PAI_CORE.words){
      if(picked.length>=limit)break;
      if(wordIntroduced(w))continue;
      const k=Object.keys(w.s||{}).find(k=>w.s[k].scene===(state.selectedScene||'daily')&&unitIsPlayable(findUnitByKey(k)));const u=k?findUnitByKey(k):null;if(unitIsPlayable(u))picked.push(u);
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
        const u=findUnitByKey(k);if(unitIsPlayable(u))candidates.push(u);
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
    const remainingWords=Math.max(1,Number(state.wordsPerRound)||10); // Rolling assignment, not a daily cap.
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
    const due=dueUnits(scene).filter(unitIsPlayable),dueSet=new Set(due.map(u=>unitKey(u.w,u.sid)));
    const fresh=assignedKeys(scene).filter(k=>!state.records[k]).map(findUnitByKey).filter(unitIsPlayable).filter(u=>!dueSet.has(unitKey(u.w,u.sid)));
    return [...due,...fresh];
  };
  todayCount=function(scene){return queueFor(scene).length};

  window.markDailyNewComplete=function(k){
    if(!k)return;const p=ensureProgress(),d=ensureDaily();
    if(!p.completed.includes(k))p.completed.push(k);
    // Count only KUs originally assigned as new, before saving their SRS records.
    const candidate=findUnitByKey(k);
    const isPreviouslyUnintroduced=!!candidate?.w&&!wordIntroduced(candidate.w);
    // Scene500-selected new words must count toward the same daily word quota,
    // even when they were not in the legacy daily assignment list.
    // One headword counts once across its KU senses and across different scenes.
    const lemma=u=>u?.w?.rank??u?.w?.w??null;
    const wordId=lemma(candidate);
    const countedWord=wordId!==null&&p.newWordsCompleted.some(done=>lemma(findUnitByKey(done))===wordId);
    if((d.newWordKeys.includes(k)||isPreviouslyUnintroduced)&&!countedWord )p.newWordsCompleted.push(k);
    if(d.reinforcementKeys.includes(k)&&!p.reinforcementCompleted.includes(k))p.reinforcementCompleted.push(k);
    oldSave();
  };
  window.setNewPerDay=function(n){
    state.newPerDay=[25,50,100,200].includes(Number(n))?Number(n):50;
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
  const unitIsPlayable=u=>!!u&&u.s?.playable!==false&&u.s?.requiresHydration!==true;
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
  function newQueue(scene){return assignedKeys(scene).filter(k=>!state.records[k]).map(byKey).filter(unitIsPlayable)}
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
  let audioGeneration=0,activeSpeech=false,audioIdleListeners=new Set(),audioWatchdog=null;
  const clearAudioWatchdog=()=>{if(audioWatchdog!==null){clearTimeout(audioWatchdog);audioWatchdog=null}};
  const notifyAudioIdle=()=>{if(!activeSpeech){for(const cb of [...audioIdleListeners]){audioIdleListeners.delete(cb);cb()}}};
  window.PAI_AUDIO={
    whenIdle(callback){if(!activeSpeech){callback();return ()=>{}}audioIdleListeners.add(callback);return ()=>audioIdleListeners.delete(callback)},
    stop(notify=true){clearAudioWatchdog();audioGeneration++;activeSpeech=false;if('speechSynthesis'in window&&(speechSynthesis.speaking||speechSynthesis.pending))speechSynthesis.cancel();if(notify)notifyAudioIdle()},
    play(text,rate=.84,onDone){if(!('speechSynthesis'in window)||!text){onDone?.();return}
      this.stop(false);activeSpeech=true;const id=audioGeneration,synth=speechSynthesis,lang=state.voiceAccent==='gb'?'en-GB':'en-US';refreshVoices();
      const voice=speechVoices.find(v=>String(v.lang).toLowerCase()===lang.toLowerCase())||speechVoices.find(v=>String(v.lang).toLowerCase().startsWith('en'))||null;
      const u=new SpeechSynthesisUtterance(String(text));u.lang=lang;u.rate=Math.min(10,rate*(Number(state.speechSpeed)||100)/100);u.voice=voice;window.__paiUtterance=u;
      let ended=false;const done=()=>{if(ended||id!==audioGeneration)return;ended=true;clearAudioWatchdog();activeSpeech=false;notifyAudioIdle();onDone?.()};
      // Bounded diagnostic trace; an API call is not proof of audible playback.
      const trace={requestId:id,kuId:window.getVisibleLearningUnit?.()?.k||null,word:String(text),at:Date.now(),status:'requested',voice:voice?.name||null};
      const history=window.PAI_AUDIO_TRACE||(window.PAI_AUDIO_TRACE=[]);history.push(trace);if(history.length>60)history.shift();
      u.onstart=()=>{if(id===audioGeneration){trace.status='started';trace.startedAt=Date.now()}};
      u.onend=()=>{trace.status=trace.startedAt?'ended':'ended-without-start';trace.endedAt=Date.now();done()};
      u.onerror=e=>{trace.status='error';trace.error=String(e?.error||'unknown');trace.endedAt=Date.now();done()};
      if(synth.paused)synth.resume();
      try{synth.speak(u);const scaledRate=Math.max(.5,Math.min(2,Number(u.rate)||1));const maxWait=Math.min(15000,Math.max(1500,Math.ceil(String(text).length*650/scaledRate)+1500));audioWatchdog=setTimeout(()=>{if(id!==audioGeneration||ended)return;trace.status=trace.startedAt?'timeout-after-start':'timeout-before-start';trace.endedAt=Date.now();console.warn('Speech synthesis completion timed out');if(synth.speaking||synth.pending)synth.cancel();done()},maxWait)}catch(e){trace.status='exception';trace.error=String(e);trace.endedAt=Date.now();console.warn('Speech synthesis failed',e);done()}
    }
  };
  // iOS Safari can return from suspension with a stuck speech queue or stale voices.
  // Reset the queue on foreground return; the next explicit speaker tap provides a fresh user gesture.
  let paiSpeechHiddenAt=0;
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){paiSpeechHiddenAt=Date.now();return}
    if(!paiSpeechHiddenAt)return;
    const backgroundMs=Date.now()-paiSpeechHiddenAt;paiSpeechHiddenAt=0;
    if(backgroundMs<15000)return;
    try{window.PAI_AUDIO.stop();refreshVoices();window.PAI_LAST_AUDIO_RESUME={at:Date.now(),backgroundMs,status:'queue-reset',voiceCount:speechVoices.length}}
    catch(error){window.PAI_LAST_AUDIO_RESUME={at:Date.now(),backgroundMs,status:'error',error:String(error)}}
  });
  window.speak=(text,rate=.84)=>{if(state.view==='learning'&&String(text)!==String(window.getVisibleLearningUnit?.()?.w?.w||''))return;return window.PAI_AUDIO.play(text,rate)};
  function speakCurrent(delay=60){const u=window.getVisibleLearningUnit?.()||currentVisibleUnit();if(!u)return;const key=u.k,word=u.w?.w;setTimeout(()=>{const current=window.getVisibleLearningUnit?.()||currentVisibleUnit();if(current?.k===key&&current?.w?.w===word&&word)speak(word)},delay)}

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
    const examples=state.showExamples&&Array.isArray(u.s.e)&&u.s.e.length?`<div class="answer-section examples-section"><div class="answer-label">${u.w.allSenses?.length>1?'词条例句（含不同义项）':'例句'}</div>${u.s.e.map((e,i)=>`<div class="example"><span class="example-num">${i+1}.</span><span>${escapeHtml(e)}</span><button type="button" class="example-play" data-example-audio data-speak="${escapeHtml(u.s.exampleAudio?.[i]||e)}" aria-label="播放例句 ${i+1}">🔊</button></div>`).join('')}</div>`:'';
    // B217: approved overlays add display content only; never modify KU or SRS.
    const approvedOverlay=window.PAI_APPROVED_TEACHING_OVERLAY;
    const approvedCard=approvedOverlay?.enabled===true&&approvedOverlay.accepted instanceof Map?approvedOverlay.accepted.get(u.s.ku_id):null;
    // Enrich the EXISTING answer page only; optional certified fields never alter learning state.
    const certifiedText=(key)=>typeof approvedCard?.[key]==='string'?approvedCard[key].trim():'';
    const runtimeGloss=typeof u.s.definition==='string'?u.s.definition.trim():'';
    const approvedGlossText=certifiedText('gloss_en')||runtimeGloss;
    const approvedGloss=approvedGlossText?`<div class="answer-section" data-approved-gloss-ku="${escapeHtml(u.s.ku_id)}"><div class="answer-label">英文释义</div><div class="definition">${escapeHtml(approvedGlossText)}</div></div>`:'';
    const approvedExamples=approvedCard&&state.showExamples&&certifiedText('example_en')?`<div class="answer-section examples-section" data-approved-teaching-ku="${escapeHtml(u.s.ku_id)}"><div class="answer-label">认证教学例句</div><div class="example"><span class="example-num">1.</span><div class="example-text"><div class="example-en">${escapeHtml(certifiedText('example_en'))}</div>${certifiedText('example_zh')?`<div class="example-translation">${escapeHtml(certifiedText('example_zh'))}</div>`:''}</div><button type="button" class="example-play" data-example-audio data-speak="${escapeHtml(certifiedText('example_en'))}" aria-label="播放例句 1">🔊</button></div></div>`:'';
    const approvedUsage=approvedCard&&state.showCollocations&&certifiedText('collocation')?`<div class="answer-section" data-approved-collocation-ku="${escapeHtml(u.s.ku_id)}"><div class="answer-label">典型搭配</div><div class="collocations">${escapeHtml(certifiedText('collocation'))}</div></div>`:'';
    const approvedGrammar=certifiedText('grammar_note')?`<div class="answer-section" data-approved-grammar-ku="${escapeHtml(u.s.ku_id)}"><div class="answer-label">语法与用法</div><div class="definition">${escapeHtml(certifiedText('grammar_note'))}</div></div>`:'';
    const approvedContrast=state.showCompare&&certifiedText('contrast_note')?`<div class="answer-section" data-approved-contrast-ku="${escapeHtml(u.s.ku_id)}"><div class="answer-label">易混词提示</div><div class="definition">${escapeHtml(certifiedText('contrast_note'))}</div></div>`:'';

    // Test-only content on the EXISTING answer page, scoped to one verified Core20K KU.
    // This is editorial staging, NOT certified lexicon data; never write to u.s or SRS.
    const previewHotel=window.PAI_CORE_QA?.release==='Core20K-dev'
      &&u.s.ku_id==='w_0771_hotel_ku01'&&u.w.w==='hotel'
      &&/酒店|旅馆|宾馆/.test(String(u.s.m||''));
    const testCollocation=previewHotel&&state.showCollocations&&!u.s.c
      ?'<div class="answer-section" data-test-teaching="collocation"><div class="answer-label">测试搭配（未认证）</div><div class="collocations">book a hotel · stay at a hotel · hotel room</div></div>':'';
    const testExample=previewHotel&&state.showExamples&&!(Array.isArray(u.s.e)&&u.s.e.length)
      ?'<div class="answer-section examples-section" data-test-teaching="example"><div class="answer-label">测试英汉例句（未认证）</div><div class="example"><span class="example-num">1.</span><div class="example-text"><div class="example-en">We booked a hotel near the station.</div><div class="example-translation">我们在车站附近预订了一家酒店。</div></div><button type="button" class="example-play" data-example-audio data-speak="We booked a hotel near the station." aria-label="播放例句 1">🔊</button></div></div>':'';
    const testContrast=previewHotel&&state.showCompare&&!compare.items.length
      ?'<div class="answer-section" data-test-teaching="contrast"><div class="answer-label">测试辨析（未认证）</div><div class="definition">hotel：酒店；hostel：通常指提供较经济住宿的旅舍。两者并非完全同义。</div></div>':'';

    const comparison=state.showCompare&&compare.items.length?`<div class="answer-section"><div class="answer-label">近义 / 易混词辨析</div>${compare.items.length?`<div class="contrast-examples">${compare.items.map(item=>`<div class="contrast-item"><div class="contrast-summary"><span class="contrast-word">${escapeHtml(item.word)}</span><span>：${escapeHtml(item.brief)}</span></div><div class="contrast-sentence">${escapeHtml(item.text)}${item.zh?`<div class="contrast-translation">${escapeHtml(item.zh)}</div>`:''}</div></div>`).join('')}</div>`:'<span class="muted">待补充</span>'}</div>`:'';
    return `<div class="answer density-${enabledCount}" onclick="event.stopPropagation()"><div class="answer-section"><div class="answer-label">释义</div><div class="definition-line">${pos}<div class="definition">${escapeHtml(u.s.m)}</div></div>${u.w.root?`<div class="root merged-root">${escapeHtml(u.w.root)}</div>`:''}${reminder}</div>${extra}${approvedGloss}${collocations}${testCollocation}${approvedUsage}${examples}${testExample}${approvedExamples}${approvedGrammar}${comparison}${testContrast}${approvedContrast}</div>`;
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
  function remainingUnseen(scene){return allUnits(scene).filter(u=>unitIsPlayable(u)&&!state.records[unitKey(u.w,u.sid)])}
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
    return `<div class="screen panel-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>设置</h2></div><div class="panel-block"><h3>记忆算法</h3><div class="setting-row"><span>当前算法</span><strong>Basic SRS</strong></div><p class="muted">FSRS-6 与自适应算法待验证后开放；当前 KU 评分仍使用基础规则，切换不会重置学习记录。</p></div><div class="panel-block"><div class="setting-row"><span>自动切词速度</span><select onchange="setAutoBrowseInterval(this.value)">${[['0.9','更快'],['1.5','快'],['3','中'],['6','慢']].map(([n,label])=>`<option value="${n}" ${Math.abs((Number(state.autoBrowseInterval)||1.5)-Number(n))<.01?'selected':''}>${label}</option>`).join('')}</select></div><div class="setting-row"><span>朗读速度</span><select onchange="setSpeechSpeed(this.value)">${[80,100,120,150].map(n=>`<option value="${n}" ${(Number(state.speechSpeed)||100)===n?'selected':''}>${n}%</option>`).join('')}</select></div><div class="setting-row"><span>发音口音</span><select onchange="setVoiceAccent(this.value)"><option value="us" ${state.voiceAccent==='us'?'selected':''}>美音</option><option value="gb" ${state.voiceAccent==='gb'?'selected':''}>英音</option></select></div><div class="setting-row"><span>隐藏单词（听音模式）</span><button class="switch ${state.hideWord?'on':''}" onclick="toggleHideWord()"><i></i></button></div><div class="setting-row"><span>显示高频搭配</span><button class="switch ${state.showCollocations?'on':''}" onclick="toggleAnswerOption('showCollocations')"><i></i></button></div><div class="setting-row"><span>显示 3 个例句</span><button class="switch ${state.showExamples?'on':''}" onclick="toggleAnswerOption('showExamples')"><i></i></button></div><div class="setting-row"><span>显示近义 / 易混词辨析</span><button class="switch ${state.showCompare?'on':''}" onclick="toggleAnswerOption('showCompare')"><i></i></button></div></div><div class="panel-block"><h3>测试数据</h3><p class="muted">仅供测试：清除本浏览器的设置、学习记录、复习进度和首页快照，无法撤销。</p><button type="button" onclick="PAI_RESET_TEST_SYSTEM()" style="border:1px solid #c94d4d;color:#a52626;background:#fff;padding:12px 16px;border-radius:12px;font-weight:700">重置系统</button></div><div class="panel-block muted">新词数量固定；到期复习不设上限。</div></div>`;
  }
  function fitAnswer(){const answer=document.querySelector('.answer'),rating=document.querySelector('.rating');if(!answer||!rating)return;answer.classList.remove('fit-medium','fit-roomy');const gap=rating.getBoundingClientRect().top-answer.getBoundingClientRect().bottom;if(gap>170)answer.classList.add('fit-roomy');else if(gap>85)answer.classList.add('fit-medium')}

  window.render=function(){
    const html=state.view==='wordPreview'?renderWordPreview():state.view==='study'?renderStudy():state.view==='review'?renderReview():state.view==='freeReview'?renderFreeReview():state.view==='stats'?renderPanel('stats'):state.view==='settings'?renderPanel('settings'):renderScenes();
    document.getElementById('app').innerHTML=html;requestAnimationFrame(fitAnswer);
  };

  document.addEventListener('click',event=>{const btn=event.target.closest('[data-example-audio],[data-word-audio]');if(!btn)return;event.preventDefault();event.stopPropagation();const text=btn.getAttribute('data-speak');if(text){if(state.view==='learning'&&btn.hasAttribute('data-word-audio')&&text!==(window.getVisibleLearningUnit?.()?.w?.w||''))return;if(state.view==='learning'&&btn.hasAttribute('data-example-audio'))window.PAI_TAP_FLOW?.beginExample();window.PAI_AUDIO.play(text,btn.hasAttribute('data-word-audio')?.84:.9,()=>{if(btn.hasAttribute('data-example-audio'))window.PAI_TAP_FLOW?.exampleFinished()})}},true);
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
    const examples=state.showExamples&&Array.isArray(u.s?.e)&&u.s.e.length?`<details class="answer-section"><summary>相关例句</summary>${u.s.e.slice(0,3).map((e,i)=>`<div class="example"><span class="example-num">${i+1}.</span><span>${esc(e)}</span><button type="button" class="example-play" data-example-audio data-speak="${esc(u.s.exampleAudio?.[i]||e)}" aria-label="播放例句 ${i+1}">🔊</button></div>`).join('')}</details>`:'';
    const collocations=state.showCollocations&&u.s?.c?`<details class="answer-section"><summary>相关搭配</summary><div class="collocations">${esc(u.s.c)}</div></details>`:'';
    return `<div class="answer ku-answer" onclick="event.stopPropagation()"><div class="answer-section ku-primary"><div class="ku-head"><span class="pos-chip">${esc(label)}</span>${title?`<span class="ku-title">${esc(title)}</span>`:''}</div><div class="definition ku-rule">${esc(kc.content_zh)}</div>${pattern}</div>${examples}${collocations}${context}</div>`;
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
      // Listening-only questions must never expose a KU title containing the answer.
      title=state.hideWord&&!state.revealed?'听音回忆知识点':(u.s?.kuTitle||label);meta=label;
    }
    const cue=document.createElement('div');cue.className='ku-front-prompt';cue.innerHTML=`<span class="pos-chip">${esc(meta||label)}</span><span class="ku-cue-title">${esc(title)}</span>`;
    const hint=hero.querySelector('.tap-hint');hint?hero.insertBefore(cue,hint):hero.appendChild(cue);
  }
  const baseRender=window.render;
  if(typeof baseRender==='function')window.render=function(){baseRender();addRecallCue()};
})();

;
// SOURCE: tap-flow.js
// Single owner of QUESTION/ANSWER interaction, timing and navigation.
(function(){
 const defaults={goodWithin:2,hardWithin:5,goodShow:2,hardShow:4,againShow:6,repeatCount:3,repeatGap:1};
 const labels={goodWithin:'想起了：点击阈值（秒）',hardWithin:'模糊：点击阈值（秒）',goodShow:'想起了：答案展示（秒）',hardShow:'模糊：答案展示（秒）',againShow:'没想起：答案展示（秒）',repeatCount:'重读次数',repeatGap:'每遍读完后的间隔（秒）'};
 const config=()=>{const c={...defaults,...state.tapTiming};for(const k in defaults){const n=Number(c[k]);c[k]=Number.isFinite(n)?Math.max(k==='repeatCount'?1:k==='repeatGap'?0:0.1,Math.min(k==='repeatCount'?10:60,n)):defaults[k]}c.repeatCount=Math.max(1,Math.round(c.repeatCount));c.hardWithin=Math.max(c.goodWithin,c.hardWithin);return c};
 let ratedVisibleKey=null;
 let pageState='QUESTION';const pageRevealed=()=>pageState==='ANSWER';
 function syncPage(){state.revealed=pageRevealed()}
 function resetPage(){pageState='QUESTION';syncPage()}
 let phase='idle',generation=0,timer=null,visibleKey=null,began=0,responseMs=null,grade=null,entryMode=null,repeated=0,onAdvance=null,visualGrade='again';
 let ratingDeadline=0,pendingSwipeDirection=0,cancelAudioWait=null,ratingSpeechStarted=false,holdAfterRating=false;
 const PENDING_GRADE_STORAGE='pai-word-preview-v2-pending-grades';
 const pendingGrades=new Map();
 try{const saved=JSON.parse(localStorage.getItem(PENDING_GRADE_STORAGE)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))for(const [k,v] of Object.entries(saved)){if(['again','hard','good'].includes(v))pendingGrades.set(k,v)}}catch(e){console.warn('无法恢复待提交评分',e)}
 function persistPending(){localStorage.setItem(PENDING_GRADE_STORAGE,JSON.stringify(Object.fromEntries(pendingGrades)))}
 function setPendingGrade(k,score){if(!k||!['again','hard','good'].includes(score))return;pendingGrades.set(k,score);try{persistPending()}catch(e){window.PAI_LAST_SAVE_ERROR=String(e);console.error('评分选择保存失败',e)}}
 const gradeFor=k=>pendingGrades.get(k)||(state.records?.[k]?.lastGrade||'again');
 function clear(preserveAudio=false){if(cancelAudioWait){cancelAudioWait();cancelAudioWait=null}ratingSpeechStarted=false;pendingSwipeDirection=0;generation++;if(timer!==null)clearTimeout(timer);timer=null;if(!preserveAudio)window.PAI_AUDIO?.stop();phase='idle';visibleKey=null;onAdvance=null}
 function later(fn,ms){timer=setTimeout(()=>{timer=null;fn()},ms)}
 function valid(g){return g===generation&&state.view==='learning'&&!document.hidden&&window.getVisibleLearningUnit?.()?.k===visibleKey}
 function ready(k,preserveAudio=false){if(ratedVisibleKey!==k)ratedVisibleKey=null;clear(preserveAudio);visualGrade=gradeFor(k);visibleKey=k;began=Date.now();responseMs=null;grade=null;entryMode=null;repeated=0;phase=pageRevealed()?'answer-paused':'question'}
 function classify(ms){const c=config();return ms<=c.goodWithin*1000?'good':ms<=c.hardWithin*1000?'hard':'again'}
 function answer({key,score}){if(key===visibleKey)startRatedSequence(score||'again')}
 function correct(score){if(phase!=='committing'&&visibleKey&&['again','hard','good'].includes(score))startRatedSequence(score)}
 function startRatedSequence(score){
  if(!visibleKey)return;
  const previousRatingSpeech=phase==='answer'&&ratingSpeechStarted;
  if(cancelAudioWait){cancelAudioWait();cancelAudioWait=null}
  if(timer!==null)clearTimeout(timer);timer=null;
  // Allow an existing auto-browse/blank-tap utterance to finish naturally.
  // A corrected rating may replace only the earlier rating's own speech.
  if(previousRatingSpeech)window.PAI_AUDIO?.stop();
  ratingSpeechStarted=false;
  const g=++generation,word=window.getVisibleLearningUnit?.()?.w?.w;
  ratedVisibleKey=visibleKey;grade=score;visualGrade=score;phase='answer';entryMode='rating';state.revealed=true;setPendingGrade(visibleKey,score);
  onAdvance=value=>window.getBrowsedUnit?.()?.k===visibleKey?window.rateBrowsedLearning?.(value,visibleKey):window.rateLearning?.(value,visibleKey);
  const count={again:3,hard:2,good:1}[score],started=Date.now(),showMs=config()[score+'Show']*1000;
  ratingDeadline=started+showMs;pendingSwipeDirection=0;holdAfterRating=false;repeated=0;window.render?.();
  const next=()=>{
   if(!valid(g)||phase!=='answer')return;
   if(repeated>=count){ratingSpeechStarted=false;later(()=>finish(g),Math.max(0,ratingDeadline-Date.now()));return}
   repeated++;ratingSpeechStarted=true;
   const done=()=>{if(!valid(g)||phase!=='answer')return;if(repeated>=count)next();else later(next,config().repeatGap*1000)};
   if(word&&state.autoPronounce?.swipe&&window.PAI_AUDIO?.play)window.PAI_AUDIO.play(word,.84,done);else done();
  };
  let startedRating=false;
  const begin=()=>{if(startedRating||!valid(g)||phase!=='answer')return;startedRating=true;cancelAudioWait=null;next()};
  cancelAudioWait=window.PAI_AUDIO?.whenIdle?.(begin)||null;
  if(!window.PAI_AUDIO?.whenIdle)begin();
 }
 function choose(score){
  if(!['again','hard','good'].includes(score)||state.view!=='learning'||document.hidden||phase==='committing'||!visibleKey)return;
  if(phase!=='answer'){window.PAI_AUTOBROWSE?.stop();window.PAI_CANCEL_PENDING_BROWSE?.();if(!pageRevealed())responseMs=Math.max(0,Date.now()-began)}
  startRatedSequence(score);
 }
 function browseReady(k,advance,revealed=true,preserveAudio=false){pageState=revealed?'ANSWER':'QUESTION';syncPage();ready(k,preserveAudio)}
 function commitEarly(direction){
  if(phase!=='answer'||![-1,1].includes(direction)||!visibleKey)return false;
  pendingSwipeDirection=direction;
  if(cancelAudioWait){cancelAudioWait();cancelAudioWait=null}window.PAI_AUDIO?.stop();ratingSpeechStarted=false;if(timer!==null)clearTimeout(timer);timer=null;
  finish(++generation);return true;
 }
 function takeSwipeDirection(){const direction=pendingSwipeDirection;pendingSwipeDirection=0;return direction}
 function takeHoldAfterRating(){const hold=holdAfterRating;holdAfterRating=false;return hold}
 function finish(g){if(!valid(g)||phase==='idle'||phase==='committing')return;const fn=onAdvance;onAdvance=null;if(typeof fn!=='function'){phase='answer-paused';window.render?.();return}phase='committing';try{fn(grade)}catch(e){window.PAI_LAST_SAVE_ERROR=String(e);console.error('评分提交回调失败',e);resumeFailedCommit()}}
 function repeat(g){if(!valid(g)||phase!=='repeating')return;const u=window.getVisibleLearningUnit?.();if(!u)return;
  repeated++;window.render?.();const c=config();
  const done=()=>{if(!valid(g)||phase!=='repeating')return;if(repeated>=c.repeatCount)later(()=>{if(!valid(g)||phase!=='repeating')return;const k=visibleKey;state.revealed=false;ready(k,true);window.render?.()},c.repeatGap*1000);else later(()=>repeat(g),c.repeatGap*1000)};
  if(state.autoPronounce?.question&&window.PAI_AUDIO?.play)window.PAI_AUDIO.play(u.w.w,.84,done);else later(done,1000);
 }
 function tap(){
  if(state.view!=='learning'||document.hidden||!window.getVisibleLearningUnit?.()||['committing','repeating'].includes(phase))return;
  const word=window.getVisibleLearningUnit?.()?.w?.w;
  pageState=state.revealed?'QUESTION':'ANSWER';syncPage();
  if(phase==='answer'){
   // A blank tap ends the rated countdown, commits once, and keeps this card visible.
   if(cancelAudioWait){cancelAudioWait();cancelAudioWait=null}window.PAI_AUDIO?.stop();ratingSpeechStarted=false;if(timer!==null)clearTimeout(timer);timer=null;
   holdAfterRating=true;finish(++generation);
   window.render?.();
   if(!state.autoBrowseEnabled&&word&&state.autoPronounce?.[state.revealed?'swipe':'question'])window.PAI_AUDIO?.play(word,.84);
   return;
  }
  if(pageRevealed()){responseMs=Math.max(0,Date.now()-began);phase='answer-paused'}
  else ready(visibleKey,true);
  window.render?.();
  if(!state.autoBrowseEnabled&&word&&state.autoPronounce?.[state.revealed?'swipe':'question'])window.PAI_AUDIO?.play(word,.84);
  // In auto-browse, blank taps only change the face. Keep the original timer and audio untouched.
 }
 function beginExample(){if(!['answer','repeating','example','answer-paused'].includes(phase))return false;generation++;if(timer!==null)clearTimeout(timer);timer=null;phase='example';window.render?.();return true}
 function interruptRepeatForExample(){return beginExample()}
 function exampleFinished(){if(phase!=='example')return;phase='answer-paused';window.render?.()}
 function resumeFailedCommit(){
  if(phase!=='committing')return;
  ratedVisibleKey=null;phase='answer-paused';onAdvance=null;window.render?.();
  const raw=String(window.PAI_LAST_SAVE_ERROR||'Unknown KU persistence failure');
  const code=/IndexedDB unavailable|InvalidStateError|database connection is closing/i.test(raw)?'IDB_UNAVAILABLE':
   /QuotaExceededError|quota|disk full/i.test(raw)?'IDB_QUOTA':
   /KU write conflict/i.test(raw)?'KU_VERSION_CONFLICT':
   /KU write duplicate/i.test(raw)?'KU_DUPLICATE':
   /DataCloneError|structuredClone/i.test(raw)?'KU_CLONE_ERROR':
   /TransactionInactiveError|AbortError|transaction aborted/i.test(raw)?'KU_TX_ABORT':'KU_SAVE_ERROR';
  window.PAI_KU_RATING_FAILURE={code,message:raw,at:Date.now(),phase,storageReady:!!window.PAI_KU_STORAGE_READY,version:window.PAI_KU_DURABLE_VERSION??null,visibleKU:window.getVisibleLearningUnit?.()?.k||null};
  const detail=code==='IDB_QUOTA'?'Safari 存储空间不足或数据库容量受限':
   code==='IDB_UNAVAILABLE'?'IndexedDB 当前不可用或连接已关闭':
   code==='KU_VERSION_CONFLICT'?'学习记录版本冲突，需重新同步':
   code==='KU_DUPLICATE'?'检测到重复评分请求':
   code==='KU_CLONE_ERROR'?'评分数据无法复制到数据库':
   code==='KU_TX_ABORT'?'数据库事务中断':'评分计算或持久化失败';
  let el=document.getElementById('pai-ku-commit-error');
  if(!el){el=document.createElement('div');el.id='pai-ku-commit-error';el.setAttribute('role','alert');el.style.cssText='position:fixed;top:calc(65px + env(safe-area-inset-top,0px));left:12px;right:12px;z-index:99999;background:#7f1d1d;color:white;padding:12px;border-radius:10px;font:14px system-ui;pointer-events:auto';document.body.appendChild(el)}
  el.replaceChildren();
  const message=document.createElement('span');message.textContent='KU 评分未保存（'+code+'）：'+detail+'。当前单词未跳过。';
  const copy=document.createElement('button');copy.type='button';copy.textContent='复制错误详情';copy.style.cssText='margin-left:10px;padding:5px 8px;border:1px solid white;border-radius:6px;color:white;background:transparent;font:12px system-ui';
  copy.addEventListener('click',ev=>{ev.stopPropagation();const report=JSON.stringify(window.PAI_KU_RATING_FAILURE,null,2);if(navigator.clipboard?.writeText)navigator.clipboard.writeText(report).then(()=>{copy.textContent='已复制'},()=>{copy.textContent='复制失败'});else copy.textContent=code;});
  el.append(message,copy);setTimeout(()=>{if(el.isConnected)el.remove()},12000);
 }
 function cancel(){clear()}
 window.setTapTiming=(k,value,refresh=true)=>{if(!(k in defaults)||value===''||!Number.isFinite(Number(value)))return;state.tapTiming={...config(),[k]:Number(value)};state.tapTiming=config();save();if(refresh)window.render?.()};
 window.resetTapTiming=()=>{state.tapTiming={...defaults};save();window.render?.()};
 window.restoreDefaultSettings=()=>{
  // Preferences only. Never touch KU records, session progress, statistics or recent scenes.
  state.tapTiming={...defaults};
  state.autoBrowseInterval=1.5;
  state.autoBrowseEnabled=false;
  state.speechSpeed=100;
  state.voiceAccent='us';
  state.newPerDay=50;
  state.wordsPerRound=10;
  state.hideWord=false;
  state.showCollocations=true;
  state.showExamples=true;
  state.showCompare=true;
  state.autoPronounce={question:true,swipe:true};
  save();window.PAI_AUTOBROWSE?.restart();window.render?.();
 };
 function settings(){const c=config();return '<div class="panel-block timing-settings"><h3>点击节奏 · 实测设置</h3><p class="muted">题目计时，答案页统一交互。</p>'+Object.keys(defaults).map(k=>'<label class="setting-row"><span>'+labels[k]+'</span><input type="number" inputmode="'+(k==='repeatCount'?'numeric':'decimal')+'" aria-label="'+labels[k]+'" min="'+(k==='repeatGap'?'0':k==='repeatCount'?'1':'0.1')+'" max="'+(k==='repeatCount'?'10':'60')+'" step="'+(k==='repeatCount'?'1':'0.1')+'" value="'+c[k]+'" onchange="setTapTiming(\''+k+'\',this.value)"></label>').join('')+'</div>'}
 function hint(){return state.revealed?'点空白回题目，左右滑切词，上下滑换批，点底部按钮训练记忆':'点空白看答案，左右滑切词，上下滑换批，点底部按钮训练记忆'}
 window.PAI_TAP_FLOW={ready,answer,browseReady,choose,resetPage,syncPage,pageState:()=>pageState,commitEarly,takeSwipeDirection,takeHoldAfterRating,selectedGradeFor:k=>k===visibleKey?visualGrade:gradeFor(k),ratingLocked:k=>ratedVisibleKey===k,clearPendingGrade:k=>{pendingGrades.delete(k);try{persistPending()}catch(e){window.PAI_LAST_SAVE_ERROR=String(e)}if(k===visibleKey)visualGrade=state.records?.[k]?.lastGrade||'again'},resumeFailedCommit,cancel,tap,beginExample,interruptRepeatForExample,exampleFinished,config,classify,settings,hint,correct,snapshot:()=>({phase,responseMs,grade,entryMode,repeated})};
 document.addEventListener('click',e=>{if(state.view!=='learning'||!e.target.closest('.learning-screen')||e.target.closest('button,a,input,select,textarea,summary,details,.auto-word-toggle,[data-word-audio],[data-example-audio]'))return;if(window.getSelection?.()?.toString()||Date.now()<(window.__paiTapSuppressUntil||0))return;tap()},true);
 document.addEventListener('keydown',e=>{if(e.code!=='Space'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)||state.view!=='learning')return;e.preventDefault();tap()});
 let touch=null;document.addEventListener('touchstart',e=>{touch=state.view==='learning'&&e.touches?.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY,time:Date.now()}:null},{passive:true});
 document.addEventListener('touchmove',e=>{if(touch&&e.touches?.[0]&&(Math.abs(e.touches[0].clientX-touch.x)>10||Math.abs(e.touches[0].clientY-touch.y)>10))window.__paiTapSuppressUntil=Date.now()+700},{passive:true});
 document.addEventListener('touchend',e=>{if(!touch||state.view!=='learning'||e.changedTouches?.length!==1)return;const x=e.changedTouches[0].clientX-touch.x,y=e.changedTouches[0].clientY-touch.y,dt=Date.now()-touch.time;touch=null;if(dt>700||e.target.closest('button,a,input,select,textarea,.auto-word-toggle'))return;const horizontal=Math.abs(x)>=65&&Math.abs(x)>=Math.abs(y)*1.3,vertical=Math.abs(y)>=75&&Math.abs(y)>=Math.abs(x)*1.3;if(!horizontal&&!vertical)return;window.__paiTapSuppressUntil=Date.now()+700;if(vertical)window.PAI_CHANGE_BATCH?.(y<0?1:-1);else window.PAI_NAVIGATE_LEARNING?.(x>0?-1:1,'swipe')},{passive:true});
 // Backgrounding never turns an already revealed answer into a fresh timed question.
 let hiddenAt=0,hiddenPhase=null;
 document.addEventListener('visibilitychange',()=>{
  if(state.view!=='learning')return;
  if(document.hidden){
   hiddenAt=Date.now();hiddenPhase=phase;
   if(timer!==null){clearTimeout(timer);timer=null}
   generation++;window.PAI_AUDIO?.stop();
   if(phase==='answer'||phase==='repeating'||phase==='example')phase='answer-paused';
  }else if(hiddenAt){
   const pausedFor=Math.max(0,Date.now()-hiddenAt);
   if(hiddenPhase==='question'&&phase==='question')began+=pausedFor;
   // Answer and repetition remain paused: no automatic result after backgrounding.
   hiddenAt=0;hiddenPhase=null;
   window.render?.();
  }
 });
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
 // New accounts default to 快 (1.5 s); preserve existing user-selected speeds.
 // Migrate the retired 0.7s preference to the new 0.9s fastest tier.
 if(Number(state.autoBrowseInterval)===0.7)state.autoBrowseInterval=0.9;
 if(![0.9,1.5,3,6].includes(Number(state.autoBrowseInterval)))state.autoBrowseInterval=1.5;
 state.autoPronounce={question:true,swipe:true,...state.autoPronounce};
 window.setAutoPronounce=(kind,enabled)=>{if(!['question','swipe'].includes(kind))return;state.autoPronounce[kind]=!!enabled;persist();render()};
 let active=false,loading=false,error='',startedAt=0,token=0,previousUnit=null;
 const newAttemptId=()=>('crypto' in window&&typeof crypto.randomUUID==='function'?crypto.randomUUID():('attempt-'+Date.now()+'-'+Math.random().toString(36).slice(2)));
 const ensureAttempt=()=>{const sess=state.learningSession,k=sess?.queue?.[0];if(!k)return null;if(!sess.currentAttempt||sess.currentAttempt.kuId!==k||sess.currentAttempt.committed){const previous=sess.currentAttempt;const next={attemptId:newAttemptId(),kuId:k,committed:false};sess.currentAttempt=next;try{if(!window.PAI_KU_STORAGE_READY)persist(true)}catch(e){sess.currentAttempt=previous;throw e}}return sess.currentAttempt};
 const due=()=>Object.entries(state.records).filter(([k,r])=>byKey(k)&&(r.learningPending||r.lastKnown===false||r.due<=Date.now())).sort((a,b)=>(b[1].learningPending?1:0)-(a[1].learningPending?1:0)||a[1].due-b[1].due).map(([k])=>k);
 const fresh=()=>{globalNewRemaining();return [...state.daily.newWordKeys,...state.daily.reinforcementKeys].filter(k=>!state.records[k])};
 const unit=()=>byKey(state.learningSession?.queue[0]);
 // Presentation bookmark is independent of the grading queue and SRS.
 // In-memory on navigation; durable only on exit or when Safari backgrounds.
 const SCENE_CURSORS_KEY='pai-word-preview-v2-scene-cursors';
 let learningCursor=null,sceneCursors={};
 try{
   const stored=JSON.parse(localStorage.getItem(SCENE_CURSORS_KEY)||'null');
   if(stored?.schema===2&&stored.scenes&&typeof stored.scenes==='object'){
     sceneCursors=stored.scenes;
     learningCursor=sceneCursors[stored.last_scene_id]||null;
   }
 }catch(_){}
 function captureLearningCursor(){
   const shown=typeof browsedUnit!=='undefined'&&browsedUnit||unit();
   if(!shown?.k||state.view!=='learning')return;
   const scene=state.learningSession?.scene500SceneId||state.selectedScene||null;
   if(!scene)return;
   const session=state.learningSession||{};
   learningCursor={schema:1,ku_id:shown.k,scene_id:scene,
     page:PAI_TAP_FLOW.pageState()==='ANSWER'?'answer':'question',
     mode:state.autoBrowseEnabled?'auto':'normal',updated_at:Date.now(),
     queue:Array.isArray(session.queue)?[...session.queue]:[],
     completed:Array.isArray(session.completed)?[...session.completed]:[],
     title:session.title||''};
   sceneCursors[scene]=learningCursor;
 }
 function flushLearningCursor(){
   if(state.view==='learning')captureLearningCursor();
   if(!learningCursor)return;
   try{
     localStorage.setItem(SCENE_CURSORS_KEY,JSON.stringify({schema:2,scenes:sceneCursors,last_scene_id:learningCursor.scene_id}));
   }catch(error){window.PAI_LEARNING_CURSOR_ERROR=String(error)}
 }
 window.PAI_LEARNING_CURSOR=(scene)=>{const c=scene?sceneCursors[scene]:learningCursor;return c&&{...c}};
 window.PAI_RECENT_LEARNING_SCENE=()=>learningCursor?.scene_id||null;
 window.addEventListener('pagehide',flushLearningCursor);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)flushLearningCursor()});
 const unlearned=id=>{const units=core.byScene.get(id)||[],introduced=new Set(units.filter(u=>state.records[u.k]).map(u=>u.w.rank)),seen=new Set();return units.filter(u=>{if(introduced.has(u.w.rank)||seen.has(u.w.rank))return false;seen.add(u.w.rank);return true})};
 function persist(strict=false){const ok=save();if(strict&&ok===false)throw new Error('学习状态未保存：浏览器存储空间不足');return ok}
 function current(){return active?unit():null}window.currentUnit=current;
 window.currentQueue=()=>active?(state.learningSession?.queue||[]).map(byKey).filter(Boolean):[];
 function statusText(){const s=window.PAI_LOCAL_LEXICON;return s.offlineReady?'全部词包已缓存':`已缓存 ${s.loadedChunks} / ${s.totalChunks} 个词包；学习时按需下载`}
 async function showCurrent(gestureSpeech=false){PAI_TAP_FLOW.syncPage();historyRetest=false;historyAttemptId=null;browseIndex=null;browsedUnit=null;++browseToken;PAI_TAP_FLOW.cancel();const id=++token,u=unit(),entryStarted=window.PAI_SCENE_ENTRY_STARTED||performance.now(),coldUnit=!!u&&!u.w.loaded;window.PAI_SCENE_ENTRY_STARTED=null;error='';loading=coldUnit;if(coldUnit||!u)render();const loadingPaintMs=Math.round(performance.now()-entryStarted);if(!u)return;
  // First scene-entry speech must be initiated synchronously in the tap gesture on iOS Safari.
  // Catalog lemmas exist before the deferred KU payload is loaded.
  const autoQuestion=state.autoPronounce.question;
  if(gestureSpeech&&autoQuestion&&u.w?.w)window.PAI_AUDIO?.play(u.w.w);
  try{const fetchStarted=performance.now();await ensureUnits([u.k]);const unitLoadMs=Math.round(performance.now()-fetchStarted);if(id!==token)return;const readyStarted=performance.now();ensureAttempt();loading=false;startedAt=Date.now();PAI_TAP_FLOW.ready(u.k,gestureSpeech&&autoQuestion);window.PAI_AUTO_RATED_FACE=null;render();window.PAI_LAST_LEARNING_ENTRY={elapsedMs:Math.round(performance.now()-entryStarted),loadingPaintMs,unitLoadMs,readyRenderMs:Math.round(performance.now()-readyStarted),coldUnit,kind:state.learningSession?.kind||null,at:Date.now()};window.PAI_LEARNING_ENTRY_SAMPLES=(window.PAI_LEARNING_ENTRY_SAMPLES||[]).concat(window.PAI_LAST_LEARNING_ENTRY).slice(-20);window.PAI_AUTOBROWSE?.restart();if(!gestureSpeech&&autoQuestion)speak(u.w.w);const next=state.learningSession.queue.slice(1,5);ensureUnits(next).catch(()=>{});captureLearningCursor()}catch(e){if(id!==token)return;loading=false;error=e.message;render()}}
 function start(keys,title,kind){window.PAI_SCENE_ENTRY_STARTED=performance.now();previousUnit=null;browseIndex=null;const uniq=[...new Set(keys)].filter(byKey);state.learningSession={date:date(),kind,title,queue:uniq,total:uniq.length,completed:[],seen:{},attempts:0,sessionId:newAttemptId(),currentAttempt:null};active=true;state.view='learning';PAI_TAP_FLOW.resetPage();persist();showCurrent(true);window.PAI_AUTOBROWSE?.restart()}
 window.PAI_START_POLICY_SESSION=(keys,title,kind='scene')=>start(keys,title,kind);
 const foodTopicSets=[
  {name:'鱼类',terms:['鱼类','鱼种','各种鱼','淡水鱼','海水鱼','fish species','types of fish'],words:'fish salmon tuna trout cod carp catfish bass perch pike eel herring mackerel sardine anchovy halibut flounder sole snapper grouper tilapia haddock pollock sturgeon swordfish marlin shark ray skate goldfish guppy koi minnow salmonella fishery aquatic freshwater saltwater fin gill scale spawn school shoal'},
  {name:'水果',terms:['水果','果园','买水果','fruit','fruits'],words:'fruit apple banana orange pear peach grape strawberry blueberry raspberry blackberry cherry pineapple mango watermelon melon lemon lime grapefruit kiwi coconut papaya plum apricot fig date pomegranate avocado lychee tangerine nectarine raisin berry citrus ripe juicy peel seed'},
  {name:'海鲜',terms:['海鲜','海产品','海鲜市场','seafood','shellfish'],words:'seafood fish shrimp prawn crab lobster oyster mussel clam scallop squid octopus salmon tuna cod sardine anchovy herring mackerel trout eel shellfish seaweed roe fillet shell fresh frozen grill steam boil fry catch'},
  {name:'肉类',terms:['肉类','肉店','meat'],words:'meat beef pork chicken lamb mutton turkey duck steak sausage bacon ham rib breast thigh roast grill fry butcher'},
  {name:'饮料',terms:['饮料','喝什么','beverage','drink'],words:'drink beverage water juice milk coffee tea soda lemonade smoothie cocktail bottle glass cup thirst'},
  {name:'甜点与烘焙',terms:['甜点','蛋糕','烘焙','dessert','bakery'],words:'dessert cake bread cookie biscuit pie pastry chocolate cream butter sugar flour oven bake sweet'}
 ];
 const topicSets=[
  {name:'蔬菜与烹饪',terms:['蔬菜','买菜','菜市场','做饭','烹饪','vegetable','cooking'],words:'vegetable carrot cabbage spinach onion cucumber broccoli lettuce eggplant potato tomato pepper garlic pumpkin pea bean mushroom celery radish corn boil chop slice fresh harvest'},
  {name:'动物园',terms:['动物园','动物','看动物','zoo','wildlife'],words:'zoo lion tiger elephant giraffe zebra monkey panda bear penguin kangaroo hippo rhino snake crocodile cage enclosure keeper feed habitat wild species conservation ticket'},
  {name:'机场与登机',terms:['机场','登机','飞机','坐飞机','airport','flight'],words:'airport airplane aircraft flight ticket passport luggage baggage terminal security departure arrival boarding gate seat aisle delay check-in'},
  {name:'医院就诊',terms:['医院','看病','医生','生病','hospital','doctor'],words:'hospital doctor nurse patient clinic symptom diagnosis treatment medicine prescription appointment pain fever examination recovery'},
  {name:'餐厅点餐',terms:['餐厅','点餐','饭店','restaurant','dining'],words:'restaurant menu waiter waitress order dish meal appetizer dessert bill tip reservation delicious spicy vegetarian'},
  {name:'酒店住宿',terms:['酒店','住宿','宾馆','hotel'],words:'hotel room reservation reception check-in check-out key lobby elevator breakfast towel guest suite'},
  {name:'超市购物',terms:['超市','购物','商店','shopping','supermarket'],words:'supermarket shop store basket cart checkout cashier price discount receipt product shelf customer'},
  {name:'天气与自然',terms:['天气','气候','下雨','weather'],words:'weather rain snow cloud sunny cloudy wind storm temperature forecast humidity climate umbrella'},
  {name:'学校与课堂',terms:['学校','课堂','上课','school','classroom'],words:'school classroom teacher student lesson homework exam textbook lecture subject grade library'},
  {name:'体育与运动',terms:['体育','运动','锻炼','sport','exercise'],words:'sport exercise training athlete competition stadium team coach race swimming running sailing'}
 ];
 let topicInput='',topicFeedback='';
 const TOPIC_BATCH_SIZE=20;
 window.setTopicInput=v=>{topicInput=String(v||'').slice(0,160)};
 const semanticGroups=[
  {id:'food',aliases:['食品','食物','吃','饮食','food'],children:['水果','蔬菜与烹饪','海鲜','鱼类','肉类','饮料','甜点与烘焙']},
  {id:'market',aliases:['市场','买菜','采购','购物','market'],children:['水果','蔬菜与烹饪','海鲜','鱼类','肉类','超市购物']},
  {id:'cooking',aliases:['做饭','烹饪','晚餐','午餐','厨房','cook','dinner'],children:['蔬菜与烹饪','海鲜','鱼类','肉类','水果']},
  {id:'restaurant',aliases:['餐厅','点餐','饭店','restaurant'],children:['餐厅点餐','海鲜','肉类','蔬菜与烹饪','饮料']}
 ];
 const topics=[...foodTopicSets,...topicSets];
 const topicByName=new Map(topics.map(t=>[t.name,t]));
 const topicIndex=new Map();
 function addTopicTag(lemma,topic,weight,source){
  const k=lemma.toLowerCase();if(!topicIndex.has(k))topicIndex.set(k,[]);
  const tags=topicIndex.get(k),old=tags.find(x=>x.topic===topic);
  if(old){if(weight>old.weight){old.weight=weight;old.source=source}}else tags.push({topic,weight,source});
 }
 for(const t of topics)for(const [i,lemma]of t.words.split(' ').entries())addTopicTag(lemma,t.name,Math.max(15,100-i*2),'curated');
 // Build an additional semantic index from actual Core-13000 sense glosses.
 // A tag is inferred only when a meaning contains a precise category term.
 const glossRules=[
  {topic:'水果',patterns:['水果','果实','浆果','柑橘','苹果','香蕉','葡萄','桃子','梨子','芒果','草莓','樱桃','西瓜','菠萝']},
  {topic:'鱼类',patterns:['鱼类','鱼种','淡水鱼','海水鱼','鲑鱼','鳕鱼','鲤鱼','鲶鱼','鲈鱼','鳗鱼','鲱鱼','鲭鱼','沙丁鱼','金枪鱼','鳟鱼','鲨鱼','比目鱼','鳃','鱼鳍']},
  {topic:'海鲜',patterns:['海鲜','贝类','甲壳类','虾','螃蟹','牡蛎','扇贝','贻贝','龙虾','鱿鱼','章鱼','鲑鱼','金枪鱼','沙丁鱼']},
  {topic:'蔬菜与烹饪',patterns:['蔬菜','绿叶菜','胡萝卜','卷心菜','菠菜','黄瓜','茄子','洋葱','烹饪','烹调']},
  {topic:'动物园',patterns:['动物园','野生动物','哺乳动物','长颈鹿','斑马','大象','狮子','老虎','猴子']},
  {topic:'机场与登机',patterns:['机场','登机','航班','航站楼','行李托运']},
  {topic:'医院就诊',patterns:['医院','就诊','诊断','处方','症状','病人']},
  {topic:'餐厅点餐',patterns:['餐厅','点餐','菜单','服务员','账单']},
  {topic:'酒店住宿',patterns:['酒店','旅馆','住宿','前台','客房']},
  {topic:'超市购物',patterns:['超市','收银','购物车','货架']},
  {topic:'天气与自然',patterns:['天气','气温','气象','暴风雨','降雨']},
  {topic:'学校与课堂',patterns:['学校','教室','课堂','学生','教师']},
  {topic:'体育与运动',patterns:['体育','运动员','比赛','训练','帆船']},
  {topic:'肉类',patterns:['肉类','牛肉','猪肉','羊肉','鸡肉','香肠']},
  {topic:'饮料',patterns:['饮料','果汁','咖啡','茶饮','汽水']},
  {topic:'甜点与烘焙',patterns:['甜点','甜品','糕点','蛋糕','烘焙']}
 ];
 const taxonomy=[
  {id:'nature',label:'自然界',parent:null,topics:['天气与自然','动物园','鱼类']},
  {id:'animals',label:'动物',parent:'nature',topics:['动物园','鱼类']},
  {id:'aquatic',label:'水生动物',parent:'animals',topics:['鱼类','海鲜']},
  {id:'fish',label:'鱼类',parent:'aquatic',topics:['鱼类']},
  {id:'wildlife',label:'野生动物',parent:'animals',topics:['动物园']},
  {id:'food',label:'食品',parent:null,topics:['水果','蔬菜与烹饪','海鲜','鱼类','肉类','饮料','甜点与烘焙']},
  {id:'produce',label:'果蔬',parent:'food',topics:['水果','蔬菜与烹饪']},
  {id:'fruit',label:'水果',parent:'produce',topics:['水果']},
  {id:'vegetable',label:'蔬菜',parent:'produce',topics:['蔬菜与烹饪']},
  {id:'seafood',label:'海鲜',parent:'food',topics:['海鲜','鱼类']},
  {id:'meat',label:'肉类',parent:'food',topics:['肉类']},
  {id:'drink',label:'饮料',parent:'food',topics:['饮料']},
  {id:'dessert',label:'甜点',parent:'food',topics:['甜点与烘焙']},
  {id:'activities',label:'生活场景',parent:null,topics:['机场与登机','医院就诊','餐厅点餐','酒店住宿','超市购物','学校与课堂','体育与运动']},
  {id:'travel',label:'出行住宿',parent:'activities',topics:['机场与登机','酒店住宿']},
  {id:'shopping',label:'购物',parent:'activities',topics:['超市购物']},
  {id:'dining',label:'餐饮',parent:'activities',topics:['餐厅点餐']},
  {id:'health',label:'医疗',parent:'activities',topics:['医院就诊']},
  {id:'education',label:'教育',parent:'activities',topics:['学校与课堂']},
  {id:'sports',label:'运动',parent:'activities',topics:['体育与运动']}
 ];
 const taxonomyById=new Map(taxonomy.map(n=>[n.id,n]));
 const taxonomyTopicMap=new Map();
 for(const node of taxonomy)for(const topic of node.topics){if(!taxonomyTopicMap.has(topic))taxonomyTopicMap.set(topic,[]);taxonomyTopicMap.get(topic).push(node.id)}
 const taxonomyAncestors=id=>{const ids=[];let n=taxonomyById.get(id);while(n){ids.push(n.id);n=n.parent?taxonomyById.get(n.parent):null}return ids};
 const senseTags=new Map(),indexStats={catalogWords:core.words.length,catalogKU:core.byKU.size,glossTaggedKU:0,curatedHeadwords:topicIndex.size};
 for(const w of core.words)for(const s of Object.values(w.s)){
  if(s.kuType!=='sense')continue;
  const meaning=String(s.m||'')+' '+String(s.kuTitle||''),tags=[];
  for(const rule of glossRules)if(rule.patterns.some(p=>meaning.includes(p)))tags.push(rule.topic);
  if(tags.length){senseTags.set(s.ku_id,tags);indexStats.glossTaggedKU++}
 }
 const topicCoverage={};
 for(const t of topics)topicCoverage[t.name]={curatedAvailable:0,glossTaggedKU:0,glossTaggedHeadwords:0};
 for(const w of core.words){
  const curated=new Set((topicIndex.get(w.w.toLowerCase())||[]).map(x=>x.topic));
  const inferred=new Set();
  for(const s of Object.values(w.s))for(const tag of senseTags.get(s.ku_id)||[]){topicCoverage[tag].glossTaggedKU++;inferred.add(tag)}
  for(const tag of curated)topicCoverage[tag].curatedAvailable++;
  for(const tag of inferred)topicCoverage[tag].glossTaggedHeadwords++;
 }
 indexStats.topics=topicCoverage;
 indexStats.taggedHeadwords=[...new Set([...topicIndex.keys(),...core.words.filter(w=>Object.values(w.s).some(s=>senseTags.has(s.ku_id))).map(w=>w.w.toLowerCase())])].length;
 window.PAI_TOPIC_INDEX_QA=indexStats;
 indexStats.taxonomyNodes=taxonomy.length;
 const kuSemanticIndex=new Map();
 for(const w of core.words){
  const curated=topicIndex.get(w.w.toLowerCase())||[];
  for(const s of Object.values(w.s)){
   if(s.kuType!=='sense')continue;
   const inferred=senseTags.get(s.ku_id)||[];
   const sources=[...curated.map(x=>({topic:x.topic,source:'curated',confidence:0.8})),...inferred.map(topic=>({topic,source:'gloss_rule',confidence:0.55}))];
   if(!sources.length)continue;
   const nodes=new Set();
   for(const source of sources)for(const id of taxonomyTopicMap.get(source.topic)||[])for(const ancestor of taxonomyAncestors(id))nodes.add(ancestor);
   kuSemanticIndex.set(s.ku_id,{nodes:[...nodes],sources});
  }
 }
 indexStats.indexedSenseKU=kuSemanticIndex.size;
 window.PAI_TOPIC_INDEX_QA=indexStats;
 window.PAI_TOPIC_INDEX_REPORT=()=>JSON.parse(JSON.stringify(indexStats));
 window.PAI_TOPIC_TAXONOMY=taxonomy.map(n=>({...n}));
 window.PAI_TOPIC_KU_TAGS=key=>{const v=kuSemanticIndex.get(key);return v?JSON.parse(JSON.stringify(v)):null};

 function topicMatch(input){
  const q=input.trim().toLowerCase(),scores=new Map();
  for(const t of topics){const hit=t.terms.reduce((n,term)=>n+(q.includes(term.toLowerCase())?term.length+2:0),0);if(hit)scores.set(t.name,hit*12)}
  for(const group of semanticGroups)if(group.aliases.some(a=>q.includes(a.toLowerCase())))for(const child of group.children)scores.set(child,Math.max(scores.get(child)||0,20));
  if(/鱼类|鱼种|淡水鱼|海水鱼|各种鱼|fish species|types of fish/.test(q))scores.set('鱼类',Math.max(scores.get('鱼类')||0,120));
  if(/海鲜|海产品|seafood/.test(q))scores.set('鱼类',Math.max(scores.get('鱼类')||0,30));
  return [...scores].sort((a,b)=>b[1]-a[1]).map(([name,weight])=>({topic:topicByName.get(name),weight}));
 }
 function topicCandidates(q,matches){
  const normalized=q.trim().toLowerCase();
  const clean=normalized.replace(/[，。！？、；：,.!?;:()（）]/g,' ').replace(/^(我想|我想要|我要|我需要|请|帮我|学习|背|关于|有关|一些|去|在|的|英语|单词|词汇|场景)+/g,'').replace(/(相关|场景|单词|词汇|英语|怎么说|有哪些|的)+$/g,'').trim();
  const tokens=[clean,normalized].filter((x,i,a)=>x.length>=2&&a.indexOf(x)===i);
  const weights=new Map(matches.map(x=>[x.topic.name,x.weight]));
  const scored=[];
  for(const w of core.words){
   const lemma=w.w.toLowerCase(),tags=topicIndex.get(lemma)||[];
   let best=null;
   for(const s of Object.values(w.s)){
    if(s.kuType!=='sense')continue;
    const gloss=String(s.m||'').toLowerCase(),title=String(s.kuTitle||'').toLowerCase();
    const direct=tokens.some(x=>gloss.includes(x)||title.includes(x));
    const inferred=senseTags.get(s.ku_id)||[];const matchedTags=[...tags.filter(x=>weights.has(x.topic)),...inferred.filter(x=>weights.has(x)).map(topic=>({topic,weight:65}))];
    const tagScore=matchedTags.length?Math.max(...matchedTags.map(x=>x.weight+weights.get(x.topic)*2)):0;
    const context=matches.some(x=>x.topic.terms.some(term=>term.length>=2&&(gloss.includes(term.toLowerCase())||title.includes(term.toLowerCase()))));
    if(!direct&&!tagScore&&!context)continue;
    const score=tagScore+(direct?160:0)+(context?35:0)-w.rank/5000;
    if(!best||score>best.score)best={key:s.ku_id,score};
   }
   if(best)scored.push({...best,rank:w.rank,known:!!state.records[best.key]});
  }
  return scored.sort((a,b)=>Number(a.known)-Number(b.known)||b.score-a.score||a.rank-b.rank).map(x=>x.key);
 }
 window.continueTopicStudy=()=>{
  const q=state.topicStudyQuery;if(!q)return;
  const keys=topicCandidates(q,topicMatch(q));
  const unseen=keys.filter(k=>!state.records[k]);
  if(!unseen.length){topicFeedback='本场景已没有未接触的 KU；已学习内容将按复习计划出现。';active=false;state.view='scenes';render();return}
  start(unseen.slice(0,TOPIC_BATCH_SIZE),(state.topicStudyTitle||q)+' · 继续学习','topic')
 };
 const topicWordCount=keys=>new Set(keys.map(k=>byKey(k)?.w?.w?.toLowerCase()).filter(Boolean)).size;
 const topicCatalog=()=>topics.map(t=>{const keys=topicCandidates(t.terms[0],topicMatch(t.terms[0]));return {name:t.name,words:topicWordCount(keys),ku:keys.length,unseen:keys.filter(k=>!state.records[k]).length}});
 window.PAI_TOPIC_CATALOG=topicCatalog;
 // Independently audit all proposed themes; this is a candidate index, not verification.
 let proposedCoverage=null;
 const proposedKeys=new Map();
 async function loadProposedCoverage(){
  try{
   const response=await fetch('data/scene-taxonomy-proposal-v1.json');
   if(!response.ok)throw Error('taxonomy HTTP '+response.status);
   const doc=await response.json();
   const rows=doc.domains.flatMap(domain=>domain.topics.map(t=>({id:t.id,domain:domain.name,name:t.name,wordRanks:new Set(),kuIds:new Set(),directKU:new Set()})));
   const ruleResponse=await fetch('data/scene-semantic-rules-v1.json');
   if(!ruleResponse.ok)throw Error('scene rules HTTP '+ruleResponse.status);
   const ruleDoc=await ruleResponse.json();
   const aliases=ruleDoc.aliases||{};
   const ruleCoverage=rows.reduce((acc,row)=>{if((aliases[row.name]||[]).length)acc.withExpansion++;else acc.directOnly++;return acc},{totalThemes:rows.length,withExpansion:0,directOnly:0});
   window.PAI_SCENE_RULE_COVERAGE=()=>({...ruleCoverage});

   const baseTopicByName=new Map(topics.map(t=>[t.name,t]));
   for(const w of core.words){
    const lemma=w.w.toLowerCase();
    for(const s of Object.values(w.s)){
     if(s.kuType!=='sense')continue;
     const gloss=String(s.m||'')+' '+String(s.kuTitle||'');
     for(const row of rows){
      const direct=gloss.includes(row.name);
      const expanded=(aliases[row.name]||[]).some(term=>gloss.includes(term));
      const base=baseTopicByName.get(row.name);
      const curated=!!base&&base.words.split(' ').includes(lemma);
      if(!direct&&!expanded&&!curated)continue;
      row.wordRanks.add(w.rank);row.kuIds.add(s.ku_id);
      if(direct)row.directKU.add(s.ku_id);
     }
    }
   }
   for(const row of rows)proposedKeys.set(row.id,[...row.kuIds]);
   proposedCoverage=rows.map(row=>({id:row.id,domain:row.domain,name:row.name,words:row.wordRanks.size,ku:row.kuIds.size,directKU:row.directKU.size,unseenKU:[...row.kuIds].filter(k=>!state.records[k]).length,status:'candidate_unverified'}));
   window.PAI_PROPOSED_SCENE_COVERAGE=()=>proposedCoverage.map(x=>({...x}));
   window.PAI_SCENE_COVERAGE_QA=()=>{
    const total=proposedCoverage.length,nonempty=proposedCoverage.filter(x=>x.ku>0).length;
    const empty=proposedCoverage.filter(x=>x.ku===0).map(x=>({id:x.id,name:x.name,domain:x.domain}));
    const low=proposedCoverage.filter(x=>x.ku>0&&x.words<10).map(x=>({id:x.id,name:x.name,words:x.words,ku:x.ku}));
    const inflated=proposedCoverage.filter(x=>x.ku>1000).map(x=>({id:x.id,name:x.name,words:x.words,ku:x.ku}));
    return {totalThemes:total,nonemptyThemes:nonempty,emptyThemes:total-nonempty,expandedRules:ruleCoverage.withExpansion,directOnly:ruleCoverage.directOnly,empty,lowCoverage:low,possibleOvermatching:inflated,verification:'not_verified'};
   };

   if(state.view==='scenes')render();
  }catch(e){window.PAI_PROPOSED_SCENE_ERROR=String(e)}
 }
 window.startProposedScene=id=>{
  const scene=proposedCoverage?.find(x=>x.id===id),keys=proposedKeys.get(id)||[];
  if(!scene||!keys.length){topicFeedback='此主题暂无可靠候选，请选择其他主题。';render();return}
  state.proposedSceneId=id;state.topicStudyQuery='';state.topicStudyTitle=scene.name;state.topicStudyTotal=keys.length;
  persist();start(keys.filter(k=>!state.records[k]).slice(0,TOPIC_BATCH_SIZE).length?keys.filter(k=>!state.records[k]).slice(0,TOPIC_BATCH_SIZE):keys.slice(0,TOPIC_BATCH_SIZE),scene.name+' · 场景学习','proposed')
 };
 window.continueProposedScene=()=>{
  const keys=proposedKeys.get(state.proposedSceneId)||[];
  const unseen=keys.filter(k=>!state.records[k]);
  if(!unseen.length){active=false;state.view='scenes';topicFeedback='本主题暂无未接触的 KU。';render();return}
  start(unseen.slice(0,TOPIC_BATCH_SIZE),(state.topicStudyTitle||'场景')+' · 继续学习','proposed')
 };
 loadProposedCoverage();

  window.PAI_TOPIC_PREVIEW=q=>{const keys=topicCandidates(q,topicMatch(q));return {totalWords:topicWordCount(keys),totalKU:keys.length,unseenKU:keys.filter(k=>!state.records[k]).length,batchSize:TOPIC_BATCH_SIZE}};
 window.startTopicStudy=()=>{
  const q=topicInput.trim();if(!q){topicFeedback='请输入场景或一句话。';render();return}
  const matches=topicMatch(q),keys=topicCandidates(q,matches);
  if(!keys.length){topicFeedback='未找到足够匹配的词义。请尝试更具体的主题，例如“蔬菜”或“动物园”。';render();return}
  topicFeedback='';state.topicStudyQuery=q;state.topicStudyTitle=matches[0]?.topic.name||q.slice(0,24);state.topicStudyTotal=keys.length;persist();start(keys.slice(0,TOPIC_BATCH_SIZE),state.topicStudyTitle+' · 场景学习','topic')
 };
 window.openToday=()=>start([...due(),...fresh()],`${SCENES[state.selectedScene]} · 今日学习`,'today');
 window.openReview=()=>start(due(),'优先复习','review');
 window.openFreeReview=()=>start(Object.keys(state.records).filter(byKey),'自由复习','free');
 window.openScene=id=>{state.selectedScene=id;rebuildDailyAssignments();start([...due().filter(k=>byKey(k).s.scene===id),...unlearned(id).slice(0,10).map(u=>u.k)],SCENES[id]+' · 定向学习','scene')};
 window.resumeLearning=()=>{
   previousUnit=null;active=true;state.view='learning';
   const session=state.learningSession,scene=session?.scene500SceneId||state.selectedScene;
   const bookmark=sceneCursors[scene]?.scene_id===scene?sceneCursors[scene]:null,keys=cycleKeys();
   const index=bookmark?.ku_id?keys.indexOf(bookmark.ku_id):-1;
   const target=index>=0?byKey(bookmark.ku_id):null;
   // Resolve the visible bookmarked KU BEFORE any initial render or audio.
   // Starting showCurrent() first can speak queue[0] while the bookmark displays another word.
   if(target?.k){
     const request=++browseToken;++token;PAI_TAP_FLOW.cancel();
     window.PAI_AUDIO?.stop();browseIndex=index;browsedUnit=target;
     state.revealed=bookmark.page==='answer';loading=!target.w.loaded;error='';
     render();
     const entrySpoken=!!(state.revealed?state.autoPronounce.swipe:state.autoPronounce.question)&&!document.hidden&&!!target.w?.w;
     if(entrySpoken)window.PAI_AUDIO?.play(target.w.w);
     void ensureUnits([target.k]).then(()=>{
       if(request!==browseToken||!active||state.view!=='learning'||browsedUnit?.k!==target.k)return;
       loading=false;PAI_TAP_FLOW.browseReady(target.k,()=>window.advanceBrowsedAnswer(),state.revealed,entrySpoken);
       render();captureLearningCursor();
       if(!entrySpoken&&(state.revealed?state.autoPronounce.swipe:state.autoPronounce.question)&&!document.hidden)speak(target.w.w);
       window.PAI_AUTOBROWSE?.restart();
     }).catch(err=>{if(request===browseToken){loading=false;error=String(err);render()}});
     return;
   }
   void showCurrent();
   window.PAI_AUTOBROWSE?.restart();
 };
 window.PAI_RESUME_SCENE_BOOKMARK=(scene)=>{
   const cursor=sceneCursors[scene];
   if(!cursor?.ku_id||!byKey(cursor.ku_id))return false;
   const existing=state.learningSession;
   if(existing?.kind==='scene'&&(existing.scene500SceneId||state.selectedScene)===scene&&
     [...(existing.queue||[]),...(existing.completed||[])].includes(cursor.ku_id)){
     learningCursor=cursor;state.selectedScene=scene;window.resumeLearning();return true;
   }
   const queue=Array.isArray(cursor.queue)?cursor.queue.filter(byKey):[];
   const completed=Array.isArray(cursor.completed)?cursor.completed.filter(byKey):[];
   if(![...queue,...completed].includes(cursor.ku_id))queue.unshift(cursor.ku_id);
   if(!queue.length&&!completed.length)return false;
   state.selectedScene=scene;
   state.learningSession={date:date(),kind:'scene',title:cursor.title||SCENES[scene]+' · 继续学习',
     queue:[...new Set(queue)],completed:[...new Set(completed)],total:new Set([...queue,...completed]).size,
     seen:{},attempts:0,sessionId:newAttemptId(),currentAttempt:null,
     scene500SceneId:scene,scene500Difficulty:state.scene500DifficultyByScene?.[scene]||'all'};
   learningCursor=cursor;
   // Save scene switch atomically with the active session; never alter SRS records.
   persist();window.resumeLearning();return true;
 };
 window.selectLearningScene=id=>{state.selectedScene=id;rebuildDailyAssignments();persist();render()};
 // Keep the home document's previous scroll position across study navigation.
 let sceneHomeScrollY=0,restoreSceneHomeScroll=false;
 const rememberSceneHomePosition=()=>{if(state.view==='scenes')sceneHomeScrollY=window.scrollY||document.scrollingElement?.scrollTop||0};
 document.addEventListener('click',rememberSceneHomePosition,true);
 window.goScenes=()=>{restoreSceneHomeScroll=true;flushLearningCursor();window.PAI_AUTOBROWSE?.stop();previousUnit=null;browseIndex=null;++browseToken;PAI_TAP_FLOW.cancel();++token;active=false;loading=false;error='';state.view='scenes';state.revealed=false;if('speechSynthesis'in window)speechSynthesis.cancel();persist();render();if(restoreSceneHomeScroll){restoreSceneHomeScroll=false;requestAnimationFrame(()=>window.scrollTo(0,sceneHomeScrollY))}};
 window.openPanel=kind=>{flushLearningCursor();window.PAI_AUTOBROWSE?.stop();previousUnit=null;PAI_TAP_FLOW.cancel();active=false;state.view=kind;persist();render()};
 window.reveal=()=>{if(!active||loading||error||!unit())return;PAI_TAP_FLOW.tap()};
 window.retryLearningLoad=()=>showCurrent();
 let browseIndex=null,browseToken=0,browsedUnit=null;
 window.PAI_CANCEL_PENDING_BROWSE=()=>{++browseToken};
 const sceneBrowseKeys=()=>{
   const scene=state.learningSession?.scene500SceneId||state.selectedScene;
   if(!scene)return [];
   const difficulty=state.scene500DifficultyByScene?.[scene]||'all';
   const allowed=rank=>difficulty==='basic'?rank<=4000:difficulty==='common'?rank>4000&&rank<=8000:difficulty==='advanced'?rank>8000&&rank<=11000:difficulty==='high'?rank>11000:true;
   return [...new Set((allUnits(scene)||[]).filter(u=>allowed(Number(u.w?.rank)||999999)).map(u=>unitKey(u.w,u.sid)))].filter(byKey);
 };
 const cycleKeys=()=>{
   if(state.learningSession?.kind!=='scene')return [...new Set([...(state.learningSession?.completed||[]),...(state.learningSession?.queue||[])])].filter(byKey);
   const all=sceneBrowseKeys(),size=[10,25,50].includes(Number(state.wordsPerRound))?Number(state.wordsPerRound):10;
   const visible=browsedUnit?.k||unit()?.k;
   const index=Math.max(0,all.indexOf(visible)),start=Math.floor(index/size)*size;
   return all.slice(start,start+size);
 };
 let pendingRatedBatchDirection=0;
 const takePendingRatedBatch=()=>{const d=pendingRatedBatchDirection;pendingRatedBatchDirection=0;return d};
 window.PAI_CHANGE_BATCH=async(direction)=>{
   if(!active||state.view!=='learning'||loading||window.PAI_SAVE_DEFERRED||historicalCommitInProgress){recordNavigationFailure('batch','batch-guard');return false;}
   // Commit the rated KU first, then perform the requested batch change.
   if(PAI_TAP_FLOW.snapshot().phase==='answer'){
     pendingRatedBatchDirection=direction;
     return PAI_TAP_FLOW.commitEarly(1);
   }
   if(PAI_TAP_FLOW.snapshot().phase==='committing'){
     if(pendingRatedBatchDirection)pendingRatedBatchDirection=direction;
     recordNavigationFailure('batch','rating-write-in-progress');return false;
   }
   const scene=state.learningSession?.scene500SceneId||state.selectedScene;
   if(!scene)return false;
   const keys=sceneBrowseKeys();
   if(!keys.length)return false;
   const size=Math.max(1,Number(state.wordsPerRound)||10),batches=Math.ceil(keys.length/size);
   if(batches<2)return false;
   const visible=window.getVisibleLearningUnit?.(),position=Math.max(0,keys.indexOf(visible?.k));
   const nextBatch=(Math.floor(position/size)+direction+batches)%batches;
   const target=byKey(keys[nextBatch*size]),originKey=visible?.k,originalFace=PAI_TAP_FLOW.pageState()==='ANSWER',request=++browseToken;
   if(!target)return false;
   // Invalidate an already scheduled auto-advance while the next batch is loading.
   stopAutoBrowse();
   try{
     await ensureUnits([target.k]);
     if(request!==browseToken||!active||state.view!=='learning'||window.PAI_SAVE_DEFERRED||historicalCommitInProgress||window.getVisibleLearningUnit?.()?.k!==originKey||(PAI_TAP_FLOW.pageState()==='ANSWER')!==originalFace)return false;
     ++token;PAI_TAP_FLOW.cancel();window.PAI_AUDIO?.stop();
     browsedUnit=target;browseIndex=keys.indexOf(target.k);state.revealed=originalFace;error='';loading=false;
     PAI_TAP_FLOW.browseReady(target.k,()=>window.advanceBrowsedAnswer(),originalFace);
     captureLearningCursor();render();
     if((originalFace?state.autoPronounce.swipe:state.autoPronounce.question)&&!document.hidden)speak(target.w.w);
     window.PAI_AUTOBROWSE?.restart();return true;
   }catch(e){window.PAI_BATCH_ERROR=String(e);return false}
   finally{if(request===browseToken&&active&&state.view==='learning')window.PAI_AUTOBROWSE?.restart()}
 };
 window.getBrowsedUnit=()=>browsedUnit;
 window.getVisibleLearningUnit=()=>browsedUnit||unit();
 window.restartLearningQuestion=()=>{if(active)showCurrent()};
 window.advanceBrowsedAnswer=()=>{if(!active||!browsedUnit)return false;const keys=cycleKeys(),index=keys.indexOf(browsedUnit.k);if(index<0||!keys.length)return false;PAI_TAP_FLOW.syncPage();void window.browseAnswer(1);return true};
 // All swipe and auto-browse navigation passes through this single guarded entry.
 let manualBrowsePending=0;
 window.PAI_NAVIGATION_DIAG=()=>({
   at:Date.now(),active,loading,error:String(error||''),view:state.view,
   phase:PAI_TAP_FLOW.snapshot().phase,visibleKU:window.getVisibleLearningUnit?.()?.k||null,
   saveDeferred:!!window.PAI_SAVE_DEFERRED,historicalCommitInProgress,
   browseToken,manualBrowsePending,autoBrowseEnabled:!!state.autoBrowseEnabled,
   documentHidden:document.hidden,storageReady:!!window.PAI_KU_STORAGE_READY,
   lastSaveError:window.PAI_LAST_SAVE_ERROR||null
 });
 const navigationFailures=window.PAI_NAVIGATION_FAILURES||(window.PAI_NAVIGATION_FAILURES=[]);
 function recordNavigationFailure(source,reason){
   navigationFailures.push({...window.PAI_NAVIGATION_DIAG(),source,reason});
   if(navigationFailures.length>30)navigationFailures.shift();
 }
 window.PAI_NAVIGATE_LEARNING=async(direction,source='swipe')=>{
  const phase=PAI_TAP_FLOW.snapshot().phase;
  if(!active||loading||error||!window.getVisibleLearningUnit?.()||state.view!=='learning'||document.hidden||window.PAI_SAVE_DEFERRED||historicalCommitInProgress||!['question','answer-paused','answer'].includes(phase)){recordNavigationFailure(source,'navigation-guard');return false;}
   if(phase==='answer'){
     if(source==='auto')return false; // Auto mode must not commit a rating prematurely.
     if(source==='swipe')return PAI_TAP_FLOW.commitEarly(direction);
   }
  // Explicit swipes take priority over a simultaneous automatic navigation.
  if(source==='auto'&&manualBrowsePending>0)return false;
  if(source==='swipe')manualBrowsePending++;
  try{
   const moved=await window.browseAnswer(direction);
   if(source==='swipe'&&moved&&state.autoBrowseEnabled&&['question','answer-paused'].includes(PAI_TAP_FLOW.snapshot().phase))window.PAI_AUTOBROWSE?.restart();
   return moved;
  }finally{if(source==='swipe')manualBrowsePending=Math.max(0,manualBrowsePending-1)}
 };
 window.browseAnswer=async direction=>{
  if(!active||loading||error||!window.getVisibleLearningUnit?.()||state.view!=='learning'||window.PAI_SAVE_DEFERRED)return false;
  const keys=cycleKeys();if(!keys.length)return false;
  const index=Math.max(0,keys.indexOf(window.getVisibleLearningUnit().k));
  const next=(index+direction+keys.length)%keys.length;
  const u=byKey(keys[next]),id=++browseToken,wasRevealed=PAI_TAP_FLOW.pageState()==='ANSWER';
  // Preload without changing the current card: a user rating can still win the race.
  try{await ensureUnits([u.k]);if(id!==browseToken||state.view!=='learning'||!active||window.PAI_SAVE_DEFERRED||historicalCommitInProgress||!['question','answer-paused'].includes(PAI_TAP_FLOW.snapshot().phase)){recordNavigationFailure('browse','async-guard');return false;}
   PAI_TAP_FLOW.cancel();historyRetest=false;historyAttemptId=null;++token;
   window.PAI_AUDIO?.stop();browseIndex=next;browsedUnit=u;state.revealed=wasRevealed;
   render();
   PAI_TAP_FLOW.browseReady(u.k,()=>window.advanceBrowsedAnswer(),wasRevealed);captureLearningCursor();render();if((wasRevealed?state.autoPronounce.swipe:state.autoPronounce.question)&&!document.hidden)speak(u.w.w);return true;
  }catch(_){return false}
 };
 // Auto-browse is presentation-only: never score or commit a KU.
 let autoBrowseTimer=null,autoBrowseGeneration=0;
 const autoInterval=()=>Math.round(([0.9,1.5,3,6].includes(Number(state.autoBrowseInterval))?Number(state.autoBrowseInterval):1.5)*1000);
 function stopAutoBrowse(){autoBrowseGeneration++;if(autoBrowseTimer!==null)clearTimeout(autoBrowseTimer);autoBrowseTimer=null}
 function scheduleAutoBrowse(){
  const generation=autoBrowseGeneration;
  if(!state.autoBrowseEnabled||!active||state.view!=='learning'||document.hidden)return;
  autoBrowseTimer=setTimeout(async()=>{
   autoBrowseTimer=null;
   if(generation!==autoBrowseGeneration||!state.autoBrowseEnabled||!active||state.view!=='learning'||document.hidden)return;
   const phase=window.PAI_TAP_FLOW?.snapshot()?.phase;
   // Never interrupt a pending rating, storage commit or explicit answer replay.
   if(!loading&&!error&&!window.PAI_SAVE_DEFERRED&&['question','answer-paused'].includes(phase)){
    try{await window.PAI_NAVIGATE_LEARNING(1,'auto')}catch(e){console.warn('Auto browse skipped',e)}
   }
   if(generation===autoBrowseGeneration)scheduleAutoBrowse();
  },autoInterval());
 }
 let autoWakeLock=null,autoWakeRequest=0;
 const wakeAllowed=()=>!!(state.autoBrowseEnabled&&active&&state.view==='learning'&&!document.hidden);
 async function syncAutoWakeLock(){
  const request=++autoWakeRequest;
  if(!wakeAllowed()){
   const lock=autoWakeLock;autoWakeLock=null;
   if(lock)try{await lock.release()}catch{}
   return;
  }
  if(autoWakeLock||!navigator.wakeLock?.request)return;
  try{
   const lock=await navigator.wakeLock.request('screen');
   if(request!==autoWakeRequest||!wakeAllowed()){try{await lock.release()}catch{};return}
   autoWakeLock=lock;
   lock.addEventListener?.('release',()=>{if(autoWakeLock===lock)autoWakeLock=null},{once:true});
  }catch(e){/* Unsupported or denied: ordinary foreground auto-browse still works. */}
 }
 function restartAutoBrowse(){stopAutoBrowse();scheduleAutoBrowse();void syncAutoWakeLock()}
 window.PAI_AUTOBROWSE={restart:restartAutoBrowse,stop(){stopAutoBrowse();const lock=autoWakeLock;autoWakeLock=null;autoWakeRequest++;if(lock)void lock.release().catch(()=>{})}};
 window.setAutoBrowse=enabled=>{
  state.autoBrowseEnabled=!!enabled;save();restartAutoBrowse();render();
 };
 window.setSpeechSpeed=value=>{const n=Number(value);if(![80,100,120,150].includes(n))return;state.speechSpeed=n;save();render()};
 window.setAutoBrowseInterval=value=>{
  const n=Number(value);if(![0.9,1.5,3,6].includes(n))return;
  state.autoBrowseInterval=n;save();restartAutoBrowse();render();
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAutoBrowse();else restartAutoBrowse()});
 // Historical rating is a NEW review event, never a rewrite of a prior attempt.
 // Because browsing already reveals the answer, first press starts a hidden-answer retest.
 let historyRetest=false,historyAttemptId=null;
 window.PAI_HISTORY_RETEST=()=>historyRetest;
 window.chooseHistoricalRating=grade=>{
  if(!active||loading||error||!browsedUnit||!['again','hard','good'].includes(grade))return;
  PAI_TAP_FLOW.choose(grade);
 };
 let historicalCommitInProgress=false;
 window.PAI_RESUME_AUTO_RATED_CARD=(k)=>{
  const face=window.PAI_AUTO_RATED_FACE;
  if(!state.autoBrowseEnabled||!face)return false;
  window.PAI_AUTO_RATED_FACE=null;
  const u=byKey(k);if(!u)return false;
  // Rating has already committed. Keep the same KU visible, with no navigation here.
  const keys=cycleKeys();
  browseIndex=keys.indexOf(k);browsedUnit=u;historyRetest=false;historyAttemptId=null;
  state.revealed=face==='answer';
  PAI_TAP_FLOW.browseReady(k,null,state.revealed);
  render();window.PAI_AUTOBROWSE?.restart();
  return true;
 };
 // Shared rating projection: same KU history and grade yield the same SRS record
 // regardless of whether the card was entered via queue, swipe, batch or bookmark.
 async function commitRatedDraft(draft,attemptId){
   if(!window.PAI_KU_STORAGE_READY)throw Error('IndexedDB unavailable: refusing unsafe KU write');
   const result=await window.PAI_KU_DURABLE.commit(window.PAI_KU_DURABLE_DB,{
     snapshot:draft,attemptId,expectedVersion:window.PAI_KU_DURABLE_VERSION
   });
   if(result.status!=='committed')throw Error('KU write '+result.status);
   window.PAI_KU_DURABLE_VERSION=result.version;
   state=draft;
   window.PAI_SAVE_DEFERRED=false;
   try{save()}catch(cacheError){try{console.warn('Durable KU committed; optional local backup failed',cacheError)}catch{}}
   return result;
 }
 function projectRatedKU(draft,before,k,grade,now,responseMs){
   const previous=before.records?.[k],seen=Number(draft.learningSession?.seen?.[k]||0);
   const repeat=grade!=='good'||(!previous&&seen===0);
   const record=window.PAI_MEMORY_SCHEDULERS.review('basic',{
     previous,grade,now,repeat,sessionKind:draft.learningSession?.kind||'scene'
   });
   record.responseMs=responseMs??null;
   draft.records[k]=record;
   if(draft.learningSession){
     draft.learningSession.seen=draft.learningSession.seen||{};
     draft.learningSession.seen[k]=seen+1;
     draft.learningSession.attempts=(draft.learningSession.attempts||0)+1;
   }
   if(!previous){
     const today=date(),old=draft.dailyNewProgress;
     const p=old?.date===today?old:{date:today,completed:[],newWordsCompleted:[],reinforcementCompleted:[]};
     p.completed=Array.isArray(p.completed)?p.completed:[];
     p.newWordsCompleted=Array.isArray(p.newWordsCompleted)?p.newWordsCompleted:[];
     p.reinforcementCompleted=Array.isArray(p.reinforcementCompleted)?p.reinforcementCompleted:[];
     if(!p.completed.includes(k))p.completed.push(k);
     const wordId=key=>{const u=byKey(key);return u?.w?.rank??u?.w?.w??null};
     const id=wordId(k);
     const alreadyIntroduced=id!==null&&Object.keys(before.records||{}).some(key=>wordId(key)===id);
     const alreadyCounted=id!==null&&p.newWordsCompleted.some(key=>wordId(key)===id);
     if(id!==null&&!alreadyIntroduced&&!alreadyCounted)p.newWordsCompleted.push(k);
     draft.dailyNewProgress=p;
   }
   draft.stats[grade==='good'?'known':'unknown']=(draft.stats[grade==='good'?'known':'unknown']||0)+1;
   return {record,repeat};
 }
 window.rateBrowsedLearning=async(grade,k)=>{
  if(window.PAI_SAVE_DEFERRED===true||historicalCommitInProgress||!active||!browsedUnit||browsedUnit.k!==k||!['again','hard','good'].includes(grade))return;
  historicalCommitInProgress=true;
  let attemptId,draft;
  try{
   attemptId=newAttemptId();
   const before=state,now=Date.now();
   draft=structuredClone(state);
   projectRatedKU(draft,before,k,grade,now,PAI_TAP_FLOW.snapshot().responseMs);
   draft.historyReviewAttempts={...(draft.historyReviewAttempts||{}),[attemptId]:{kuId:k,grade,at:now}};
  }catch(e){
   historicalCommitInProgress=false;window.PAI_SAVE_DEFERRED=false;
   window.PAI_LAST_SAVE_ERROR=String(e);takePendingRatedBatch();PAI_TAP_FLOW.resumeFailedCommit();render();return;
  }
  window.PAI_SAVE_DEFERRED=true;
  try{await commitRatedDraft(draft,attemptId)}catch(e){window.PAI_SAVE_DEFERRED=false;window.PAI_LAST_SAVE_ERROR=String(e);console.error('历史评分保存失败',e);historicalCommitInProgress=false;takePendingRatedBatch();PAI_TAP_FLOW.resumeFailedCommit();render();if(/KU write (?:conflict|duplicate)/.test(String(e)))window.PAI_RELOAD_KU_AFTER_CONFLICT?.();return}
  historicalCommitInProgress=false;PAI_TAP_FLOW.clearPendingGrade(k);PAI_TAP_FLOW.syncPage();const ratedBatch=takePendingRatedBatch();if(ratedBatch){PAI_TAP_FLOW.takeSwipeDirection();PAI_TAP_FLOW.browseReady(k,null,PAI_TAP_FLOW.pageState()==='ANSWER');await window.PAI_CHANGE_BATCH(ratedBatch);return}if(PAI_TAP_FLOW.takeHoldAfterRating()){PAI_TAP_FLOW.browseReady(k,null,PAI_TAP_FLOW.pageState()==='ANSWER',true);render();window.PAI_AUTOBROWSE?.restart();return}const direction=PAI_TAP_FLOW.takeSwipeDirection()||1;PAI_TAP_FLOW.browseReady(k,null,PAI_TAP_FLOW.pageState()==='ANSWER');await window.browseAnswer(direction);window.PAI_AUTOBROWSE?.restart()
 };
 window.PAI_RELOAD_KU_AFTER_CONFLICT=async()=>{
  if(!window.PAI_KU_STORAGE_READY)return false;
  window.PAI_AUTOBROWSE?.stop();
  try{
   const latest=await window.PAI_KU_DURABLE.read(window.PAI_KU_DURABLE_DB);
   if(!latest?.snapshot?.records)return false;
   // Keep locally selected settings; replace only authoritative learning state.
   const preserved={};for(const key of ['newPerDay','wordsPerRound','voiceAccent','hideWord','autoPronounce','tapTiming','autoBrowseEnabled','autoBrowseInterval','selectedScene','sceneDifficulty'])if(Object.prototype.hasOwnProperty.call(state,key))preserved[key]=state[key];
   state={...state,...latest.snapshot,...preserved,view:'scenes',revealed:false};
   window.PAI_KU_DURABLE_VERSION=latest.version;
   active=false;browsedUnit=null;historyRetest=false;historyAttemptId=null;++browseToken;++token;PAI_TAP_FLOW.cancel();
   render();return true;
  }catch(e){window.PAI_LAST_SAVE_ERROR=String(e);return false}
 };
 window.rateLearning=async(grade,targetKey=null)=>{
  if(window.PAI_SAVE_DEFERRED===true||!active||loading||error||!unit()||(PAI_TAP_FLOW.snapshot().phase!=='committing'&&!state.revealed)||browsedUnit||!['again','hard','good'].includes(grade))return;
  const u=unit();if(!u||targetKey&&targetKey!==u.k)return;const k=u.k;let attempt;try{attempt=ensureAttempt()}catch(e){window.PAI_LAST_SAVE_ERROR=String(e);console.error('无法持久化评分尝试',e);PAI_TAP_FLOW.resumeFailedCommit();render();return}if(!attempt||attempt.kuId!==k||attempt.committed)return;const now=Date.now(),prev=state.records[k];
  // Compute on an isolated draft; never mutate live memory before persistence succeeds.
  let before,draft;
  try{before=state;draft=structuredClone(state)}catch(e){window.PAI_LAST_SAVE_ERROR=String(e);console.error('评分状态复制失败',e);PAI_TAP_FLOW.resumeFailedCommit();return}
  window.PAI_SAVE_DEFERRED=true;
  try{
  const {repeat}=projectRatedKU(draft,before,k,grade,now,
    PAI_TAP_FLOW.snapshot().responseMs??Math.max(0,now-startedAt));
  // Rebuild after the durable commit, not while the draft is unpublished.
  const qi=draft.learningSession.queue.indexOf(k);if(qi>=0)draft.learningSession.queue.splice(qi,1);draft.learningSession.completed=draft.learningSession.completed.filter(x=>x!==k);if(repeat)draft.learningSession.queue.splice(Math.min(4,draft.learningSession.queue.length),0,k);else draft.learningSession.completed.push(k);
  draft.learningSession.currentAttempt={...attempt,committed:true};
  await commitRatedDraft(draft,attempt.attemptId);
  // Assignment refresh is non-critical after durable commit: it must never mark a successful rating as failed.
  try{rebuildDailyAssignments()}catch(refreshError){console.warn('Post-commit assignment refresh failed',refreshError)}
  }catch(e){window.PAI_SAVE_DEFERRED=false;console.error('评分保存失败，学习状态保持不变',e);window.PAI_LAST_SAVE_ERROR=String(e);takePendingRatedBatch();PAI_TAP_FLOW.resumeFailedCommit();render();if(/KU write (?:conflict|duplicate)/.test(String(e)))window.PAI_RELOAD_KU_AFTER_CONFLICT?.();return}
  // Do not clear the committed attempt before the next question is durably prepared.
  // On refresh the committed marker prevents replaying this rating.
  PAI_TAP_FLOW.clearPendingGrade(k);previousUnit=u;PAI_TAP_FLOW.syncPage();const ratedBatch=takePendingRatedBatch();if(ratedBatch){PAI_TAP_FLOW.takeSwipeDirection();const ratedFace=PAI_TAP_FLOW.pageState()==='ANSWER';browsedUnit=u;state.revealed=ratedFace;PAI_TAP_FLOW.browseReady(k,null,ratedFace);const moved=await window.PAI_CHANGE_BATCH(ratedBatch);if(!moved)await showCurrent();return}if(PAI_TAP_FLOW.takeHoldAfterRating()){browsedUnit=u;browseIndex=cycleKeys().indexOf(k);PAI_TAP_FLOW.browseReady(k,null,PAI_TAP_FLOW.pageState()==='ANSWER',true);render();window.PAI_AUTOBROWSE?.restart();return}const direction=PAI_TAP_FLOW.takeSwipeDirection();await showCurrent();if(direction===-1)await window.browseAnswer(-1);
 };
 function top(title,progress=''){
  const batch=String(progress).match(/^第(\d+\/\d+)批 · 本批已学习 (\d+\/\d+)$/);
  const status=batch?`<span class="study-batch-line">第${batch[1]}批</span><span class="study-batch-line">本批已学 ${batch[2]}</span>`:esc(progress);
  return `<div class="study-top"><button class="back-btn" aria-label="返回首页" onclick="goScenes()">‹</button><div class="study-scene">${esc(title)}</div><div class="study-progress"${batch?` title="${esc(progress)}"`:''}>${status}</div></div>`;
 }
 function home(){
  const n=fresh().length,r=due().length,completed=globalNewCompleted(),resume=state.learningSession?.queue?.length;
  const topicCards=()=>topicCatalog().map(t=>`<button class="scene-card" onclick="setTopicInput('${esc(t.name)}');startTopicStudy()"><span class="scene-name">${esc(t.name)}</span><span class="scene-count"><b>${t.words}</b><small>单词 · ${t.ku} KU</small></span></button>`).join('');
  const cards=ids=>ids.map(id=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${esc(SCENES[id])}</span><span class="scene-count"><b>${unlearned(id).length}</b><small>未学词</small></span></button>`).join('');
  return `<div class="screen scene-screen"><div class="scene-head"><h1>PAI Word</h1><div class="scene-tools"><button class="text-btn" onclick="openLexicon()">词库</button><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><p class="home-intro">选一个场景，先回忆，再看答案。</p><section class="topic-search"><label for="topic-input">一句话选择背词场景</label><form onsubmit="event.preventDefault();startTopicStudy()"><input id="topic-input" aria-label="描述想学的场景" maxlength="160" placeholder="例如：蔬菜、动物园、我想去机场登机" oninput="setTopicInput(this.value)" value="${esc(topicInput)}"><button type="submit" class="primary-btn">开始场景背词</button></form><p class="scene-note">支持常见主题与简短描述；从当前词库中选词，不生成新词条。</p>${topicFeedback?`<p class="topic-feedback" role="status">${esc(topicFeedback)}</p>`:""}</section><section class="today-plan"><label for="scene-choice">今日新词来源</label><select id="scene-choice" onchange="selectLearningScene(this.value)">${Object.entries(SCENES).map(([id,name])=>`<option value="${id}" ${id===state.selectedScene?'selected':''}>${category(id)} · ${esc(name)}</option>`).join('')}</select><p>今日已接触 ${completed} 个新词 · 待学 ${state.daily.newWordKeys.filter(k=>!state.records[k]).length} 个</p><button class="primary-btn" onclick="openToday()">${n||r?'开始今日学习':'今日分配已完成'}${n||r?` · ${n+r} 项`:''}</button>${resume?`<button class="secondary-btn" onclick="resumeLearning()">继续上次学习 · 剩余 ${resume} 项</button>`:''}<button class="text-btn" onclick="openReview()">优先复习 ${r} 项</button></section><h2 class="group-title">主题场景 · 全部候选单词数</h2><p class="scene-note">按当前词库动态统计；每个场景内同一单词只计一次。</p><div class="scene-grid">${topicCards()}</div><details class="scene-taxonomy-audit"><summary>完整场景目录与候选覆盖（188个主题）</summary><p class="scene-note">仅按中文释义中的主题名称直接匹配，属于未经验证的保守候选统计；0不表示词库没有相关词。</p>${proposedCoverage?proposedCoverage.map(t=>`<button class="scene-card" onclick="startProposedScene(\'${t.id}\')" ${t.ku?'':'disabled'}><span class="scene-name">${esc(t.domain)} / ${esc(t.name)}</span><span class="scene-count"><b>${t.words}</b><small>单词 · ${t.ku} KU</small></span></button>`).join(''):'正在统计场景候选…'}</details><h2 class="group-title">按场景学习</h2><div class="scene-grid">${cards(Object.keys(SCENES).filter(id=>category(id)==='场景'))}</div><h2 class="group-title">基础与词频分层</h2><p class="scene-note">以下词汇尚未完成场景细分，按词频范围学习。功能词单独练习。</p><div class="scene-grid">${cards(Object.keys(SCENES).filter(id=>category(id)!=='场景'&&(core.byScene.get(id)||[]).length))}</div><p class="scene-note">内容持续校订中；收录数量不代表已完成词典核验。<br>${statusText()}</p></div>`;
 }
 function learning(){
  const s=state.learningSession,u=browsedUnit||unit();if(!s)return home();
   const sessionTotal=Math.max(0,Number.isFinite(Number(s.total))?Math.floor(Number(s.total)):0);
   const sessionCompleted=Math.min(new Set((s.completed||[]).filter(k=>window.PAI_CORE?.byKU?.has(k))).size,sessionTotal);
  if(!u)return `<div class="screen study-screen">${top(s.title,'完成')}<div class="done"><div><h2>本轮回忆已完成</h2><p>${sessionCompleted} 项已通过本轮回忆，共作答 ${s.attempts} 次。<br>本轮错词已重新出现；长期记忆仍需后续复习。</p>${(s.kind==='topic'||s.kind==='proposed')?`<p>当前场景候选共 ${state.topicStudyTotal||0} 个 KU；每轮最多 ${TOPIC_BATCH_SIZE} 个。</p><button class="primary-btn" onclick="${s.kind==='proposed'?'continueProposedScene()':'continueTopicStudy()'}">继续本场景</button>`:''}${s.kind==='scene'?`<p>此分类还有 ${unlearned(state.selectedScene).length} 个未接触词。</p><button class="primary-btn" onclick="openScene('${state.selectedScene}')">再学 10 个</button>`:''}<button class="secondary-btn" onclick="goScenes()">返回首页</button></div></div></div>`;
  // This counter describes the assigned round, not the whole Scene500 catalog.
  const sceneId=s.kind==='scene'?(s.scene500SceneId||state.selectedScene):null;
  const sceneKUs=sceneId&&typeof allUnits==='function'
    ?new Set((allUnits(sceneId)||[]).map(u=>u?.k||unitKey(u.w,u.sid)).filter(Boolean)).size:null;
  const sceneKeys=sceneId?sceneBrowseKeys():[];
  const batchSize=Math.max(1,Number(state.wordsPerRound)||10);
  const visibleIndex=sceneKeys.indexOf(u?.k);
  const batchIndex=Math.floor(Math.max(0,visibleIndex)/batchSize);
  const batchKeys=visibleIndex>=0?sceneKeys.slice(batchIndex*batchSize,(batchIndex+1)*batchSize):[];
  const batchStudied=batchKeys.filter(k=>!!state.records?.[k]).length;
  const progress=sceneKeys.length&&visibleIndex>=0
    ?`第${batchIndex+1}/${Math.ceil(sceneKeys.length/batchSize)}批 · 本批已学习 ${batchStudied}/${batchKeys.length}`
    :`本轮已完成 ${sessionCompleted}/${sessionTotal}${sceneKUs!==null?` · 场景词池 ${sceneKUs} KU`:''}`;
  if(loading||error)return `<div class="screen study-screen learning-screen">${top(s.title,progress)}<div class="done" role="status"><div><p>${error?esc(error):'正在准备本轮词卡…'}</p>${error?'<button class="primary-btn" onclick="retryLearningLoad()">重试下载</button>':'<div class="skeleton-line"></div>'}</div></div><div class="recall-correction" role="group" aria-label="词卡加载中，按钮暂不可用"><button disabled>不知道</button><button disabled>模糊</button><button disabled>知道</button></div></div>`;
  const hidden=state.hideWord&&!state.revealed?' listen-only':'';
  const selectedGrade=PAI_TAP_FLOW.selectedGradeFor(u.k);
  const gradeAttrs=g=>` ${PAI_TAP_FLOW.snapshot().phase==='committing'?'disabled aria-disabled="true"':''} data-grade="${g}" aria-pressed="${selectedGrade===g?'true':'false'}" class="${selectedGrade===g?'is-selected':''}"`;
  const repeat=s.seen[u.k]>0;
  const autoSwitch=`<label class="auto-word-toggle" title="自动切词：点击开启或关闭"><input type="checkbox" ${state.autoBrowseEnabled?'checked':''} onchange="setAutoBrowse(this.checked)" aria-label="自动切词" aria-description="勾选后按照设置速度自动切换词卡"><span class="auto-word-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.9-4L3 9"/><path d="M3 4v5h5"/><path d="M4 13a8 8 0 0 0 14.9 4L21 15"/><path d="M16 15h5v5"/></svg></span></label>`;
  const label=u.s.kuType==='sense'?'回忆词义':(state.hideWord&&!state.revealed?'听音回忆知识点':u.s.kuTitle);
  return `<div class="screen study-screen learning-screen ${state.revealed?'revealed':''} ${browsedUnit?'previous-answer':''}">${top(s.title,progress)}<div class="word-hero${hidden}"><div class="word-line"><div class="word">${esc(u.w.w)}</div></div><div class="ipa-line"><span class="ipa">${esc(u.w.ipaUS)}</span><button class="speak-btn" data-word-audio data-speak="${esc(u.w.w)}" aria-label="播放单词">🔊</button></div>${/^(the|a|an|and|to|of)$/.test(u.w.w)?'<small class="muted">功能词读音会随重读与连读语境变化。</small>':''}<div class="recall-controls-row"><p class="recall-cue">${repeat?'本轮再回忆 · ':''}${esc(label)}</p>${autoSwitch}</div></div><div class="study-body">${state.revealed?answerHtml(u):''}</div>${browsedUnit?`<div class="recall-correction read-only" role="group" aria-label="历史词卡只读"><button onclick="chooseHistoricalRating('again')" ${gradeAttrs('again')}>不知道</button><button onclick="chooseHistoricalRating('hard')" ${gradeAttrs('hard')}>模糊</button><button onclick="chooseHistoricalRating('good')" ${gradeAttrs('good')}>知道</button></div>`:`<div class="recall-correction" role="group" aria-label="回忆结果"><button type="button" onclick="PAI_TAP_FLOW.choose('again')" ${gradeAttrs('again')}>不知道</button><button type="button" onclick="PAI_TAP_FLOW.choose('hard')" ${gradeAttrs('hard')}>模糊</button><button type="button" onclick="PAI_TAP_FLOW.choose('good')" ${gradeAttrs('good')}>知道</button></div>`}<p class="recall-note" aria-live="polite">${esc(PAI_TAP_FLOW.hint())}</p><div class="session-footnote"></div></div>`;
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
 window.render=function(){const app=document.getElementById('app');if(state.view==='scenes'){if(typeof window.PAI_HOME_DASHBOARD_RENDER==='function')app.innerHTML=window.PAI_HOME_DASHBOARD_RENDER();/* Preserve initial home shell until canonical renderer is installed; never show legacy home. */}else if(state.view==='learning')app.innerHTML=learning();else if(state.view==='lexicon')app.innerHTML=lexicon();else if(state.view==='lexiconWord')app.innerHTML=detail();else{previousRender();if(state.view==='settings'){for(const row of document.querySelectorAll('.setting-row')){if(row.textContent.includes('显示 3 个例句'))row.querySelector('span').textContent='显示可用例句'}const panel=document.querySelector('.panel-screen');panel.insertAdjacentHTML('beforeend',`<div class="panel-block"><h3>自动发音</h3><label class="setting-row"><span>进入题目页自动读单词</span><input type="checkbox" ${state.autoPronounce.question?'checked':''} onchange="setAutoPronounce('question',this.checked)"></label><label class="setting-row"><span>进入答案页自动读单词</span><input type="checkbox" ${state.autoPronounce.swipe?'checked':''} onchange="setAutoPronounce('swipe',this.checked)"></label><p class="muted">默认开启；手动点击喇叭和重读不受此开关影响。</p></div>`);panel.insertAdjacentHTML('beforeend',PAI_TAP_FLOW.settings());panel.insertAdjacentHTML('beforeend',`<div class="panel-block"><button class="secondary-btn" onclick="restoreDefaultSettings()">恢复默认设置</button></div><div class="panel-block"><p>${statusText()}</p><button class="secondary-btn" onclick="downloadOfflineLexicon()" ${window.PAI_LOCAL_LEXICON.downloading?'disabled':''}>${window.PAI_LOCAL_LEXICON.downloading?'正在缓存…':'下载全部词包供离线使用'}</button>${window.PAI_LOCAL_LEXICON.error?`<p>${esc(window.PAI_LOCAL_LEXICON.error)}</p>`:''}</div>`)} }
 };
 window.addEventListener('pai-offline-status',()=>{if(state.view==='settings')render()});
 window.PAI_LEARNING_QA={due,fresh,unlearned,current:unit};
})();
