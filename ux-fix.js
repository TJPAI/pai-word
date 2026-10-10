// UX layer: compact answer layout, answer toggles, audio behavior, and settings.
(function(){
  function escapeHtml(value){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')}
  state.showCollocations=state.showCollocations!==false;
  state.showExamples=state.showExamples!==false;
  state.showCompare=state.showCompare!==false;
  state.voiceAccent=state.voiceAccent==='gb'?'gb':'us';
  window.toggleAnswerOption=function(key){if(!['showCollocations','showExamples','showCompare'].includes(key))return;state[key]=!state[key];save();render()};
  window.setVoiceAccent=function(value){state.voiceAccent=value==='gb'?'gb':'us';save();render();setTimeout(()=>{const word=document.querySelector('.word')?.textContent?.trim();if(word)speak(word)},40)};

  let speechVoices=[];
  function refreshVoices(){if('speechSynthesis' in window)speechVoices=speechSynthesis.getVoices()||[]}
  refreshVoices();
  if('speechSynthesis' in window&&speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',refreshVoices);
  speak=function(text,rate=.84){
    if(!('speechSynthesis' in window)||!text)return;
    const synth=speechSynthesis,lang=state.voiceAccent==='gb'?'en-GB':'en-US';
    refreshVoices();
    const exact=speechVoices.find(v=>String(v.lang).toLowerCase()===lang.toLowerCase());
    const regional=speechVoices.find(v=>String(v.lang).toLowerCase().startsWith(state.voiceAccent==='gb'?'en-gb':'en-us'));
    const fallback=speechVoices.find(v=>String(v.lang).toLowerCase().startsWith('en'));
    synth.cancel();
    const u=new SpeechSynthesisUtterance(String(text));u.lang=lang;u.rate=rate;u.voice=exact||regional||fallback||null;
    window.__paiUtterance=u;
    if(synth.paused)synth.resume();
    setTimeout(()=>synth.speak(u),20);
  };

  function normalizeText(value){return String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' -]/g,' ')}
  const irregularForms={'win':['won'],'build':['built'],'lead':['led'],'run':['ran'],'fall':['fell','fallen'],'grow':['grew','grown'],'send':['sent'],'spend':['spent'],'find':['found'],'take':['took','taken'],'make':['made'],'come':['came'],'become':['became'],'write':['wrote','written'],'choose':['chose','chosen'],'rise':['rose','risen'],'hold':['held'],'sell':['sold'],'buy':['bought'],'teach':['taught'],'catch':['caught'],'think':['thought'],'bring':['brought'],'leave':['left'],'meet':['met'],'pay':['paid'],'say':['said'],'tell':['told'],'keep':['kept'],'feel':['felt'],'mean':['meant'],'lose':['lost'],'stand':['stood'],'understand':['understood'],'begin':['began','begun'],'break':['broke','broken'],'drive':['drove','driven']};
  function tokenForms(token){const t=token.toLowerCase(),forms=new Set([t]);if(irregularForms[t])irregularForms[t].forEach(x=>forms.add(x));if(t.length>=3){forms.add(t+'s');forms.add(t+'ed');forms.add(t+'ing');if(t.endsWith('e')){forms.add(t.slice(0,-1)+'ed');forms.add(t.slice(0,-1)+'ing')}if(t.endsWith('y')){forms.add(t.slice(0,-1)+'ies');forms.add(t.slice(0,-1)+'ied')}}return [...forms]}
  function wordMatchesSentence(word,sentence){const w=normalizeText(word).trim(),s=' '+normalizeText(sentence)+' ';if(!w||!s.trim())return false;const parts=w.split(/\s+/).filter(Boolean);return parts.every(p=>tokenForms(p).some(f=>s.includes(' '+f+' ')))}

  function comparisonBriefs(words,note){
    const parts=String(note||'').split(/[；;]/).map(x=>x.trim()).filter(Boolean);
    return words.map((word,i)=>{
      const lw=word.toLowerCase();
      let part=parts.find(p=>p.toLowerCase().startsWith(lw+' ')||p.toLowerCase().startsWith(lw+'是')||p.toLowerCase().startsWith(lw+'：'));
      if(!part)part=parts[i]||'';
      if(part.toLowerCase().startsWith(lw))part=part.slice(word.length).trim();
      part=part.replace(/^[:：]\s*/,'').replace(/^是\s*/,'');
      return part;
    });
  }

  function contrastData(u){
    let words=[],note='',raw=[];
    if(u.s.compare&&Array.isArray(u.s.compare.examples)){
      words=Array.isArray(u.s.compare.words)?u.s.compare.words:[];
      note=u.s.compare.note||'';
      raw=u.s.compare.examples.slice(0,3);
    }else if(Array.isArray(u.s.compareExamples)&&u.s.compareExamples.length){
      note=u.s.x||'';raw=u.s.compareExamples.slice(0,3);
    }else{
      note=u.s.x||'';raw=[u.s.bad,u.s.good].filter(Boolean).slice(0,2);
    }
    const mapped=[];
    raw.forEach(text=>{
      const hits=words.filter(word=>wordMatchesSentence(word,text));
      if(hits.length===1&&!mapped.some(x=>x.word===hits[0]))mapped.push({word:hits[0],text});
    });
    const briefs=comparisonBriefs(words,note);
    const items=words.map((word,i)=>{
      const example=mapped.find(x=>x.word===word);
      return example?{word,brief:briefs[i]||'',text:example.text}:null;
    }).filter(Boolean);
    return {items};
  }

  answerHtml=function(u){
    const compare=contrastData(u),enabledCount=[state.showCollocations,state.showExamples,state.showCompare].filter(Boolean).length;
    const pos=u.w.pos?`<span class="pos-chip">${escapeHtml(u.w.pos)}</span>`:'';
    const reminder=u.s.x?`<div class="key-reminder"><span>提醒</span>${escapeHtml(u.s.x)}</div>`:'';
    const collocations=state.showCollocations?`<div class="answer-section"><div class="answer-label">高频搭配</div><div class="collocations">${escapeHtml(u.s.c)}</div></div>`:'';
    const examples=state.showExamples?`<div class="answer-section examples-section">${u.s.e.map((e,i)=>`<div class="example"><span class="example-num">${i+1}.</span><span>${escapeHtml(e)}</span><button type="button" class="example-play" data-example-audio data-speak="${escapeHtml(e)}" aria-label="播放例句 ${i+1}">🔊</button></div>`).join('')}</div>`:'';
    const comparison=state.showCompare?`<div class="answer-section"><div class="answer-label">近义区分</div>${compare.items.length?`<div class="contrast-examples">${compare.items.map(item=>`<div class="contrast-item"><div class="contrast-summary"><span class="contrast-word">${escapeHtml(item.word)}</span><span>：${escapeHtml(item.brief)}</span></div><div class="contrast-sentence">${escapeHtml(item.text)}</div></div>`).join('')}</div>`:''}</div>`:'';
    return `<div class="answer density-${enabledCount}"><div class="answer-section"><div class="answer-label">释义 / 词源</div><div class="definition-line">${pos}<div class="definition">${escapeHtml(u.s.m)}</div></div><div class="root merged-root">${escapeHtml(u.w.root)}</div>${reminder}</div>${collocations}${examples}${comparison}</div>`;
  };

  reveal=function(){
    if(Date.now()<(window.__paiSwipeUntil||0))return;
    if(state.view!=='study'&&state.view!=='review')return;
    const wasRevealed=!!state.revealed,wordText=document.querySelector('.word')?.textContent?.trim()||'';
    state.revealed=!state.revealed;save();render();
    if(wasRevealed&&wordText)setTimeout(()=>speak(wordText),60);
  };
  document.addEventListener('click',function(event){const btn=event.target.closest('[data-example-audio]');if(!btn)return;event.preventDefault();event.stopPropagation();const text=btn.getAttribute('data-speak');if(text)speak(text,.9)},true);

  function enhanceSettings(){if(state.view!=='settings')return;const app=document.getElementById('app'),firstBlock=app?.querySelector('.panel-block');if(!firstBlock||firstBlock.querySelector('[data-answer-options]'))return;const wrap=document.createElement('div');wrap.setAttribute('data-answer-options','');wrap.innerHTML=`<div class="setting-row"><span>发音口音</span><select onchange="setVoiceAccent(this.value)"><option value="us" ${state.voiceAccent==='us'?'selected':''}>美音</option><option value="gb" ${state.voiceAccent==='gb'?'selected':''}>英音</option></select></div><div class="setting-row"><span>显示高频搭配</span><button class="switch ${state.showCollocations?'on':''}" onclick="toggleAnswerOption('showCollocations')"><i></i></button></div><div class="setting-row"><span>显示 3 个例句</span><button class="switch ${state.showExamples?'on':''}" onclick="toggleAnswerOption('showExamples')"><i></i></button></div><div class="setting-row"><span>显示近义区分</span><button class="switch ${state.showCompare?'on':''}" onclick="toggleAnswerOption('showCompare')"><i></i></button></div>`;firstBlock.appendChild(wrap)}

  function fitAnswer(){const answer=document.querySelector('.answer'),rating=document.querySelector('.rating');if(!answer||!rating)return;answer.classList.remove('fit-medium','fit-roomy');const gap=rating.getBoundingClientRect().top-answer.getBoundingClientRect().bottom;if(gap>170)answer.classList.add('fit-roomy');else if(gap>85)answer.classList.add('fit-medium')}

  const baseRender=render;
  render=function(){baseRender();enhanceSettings();requestAnimationFrame(fitAnswer)};
  enhanceSettings();requestAnimationFrame(fitAnswer);
})();