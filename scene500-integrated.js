// Scene500 composed-scene data bridge.
// Scene definitions live here; playable vocabulary membership is data-driven.
// Study-session sizing, daily budgets, queue construction and grading are owned by round-policy.js.
(function(){
  const VERSION='scene500-playable-v9-membership-data';
  const SCENE_SPECS=[
    {id:'cs018',name:'租房看房并询问居住条件',desc:'看房、房东、租约、水电与居住条件',tags:['租房','看房','房东','租约','合同','水电','公寓','rent','landlord','lease','utilities']},
    {id:'cs043',name:'预订酒店并确认房型和政策',desc:'订房、房型、价格、取消与入住政策',tags:['酒店','订房','预订','房型','取消','住宿','hotel','booking','reservation']},
    {id:'cs044',name:'酒店入住、房间与服务沟通',desc:'前台、入住、房间设施与酒店服务',tags:['酒店入住','入住','前台','房间','住宿','hotel','check in','front desk']},
    {id:'cs046',name:'机场值机、托运和安检',desc:'值机、登机牌、行李托运与机场安检',tags:['机场','值机','托运','行李','安检','登机牌','airport','check in','luggage','security']},
    {id:'cs047',name:'登机、航班延误与改签',desc:'登机、延误、取消、转机与改签',tags:['航班','登机','延误','取消','改签','转机','飞机','flight','delay','board']},
    {id:'cs049',name:'过海关、签证与边境问答',desc:'入境、海关、签证、护照与边境问答',tags:['入境','海关','签证','边境','护照','美国入境','customs','immigration','visa','passport']},
    {id:'cs057',name:'看全科或专科医生并回答问诊',desc:'挂号后描述症状、病史与治疗需求',tags:['医生','看病','问诊','症状','医院','doctor','patient','symptom']},
    {id:'cs062',name:'课堂听讲、提问和记笔记',desc:'课堂、讲座、提问、解释与笔记',tags:['课堂','听课','讲座','提问','笔记','lecture','class','note']},
    {id:'cs064',name:'小组讨论并与同学合作',desc:'讨论观点、分工、协作与形成决定',tags:['小组讨论','同学','合作','团队','讨论','group','team','discussion']},
    {id:'cs073',name:'准备并参加工作面试',desc:'经历、技能、职位、薪资与自我介绍',tags:['面试','求职','工作面试','自我介绍','招聘','interview','job','career']},
    {id:'cs076',name:'安排、参加和主持会议',desc:'日程、议程、讨论、汇报与会议决定',tags:['会议','工作会议','商务会议','主持会议','议程','meeting','agenda','schedule']},
    {id:'cs079',name:'与客户沟通、服务和处理投诉',desc:'客户需求、支持、投诉与解决方案',tags:['客户','客服','投诉','客户沟通','服务','client','customer','complaint','support']},
    {id:'cs081',name:'电脑、手机和常用软件操作',desc:'设备、App、软件、安装、更新与故障',tags:['手机','电脑','app','软件','设备','故障','phone','computer','software','device']},
    {id:'cs088',name:'讨论人工智能和机器人应用',desc:'AI、机器人、算法、自动化与智能应用',tags:['人工智能','ai','机器人','无人机','智能','算法','自动化','robot','drone','machine learning']},
    {id:'cs090',name:'工厂生产、自动化和质量控制',desc:'生产、自动化、设备、检测与质量控制',tags:['工厂','生产','自动化','质量控制','仓储','仓库','盘点','物流','factory','warehouse','inventory','automation']},
    {id:'cs092',name:'阅读论文并总结研究不足',desc:'论文、研究方法、结果、证据与研究不足',tags:['论文','研究','学术','文献','paper','research','study']},
    {id:'cs096',name:'学术会议报告、提问和答辩',desc:'会议报告、演讲、提问、讨论与学术社交',tags:['学术会议','开会','会议报告','报告','答辩','学术交流','conference','academic conference','presentation']},
    {id:'cs468',name:'讨论气候变化与可持续发展',desc:'气候、能源、碳排放、环境与可持续发展',tags:['气候变化','可持续','环境','碳','能源','climate','sustainable','carbon']},
    {id:'cs206',name:'工作面试与自我介绍',desc:'兼容旧 pilot 场景',tags:['面试','求职','interview']},
    {id:'cs215',name:'安排并参加工作会议',desc:'兼容旧 pilot 场景',tags:['会议','meeting']},
    {id:'cs223',name:'与客户沟通并处理问题',desc:'兼容旧 pilot 场景',tags:['客户','client','customer']},
    {id:'cs254',name:'手机、App与设备问题',desc:'兼容旧 pilot 场景',tags:['手机','app','设备','phone']},
    {id:'cs321',name:'阅读论文并做学术讨论',desc:'兼容旧 pilot 场景',tags:['论文','学术','research']}
  ];
  const ids=new Set(SCENE_SPECS.map(x=>x.id));
  const membership=window.PAI_SCENE500_MEMBERSHIP||{};
  const membershipScenes=membership.scenes||{};

  function primaryUnitForLemma(lemma){
    const words=window.PAI_CORE?.byLemma?.get(lemma)||[];
    for(const w of words){
      const entries=Object.entries(w.s||{});
      const sense=entries.find(([,s])=>String(s.kuType||'sense').toLowerCase()==='sense')||entries[0];
      if(sense){const u=window.PAI_CORE.byKU.get(sense[0]);if(u)return u}
    }
    return null;
  }

  function installSceneData(){
    if(!window.PAI_CORE)return;
    const qa={missingMembership:[],emptyPlayable:[],unresolvedLemmas:[],duplicateEntries:[]};
    for(const spec of SCENE_SPECS){
      SCENES[spec.id]=spec.name;
      const source=membershipScenes[spec.id];
      if(!source)qa.missingMembership.push(spec.id);
      const entries=Array.isArray(source?.entries)?source.entries:[];
      const units=[],seenWords=new Set(),seenLemma=new Set();
      for(const raw of entries){
        const lemma=String(typeof raw==='string'?raw:raw?.lemma||'').trim().toLowerCase();
        if(!lemma)continue;
        if(seenLemma.has(lemma)){qa.duplicateEntries.push(`${spec.id}:${lemma}`);continue}
        seenLemma.add(lemma);
        const u=primaryUnitForLemma(lemma);
        if(!u){qa.unresolvedLemmas.push(`${spec.id}:${lemma}`);continue}
        const wordKey=u.w?.rank??u.w?.w;if(seenWords.has(wordKey))continue;
        seenWords.add(wordKey);units.push(u);
      }
      if(!units.length)qa.emptyPlayable.push(spec.id);
      window.PAI_CORE.byScene.set(spec.id,units);
    }
    window.PAI_SCENE500={
      version:VERSION,
      sceneIds:[...ids],
      specs:SCENE_SPECS,
      membershipSchemaVersion:membership.schemaVersion||null,
      membershipStatus:membership.status||'missing',
      playableVocabulary:'membership_data_only',
      broadBackfillPlayable:false,
      sessionPolicyOwner:'round-policy.js',
      qa
    };
  }
  installSceneData();
})();