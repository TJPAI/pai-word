// One owner for today's study, scene batches, reviews and in-session relearning.
(function(){
 const DAY=86400000,core=window.PAI_CORE,byKey=k=>core.byKU.get(k),key=u=>u.k;
 const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const primary=w=>Object.keys(w.s)[0];
 const category=id=>id==='function'?'专项':id.startsWith('core')?'词频分层':'场景';
 const date=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
 state.selectedScene=SCENES[state.selectedScene]?state.selectedScene:'daily';
 state.learningSession=state.learningSession||null;
 let active=false,loading=false,error='',startedAt=0,token=0,previousUnit=null;
 const due=()=>Object.entries(state.records).filter(([k,r])=>byKey(k)&&(r.learningPending||r.lastKnown===false||r.due<=Date.now())).sort((a,b)=>(b[1].learningPending?1:0)-(a[1].learningPending?1:0)||a[1].due-b[1].due).map(([k])=>k);
 const fresh=()=>{globalNewRemaining();return [...state.daily.newWordKeys,...state.daily.reinforcementKeys].filter(k=>!state.records[k])};
 const unit=()=>byKey(state.learningSession?.queue[0]);
 const unlearned=id=>{const units=core.byScene.get(id)||[],introduced=new Set(units.filter(u=>state.records[u.k]).map(u=>u.w.rank)),seen=new Set();return units.filter(u=>{if(introduced.has(u.w.rank)||seen.has(u.w.rank))return false;seen.add(u.w.rank);return true})};
 function persist(){save()}
 function current(){return active?unit():null}window.currentUnit=current;
 window.currentQueue=()=>active?(state.learningSession?.queue||[]).map(byKey).filter(Boolean):[];
 function statusText(){const s=window.PAI_LOCAL_LEXICON;return s.offlineReady?'全部词包已缓存':`已缓存 ${s.loadedChunks} / ${s.totalChunks} 个词包；学习时按需下载`}
 async function showCurrent(auto=true){PAI_TAP_FLOW.cancel();const id=++token,u=unit();error='';loading=!!u&&!u.w.loaded;render();if(!u)return;try{await ensureUnits([u.k]);if(id!==token)return;loading=false;startedAt=Date.now();PAI_TAP_FLOW.ready(u.k);render();if(auto&&!state.hideWord)speak(u.w.w);if(auto&&state.hideWord)speak(u.w.w);const next=state.learningSession.queue.slice(1,5);ensureUnits(next).catch(()=>{})}catch(e){if(id!==token)return;loading=false;error=e.message;render()}}
 function start(keys,title,kind){previousUnit=null;const uniq=[...new Set(keys)].filter(byKey);state.learningSession={date:date(),kind,title,queue:uniq,total:uniq.length,completed:[],seen:{},attempts:0};active=true;state.view='learning';state.revealed=false;persist();showCurrent()}
 window.openToday=()=>start([...due(),...fresh()],`${SCENES[state.selectedScene]} · 今日学习`,'today');
 window.openReview=()=>start(due(),'优先复习','review');
 window.openFreeReview=()=>start(Object.keys(state.records).filter(byKey),'自由复习','free');
 window.openScene=id=>{state.selectedScene=id;rebuildDailyAssignments();start([...due().filter(k=>byKey(k).s.scene===id),...unlearned(id).slice(0,10).map(u=>u.k)],SCENES[id]+' · 定向学习','scene')};
 window.resumeLearning=()=>{previousUnit=null;active=true;state.view='learning';state.revealed=false;showCurrent()};
 window.selectLearningScene=id=>{state.selectedScene=id;rebuildDailyAssignments();persist();render()};
 window.goScenes=()=>{previousUnit=null;PAI_TAP_FLOW.cancel();++token;active=false;loading=false;error='';state.view='scenes';state.revealed=false;if('speechSynthesis'in window)speechSynthesis.cancel();persist();render()};
 window.openPanel=kind=>{previousUnit=null;PAI_TAP_FLOW.cancel();active=false;state.view=kind;persist();render()};
 window.reveal=()=>{if(!active||loading||error||!unit())return;PAI_TAP_FLOW.tap()};
 window.retryLearningLoad=()=>showCurrent(false);
 window.showPreviousAnswer=async()=>{if(!active||!previousUnit||loading||error)return false;PAI_TAP_FLOW.cancel();const id=++token;const previous=previousUnit;state.view='learning';state.revealed=true;try{await ensureUnits([previous.k]);if(id!==token)return false;const html=answerHtml(previous);const host=document.querySelector('.learning-screen');if(!host)return false;const body=host.querySelector('.study-body');if(!body)return false;body.innerHTML=`<div class="word-hero"><div class="word-line"><div class="word">${esc(previous.w.w)}</div><button class="speak-btn" data-word-audio data-speak="${esc(previous.w.w)}" aria-label="播放单词">🔊</button></div><div class="ipa">${esc(previous.w.ipaUS)}</div></div>${html}`;host.classList.add('revealed','previous-answer');host.querySelector('.recall-note').textContent='上一词答案 · 左滑返回当前词';return true}catch(_){return false}};
 window.restoreCurrentAnswer=()=>{if(!document.querySelector('.learning-screen.previous-answer'))return false;state.revealed=false;showCurrent(false);return true};
 window.rateLearning=grade=>{
  if(!active||loading||error||!unit()||!state.revealed||!['again','hard','good'].includes(grade))return;
  const session=state.learningSession,u=unit(),k=u.k,now=Date.now(),prev=state.records[k];previousUnit=u;
  if(!prev)markDailyNewComplete(k);
  const seen=session.seen[k]||0;session.seen[k]=seen+1;session.attempts++;
  // New material gets a second retrieval; mistakes never disappear behind a timer.
  const repeat=grade!=='good'||(!prev&&seen===0);
  const r={...(prev||{}),last:now,lastKnown:grade==='good',lastGrade:grade,reps:(prev?.reps||0)+1,responseMs:PAI_TAP_FLOW.snapshot().responseMs??Math.max(0,now-startedAt),learningPending:repeat,srsPolicy:'session-retrieval-v3'};
  if(repeat){r.due=now;r.interval=0;}else{const prior=prev?.lastStableInterval||prev?.interval||0;const days=session.kind==='free'&&prior>0?prior/DAY:prior<DAY?1:prior<3*DAY?3:Math.max(3,Math.round(prior/DAY*(prev?.lastGrade==='hard'?1.5:2.3)));r.interval=days*DAY;r.lastStableInterval=r.interval;r.due=session.kind==='free'&&prev?.due>now?prev.due:now+r.interval}
  if(repeat&&prev?.interval>0)r.lastStableInterval=grade==='again'?0:prev.interval;
  state.records[k]=r;rebuildDailyAssignments();state.stats[grade==='good'?'known':'unknown']=(state.stats[grade==='good'?'known':'unknown']||0)+1;
  session.queue.shift();if(repeat)session.queue.splice(Math.min(4,session.queue.length),0,k);else if(!session.completed.includes(k))session.completed.push(k);
  state.revealed=false;persist();showCurrent();
 };
 function top(title,progress=''){return `<div class="study-top"><button class="back-btn" aria-label="返回首页" onclick="goScenes()">‹</button><div class="study-scene">${esc(title)}</div><div class="study-progress">${progress}</div></div>`}
 function home(){
  const n=fresh().length,r=due().length,completed=globalNewCompleted(),resume=state.learningSession?.queue?.length;
  const cards=ids=>ids.map(id=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${esc(SCENES[id])}</span><span class="scene-count"><b>${unlearned(id).length}</b><small>未学词</small></span></button>`).join('');
  return `<div class="screen scene-screen"><div class="scene-head"><h1>PAI Word</h1><div class="scene-tools"><button class="text-btn" onclick="openLexicon()">词库</button><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><p class="home-intro">选一个场景，先回忆，再看答案。</p><section class="today-plan"><label for="scene-choice">今日新词来源</label><select id="scene-choice" onchange="selectLearningScene(this.value)">${Object.entries(SCENES).map(([id,name])=>`<option value="${id}" ${id===state.selectedScene?'selected':''}>${category(id)} · ${esc(name)}</option>`).join('')}</select><p>今日已接触 ${completed} 个新词 · 待学 ${state.daily.newWordKeys.filter(k=>!state.records[k]).length} 个</p><button class="primary-btn" onclick="openToday()">${n||r?'开始今日学习':'今日分配已完成'}${n||r?` · ${n+r} 项`:''}</button>${resume?`<button class="secondary-btn" onclick="resumeLearning()">继续上次学习 · 剩余 ${resume} 项</button>`:''}<button class="text-btn" onclick="openReview()">优先复习 ${r} 项</button></section><h2 class="group-title">按场景学习</h2><div class="scene-grid">${cards(Object.keys(SCENES).filter(id=>category(id)==='场景'))}</div><h2 class="group-title">基础与词频分层</h2><p class="scene-note">以下词汇尚未完成场景细分，按词频范围学习。功能词单独练习。</p><div class="scene-grid">${cards(Object.keys(SCENES).filter(id=>category(id)!=='场景'&&(core.byScene.get(id)||[]).length))}</div><p class="scene-note">内容持续校订中；收录数量不代表已完成词典核验。<br>${statusText()}</p></div>`;
 }
 function learning(){
  const s=state.learningSession,u=unit();if(!s)return home();
  if(!u)return `<div class="screen study-screen">${top(s.title,'完成')}<div class="done"><div><h2>本轮回忆已完成</h2><p>${s.completed.length} 项已通过本轮回忆，共作答 ${s.attempts} 次。<br>本轮错词已重新出现；长期记忆仍需后续复习。</p>${s.kind==='scene'?`<p>此分类还有 ${unlearned(state.selectedScene).length} 个未接触词。</p><button class="primary-btn" onclick="openScene('${state.selectedScene}')">再学 10 个</button>`:''}<button class="secondary-btn" onclick="goScenes()">返回首页</button></div></div></div>`;
  const progress=`已完成 ${s.completed.length} / ${s.total}`;
  if(loading||error)return `<div class="screen study-screen">${top(s.title,progress)}<div class="done" role="status"><div><p>${error?esc(error):'正在准备本轮词卡…'}</p>${error?'<button class="primary-btn" onclick="retryLearningLoad()">重试下载</button>':'<div class="skeleton-line"></div>'}</div></div></div>`;
  const hidden=state.hideWord&&!state.revealed?' listen-only':'';
  const repeat=s.seen[u.k]>0;
  const label=u.s.kuType==='sense'?'回忆这个词的含义':u.s.kuTitle;
  return `<div class="screen study-screen learning-screen ${state.revealed?'revealed':''}">${top(s.title,progress)}<div class="study-body"><div class="word-hero${hidden}"><div class="word-line"><div class="word">${esc(u.w.w)}</div><button class="speak-btn" data-word-audio data-speak="${esc(u.w.w)}" aria-label="播放单词">🔊</button></div><div class="ipa">${esc(u.w.ipaUS)}</div>${/^(the|a|an|and|to|of)$/.test(u.w.w)?'<small class="muted">功能词读音会随重读与连读语境变化。</small>':''}<p class="recall-cue">${repeat?'本轮再回忆 · ':''}${esc(label)}</p></div>${state.revealed?answerHtml(u):''}</div><p class="recall-note" aria-live="polite">${esc(PAI_TAP_FLOW.hint())}</p><div class="session-footnote">新词与错词会在本轮再次出现。点击节奏可在设置中调整。</div></div>`;
 }
 let query='';window.openLexicon=()=>{active=false;state.view='lexicon';render()};
 const results=()=>{const q=query.trim().toLowerCase();return core.words.filter(w=>!q||w.w.toLowerCase().includes(q)||Object.values(w.s).some(s=>s.m.includes(q))).sort((a,b)=>(a.w.toLowerCase()===q?-1:0)-(b.w.toLowerCase()===q?-1:0)||a.rank-b.rank).slice(0,60)};
 const resultHtml=()=>results().map(w=>`<button class="lex-row" onclick="openLexiconWord(${w.rank})"><span class="lex-main"><b>${esc(w.w)}</b><small>${esc(w.pos)}</small></span><span class="lex-gloss">${esc(w.s[primary(w)].m)}</span></button>`).join('')||'<p>没有找到词条。</p>';
 window.updateLexiconSearch=v=>{query=v;document.getElementById('lex-results').innerHTML=resultHtml()};
 window.openLexiconWord=async rank=>{state.lexiconWordRank=rank;state.previewKU=primary(core.words[rank-1]);state.view='lexiconWord';loading=true;error='';render();try{await ensureUnits(Object.keys(core.words[rank-1].s))}catch(e){error=e.message}loading=false;render()};
 window.selectLexiconSense=k=>{state.previewKU=k;render()};
 function lexicon(){return `<div class="screen lex-screen">${top('词库浏览')}<p class="scene-note">共收录 ${core.words.length.toLocaleString()} 词；内容校验尚未全部完成。</p><input aria-label="搜索词库" class="lex-search" placeholder="搜索英文或中文释义" value="${esc(query)}" oninput="updateLexiconSearch(this.value)"><div id="lex-results">${resultHtml()}</div></div>`}
 function detail(){const w=core.words[state.lexiconWordRank-1],u=byKey(state.previewKU);return `<div class="screen lex-word-screen">${top('词条')}<button class="text-btn" onclick="openLexicon()">返回搜索</button><div class="lex-word-head"><div><h1>${esc(w.w)}</h1><div class="ipa">${esc(w.ipaUS||'')}</div></div><button class="speak-btn" data-word-audio data-speak="${esc(w.w)}" aria-label="播放单词">🔊</button></div>${loading?'<p>正在加载词条…</p>':error?`<p>${esc(error)}</p><button onclick="openLexiconWord(${w.rank})">重试</button>`:`<div class="sense-picker">${Object.values(w.s).map(s=>`<button class="sense-chip ${s.ku_id===u.k?'active':''}" onclick="selectLexiconSense('${s.ku_id}')">${esc(s.kuTitle||s.pos)} · ${esc(s.m)}</button>`).join('')}</div>${answerHtml(u)}`}<p class="scene-note">浏览不改变学习进度。发音使用设备提供的美音语音。</p></div>`}
 const previousRender=window.render;
 window.render=function(){const app=document.getElementById('app');if(state.view==='scenes')app.innerHTML=home();else if(state.view==='learning')app.innerHTML=learning();else if(state.view==='lexicon')app.innerHTML=lexicon();else if(state.view==='lexiconWord')app.innerHTML=detail();else{previousRender();if(state.view==='settings'){for(const row of document.querySelectorAll('.setting-row')){if(row.textContent.includes('发音口音'))row.innerHTML='<span>发音</span><b>美音 · 系统语音</b>';if(row.textContent.includes('显示 3 个例句'))row.querySelector('span').textContent='显示可用例句'}const panel=document.querySelector('.panel-screen');panel.insertAdjacentHTML('beforeend',PAI_TAP_FLOW.settings());panel.insertAdjacentHTML('beforeend',`<div class="panel-block"><p>${statusText()}</p><button class="secondary-btn" onclick="downloadOfflineLexicon()" ${window.PAI_LOCAL_LEXICON.downloading?'disabled':''}>${window.PAI_LOCAL_LEXICON.downloading?'正在缓存…':'下载全部词包供离线使用'}</button>${window.PAI_LOCAL_LEXICON.error?`<p>${esc(window.PAI_LOCAL_LEXICON.error)}</p>`:''}</div>`)} }
 };
 window.addEventListener('pai-offline-status',()=>{if(state.view==='settings')render()});
 window.PAI_LEARNING_QA={due,fresh,unlearned,current:unit};
})();
