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