// PAI Word: sentence audio enhancement
(function(){
  function cleanSentence(text){
    return text.replace(/^\s*\d+\.\s*/, '').replace(/\s+/g,' ').trim();
  }
  function speakSentence(text, rate=.82){
    if(!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='en-US';
    u.rate=rate;
    speechSynthesis.speak(u);
  }
  function playAll(sentences, index=0){
    if(!('speechSynthesis' in window)||index>=sentences.length) return;
    if(index===0) speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(sentences[index]);
    u.lang='en-US';
    u.rate=.82;
    u.onend=()=>setTimeout(()=>playAll(sentences,index+1),260);
    speechSynthesis.speak(u);
  }
  function decorateExamples(){
    const groups=[...document.querySelectorAll('.examples')];
    groups.forEach(group=>{
      const examples=[...group.querySelectorAll('.example')];
      if(!examples.length) return;
      examples.forEach(el=>{
        if(el.dataset.audioReady) return;
        el.dataset.audioReady='1';
        const sentence=cleanSentence(el.textContent);
        el.dataset.sentence=sentence;
        const btn=document.createElement('button');
        btn.className='example-audio';
        btn.type='button';
        btn.setAttribute('aria-label','播放例句');
        btn.title='播放例句';
        btn.textContent='🔊';
        btn.addEventListener('click',e=>{
          e.stopPropagation();
          speakSentence(sentence);
        });
        el.appendChild(btn);
      });
      if(!group.previousElementSibling?.classList?.contains('example-tools')){
        const bar=document.createElement('div');
        bar.className='example-tools';
        const label=document.createElement('span');
        label.textContent='例句听力';
        const play=document.createElement('button');
        play.type='button';
        play.textContent='▶ 连播 3 句';
        play.addEventListener('click',()=>{
          const sentences=[...group.querySelectorAll('.example')].map(el=>el.dataset.sentence||cleanSentence(el.textContent));
          playAll(sentences);
        });
        const stop=document.createElement('button');
        stop.type='button';
        stop.textContent='■ 停止';
        stop.addEventListener('click',()=>{ if('speechSynthesis' in window) speechSynthesis.cancel(); });
        bar.append(label,play,stop);
        group.before(bar);
      }
    });
  }
  const originalRender=window.render;
  if(typeof originalRender==='function'){
    window.render=function(){
      const result=originalRender.apply(this,arguments);
      queueMicrotask(decorateExamples);
      return result;
    };
  }
  window.addEventListener('DOMContentLoaded',decorateExamples);
  setTimeout(decorateExamples,0);
})();
