// Single owner of QUESTION/ANSWER interaction, timing and navigation.
(function(){
 const defaults={goodWithin:2,hardWithin:5,goodShow:2,hardShow:4,againShow:6,repeatCount:3,repeatGap:1};
 const labels={goodWithin:'想起了：点击阈值（秒）',hardWithin:'模糊：点击阈值（秒）',goodShow:'想起了：答案展示（秒）',hardShow:'模糊：答案展示（秒）',againShow:'没想起：答案展示（秒）',repeatCount:'重读次数',repeatGap:'每遍读完后的间隔（秒）'};
 const config=()=>{const c={...defaults,...state.tapTiming};for(const k in defaults){const n=Number(c[k]);c[k]=Number.isFinite(n)?Math.max(k==='repeatGap'?0:.1,Math.min(k==='repeatCount'?20:60,n)):defaults[k]}c.repeatCount=Math.max(1,Math.round(c.repeatCount));c.hardWithin=Math.max(c.goodWithin,c.hardWithin);return c};
 let phase='idle',generation=0,timer=null,visibleKey=null,began=0,responseMs=null,grade=null,entryMode=null,repeated=0,onAdvance=null;
 function clear(preserveAudio=false){generation++;if(timer!==null)clearTimeout(timer);timer=null;if(!preserveAudio)window.PAI_AUDIO?.stop();phase='idle';visibleKey=null;onAdvance=null}
 function later(fn,ms){timer=setTimeout(()=>{timer=null;fn()},ms)}
 function valid(g){return g===generation&&state.view==='learning'&&!document.hidden&&window.getVisibleLearningUnit?.()?.k===visibleKey}
 function ready(k,preserveAudio=false){clear(preserveAudio);visibleKey=k;began=Date.now();responseMs=null;grade=null;entryMode=null;repeated=0;phase='question'}
 function classify(ms){const c=config();return ms<=c.goodWithin*1000?'good':ms<=c.hardWithin*1000?'hard':'again'}
 function answer({key,mode,score,advance}){clear();visibleKey=key;entryMode=mode;grade=score;onAdvance=advance;phase='answer';const g=generation;later(()=>finish(g),config()[(score||'again')+'Show']*1000)}
 function correct(score){if(!['again','hard','good'].includes(score)||!['answer','answer-paused','example'].includes(phase))return;window.PAI_AUDIO?.stop();if(timer!==null)clearTimeout(timer);timer=null;generation++;grade=score;phase='answer';const g=generation;later(()=>finish(g),config()[score+'Show']*1000);window.render?.()}
 function browseReady(k,advance){answer({key:k,mode:'swipe',score:'again',advance})}
 function finish(g){if(!valid(g)||phase==='idle')return;phase='committing';const fn=onAdvance;onAdvance=null;fn?.(grade)}
 function repeat(g){if(!valid(g)||phase!=='repeating')return;const u=window.getVisibleLearningUnit?.();if(!u)return;
  repeated++;window.render?.();const c=config();
  const done=()=>{if(!valid(g)||phase!=='repeating')return;if(repeated>=c.repeatCount)later(()=>finish(g),c.repeatGap*1000);else later(()=>repeat(g),c.repeatGap*1000)};
  if(window.PAI_AUDIO?.play)window.PAI_AUDIO.play(u.w.w,.84,done);else later(done,1000);
 }
 function tap(){if(state.view!=='learning'||document.hidden||!window.getVisibleLearningUnit?.())return;
  if(phase==='question'){responseMs=Math.max(0,Date.now()-began);const score=classify(responseMs),k=visibleKey;state.revealed=true;answer({key:k,mode:'tap',score,advance:g=>window.rateLearning?.(g)});window.render?.()}
  else if(phase==='answer'||phase==='answer-paused'||phase==='example'){window.PAI_AUDIO?.stop();if(timer!==null)clearTimeout(timer);timer=null;generation++;phase='repeating';grade='again';repeated=0;repeat(generation)}
 }
 function beginExample(){if(!['answer','repeating','example','answer-paused'].includes(phase))return false;generation++;if(timer!==null)clearTimeout(timer);timer=null;phase='example';window.render?.();return true}
 function interruptRepeatForExample(){return beginExample()}
 function exampleFinished(){if(phase!=='example')return;phase='answer-paused';window.render?.()}
 function cancel(){clear()}
 window.setTapTiming=(k,value,refresh=true)=>{if(!(k in defaults)||value==='')return;state.tapTiming={...config(),[k]:Number(value)};state.tapTiming=config();save();if(refresh)window.render?.()};
 window.resetTapTiming=()=>{state.tapTiming={...defaults};save();window.render?.()};
 function settings(){const c=config();return '<div class="panel-block timing-settings"><h3>点击节奏 · 实测设置</h3><p class="muted">题目计时，答案页统一交互。</p>'+Object.keys(defaults).map(k=>'<label class="setting-row"><span>'+labels[k]+'</span><input type="number" aria-label="'+labels[k]+'" min="0" max="60" step="0.1" value="'+c[k]+'" oninput="setTapTiming(\''+k+'\',this.value,false)" onchange="setTapTiming(\''+k+'\',this.value)"></label>').join('')+'<button class="text-btn" onclick="resetTapTiming()">恢复默认节奏</button></div>'}
 function hint(){if(phase==='question')return '想好后，轻点屏幕空白处';if(phase==='answer')return '轻点空白处重读 · 自动进入下一词题目';if(phase==='repeating')return '重读 '+repeated+' / '+config().repeatCount;if(phase==='example')return '正在朗读例句 · 点击空白处可重读单词';if(phase==='answer-paused')return '点击空白处重读单词后进入下一题';return ''}
 window.PAI_TAP_FLOW={ready,answer,browseReady,cancel,tap,beginExample,interruptRepeatForExample,exampleFinished,config,classify,settings,hint,correct,snapshot:()=>({phase,responseMs,grade,entryMode,repeated})};
 document.addEventListener('click',e=>{if(state.view!=='learning'||!e.target.closest('.learning-screen')||e.target.closest('button,a,input,select,textarea,summary,details,[data-word-audio],[data-example-audio]'))return;if(window.getSelection?.()?.toString()||Date.now()<(window.__paiTapSuppressUntil||0))return;tap()},true);
 document.addEventListener('keydown',e=>{if(e.code!=='Space'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)||state.view!=='learning')return;e.preventDefault();tap()});
 let touch=null;document.addEventListener('touchstart',e=>{touch=state.view==='learning'&&e.touches?.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY,time:Date.now()}:null},{passive:true});
 document.addEventListener('touchmove',e=>{if(touch&&e.touches?.[0]&&(Math.abs(e.touches[0].clientX-touch.x)>10||Math.abs(e.touches[0].clientY-touch.y)>10))window.__paiTapSuppressUntil=Date.now()+700},{passive:true});
 document.addEventListener('touchend',e=>{if(!touch||state.view!=='learning'||e.changedTouches?.length!==1)return;const x=e.changedTouches[0].clientX-touch.x,y=e.changedTouches[0].clientY-touch.y,dt=Date.now()-touch.time;touch=null;if(dt>700||Math.abs(x)<65||Math.abs(x)<Math.abs(y)*1.3||e.target.closest('button,a,input,select,textarea'))return;window.__paiTapSuppressUntil=Date.now()+700;window.browseAnswer?.(x>0?-1:1)},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(state.view!=='learning')return;if(document.hidden){clear();state.revealed=false}else window.restartLearningQuestion?.()});
})();
