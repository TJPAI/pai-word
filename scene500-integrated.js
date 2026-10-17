// Scene500 composed-scene bridge.
// Adds a conservative playable subset to the existing PAI Word shell while
// preserving question/answer/rating/audio/SRS behavior owned by learning-runtime.js.
(function(){
  const VERSION='scene500-playable-v5';
  const MAX_SCENE_UNITS=50;
  const SCENE_SPECS=[
    {id:'cs018',name:'租房看房并询问居住条件',desc:'看房、房东、租约、水电与居住条件',lemmas:['rent','apartment','house','room','landlord','contract','lease','electricity','water','condition'],tags:['租房','看房','房东','租约','合同','水电','公寓','rent','landlord','lease','utilities']},
    {id:'cs043',name:'预订酒店并确认房型和政策',desc:'订房、房型、价格、取消与入住政策',lemmas:['hotel','book','reservation','room','price','cancel','confirm','available','guest','policy'],tags:['酒店','订房','预订','房型','取消','住宿','hotel','booking','reservation']},
    {id:'cs044',name:'酒店入住、房间与服务沟通',desc:'前台、入住、房间设施与酒店服务',lemmas:['hotel','check','room','key','front','desk','guest','service','stay','reservation'],tags:['酒店入住','入住','前台','房间','住宿','hotel','check in','front desk']},
    {id:'cs046',name:'机场值机、托运和安检',desc:'值机、登机牌、行李托运与机场安检',lemmas:['airport','check','ticket','passport','luggage','bag','security','gate','flight','board'],tags:['机场','值机','托运','行李','安检','登机牌','airport','check in','luggage','security']},
    {id:'cs047',name:'登机、航班延误与改签',desc:'登机、延误、取消、转机与改签',lemmas:['flight','delay','board','gate','ticket','cancel','change','depart','arrive','luggage'],tags:['航班','登机','延误','取消','改签','转机','飞机','flight','delay','board']},
    {id:'cs049',name:'过海关、签证与边境问答',desc:'入境、海关、签证、护照与边境问答',lemmas:['customs','passport','visa','border','enter','country','purpose','declare','officer','travel'],tags:['入境','海关','签证','边境','护照','美国入境','customs','immigration','visa','passport']},
    {id:'cs057',name:'看全科或专科医生并回答问诊',desc:'挂号后描述症状、病史与治疗需求',lemmas:['doctor','patient','symptom','pain','fever','cough','medicine','treatment','appointment','health'],tags:['医生','看病','问诊','症状','医院','doctor','patient','symptom']},
    {id:'cs062',name:'课堂听讲、提问和记笔记',desc:'课堂、讲座、提问、解释与笔记',lemmas:['lecture','class','question','answer','note','explain','example','understand','discuss','learn'],tags:['课堂','听课','讲座','提问','笔记','lecture','class','note']},
    {id:'cs064',name:'小组讨论并与同学合作',desc:'讨论观点、分工、协作与形成决定',lemmas:['group','team','discuss','agree','idea','share','project','partner','suggest','decision'],tags:['小组讨论','同学','合作','团队','讨论','group','team','discussion']},
    {id:'cs073',name:'准备并参加工作面试',desc:'经历、技能、职位、薪资与自我介绍',lemmas:['interview','experience','skill','career','job','position','candidate','strength','salary','company'],tags:['面试','求职','工作面试','自我介绍','招聘','interview','job','career']},
    {id:'cs076',name:'安排、参加和主持会议',desc:'日程、议程、讨论、汇报与会议决定',lemmas:['meeting','schedule','agenda','attend','discuss','report','update','deadline','task','decision'],tags:['会议','工作会议','商务会议','主持会议','议程','meeting','agenda','schedule']},
    {id:'cs079',name:'与客户沟通、服务和处理投诉',desc:'客户需求、支持、投诉与解决方案',lemmas:['customer','client','service','issue','support','request','solution','complaint','reply','confirm'],tags:['客户','客服','投诉','客户沟通','服务','client','customer','complaint','support']},
    {id:'cs081',name:'电脑、手机和常用软件操作',desc:'设备、App、软件、安装、更新与故障',lemmas:['phone','mobile','app','software','device','screen','battery','update','install','connect'],tags:['手机','电脑','app','软件','设备','故障','phone','computer','software','device']},
    {id:'cs088',name:'讨论人工智能和机器人应用',desc:'AI、机器人、算法、自动化与智能应用',lemmas:['artificial','intelligence','robot','model','algorithm','automation','data','system','machine','application'],tags:['人工智能','ai','机器人','无人机','智能','算法','自动化','robot','drone','machine learning']},
    {id:'cs090',name:'工厂生产、自动化和质量控制',desc:'生产、自动化、设备、检测与质量控制',lemmas:['factory','production','automation','quality','control','machine','equipment','inspect','process','system'],tags:['工厂','生产','自动化','质量控制','仓储','仓库','盘点','物流','factory','warehouse','inventory','automation']},
    {id:'cs092',name:'阅读论文并总结研究不足',desc:'论文、研究方法、结果、证据与研究不足',lemmas:['paper','research','study','method','result','data','analysis','evidence','theory','experiment'],tags:['论文','研究','学术','文献','paper','research','study']},
    {id:'cs096',name:'学术会议报告、提问和答辩',desc:'会议报告、演讲、提问、讨论与学术社交',lemmas:['conference','research','paper','present','presentation','question','answer','discuss','session','speaker'],tags:['学术会议','开会','会议报告','报告','答辩','学术交流','conference','academic conference','presentation']},
    {id:'cs468',name:'讨论气候变化与可持续发展',desc:'气候、能源、碳排放、环境与可持续发展',lemmas:['climate','environment','energy','carbon','emission','sustainable','pollution','resource','global','risk'],tags:['气候变化','可持续','环境','碳','能源','climate','sustainable','carbon']},
    {id:'cs206',name:'工作面试与自我介绍',desc:'兼容旧 pilot 场景',lemmas:['interview','experience','skill','career','job','position','candidate','strength','salary','company'],tags:['面试','求职','interview']},
    {id:'cs215',name:'安排并参加工作会议',desc:'兼容旧 pilot 场景',lemmas:['meeting','schedule','agenda','attend','discuss','report','update','deadline','task','decision'],tags:['会议','meeting']},
    {id:'cs223',name:'与客户沟通并处理问题',desc:'兼容旧 pilot 场景',lemmas:['customer','client','service','issue','support','request','solution','complaint','reply','confirm'],tags:['客户','client','customer']},
    {id:'cs254',name:'手机、App与设备问题',desc:'兼容旧 pilot 场景',lemmas:['phone','mobile','app','software','device','screen','battery','update','install','connect'],tags:['手机','app','设备','phone']},
    {id:'cs321',name:'阅读论文并做学术讨论',desc:'兼容旧 pilot 场景',lemmas:['paper','research','study','method','result','data','analysis','evidence','theory','experiment'],tags:['论文','学术','research']}
  ];
  const BASE_POOL={
    cs018:'daily',cs043:'travel',cs044:'travel',cs046:'travel',cs047:'travel',cs049:'travel',
    cs057:'health',cs062:'academic',cs064:'academic',cs073:'work',cs076:'work',cs079:'work',
    cs081:'tech',cs088:'tech',cs090:'tech',cs092:'academic',cs096:'academic',cs468:'public',
    cs206:'work',cs215:'work',cs223:'work',cs254:'tech',cs321:'academic'
  };
  const ids=new Set(SCENE_SPECS.map(x=>x.id));
  const keyOf=u=>unitKey(u.w,u.sid);
  const dayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const rankAllowed=(rank,difficulty)=>difficulty==='basic'?rank<=4000:difficulty==='common'?rank>4000&&rank<=8000:difficulty==='advanced'?rank>8000&&rank<=11000:difficulty==='high'?rank>11000:true;
  const activeDifficulty=scene=>state.scene500DifficultyByScene?.[scene]||'all';

  function primaryUnitForLemma(lemma){
    const words=window.PAI_CORE?.byLemma?.get(lemma)||[];
    for(const w of words){
      const entries=Object.entries(w.s||{});
      const sense=entries.find(([,s])=>String(s.kuType||'sense').toLowerCase()==='sense')||entries[0];
      if(sense){const u=window.PAI_CORE.byKU.get(sense[0]);if(u)return u}
    }
    return null;
  }

  function addUnit(units,seen,u){
    if(!u||units.length>=MAX_SCENE_UNITS)return;
    const k=keyOf(u);if(seen.has(k))return;
    seen.add(k);units.push(u);
  }

  function installSceneData(){
    if(!window.PAI_CORE)return;
    for(const spec of SCENE_SPECS){
      SCENES[spec.id]=spec.name;
      const units=[],seen=new Set();
      // Tier 1: explicitly curated scene lemmas always come first.
      for(const lemma of spec.lemmas)addUnit(units,seen,primaryUnitForLemma(lemma));
      // Tier 2 (temporary MVP): backfill from the closest existing controlled Core scene,
      // ranked by the Core lexicon rank. This expands the playable pool without inventing
      // words/KUs. It is intentionally broad and will be replaced by reviewed Scene500×KU mapping.
      const baseScene=BASE_POOL[spec.id];
      const fallback=[...(window.PAI_CORE.byScene.get(baseScene)||[])].sort((a,b)=>(Number(a?.w?.rank)||999999)-(Number(b?.w?.rank)||999999));
      for(const u of fallback){addUnit(units,seen,u);if(units.length>=MAX_SCENE_UNITS)break}
      window.PAI_CORE.byScene.set(spec.id,units);
    }
    window.PAI_SCENE500={version:VERSION,maxSceneUnits:MAX_SCENE_UNITS,sceneIds:[...ids],specs:SCENE_SPECS};
  }

  function pilotState(){
    state.scene500Pilot=state.scene500Pilot||{version:VERSION,days:{}};
    if(state.scene500Pilot.version!==VERSION)state.scene500Pilot={version:VERSION,days:{}};
    const date=dayKey();
    state.scene500Pilot.days[date]=state.scene500Pilot.days[date]||{};
    return state.scene500Pilot.days[date];
  }

  // Scene500 MVP deliberately assigns the whole filtered scene pool (up to 50)
  // instead of inheriting the global daily-new-word quota. This keeps the experiment
  // focused on scene relevance while leaving existing due/SRS records untouched.
  function assignment(scene,count=MAX_SCENE_UNITS,extend=false){
    const difficulty=activeDifficulty(scene),bucket=`${scene}::${difficulty}`,days=pilotState();
    const units=allUnits(scene).filter(u=>rankAllowed(Number(u?.w?.rank)||999999,difficulty));
    const existing=Array.isArray(days[bucket])?days[bucket]:[];
    if(!extend&&existing.length)return existing;
    const chosen=[...existing],seen=new Set(chosen);
    for(const u of units){
      const k=keyOf(u);if(seen.has(k)||state.records[k])continue;
      chosen.push(k);seen.add(k);
      if(chosen.length>=Math.min(MAX_SCENE_UNITS,existing.length+count))break;
    }
    days[bucket]=chosen;save();return chosen;
  }

  const baseQueueFor=window.queueFor||queueFor;
  window.queueFor=queueFor=function(scene){
    if(!ids.has(scene))return baseQueueFor(scene);
    const keys=assignment(scene),due=dueUnits(scene),dueSet=new Set(due.map(keyOf));
    const fresh=keys.filter(k=>!state.records[k]).map(findUnitByKey).filter(Boolean).filter(u=>!dueSet.has(keyOf(u)));
    state.daily=state.daily||{date:dayKey(),assigned:{}};
    state.daily.assigned=state.daily.assigned||{};
    state.daily.assigned[scene]=keys;
    return [...due,...fresh];
  };

  const baseOpenScene=window.openScene;
  window.openScene=function(scene){
    if(!ids.has(scene))return baseOpenScene(scene);
    assignment(scene,MAX_SCENE_UNITS);
    return baseOpenScene(scene);
  };

  const baseLearnMore=window.learnMore;
  window.learnMore=function(scene,n=10){
    if(!ids.has(scene))return baseLearnMore(scene,n);
    assignment(scene,n,true);
    return baseOpenScene(scene);
  };

  installSceneData();
})();