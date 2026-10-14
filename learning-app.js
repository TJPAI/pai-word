// One owner for today's study, scene batches, reviews and in-session relearning.
(function(){
 const DAY=86400000,core=window.PAI_CORE,byKey=k=>core.byKU.get(k),key=u=>u.k;
 const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const primary=w=>Object.keys(w.s)[0];
 const category=id=>id==='function'?'专项':id.startsWith('core')?'词频分层':'场景';
 const date=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
 state.selectedScene=SCENES[state.selectedScene]?state.selectedScene:'daily';
 state.learningSession=state.learningSession||null;
 state.autoPronounce={question:true,swipe:true,...state.autoPronounce};
 window.setAutoPronounce=(kind,enabled)=>{if(!['question','swipe'].includes(kind))return;state.autoPronounce[kind]=!!enabled;persist();render()};
 let active=false,loading=false,error='',startedAt=0,token=0,previousUnit=null;
 const due=()=>Object.entries(state.records).filter(([k,r])=>byKey(k)&&(r.learningPending||r.lastKnown===false||r.due<=Date.now())).sort((a,b)=>(b[1].learningPending?1:0)-(a[1].learningPending?1:0)||a[1].due-b[1].due).map(([k])=>k);
 const fresh=()=>{globalNewRemaining();return [...state.daily.newWordKeys,...state.daily.reinforcementKeys].filter(k=>!state.records[k])};
 const unit=()=>byKey(state.learningSession?.queue[0]);
 const unlearned=id=>{const units=core.byScene.get(id)||[],introduced=new Set(units.filter(u=>state.records[u.k]).map(u=>u.w.rank)),seen=new Set();return units.filter(u=>{if(introduced.has(u.w.rank)||seen.has(u.w.rank))return false;seen.add(u.w.rank);return true})};
 function persist(){save()}
 function current(){return active?unit():null}window.currentUnit=current;
 window.currentQueue=()=>active?(state.learningSession?.queue||[]).map(byKey).filter(Boolean):[];
 function statusText(){const s=window.PAI_LOCAL_LEXICON;return s.offlineReady?'全部词包已缓存':`已缓存 ${s.loadedChunks} / ${s.totalChunks} 个词包；学习时按需下载`}
 async function showCurrent(gestureSpeech=false){browseIndex=null;browsedUnit=null;++browseToken;PAI_TAP_FLOW.cancel();const id=++token,u=unit();error='';loading=!!u&&!u.w.loaded;render();if(!u)return;
  // First scene-entry speech must be initiated synchronously in the tap gesture on iOS Safari.
  // Catalog lemmas exist before the deferred KU payload is loaded.
  const autoQuestion=state.autoPronounce.question;
  if(gestureSpeech&&autoQuestion&&u.w?.w)window.PAI_AUDIO?.play(u.w.w);
  try{await ensureUnits([u.k]);if(id!==token)return;loading=false;startedAt=Date.now();PAI_TAP_FLOW.ready(u.k,gestureSpeech&&autoQuestion);render();if(!gestureSpeech&&autoQuestion)speak(u.w.w);const next=state.learningSession.queue.slice(1,5);ensureUnits(next).catch(()=>{})}catch(e){if(id!==token)return;loading=false;error=e.message;render()}}
 function start(keys,title,kind){previousUnit=null;browseIndex=null;const uniq=[...new Set(keys)].filter(byKey);state.learningSession={date:date(),kind,title,queue:uniq,total:uniq.length,completed:[],seen:{},attempts:0};active=true;state.view='learning';state.revealed=false;persist();showCurrent(true)}
 const topicSets=[
  {name:'蔬菜与烹饪',terms:['蔬菜','买菜','菜市场','做饭','烹饪','vegetable','cooking'],words:'vegetable carrot cabbage spinach onion cucumber broccoli lettuce eggplant potato tomato pepper garlic pumpkin pea bean mushroom celery radish corn boil chop slice fresh harvest'},
  {name:'动物园',terms:['动物园','动物','看动物','zoo','wildlife'],words:'zoo lion tiger elephant giraffe zebra monkey panda bear penguin kangaroo hippo rhino snake crocodile cage enclosure keeper feed habitat wild species conservation ticket'},
  {name:'机场与登机',terms:['机场','登机','飞机','坐飞机','airport','flight'],words:'airport airplane aircraft flight ticket passport luggage baggage terminal security departure arrival boarding gate seat aisle delay check-in'},
  {name:'医院就诊',terms:['医院','看病','医生','生病','hospital','doctor'],words:'hospital doctor nurse patient clinic symptom diagnosis treatment medicine prescription appointment pain fever examination recovery'},
  {name:'餐厅点餐',terms:['餐厅','点餐','饭店','restaurant','dining'],words:'restaurant menu waiter waitress order dish meal appetizer dessert bill tip reservation delicious spicy vegetarian'},
  {name:'酒店住宿',terms:['酒店','住宿','宾馆','hotel'],words:'hotel room reservation reception check-in check-out key lobby elevator breakfast towel guest suite'},
  {name:'超市购物',terms:['超市','购物','商店','shopping','supermarket'],words:'supermarket shop store basket cart checkout cashier price discount receipt product shelf customer'},
  {name:'天气与自然',terms:['天气','气候','下雨','weather'],words:'weather rain snow cloud sunny cloudy wind storm temperature forecast humidity climate umbrella'},
  {name:'学校与课堂',terms:['学校','课堂','上课','school','classroom'],words:'school classroom teacher student lesson homework exam textbook lecture subject grade library'},
  {name:'体育与运动',terms:['体育','运动','锻炼','sport','exercise'],words:'sport exercise training athlete competition stadium team coach race swimming running sailing'}
 ];
 let topicInput='',topicFeedback='';
 window.setTopicInput=v=>{topicInput=String(v||'').slice(0,160)};
 function topicMatch(input){const q=input.trim().toLowerCase();if(!q)return null;const hits=topicSets.map(t=>({t,score:t.terms.reduce((n,term)=>n+(q.includes(term.toLowerCase())?term.length+2:0),0)})).sort((a,b)=>b.score-a.score);return hits[0].score?hits[0].t:null}
 function topicCandidates(q,t){
  const terms=t?t.words.split(' '):[];
  const order=new Map(terms.map((w,i)=>[w,i]));
  const normalized=q.trim().toLowerCase();
  const clean=normalized.replace(/[，。！？、；：,.!?;:()（）]/g,' ').replace(/^(我想|我想要|我要|我需要|请|帮我|学习|背|关于|有关|一些|去|在|的|英语|单词|词汇|场景)+/g,'').replace(/(相关|场景|单词|词汇|英语|怎么说|有哪些|的)+$/g,'').trim();
  const tokens=[clean,normalized].filter((x,i,a)=>x.length>=2&&a.indexOf(x)===i);
  const scored=[];
  for(const w of core.words){
   const exact=order.has(w.w.toLowerCase());
   let best=null;
   for(const s of Object.values(w.s)){
    if(s.kuType!=='sense')continue;
    const gloss=String(s.m||'').toLowerCase(),title=String(s.kuTitle||'').toLowerCase();
    const semantic=t&&t.terms.some(x=>x.length>=2&&(gloss.includes(x.toLowerCase())||title.includes(x.toLowerCase())));
    const queryHit=tokens.some(x=>gloss.includes(x)||title.includes(x));
    if(!exact&&!queryHit&&!semantic)continue;
    const score=(exact?1000-order.get(w.w.toLowerCase())*8:0)+(queryHit?220:0)+(semantic?45:0)-w.rank/5000;
    if(!best||score>best.score)best={key:s.ku_id,score};
   }
   if(best)scored.push({...best,rank:w.rank,known:!!state.records[best.key]});
  }
  return scored.sort((a,b)=>Number(a.known)-Number(b.known)||b.score-a.score||a.rank-b.rank).slice(0,20).map(x=>x.key);
 }
 window.startTopicStudy=()=>{
  const q=topicInput.trim();if(!q){topicFeedback='请输入场景或一句话。';render();return}
  const t=topicMatch(q),keys=topicCandidates(q,t);
  if(!keys.length){topicFeedback='未找到足够匹配的词义。请尝试更具体的主题，例如“蔬菜”或“动物园”。';render();return}
  topicFeedback='';start(keys,(t?.name||q.slice(0,24))+' · 场景学习','topic')
 };
 window.openToday=()=>start([...due(),...fresh()],`${SCENES[state.selectedScene]} · 今日学习`,'today');
 window.openReview=()=>start(due(),'优先复习','review');
 window.openFreeReview=()=>start(Object.keys(state.records).filter(byKey),'自由复习','free');
 window.openScene=id=>{state.selectedScene=id;rebuildDailyAssignments();start([...due().filter(k=>byKey(k).s.scene===id),...unlearned(id).slice(0,10).map(u=>u.k)],SCENES[id]+' · 定向学习','scene')};
 window.resumeLearning=()=>{previousUnit=null;active=true;state.view='learning';state.revealed=false;showCurrent()};
 window.selectLearningScene=id=>{state.selectedScene=id;rebuildDailyAssignments();persist();render()};
 window.goScenes=()=>{previousUnit=null;browseIndex=null;++browseToken;PAI_TAP_FLOW.cancel();++token;active=false;loading=false;error='';state.view='scenes';state.revealed=false;if('speechSynthesis'in window)speechSynthesis.cancel();persist();render()};
 window.openPanel=kind=>{previousUnit=null;PAI_TAP_FLOW.cancel();active=false;state.view=kind;persist();render()};
 window.reveal=()=>{if(!active||loading||error||!unit())return;PAI_TAP_FLOW.tap()};
 window.retryLearningLoad=()=>showCurrent();
 let browseIndex=null,browseToken=0,browsedUnit=null;
 const cycleKeys=()=>[...new Set([...(state.learningSession?.completed||[]),...(state.learningSession?.queue||[])])].filter(byKey);
 window.getBrowsedUnit=()=>browsedUnit;
 window.getVisibleLearningUnit=()=>browsedUnit||unit();
 window.restartLearningQuestion=()=>{if(active)showCurrent()};
 window.advanceBrowsedAnswer=()=>{if(!active||!browsedUnit)return false;const keys=cycleKeys(),index=keys.indexOf(browsedUnit.k),next=keys.length?keys[(index+1+keys.length)%keys.length]:null;state.revealed=false;if(!next)return false;persist();showCurrent();return true};
 window.browseAnswer=async direction=>{
  if(!active||loading||error||!unit())return false;
  const keys=cycleKeys();if(!keys.length)return false;
  const index=browseIndex===null?Math.max(0,keys.indexOf(unit().k)):browseIndex;
  const next=(index+direction+keys.length)%keys.length;
  const u=byKey(keys[next]),id=++browseToken;
  PAI_TAP_FLOW.cancel();++token;
  try{await ensureUnits([u.k]);if(id!==browseToken||state.view!=='learning')return false;
   browseIndex=next;browsedUnit=u;state.revealed=true;
   render();
   PAI_TAP_FLOW.browseReady(u.k,()=>window.advanceBrowsedAnswer());render();if(state.autoPronounce.swipe)speak(u.w.w);return true;
  }catch(_){return false}
 };
 window.rateBrowsedLearning=(grade,k)=>{if(!browsedUnit||browsedUnit.k!==k)return;window.rateLearning(grade,k)};
 window.rateLearning=(grade,targetKey=null)=>{
  if(!active||loading||error||!unit()||!state.revealed||!['again','hard','good'].includes(grade))return;
  const session=state.learningSession,u=targetKey?byKey(targetKey):unit();if(!u)return;const k=u.k,now=Date.now(),prev=state.records[k];previousUnit=u;
  if(!prev)markDailyNewComplete(k);
  const seen=session.seen[k]||0;session.seen[k]=seen+1;session.attempts++;
  // New material gets a second retrieval; mistakes never disappear behind a timer.
  const repeat=grade!=='good'||(!prev&&seen===0);
  const r={...(prev||{}),last:now,lastKnown:grade==='good',lastGrade:grade,reps:(prev?.reps||0)+1,responseMs:PAI_TAP_FLOW.snapshot().responseMs??Math.max(0,now-startedAt),learningPending:repeat,srsPolicy:'session-retrieval-v3'};
  if(repeat){r.due=now;r.interval=0;}else{const prior=prev?.lastStableInterval||prev?.interval||0;const days=session.kind==='free'&&prior>0?prior/DAY:prior<DAY?1:prior<3*DAY?3:Math.max(3,Math.round(prior/DAY*(prev?.lastGrade==='hard'?1.5:2.3)));r.interval=days*DAY;r.lastStableInterval=r.interval;r.due=session.kind==='free'&&prev?.due>now?prev.due:now+r.interval}
  if(repeat&&prev?.interval>0)r.lastStableInterval=grade==='again'?0:prev.interval;
  state.records[k]=r;rebuildDailyAssignments();state.stats[grade==='good'?'known':'unknown']=(state.stats[grade==='good'?'known':'unknown']||0)+1;
  const qi=session.queue.indexOf(k);if(qi>=0)session.queue.splice(qi,1);session.completed=session.completed.filter(x=>x!==k);if(repeat)session.queue.splice(Math.min(4,session.queue.length),0,k);else session.completed.push(k);
  state.revealed=false;persist();showCurrent();
 };
 function top(title,progress=''){return `<div class="study-top"><button class="back-btn" aria-label="返回首页" onclick="goScenes()">‹</button><div class="study-scene">${esc(title)}</div><div class="study-progress">${progress}</div></div>`}
 function home(){
  const n=fresh().length,r=due().length,completed=globalNewCompleted(),resume=state.learningSession?.queue?.length;
  const cards=ids=>ids.map(id=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${esc(SCENES[id])}</span><span class="scene-count"><b>${unlearned(id).length}</b><small>未学词</small></span></button>`).join('');
  return `<div class="screen scene-screen"><div class="scene-head"><h1>PAI Word</h1><div class="scene-tools"><button class="text-btn" onclick="openLexicon()">词库</button><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><p class="home-intro">选一个场景，先回忆，再看答案。</p><section class="topic-search"><label for="topic-input">一句话选择背词场景</label><form onsubmit="event.preventDefault();startTopicStudy()"><input id="topic-input" aria-label="描述想学的场景" maxlength="160" placeholder="例如：蔬菜、动物园、我想去机场登机" oninput="setTopicInput(this.value)" value="${esc(topicInput)}"><button type="submit" class="primary-btn">开始场景背词</button></form><p class="scene-note">支持常见主题与简短描述；从现有 Core-13000 中选词，不生成新词条。</p>${topicFeedback?`<p class="topic-feedback" role="status">${esc(topicFeedback)}</p>`:""}</section><section class="today-plan"><label for="scene-choice">今日新词来源</label><select id="scene-choice" onchange="selectLearningScene(this.value)">${Object.entries(SCENES).map(([id,name])=>`<option value="${id}" ${id===state.selectedScene?'selected':''}>${category(id)} · ${esc(name)}</option>`).join('')}</select><p>今日已接触 ${completed} 个新词 · 待学 ${state.daily.newWordKeys.filter(k=>!state.records[k]).length} 个</p><button class="primary-btn" onclick="openToday()">${n||r?'开始今日学习':'今日分配已完成'}${n||r?` · ${n+r} 项`:''}</button>${resume?`<button class="secondary-btn" onclick="resumeLearning()">继续上次学习 · 剩余 ${resume} 项</button>`:''}<button class="text-btn" onclick="openReview()">优先复习 ${r} 项</button></section><h2 class="group-title">按场景学习</h2><div class="scene-grid">${cards(Object.keys(SCENES).filter(id=>category(id)==='场景'))}</div><h2 class="group-title">基础与词频分层</h2><p class="scene-note">以下词汇尚未完成场景细分，按词频范围学习。功能词单独练习。</p><div class="scene-grid">${cards(Object.keys(SCENES).filter(id=>category(id)!=='场景'&&(core.byScene.get(id)||[]).length))}</div><p class="scene-note">内容持续校订中；收录数量不代表已完成词典核验。<br>${statusText()}</p></div>`;
 }
 function learning(){
  const s=state.learningSession,u=browsedUnit||unit();if(!s)return home();
  if(!u)return `<div class="screen study-screen">${top(s.title,'完成')}<div class="done"><div><h2>本轮回忆已完成</h2><p>${s.completed.length} 项已通过本轮回忆，共作答 ${s.attempts} 次。<br>本轮错词已重新出现；长期记忆仍需后续复习。</p>${s.kind==='scene'?`<p>此分类还有 ${unlearned(state.selectedScene).length} 个未接触词。</p><button class="primary-btn" onclick="openScene('${state.selectedScene}')">再学 10 个</button>`:''}<button class="secondary-btn" onclick="goScenes()">返回首页</button></div></div></div>`;
  const progress=`已完成 ${s.completed.length} / ${s.total}`;
  if(loading||error)return `<div class="screen study-screen">${top(s.title,progress)}<div class="done" role="status"><div><p>${error?esc(error):'正在准备本轮词卡…'}</p>${error?'<button class="primary-btn" onclick="retryLearningLoad()">重试下载</button>':'<div class="skeleton-line"></div>'}</div></div></div>`;
  const hidden=state.hideWord&&!state.revealed?' listen-only':'';
  const repeat=s.seen[u.k]>0;
  const label=u.s.kuType==='sense'?'回忆这个词的含义':u.s.kuTitle;
  return `<div class="screen study-screen learning-screen ${state.revealed?'revealed':''} ${browsedUnit?'previous-answer':''}">${top(s.title,progress)}<div class="study-body"><div class="word-hero${hidden}"><div class="word-line"><div class="word">${esc(u.w.w)}</div><button class="speak-btn" data-word-audio data-speak="${esc(u.w.w)}" aria-label="播放单词">🔊</button></div><div class="ipa">${esc(u.w.ipaUS)}</div>${/^(the|a|an|and|to|of)$/.test(u.w.w)?'<small class="muted">功能词读音会随重读与连读语境变化。</small>':''}<p class="recall-cue">${repeat?'本轮再回忆 · ':''}${esc(label)}</p></div>${state.revealed?answerHtml(u):''}</div>${state.revealed?`<div class="recall-correction" role="group" aria-label="纠正回忆结果"><button type="button" onclick="PAI_TAP_FLOW.correct('again')">不知道</button><button type="button" onclick="PAI_TAP_FLOW.correct('hard')">模糊</button><button type="button" onclick="PAI_TAP_FLOW.correct('good')">知道</button></div>`:''}<p class="recall-note" aria-live="polite">${esc(PAI_TAP_FLOW.hint())}</p><div class="session-footnote">新词与错词会在本轮再次出现。点击节奏可在设置中调整。</div></div>`;
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
 window.render=function(){const app=document.getElementById('app');if(state.view==='scenes')app.innerHTML=home();else if(state.view==='learning')app.innerHTML=learning();else if(state.view==='lexicon')app.innerHTML=lexicon();else if(state.view==='lexiconWord')app.innerHTML=detail();else{previousRender();if(state.view==='settings'){for(const row of document.querySelectorAll('.setting-row')){if(row.textContent.includes('发音口音'))row.innerHTML='<span>发音</span><b>美音 · 系统语音</b>';if(row.textContent.includes('显示 3 个例句'))row.querySelector('span').textContent='显示可用例句'}const panel=document.querySelector('.panel-screen');panel.insertAdjacentHTML('beforeend',`<div class="panel-block"><h3>自动发音</h3><label class="setting-row"><span>进入题目页自动读单词</span><input type="checkbox" ${state.autoPronounce.question?'checked':''} onchange="setAutoPronounce('question',this.checked)"></label><label class="setting-row"><span>左右滑动进入答案页自动读单词</span><input type="checkbox" ${state.autoPronounce.swipe?'checked':''} onchange="setAutoPronounce('swipe',this.checked)"></label><p class="muted">默认开启；点击喇叭、例句播放和答案页点击空白重读不受影响。</p></div>`);panel.insertAdjacentHTML('beforeend',PAI_TAP_FLOW.settings());panel.insertAdjacentHTML('beforeend',`<div class="panel-block"><p>${statusText()}</p><button class="secondary-btn" onclick="downloadOfflineLexicon()" ${window.PAI_LOCAL_LEXICON.downloading?'disabled':''}>${window.PAI_LOCAL_LEXICON.downloading?'正在缓存…':'下载全部词包供离线使用'}</button>${window.PAI_LOCAL_LEXICON.error?`<p>${esc(window.PAI_LOCAL_LEXICON.error)}</p>`:''}</div>`)} }
 };
 window.addEventListener('pai-offline-status',()=>{if(state.view==='settings')render()});
 window.PAI_LEARNING_QA={due,fresh,unlearned,current:unit};
})();
