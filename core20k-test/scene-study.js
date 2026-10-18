// Scene-targeted learning layer: scene cards are always learnable, independent of today's recommendation quota.
(function(){
  const BATCH=10;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const keyOf=u=>u?unitKey(u.w,u.sid):'';
  const byKey=k=>window.PAI_CORE?.byKU?.get(k)||null;
  const baseRender=window.render;
  const baseReveal=window.reveal;
  const baseCurrentUnit=window.currentUnit;
  const baseCurrentQueue=window.currentQueue;
  const baseSwipeWord=window.swipeWord;
  const baseGoScenes=window.goScenes;

  function ensureDaily(){if(typeof globalNewRemaining==='function')globalNewRemaining()}
  function freshAssigned(scene){ensureDaily();return (state.daily?.assigned?.[scene]||[]).filter(k=>!state.records?.[k]&&byKey(k))}
  function unseenSenseUnits(scene){
    const out=[],seenWords=new Set();
    for(const u of allUnits(scene)){
      const k=keyOf(u);if(!k||state.records?.[k]||String(u.s?.kuType||'sense').toLowerCase()!=='sense')continue;
      const rank=u.w.rank;if(seenWords.has(rank))continue;seenWords.add(rank);out.push(u);
    }
    return out;
  }
  function unseenAnyUnits(scene){const out=[];for(const u of allUnits(scene)){const k=keyOf(u);if(k&&!state.records?.[k])out.push(u)}return out}
  function nextExtraKeys(scene,limit,exclude=new Set()){
    const out=[];
    for(const u of unseenSenseUnits(scene)){const k=keyOf(u);if(exclude.has(k))continue;out.push(k);exclude.add(k);if(out.length>=limit)return out}
    for(const u of unseenAnyUnits(scene)){const k=keyOf(u);if(exclude.has(k))continue;out.push(k);exclude.add(k);if(out.length>=limit)return out}
    return out;
  }
  function buildBatch(scene,{append=false}={}){
    const existing=append?(state.sceneStudyKeys||[]):[];
    const exclude=new Set(existing),keys=[];
    if(!append){for(const k of freshAssigned(scene)){if(!exclude.has(k)){keys.push(k);exclude.add(k)}if(keys.length>=BATCH)break}}
    const need=Math.max(0,BATCH-(append?0:keys.length));
    const extras=nextExtraKeys(scene,append?BATCH:need,exclude);
    state.sceneStudyKeys=[...existing,...keys,...extras];state.sceneStudyScene=scene;state.sceneStudySource=keys.length?'today+targeted':'targeted';
    if(!append)state.sceneStudyIndex=0;
    return sceneQueue();
  }
  function sceneQueue(){
    if(state.view!=='study'||!state.scene||state.sceneStudyScene!==state.scene)return[];
    return (state.sceneStudyKeys||[]).filter(k=>!state.records?.[k]).map(byKey).filter(Boolean);
  }
  function clampIndex(i,len){return len?Math.max(0,Math.min(Number(i)||0,len-1)):0}
  function sceneCurrent(){const q=sceneQueue();state.sceneStudyIndex=clampIndex(state.sceneStudyIndex,q.length);return q[state.sceneStudyIndex]||null}
  function pendingFor(u){return !!u&&state.pendingUnknownKey===keyOf(u)}
  function remainingWords(scene){return new Set(unseenSenseUnits(scene).map(u=>u.w.rank)).size}
  function speakCurrent(){const u=sceneCurrent();if(u&&typeof speak==='function')setTimeout(()=>speak(u.w.w),80)}

  window.openScene=function(scene){
    state.pendingUnknownKey=null;state.scene=scene;state.view='study';state.revealed=false;state.sessionDone=0;state.sceneStudyKeys=[];state.sceneStudyIndex=0;
    buildBatch(scene);state.sessionTotal=sceneQueue().length;if(typeof save==='function')save();render();speakCurrent();
  };
  window.addSceneBatch=function(){
    if(!state.scene)return;state.pendingUnknownKey=null;state.revealed=false;buildBatch(state.scene,{append:true});state.sceneStudyIndex=clampIndex(state.sceneStudyIndex,sceneQueue().length);state.sessionTotal=(state.sessionDone||0)+sceneQueue().length;
    if(typeof save==='function')save();render();speakCurrent();
  };
  window.continueScene=function(scene){openScene(scene)};
  window.currentQueue=function(){return state.view==='study'&&state.sceneStudyScene===state.scene?sceneQueue():baseCurrentQueue?.()||[]};
  window.currentUnit=function(){return state.view==='study'&&state.sceneStudyScene===state.scene?sceneCurrent():baseCurrentUnit?.()||null};

  window.reveal=function(){
    if(state.view!=='study'||state.sceneStudyScene!==state.scene)return baseReveal();
    const u=sceneCurrent();if(!u||pendingFor(u))return;
    const was=!!state.revealed,word=u.w.w;state.revealed=!state.revealed;if(typeof save==='function')save();render();if(was&&word&&typeof speak==='function')setTimeout(()=>speak(word),60);
  };
  window.swipeWord=function(direction){
    if(state.view!=='study'||state.sceneStudyScene!==state.scene)return baseSwipeWord(direction);
    const q=sceneQueue(),u=sceneCurrent();if(q.length<2||!u||pendingFor(u))return;
    const next=clampIndex((state.sceneStudyIndex||0)+direction,q.length);if(next===state.sceneStudyIndex)return;
    state.sceneStudyIndex=next;state.revealed=false;if(typeof save==='function')save();render();speakCurrent();
  };

  function ratingHtml(u){
    if(pendingFor(u))return '<div class="rating pending-unknown"><button class="unknown" onclick="rateKnown(false)">看完了 · 10分钟后再来</button></div>';
    return '<div class="rating"><button class="unknown" onclick="rateKnown(false)">不知道</button><button class="known" onclick="rateKnown(true)">知道</button></div>';
  }
  function heroHtml(u){
    const hidden=state.hideWord&&!state.revealed?' listen-only':'';
    return `<div class="word-hero${hidden}"><div class="word-line"><div class="word">${esc(u.w.w)}</div><button class="speak-btn" data-word-audio data-speak="${esc(u.w.w)}" aria-label="播放单词">🔊</button></div><div class="ipa">${esc(u.w.ipa||u.w.ipaUS||'美音音标待补充')}</div>${state.revealed?'':'<div class="tap-hint">轻点空白处显示答案</div>'}</div>`;
  }
  function renderSceneStudy(){
    const q=sceneQueue(),u=sceneCurrent(),name=SCENES[state.scene]||state.scene;
    if(!u){const left=remainingWords(state.scene);return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${esc(name)}</div><div class="study-progress">完成</div></div><div class="done"><div><h2>本批已完成</h2><p>${left?`该场景还有 ${left} 个未学词，可继续定向学习。`:'这个场景当前可学习词已经完成。'}</p>${left?'<button class="primary-btn" onclick="addSceneBatch()">再学 10 个</button>':''}<button class="secondary-btn" onclick="goScenes()">返回首页</button></div></div></div>`}
    const pos=(state.sceneStudyIndex||0)+1,total=Math.max(1,q.length);
    return `<div class="screen study-screen scene-targeted-screen ${state.revealed?'revealed':''}"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${esc(name)} · 定向学习</div><div class="study-progress">${Math.min(pos,total)} / ${total}</div></div><div class="study-body" onclick="reveal()">${heroHtml(u)}${state.revealed?answerHtml(u):''}</div>${ratingHtml(u)}</div>`;
  }

  window.render=function(){if(state.view==='study'&&state.sceneStudyScene===state.scene){document.getElementById('app').innerHTML=renderSceneStudy();return}baseRender()};
  window.goScenes=function(){state.sceneStudyKeys=[];state.sceneStudyScene=null;state.sceneStudyIndex=0;state.pendingUnknownKey=null;return baseGoScenes()};
  window.PAI_SCENE_STUDY_QA={sceneQueue,sceneCurrent,buildBatch,remainingWords};
})();
