// UX layer: compact answer layout, answer toggles, audio behavior, and settings.
(function(){
  function escapeHtml(value){
    return String(value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  state.showCollocations=state.showCollocations!==false;
  state.showExamples=state.showExamples!==false;
  state.showCompare=state.showCompare!==false;

  window.toggleAnswerOption=function(key){
    if(!['showCollocations','showExamples','showCompare'].includes(key))return;
    state[key]=!state[key];
    save();
    render();
  };

  function normalizeText(value){
    return String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' -]/g,' ');
  }

  const irregularForms={
    'win':['won'],'build':['built'],'lead':['led'],'run':['ran'],'fall':['fell','fallen'],
    'grow':['grew','grown'],'send':['sent'],'spend':['spent'],'find':['found'],'take':['took','taken'],
    'make':['made'],'come':['came'],'become':['became'],'write':['wrote','written'],'choose':['chose','chosen'],
    'rise':['rose','risen'],'hold':['held'],'sell':['sold'],'buy':['bought'],'teach':['taught'],'catch':['caught'],
    'think':['thought'],'bring':['brought'],'leave':['left'],'meet':['met'],'pay':['paid'],'say':['said'],
    'tell':['told'],'keep':['kept'],'feel':['felt'],'mean':['meant'],'lose':['lost'],'stand':['stood'],
    'understand':['understood'],'begin':['began','begun'],'break':['broke','broken'],'drive':['drove','driven']
  };

  function tokenForms(token){
    const t=token.toLowerCase();
    const forms=new Set([t]);
    if(irregularForms[t])irregularForms[t].forEach(x=>forms.add(x));
    if(t.length>=3){
      forms.add(t+'s');
      forms.add(t+'ed');
      forms.add(t+'ing');
      if(t.endsWith('e')){
        forms.add(t.slice(0,-1)+'ed');
        forms.add(t.slice(0,-1)+'ing');
      }
      if(t.endsWith('y')){
        forms.add(t.slice(0,-1)+'ies');
        forms.add(t.slice(0,-1)+'ied');
      }
    }
    return [...forms];
  }

  function wordMatchesSentence(word,sentence){
    const w=normalizeText(word).trim();
    const s=' '+normalizeText(sentence)+' ';
    if(!w||!s.trim())return false;
    const parts=w.split(/\s+/).filter(Boolean);
    if(parts.length===1){
      return tokenForms(parts[0]).some(f=>s.includes(' '+f+' '));
    }
    // For multi-word comparison items, require every lexical part to appear in
    // the sentence in either base or common inflected form. This is deliberately
    // conservative: an uncertain label is better than a wrong one.
    return parts.every(p=>tokenForms(p).some(f=>s.includes(' '+f+' ')));
  }

  function contrastData(u){
    let words=[],note='',examples=[];
    if(u.s.compare&&Array.isArray(u.s.compare.examples)){
      words=Array.isArray(u.s.compare.words)?u.s.compare.words:[];
      note=u.s.compare.note||'';
      examples=u.s.compare.examples.slice(0,3);
    }else if(Array.isArray(u.s.compareExamples)&&u.s.compareExamples.length){
      note=u.s.x||'';
      examples=u.s.compareExamples.slice(0,3);
    }else{
      note=u.s.x||'';
      examples=[u.s.bad,u.s.good].filter(Boolean).slice(0,2);
    }
    const labeled=examples.map((example,i)=>{
      const matches=words.filter(word=>wordMatchesSentence(word,example));
      return {text:example,word:matches.length===1?matches[0]:''};
    });
    return {words,note,examples:labeled};
  }

  answerHtml=function(u){
    const compare=contrastData(u);
    const enabledCount=[state.showCollocations,state.showExamples,state.showCompare].filter(Boolean).length;
    const words=compare.words.length?`<div class="contrast-words">${compare.words.map(escapeHtml).join(' · ')}</div>`:'';
    const pos=u.w.pos?`<span class="pos-chip">${escapeHtml(u.w.pos)}</span>`:'';
    const reminder=u.s.x?`<div class="key-reminder"><span>提醒</span>${escapeHtml(u.s.x)}</div>`:'';
    const collocations=state.showCollocations?`<div class="answer-section"><div class="answer-label">高频搭配</div><div class="collocations">${escapeHtml(u.s.c)}</div></div>`:'';
    const examples=state.showExamples?`<div class="answer-section examples-section">${u.s.e.map((e,i)=>`<div class="example"><span class="example-num">${i+1}.</span><span>${escapeHtml(e)}</span><button type="button" class="example-play" data-example-audio data-speak="${escapeHtml(e)}" aria-label="播放例句 ${i+1}">🔊</button></div>`).join('')}</div>`:'';
    const comparison=state.showCompare?`<div class="answer-section"><div class="answer-label">近义区分</div>${words}<div class="error-note">${escapeHtml(compare.note)}</div>${compare.examples.length?`<div class="contrast-examples">${compare.examples.map((item,i)=>`<div class="contrast-example"><span class="contrast-word ${item.word?'':'unresolved'}">${escapeHtml(item.word||'例句')}</span><span>${escapeHtml(item.text)}</span></div>`).join('')}</div>`:''}</div>`:'';
    return `<div class="answer density-${enabledCount}">
      <div class="answer-section"><div class="answer-label">释义 / 词源</div><div class="definition-line">${pos}<div class="definition">${escapeHtml(u.s.m)}</div></div><div class="root merged-root">${escapeHtml(u.w.root)}</div>${reminder}</div>
      ${collocations}${examples}${comparison}
    </div>`;
  };

  reveal=function(){
    if(state.view!=='study'&&state.view!=='review')return;
    const wasRevealed=!!state.revealed;
    const wordText=document.querySelector('.word')?.textContent?.trim()||'';
    state.revealed=!state.revealed;
    save();
    render();
    if(wasRevealed&&wordText)setTimeout(()=>speak(wordText),60);
  };

  document.addEventListener('click',function(event){
    const btn=event.target.closest('[data-example-audio]');
    if(!btn)return;
    event.preventDefault();
    event.stopPropagation();
    const text=btn.getAttribute('data-speak');
    if(text)speak(text,.9);
  },true);

  function enhanceSettings(){
    if(state.view!=='settings')return;
    const app=document.getElementById('app');
    const firstBlock=app?.querySelector('.panel-block');
    if(!firstBlock||firstBlock.querySelector('[data-answer-options]'))return;
    const wrap=document.createElement('div');
    wrap.setAttribute('data-answer-options','');
    wrap.innerHTML=`
      <div class="setting-row"><span>显示高频搭配</span><button class="switch ${state.showCollocations?'on':''}" onclick="toggleAnswerOption('showCollocations')"><i></i></button></div>
      <div class="setting-row"><span>显示 3 个例句</span><button class="switch ${state.showExamples?'on':''}" onclick="toggleAnswerOption('showExamples')"><i></i></button></div>
      <div class="setting-row"><span>显示近义区分</span><button class="switch ${state.showCompare?'on':''}" onclick="toggleAnswerOption('showCompare')"><i></i></button></div>`;
    firstBlock.appendChild(wrap);
  }

  const baseRender=render;
  render=function(){
    baseRender();
    enhanceSettings();
  };

  enhanceSettings();
})();
