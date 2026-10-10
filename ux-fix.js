// UX fixes: keep word position stable when revealing answers and make example audio reliable.
(function(){
  function escapeHtml(value){
    return String(value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  answerHtml=function(u){
    return `<div class="answer" onclick="event.stopPropagation()">
      <div class="answer-section"><div class="answer-label">释义</div><div class="definition">${escapeHtml(u.s.m)}</div></div>
      <div class="answer-section"><div class="answer-label">高频搭配</div><div class="collocations">${escapeHtml(u.s.c)}</div></div>
      <div class="answer-section"><div class="answer-label">例句</div>${u.s.e.map((e,i)=>`<div class="example"><span class="example-num">${i+1}.</span><span>${escapeHtml(e)}</span><button type="button" class="example-play" data-example-audio data-speak="${escapeHtml(e)}" aria-label="播放例句 ${i+1}">🔊</button></div>`).join('')}</div>
      <div class="answer-section"><div class="answer-label">词根 / 词源</div><div class="root">${escapeHtml(u.w.root)}</div></div>
      <div class="answer-section"><div class="answer-label">易错提醒</div><div class="error-note">${escapeHtml(u.s.x)}</div><div class="error-pair"><div class="wrong">✕ ${escapeHtml(u.s.bad)}</div><div class="right">✓ ${escapeHtml(u.s.good)}</div></div></div>
    </div>`;
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
