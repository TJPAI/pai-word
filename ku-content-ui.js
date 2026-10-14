// V26.7I KU teaching-card UI + KU-specific recall cue.
(function(){
  const base=window.answerHtml;if(typeof base!=='function')return;
  const style=document.createElement('style');style.textContent='.ku-head{display:flex;align-items:center;gap:8px;margin-bottom:12px}.ku-title{font-weight:700}.ku-rule{font-size:1.05rem;line-height:1.65}.ku-pattern{margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.035);line-height:1.55}.ku-pattern .answer-label{margin-bottom:5px}.ku-context{margin-top:8px}.ku-context summary{cursor:pointer}.ku-front-prompt{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;margin-top:10px;font-size:.92rem}.ku-front-prompt .ku-cue-title{font-weight:650}';document.head.appendChild(style);
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const labels={sense:'释义',grammar:'语法',collocation:'搭配',contrast:'辨析',pronunciation:'发音',usage:'用法',risk:'易错',morphology:'词形',polysemy:'多义',discourse:'语篇',pragmatics:'语用',degree:'程度',number:'数词',adverb:'副词',word_order:'语序'};
  function isWordIntroduction(u){const k=u?.k||u?.s?.ku_id;return !!(k&&state.daily?.newWordKeys?.includes(k))}
  window.answerHtml=function(u){
    const kc=u?.kuContent,type=String(u?.s?.kuType||'sense').toLowerCase();
    if(!kc?.content_zh||type==='sense'||isWordIntroduction(u))return base(u);
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
    const intro=isWordIntroduction(u),type=intro?'sense':String(u.s?.kuType||'sense').toLowerCase(),label=labels[type]||'知识点';
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
