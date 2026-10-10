const SCENES = {
  daily:'日常生活', work:'职场商务', academic:'学术学习', travel:'旅行出行', social:'社交关系',
  tech:'科技互联网', health:'健康医疗', finance:'金融消费', public:'公共社会', culture:'文化娱乐'
};

const WORDS = [
  {w:'issue',ipa:'/ˈɪʃuː/',pos:'n./v.',root:'来自拉丁语 exire，原意是“出去、产生出来”，后来发展出“事项、发行”等含义。',s:{
    work:{m:'问题、事项；需要处理但不一定严重的事情',c:'address an issue · resolve an issue · raise an issue',e:['We need to resolve the staffing issue before Friday.','She raised the issue during the project review.','The main issue is timing rather than cost.'],x:'issue 在商务中通常比 problem 更中性，常只是“事项”。',bad:'We have a serious issue problem.',good:'We have a serious issue.'},
    academic:{m:'议题；值得分析、讨论或争论的问题',c:'a methodological issue · an ethical issue',e:['The paper addresses an important methodological issue.','This issue remains controversial in the literature.','The authors discuss several ethical issues.'],x:'学术中的 issue 常指“议题/争议点”，不等于“错误”。',bad:'This paper has an issue about privacy.',good:'This paper addresses an issue of privacy.'},
    public:{m:'公共议题；社会或政策问题',c:'a social issue · a policy issue',e:['Housing affordability has become a major policy issue.','The debate focuses on a broader social issue.','Climate adaptation is now a local governance issue.'],x:'public issue 强调公共讨论对象。',bad:'Traffic is a public problem issue.',good:'Traffic has become a public issue.'},
    finance:{m:'发行；正式发布证券、债券或票据',c:'issue shares · issue bonds · issue debt',e:['The company issued new shares to raise capital.','The government plans to issue ten-year bonds.','The bank issued the card within three days.'],x:'动词 issue 在金融中是“发行”，不能按“问题”理解。',bad:'The company problem new shares.',good:'The company issued new shares.'}
  }},
  {w:'interest',ipa:'/ˈɪntrəst/',pos:'n./v.',root:'来自拉丁语 inter + esse，原意是“处于其中、与之有关”。',s:{
    social:{m:'兴趣；对某事产生注意和好奇',c:'have an interest in · develop an interest in',e:['She developed an interest in jazz while studying abroad.','His questions show a genuine interest in the topic.','I have little interest in celebrity news.'],x:'表示“对……有兴趣”常用 have an interest in。',bad:'I have interest on jazz.',good:'I have an interest in jazz.'},
    finance:{m:'利息；借贷资金的价格',c:'interest rate · pay interest',e:['The loan carries a fixed interest rate of 4.5 percent.','You will pay less interest if you repay early.','Interest is calculated monthly.'],x:'interest rate 是“利率”，interest 本身是“利息”。',bad:'The bank pays a high interest percentage.',good:'The bank offers a high interest rate.'},
    public:{m:'利益；权益，常用复数 interests',c:'public interest · national interests',e:['The rule is designed to protect the public interest.','The two sides have competing commercial interests.','The decision must balance several national interests.'],x:'复数 interests 常指“利益、权益”，不是“多个兴趣”。',bad:'The policy protects public interests to music.',good:'The policy protects the public interest.'}
  }},
  {w:'approach',ipa:'/əˈprəʊtʃ/',pos:'n./v.',root:'来自古法语 aprochier，核心意象是“向……靠近”，由此发展出“接近、处理方式”。',s:{
    work:{m:'处理问题的总体方式或思路',c:'a practical approach · a systematic approach',e:['We need a more systematic approach to customer retention.','Her approach reduced unnecessary meetings.','The team adopted a phased approach to the rollout.'],x:'approach 强调总体思路；method 更偏具体步骤。',bad:'We need a new method approach.',good:'We need a new approach.'},
    academic:{m:'研究路径、理论框架或分析视角',c:'an empirical approach · a theoretical approach',e:['The study uses a data-driven approach to localization.','This approach differs from conventional optimization methods.','A comparative approach helps reveal the trade-offs.'],x:'论文里 approach 往往比 method 更抽象一层。',bad:'The paper uses an approach method.',good:'The paper uses a data-driven approach.'},
    social:{m:'接近某人；主动与某人交谈或提出请求',c:'approach someone about something',e:['He approached me after the talk with a question.','She approached her manager about flexible hours.','A stranger approached us near the station.'],x:'approach 作动词通常直接接宾语，不加 to。',bad:'She approached to her manager.',good:'She approached her manager.'}
  }},
  {w:'deploy',ipa:'/dɪˈplɔɪ/',pos:'v.',root:'原指“展开部队”，现代扩展为把资源安排到实际运行位置。',s:{
    tech:{m:'把软件、模型或服务发布到实际运行环境',c:'deploy to production · deploy to the cloud',e:['We deployed the new model to production last night.','The update can be deployed without downtime.','The service is deployed across three regions.'],x:'deploy 不等于 install；它强调进入实际可运行环境。',bad:'We installed the model to production.',good:'We deployed the model to production.'},
    public:{m:'调配人员、设备或资源到现场',c:'deploy teams · deploy resources',e:['The city deployed extra crews after the storm.','Emergency teams were deployed within an hour.','Additional resources were deployed to the affected area.'],x:'公共语境常指“调派、部署”。',bad:'The city deployed with extra crews.',good:'The city deployed extra crews.'},
    work:{m:'把人员或能力投入某项任务',c:'deploy talent · deploy resources effectively',e:['Managers should deploy scarce expertise where it matters most.','The firm deployed a small team to test the market.','We can deploy the remaining budget to customer support.'],x:'这里 deploy 比 assign 更强调“投入使用”。',bad:'We deployed to the team on the task.',good:'We deployed a team to the task.'}
  }},
  {w:'plot',ipa:'/plɒt/',pos:'n./v.',root:'古义与“小块地、计划”相关，后发展出“情节、密谋、绘图”等含义。',s:{
    culture:{m:'故事情节；事件如何展开的结构',c:'a complex plot · a predictable plot',e:['The film has a simple plot but memorable characters.','The plot becomes more complex in the second half.','I enjoyed the acting more than the plot.'],x:'plot 是“情节”；story 更宽，可指整个故事。',bad:'The movie has a good story plot.',good:'The movie has a strong plot.'},
    academic:{m:'把数据绘制成图',c:'plot A against B · plot the trajectory',e:['We plotted error against signal-to-noise ratio.','Plot the measurements on a logarithmic scale.','The software plots the trajectory in real time.'],x:'plot A against B 常表示展示 A 与 B 的关系。',bad:'Plot error with SNR by a graph.',good:'Plot error against SNR.'},
    public:{m:'密谋；秘密计划',c:'a plot to do something',e:['Police uncovered a plot to steal confidential data.','The suspects denied involvement in the plot.','The novel centers on a political plot.'],x:'该义通常带非法或秘密意味。',bad:'They made a public plot openly.',good:'Police uncovered a secret plot.'}
  }},
  {w:'symptom',ipa:'/ˈsɪmptəm/',pos:'n.',root:'来自希腊语 symptōma，指“随某种状态一同出现的现象”。',s:{
    health:{m:'患者感受到或表现出的疾病症状',c:'develop symptoms · experience symptoms',e:['A persistent cough can be a symptom of several conditions.','Tell the doctor when the symptoms first appeared.','Some people develop mild symptoms only.'],x:'symptom 是症状；sign 在医学中更常指可客观观察的体征。',bad:'Fever is always a symptom sign.',good:'Fever can be a symptom of infection.'},
    work:{m:'深层组织问题的外在表现',c:'a symptom of poor management',e:['High turnover may be a symptom of poor management.','Repeated delays are a symptom, not the root cause.','Low morale can be a symptom of unclear leadership.'],x:'比喻用法强调“表象，不是根因”。',bad:'High turnover is the root symptom.',good:'High turnover may be a symptom of deeper problems.'}
  }},
  {w:'estimate',ipa:'/ˈestɪmeɪt/',pos:'v./n.',root:'来自拉丁语 aestimare，意为“估价、判断价值”。',s:{
    academic:{m:'基于数据或模型估计参数或结果',c:'estimate a parameter · estimate a position',e:['We estimate the position from multiple noisy measurements.','The parameter is estimated from the training data.','The model estimates uncertainty explicitly.'],x:'estimate 通常有方法依据，不是随意 guess。',bad:'We guessed the parameter precisely from data.',good:'We estimated the parameter from data.'},
    work:{m:'估算时间、成本、工作量',c:'cost estimate · time estimate · rough estimate',e:['The initial cost estimate was too optimistic.','Can you estimate how long the migration will take?','We need a rough estimate before approving the project.'],x:'rough estimate 可以很粗，但仍应有依据。',bad:'Give me an exact rough estimate.',good:'Give me a rough estimate.'},
    finance:{m:'估值或对金额作近似判断',c:'estimated value · estimated revenue',e:['Analysts estimate annual revenue at $8 million.','The estimated value of the asset rose sharply.','The estimate assumes stable demand.'],x:'estimate 是近似判断，不等于正式 valuation。',bad:'The formal estimate valuation was audited.',good:'The estimated value was reviewed.'}
  }}
];

