// Render non-Sense KUs as focused teaching cards when V26.7I KU content is available.
(function(){
  const base=window.answerHtml;if(typeof base!=='function')return;
  const style=document.createElement('style');style.textContent='.ku-head{display:flex;align-items:center;gap:8px;margin-bottom:12px}.ku-title{font-weight:700}.ku-rule{font-size:1.05rem;line-height:1.65}.ku-pattern{margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.035);line-height:1.55}.ku-pattern .answer-label{margin-bottom:5px}.ku-context{margin-top:8px}.ku-context summary{cursor:pointer}';document.head.appendChild(style);
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const labels={grammar:'语法',collocation:'搭配',contrast:'辨析',pronunciation:'发音',usage:'用法',risk:'易错',morphology:'词形',polysemy:'多义',discourse:'语篇',pragmatics:'语用',degree:'程度',number:'数词',adverb:'副词',word_order:'语序'};
  window.answerHtml=function(u){
    const kc=u?.kuContent,type=String(u?.s?.kuType||'sense').toLowerCase();
    if(!kc?.content_zh||type==='sense')return base(u);
    const label=labels[type]||u.s.kuTitle||'知识点',title=u.s.kuTitle&&u.s.kuTitle!==label?u.s.kuTitle:'';
    const pattern=kc.pattern_or_example?`<div class="ku-pattern"><div class="answer-label">模式 / 例子</div><div>${esc(kc.pattern_or_example)}</div></div>`:'';
    const context=u.s?.m?`<details class="answer-section ku-context"><summary>相关义项</summary><div class="definition">${esc(u.s.m)}</div></details>`:'';
    return `<div class="answer ku-answer" onclick="event.stopPropagation()"><div class="answer-section ku-primary"><div class="ku-head"><span class="pos-chip">${esc(label)}</span>${title?`<span class="ku-title">${esc(title)}</span>`:''}</div><div class="definition ku-rule">${esc(kc.content_zh)}</div>${pattern}</div>${context}</div>`;
  };
})();
