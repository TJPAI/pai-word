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
    if(u.s.compare&&Array.isArray(u.s.compare.examples)){
      return {
        words:Array.isArray(u.s.compare.words)?u.s.compare.words:[],
        note:u.s.compare.note||'',
        examples:u.s.compare.examples.slice(0,3)
      };
    }
    if(Array.isArray(u.s.compareExamples)&&u.s.compareExamples.length){
      return {words:[],note:u.s.x||'',examples:u.s.compareExamples.slice(0,2)};
    }
    return {words:[],note:u.s.x||'',examples:[u.s.bad,u.s.good].filter(Boolean).slice(0,2)};
  }

  answerHtml=function(u){
    const compare=contrastData(u);
    const words=compare.words.length?`<div class="contrast-words">${compare.words.map(escapeHtml).join(' · ')}</div>`:'';
    return `<div class="answer">
      <div class="answer-section"><div class="answer-label">释义 / 词源</div><div class="definition">${escapeHtml(u.s.m)}</div><div class="root merged-root">${escapeHtml(u.w.root)}</div></div>
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