const STORAGE='pai-word-mobile-v1';
let state={view:'scenes',scene:null,index:0,revealed:false,newPerDay:20,records:{},stats:{known:0,unknown:0}};
try{state={...state,...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch(e){}

function save(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function unitKey(w,sid){return `${w.w}::${sid}`}
function allUnits(scene){return WORDS.flatMap(w=>Object.entries(w.s).filter(([sid])=>sid===scene).map(([sid,s])=>({w,sid,s})))}
function dueUnits(scene){const now=Date.now();return allUnits(scene).filter(u=>state.records[unitKey(u.w,u.sid)]?.due<=now)}
function unseenUnits(scene){return allUnits(scene).filter(u=>!state.records[unitKey(u.w,u.sid)])}
function queueFor(scene){const due=dueUnits(scene);const unseen=unseenUnits(scene).slice(0,state.newPerDay);const seen=new Set(due.map(u=>unitKey(u.w,u.sid)));return [...due,...unseen.filter(u=>!seen.has(unitKey(u.w,u.sid)))]}
function todayCount(scene){return queueFor(scene).length}
function currentQueue(){return state.scene?queueFor(state.scene):[]}
function currentUnit(){const q=currentQueue();return q.length?q[Math.min(state.index,q.length-1)]:null}

function speak(text,rate=.84){if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=rate;speechSynthesis.speak(u)}
function openScene(scene){state.scene=scene;state.index=0;state.revealed=false;state.view='study';save();render();setTimeout(()=>{const u=currentUnit();if(u)speak(u.w.w)},120)}
function goScenes(){speechSynthesis?.cancel?.();state.view='scenes';state.scene=null;state.index=0;state.revealed=false;save();render()}
function reveal(){if(state.view!=='study'||state.revealed)return;state.revealed=true;save();render()}
function rateKnown(known){const u=currentUnit();if(!u)return;const k=unitKey(u.w,u.sid),now=Date.now(),prev=state.records[k]||{interval:0,reps:0};let due,interval;
  if(known){const prevDays=prev.interval?prev.interval/86400000:0;const days=prev.reps?Math.max(3,Math.round(prevDays*2.4)):3;interval=days*86400000;due=now+interval;state.stats.known=(state.stats.known||0)+1}
  else{interval=10*60000;due=now+interval;state.stats.unknown=(state.stats.unknown||0)+1}
  state.records[k]={due,interval,reps:(prev.reps||0)+1,last:now,lastKnown:known};save();
  const btn=document.querySelector(known?'.known':'.unknown');btn?.classList.add('flash');document.querySelector('.word-hero')?.classList.add('fade-out');
  setTimeout(()=>{state.index++;state.revealed=false;save();render();setTimeout(()=>{const n=currentUnit();if(n)speak(n.w.w)},90)},130)
}

function renderScenes(){return `<div class="screen scene-screen"><div class="scene-head"><h1>场景背单词</h1><div class="scene-tools"><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><div class="scene-grid">${Object.entries(SCENES).map(([id,name])=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${name}</span><span class="scene-count">${todayCount(id)}</span></button>`).join('')}</div><div class="scene-note">数字表示今天待学数量：到期复习 + 今日新词。</div></div>`}

function answerHtml(u){return `<div class="answer" onclick="event.stopPropagation()"><div class="answer-section"><div class="answer-label">释义</div><div class="definition">${u.s.m}</div></div><div class="answer-section"><div class="answer-label">高频搭配</div><div class="collocations">${u.s.c}</div></div><div class="answer-section"><div class="answer-label">例句</div>${u.s.e.map((e,i)=>`<div class="example"><span class="example-num">${i+1}.</span><span>${e}</span><button class="example-play" onclick="speak(${JSON.stringify(e)});event.stopPropagation()">🔊</button></div>`).join('')}</div><div class="answer-section"><div class="answer-label">词根 / 词源</div><div class="root">${u.w.root}</div></div><div class="answer-section"><div class="answer-label">易错提醒</div><div class="error-note">${u.s.x}</div><div class="error-pair"><div class="wrong">✕ ${u.s.bad}</div><div class="right">✓ ${u.s.good}</div></div></div></div>`}

function renderStudy(){const q=currentQueue(),u=currentUnit();if(!u)return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${SCENES[state.scene]}</div><div class="study-progress">完成</div></div><div class="done"><div><h2>今天完成了</h2><p>本场景当前没有待学项目。</p><button class="primary-btn" onclick="goScenes()">返回场景</button></div></div></div>`;
  const pos=Math.min(state.index+1,q.length);return `<div class="screen study-screen"><div class="study-top"><button class="back-btn" onclick="goScenes()">‹</button><div class="study-scene">${SCENES[state.scene]}</div><div class="study-progress">${pos} / ${q.length}</div></div><div class="study-body" onclick="reveal()"><div class="word-hero"><div class="word-line"><div class="word">${u.w.w}</div><button class="speak-btn" onclick="speak('${u.w.w}');event.stopPropagation()">🔊</button></div><div class="ipa">${u.w.ipa}</div>${state.revealed?'':'<div class="tap-hint">轻点空白处显示答案</div>'}</div>${state.revealed?answerHtml(u):''}</div><div class="rating"><button class="unknown" onclick="rateKnown(false)">不知道</button><button class="known" onclick="rateKnown(true)">知道</button></div></div>`}

function openPanel(kind){state.view=kind;save();render()}
function renderPanel(kind){if(kind==='stats'){const total=Object.keys(state.records).length,known=state.stats.known||0,unknown=state.stats.unknown||0;return `<div class="screen panel-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>统计</h2></div><div class="panel-block"><div class="stat-row"><span>已学习义项</span><b>${total}</b></div><div class="stat-row"><span>知道</span><b>${known}</b></div><div class="stat-row"><span>不知道</span><b>${unknown}</b></div></div><div class="panel-block muted">统计按“单词 × 场景义项”记录。</div></div>`}
  return `<div class="screen panel-screen"><div class="panel-top"><button class="back-btn" onclick="goScenes()">‹</button><h2>设置</h2></div><div class="panel-block"><div class="setting-row"><span>每日新词</span><select onchange="state.newPerDay=+this.value;save();render()">${[10,20,30,50].map(n=>`<option value="${n}" ${state.newPerDay===n?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="panel-block muted">新词数量固定；到期复习不设上限。</div></div>`}

function render(){let html=state.view==='study'?renderStudy():state.view==='stats'?renderPanel('stats'):state.view==='settings'?renderPanel('settings'):renderScenes();document.getElementById('app').innerHTML=html}
render();
