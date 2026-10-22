// PAI Word base data and state only. UI, learning flow, review, speech and settings
// are owned by app-runtime.js.
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

const STORAGE='pai-word-core20k-rebuild-preview-v21';
let state={view:'scenes',scene:null,index:0,revealed:false,newPerDay:50,wordsPerRound:10,records:{},stats:{known:0,unknown:0}};
try{state={...state,...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch(e){}

const PAI_SETTING_KEYS=['newPerDay','wordsPerRound','voiceAccent','hideWord','autoPronounce','tapTiming','autoBrowseEnabled','autoBrowseInterval','speechSpeed','showCollocations','showExamples','showCompare','selectedScene','sceneDifficulty'];
const PAI_HOME_KEYS=['sceneSearchUi','scene500Recent','scene500DifficultyByScene'];
// Safari may suspend/close an IndexedDB connection while the tab is backgrounded.
// Reopen only for connection-invalid errors; quota and transaction errors remain visible.
let paiReconnectPending=null;
async function paiWriteWithConnectionRecovery(method,value){
 const durable=window.PAI_KU_DURABLE;
 const db=window.PAI_KU_DURABLE_DB;
 try{return await durable[method](db,value)}
 catch(error){
  const msg=String(error?.name||'')+' '+String(error?.message||error||'');
  if(!/InvalidStateError|DatabaseClosedError|TransactionInactiveError|UnknownError|AbortError|connection is closing|database connection is closing|connection.*closed|database.*closed/i.test(msg))throw error;
  if(!paiReconnectPending)paiReconnectPending=(async()=>{
   const fresh=await durable.open();
   window.PAI_KU_DURABLE_DB=fresh;
   window.PAI_KU_STORAGE_READY=true;
   window.PAI_KU_STORAGE_FATAL=false;
   return fresh;
  })().finally(()=>{paiReconnectPending=null});
  const fresh=await paiReconnectPending;
  return durable[method](fresh,value);
 }
}
let paiHomeLast=null,paiHomeQueued=null,paiHomeQueue=Promise.resolve();
function persistHomeState(){
 if(!window.PAI_KU_STORAGE_READY)return;
 const home={};for(const key of PAI_HOME_KEYS)if(Object.prototype.hasOwnProperty.call(state,key))home[key]=structuredClone(state[key]);
 const serialized=JSON.stringify(home);if(serialized===paiHomeQueued||(serialized===paiHomeLast&&paiHomeQueued===null))return;
 paiHomeQueued=serialized;
 paiHomeQueue=paiHomeQueue.catch(()=>{}).then(()=>paiWriteWithConnectionRecovery('writeHome',home)).then(()=>{paiHomeLast=serialized;if(paiHomeQueued===serialized)paiHomeQueued=null;window.PAI_HOME_SAVE_ERROR=null}).catch(e=>{if(paiHomeQueued===serialized)paiHomeQueued=null;window.PAI_HOME_SAVE_ERROR=String(e);console.warn('PAI_HOME_IDB_WRITE_FAILED',e);let banner=document.getElementById('pai-home-save-error');if(!banner){banner=document.createElement('div');banner.id='pai-home-save-error';banner.setAttribute('role','alert');banner.style.cssText='position:fixed;top:calc(66px + env(safe-area-inset-top,0px));left:12px;right:12px;z-index:99999;background:#7f1d1d;color:white;padding:10px;border-radius:10px;font:13px system-ui;pointer-events:none';document.body.appendChild(banner)}banner.textContent='场景或难度保存失败：刷新后可能丢失最近修改。';setTimeout(()=>banner.remove(),7000)});
}

let paiSettingsLast=null,paiSettingsQueued=null,paiSettingsQueue=Promise.resolve();
function persistIndependentSettings(){
 if(!window.PAI_KU_STORAGE_READY)return;
 const settings={};for(const key of PAI_SETTING_KEYS)if(Object.prototype.hasOwnProperty.call(state,key))settings[key]=state[key];
 const serialized=JSON.stringify(settings);if(serialized===paiSettingsQueued||(serialized===paiSettingsLast&&paiSettingsQueued===null))return;
 paiSettingsQueued=serialized;
 paiSettingsQueue=paiSettingsQueue.catch(()=>{}).then(()=>paiWriteWithConnectionRecovery('writeSettings',settings)).then(()=>{paiSettingsLast=serialized;if(paiSettingsQueued===serialized)paiSettingsQueued=null;window.PAI_SETTINGS_SAVE_ERROR=null}).catch(e=>{if(paiSettingsQueued===serialized)paiSettingsQueued=null;window.PAI_SETTINGS_SAVE_ERROR=String(e);console.warn('PAI_SETTINGS_IDB_WRITE_FAILED',e);let banner=document.getElementById('pai-settings-save-error');if(!banner){banner=document.createElement('div');banner.id='pai-settings-save-error';banner.setAttribute('role','alert');banner.style.cssText='position:fixed;top:calc(66px + env(safe-area-inset-top,0px));left:12px;right:12px;z-index:99999;background:#7f1d1d;color:white;padding:10px;border-radius:10px;font:13px system-ui;pointer-events:none';document.body.appendChild(banner)}banner.textContent='设置保存失败：本次修改可能在刷新后丢失。';setTimeout(()=>banner.remove(),7000)});
}
// Read-only foreground probe: Safari may keep a stale IDB handle after a long suspension.
// Do not touch SRS versions or overwrite records. Writes reopen on recognized transient failures.
window.PAI_STORAGE_PROBE=async()=>{
 const at=Date.now(),info={at,hidden:document.hidden,settings:'not-ready'};
 try{const db=window.PAI_KU_DURABLE_DB;if(!db)throw Error('DB not initialized');await window.PAI_KU_DURABLE.readSettings(db);info.settings='ok'}
 catch(error){info.settings='failed';info.errorName=error?.name||'Error';info.errorMessage=String(error?.message||error);}
 window.PAI_LAST_FOREGROUND_STORAGE_PROBE=info;return info;
};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void window.PAI_STORAGE_PROBE()});
window.addEventListener('pageshow',()=>{void window.PAI_STORAGE_PROBE()});
window.PAI_PERSISTENCE_FLUSH=()=>Promise.allSettled([paiHomeQueue,paiSettingsQueue]);
function save(){
  if(window.PAI_SAVE_DEFERRED===true)return true;
  persistIndependentSettings();
  persistHomeState();
  try{
    // Only ephemeral daily assignments are omitted; canonical SRS records remain.
    const snapshot={...state};
    delete snapshot.daily;
    localStorage.setItem(STORAGE,JSON.stringify(snapshot));
    window.PAI_PREVIEW_STORAGE_ERROR=null;
    return true;
  }catch(error){
    // IndexedDB is the KU authority once initialized; localStorage is only legacy backup.
    if(window.PAI_KU_STORAGE_READY===true)return true;
    window.PAI_PREVIEW_STORAGE_ERROR=String(error?.message||error);
    console.warn('PAI_PREVIEW_STORAGE_QUOTA',error);
    if(!document.getElementById('pai-preview-storage-warning')){
      const notice=document.createElement('div');
      notice.id='pai-preview-storage-warning';
      notice.setAttribute('role','alert');
      notice.style.cssText='position:fixed;top:calc(66px + env(safe-area-inset-top,0px));left:12px;right:12px;z-index:99999;background:#78350f;color:#fff;padding:10px;border-radius:10px;font:13px system-ui;pointer-events:none;box-shadow:0 3px 12px #0003';
      notice.textContent='Safari 存储空间不足：当前存储写入失败；评分不会被视为成功，请先备份学习数据并检查存储。';
      document.body.appendChild(notice);
      setTimeout(()=>notice.remove(),8000);
    }
    return false;
  }
}
function unitKey(w,sid){return w.s[sid]?.ku_id||`${w.w}::${sid}`}
function findUnitByKey(k){return window.PAI_CORE?.byKU.get(k)||null}
function allUnits(scene){return window.PAI_CORE?.byScene.get(scene)||[]}
function dueUnits(scene){const now=Date.now();return allUnits(scene).filter(u=>state.records[unitKey(u.w,u.sid)]?.due<=now)}
function unseenUnits(scene){return allUnits(scene).filter(u=>!state.records[unitKey(u.w,u.sid)])}

// Base queue helpers are intentionally simple; daily.js replaces queueFor/todayCount
// with the production daily-assignment policy before app-runtime.js loads.
function queueFor(scene){const due=dueUnits(scene),unseen=unseenUnits(scene).slice(0,state.newPerDay),seen=new Set(due.map(u=>unitKey(u.w,u.sid)));return [...due,...unseen.filter(u=>!seen.has(unitKey(u.w,u.sid)))]}
function todayCount(scene){return queueFor(scene).length}
function currentQueue(){return state.scene?queueFor(state.scene):[]}
function currentUnit(){const q=currentQueue();return q[0]||null}

function goScenes(){
  if('speechSynthesis' in window)speechSynthesis.cancel();
  state.view='scenes';state.scene=null;state.index=0;state.revealed=false;
  save();
  if(typeof render==='function')render();
}
function openPanel(kind){state.view=kind;save();if(typeof render==='function')render()}
