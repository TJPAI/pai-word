// UX fixes: stable word position, reliable audio, compact answer layout, and answer toggle.
(function(){
  function escapeHtml(value){
    return String(value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
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
      examples=[u.s.bad,u.s.good].filter(Boolean).slice(0,3);
    }

    // Older comparison layers contain two dedicated contrast sentences.
    // Fill to three with a real example from the current sense so every
    // distinction has enough contextual evidence without inventing text.
    if(examples.length<3&&Array.isArray(u.s.e)){
      for(const e of u.s.e){
        if(e&&!examples.includes(e))examples.push(e);
        if(examples.length===3)break;
      }
    }
    return {words,note,examples:examples.slice(0,3)};
  }

  answerHtml=function(u){
    const compare=contrastData(u);
    const words=compare.words.length?`<div class="contrast-words">${compare.words.map(escapeHtml).join(' · ')}</div>`:'';
    const pos=u.w.pos?`<span class="pos-chip">${escapeHtml(u.w.pos)}</span>`:'';
    const reminder=u.s.x?`<div class="key-reminder"><span>提醒</span>${escapeHtml(u.s.x)}</div>`:'';
    return `<div class="answer">
      <div class="answer-section"><div class="answer-label">释义 / 词源</div><div class="definition-line">${pos}<div class="definition">${escapeHtml(u.s.m)}</div></div><div class="root merged-root">${escapeHtml(u.w.root)}</div>${reminder}</div>
      <div class="answer-section"><div class="answer-label">高频搭配</div><div class="collocations">${escapeHtml(u.s.c)}</div></div>
      <div class="answer-section examples-section">${u.s.e.map((e,i)=>`<div class="example"><span class="example-num">${i+1}.</span><span>${escapeHtml(e)}</span><button type="button" class="example-play" data-example-audio data-speak="${escapeHtml(e)}" aria-label="播放例句 ${i+1}">🔊</button></div>`).join('')}</div>
      <div class="answer-section"><div class="answer-label">近义区分</div>${words}<div class="error-note">${escapeHtml(compare.note)}</div>${compare.examples.length?`<div class="contrast-examples">${compare.examples.map((e,i)=>`<div class="contrast-example"><span>${i+1}.</span><span>${escapeHtml(e)}</span></div>`).join('')}</div>`:''}</div>
    </div>`;
  };

  // Blank-area tap toggles between prompt-only and revealed answer.
  // When returning to the prompt, replay the current headword immediately.
  reveal=function(){
    if(state.view!=='study'&&state.view!=='review')return;
    const wasRevealed=!!state.revealed;
    const wordText=document.querySelector('.word')?.textContent?.trim()||'';
    state.revealed=!state.revealed;
    save();
    render();
    if(wasRevealed&&wordText){
      setTimeout(()=>speak(wordText),60);
    }
  };

  document.addEventListener('click',function(event){
    const btn=event.target.closest('[data-example-audio]');
    if(!btn)return;
    event.preventDefault();
    event.stopPropagation();
    const text=btn.getAttribute('data-speak');
    if(text)speak(text,.9);
  },true);
})();
