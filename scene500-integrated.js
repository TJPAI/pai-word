// Scene500 composed-scene bridge.
// Purpose: add a small composed-scene pilot to the existing PAI Word shell while
// preserving the production settings, question page, answer page, rating, swipe,
// audio and SRS interaction logic owned by learning-runtime.js.
(function(){
  const VERSION='scene500-integrated-pilot-v1';
  const SCENE_SPECS=[
    {id:'cs047',name:'登机、航班延误与改签',lemmas:['flight','delay','board','gate','ticket','cancel','change','depart','arrive','luggage']},
    {id:'cs057',name:'看医生并回答问诊',lemmas:['doctor','patient','symptom','pain','fever','cough','medicine','treatment','appointment','health']},
    {id:'cs062',name:'课堂听讲、提问和记笔记',lemmas:['lecture','class','question','answer','note','explain','example','understand','discuss','learn']},
    {id:'cs064',name:'小组讨论并与同学合作',lemmas:['group','team','discuss','agree','idea','share','project','partner','suggest','decision']},
    {id:'cs206',name:'工作面试与自我介绍',lemmas:['interview','experience','skill','career','job','position','candidate','strength','salary','company']},
    {id:'cs215',name:'安排并参加工作会议',lemmas:['meeting','schedule','agenda','attend','discuss','report','update','deadline','task','decision']},
    {id:'cs223',name:'与客户沟通并处理问题',lemmas:['customer','client','service','issue','support','request','solution','complaint','reply','confirm']},
    {id:'cs254',name:'手机、App与设备问题',lemmas:['phone','mobile','app','software','device','screen','battery','update','install','connect']},
    {id:'cs321',name:'阅读论文并做学术讨论',lemmas:['paper','research','study','method','result','data','analysis','evidence','theory','experiment']},
    {id:'cs468',name:'讨论气候变化与可持续发展',lemmas:['climate','environment','energy','carbon','emission','sustainable','pollution','resource','global','risk']}
  ];
  const ids=new Set(SCENE_SPECS.map(x=>x.id));
  const keyOf=u=>unitKey(u.w,u.sid);
  const dayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};

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
    for(const spec of SCENE_SPECS){
      SCENES[spec.id]=spec.name;
      const units=[],seen=new Set();
      for(const lemma of spec.lemmas){
        const u=primaryUnitForLemma(lemma);if(!u)continue;
        const k=keyOf(u);if(seen.has(k))continue;seen.add(k);units.push(u);
      }
      window.PAI_CORE.byScene.set(spec.id,units);
    }
    window.PAI_SCENE500={version:VERSION,sceneIds:[...ids],specs:SCENE_SPECS};
  }

  function pilotState(){
    state.scene500Pilot=state.scene500Pilot||{version:VERSION,days:{}};
    if(state.scene500Pilot.version!==VERSION)state.scene500Pilot={version:VERSION,days:{}};
    const date=dayKey();
    state.scene500Pilot.days[date]=state.scene500Pilot.days[date]||{};
    return state.scene500Pilot.days[date];
  }

  function assignment(scene,count=state.newPerDay||20,extend=false){
    const days=pilotState(),units=allUnits(scene),existing=Array.isArray(days[scene])?days[scene]:[];
    if(!extend&&existing.length)return existing;
    const chosen=[...existing],seen=new Set(chosen);
    for(const u of units){
      const k=keyOf(u);if(seen.has(k)||state.records[k])continue;
      chosen.push(k);seen.add(k);
      if(chosen.length>=existing.length+count)break;
    }
    days[scene]=chosen;save();return chosen;
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
  window.openScene=async function(scene){
    if(!ids.has(scene))return baseOpenScene(scene);
    const keys=assignment(scene);
    if(typeof ensureUnits==='function')await ensureUnits(keys);
    return baseOpenScene(scene);
  };

  const baseLearnMore=window.learnMore;
  window.learnMore=async function(scene,n=10){
    if(!ids.has(scene))return baseLearnMore(scene,n);
    const keys=assignment(scene,n,true);
    if(typeof ensureUnits==='function')await ensureUnits(keys);
    return baseOpenScene(scene);
  };

  installSceneData();
})();
