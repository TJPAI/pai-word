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
 const foodTopicSets=[
  {name:'鱼类',terms:['鱼类','鱼种','各种鱼','淡水鱼','海水鱼','fish species','types of fish'],words:'fish salmon tuna trout cod carp catfish bass perch pike eel herring mackerel sardine anchovy halibut flounder sole snapper grouper tilapia haddock pollock sturgeon swordfish marlin shark ray skate goldfish guppy koi minnow salmonella fishery aquatic freshwater saltwater fin gill scale spawn school shoal'},
  {name:'水果',terms:['水果','果园','买水果','fruit','fruits'],words:'fruit apple banana orange pear peach grape strawberry blueberry raspberry blackberry cherry pineapple mango watermelon melon lemon lime grapefruit kiwi coconut papaya plum apricot fig date pomegranate avocado lychee tangerine nectarine raisin berry citrus ripe juicy peel seed'},
  {name:'海鲜',terms:['海鲜','海产品','海鲜市场','seafood','shellfish'],words:'seafood fish shrimp prawn crab lobster oyster mussel clam scallop squid octopus salmon tuna cod sardine anchovy herring mackerel trout eel shellfish seaweed roe fillet shell fresh frozen grill steam boil fry catch'},
  {name:'肉类',terms:['肉类','肉店','meat'],words:'meat beef pork chicken lamb mutton turkey duck steak sausage bacon ham rib breast thigh roast grill fry butcher'},
  {name:'饮料',terms:['饮料','喝什么','beverage','drink'],words:'drink beverage water juice milk coffee tea soda lemonade smoothie cocktail bottle glass cup thirst'},
  {name:'甜点与烘焙',terms:['甜点','蛋糕','烘焙','dessert','bakery'],words:'dessert cake bread cookie biscuit pie pastry chocolate cream butter sugar flour oven bake sweet'}
 ];
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
 const TOPIC_BATCH_SIZE=20;
 window.setTopicInput=v=>{topicInput=String(v||'').slice(0,160)};
 const semanticGroups=[
  {id:'food',aliases:['食品','食物','吃','饮食','food'],children:['水果','蔬菜与烹饪','海鲜','鱼类','肉类','饮料','甜点与烘焙']},
  {id:'market',aliases:['市场','买菜','采购','购物','market'],children:['水果','蔬菜与烹饪','海鲜','鱼类','肉类','超市购物']},
  {id:'cooking',aliases:['做饭','烹饪','晚餐','午餐','厨房','cook','dinner'],children:['蔬菜与烹饪','海鲜','鱼类','肉类','水果']},
  {id:'restaurant',aliases:['餐厅','点餐','饭店','restaurant'],children:['餐厅点餐','海鲜','肉类','蔬菜与烹饪','饮料']}
 ];
 const topics=[...foodTopicSets,...topicSets];
 const topicByName=new Map(topics.map(t=>[t.name,t]));
 const topicIndex=new Map();
 function addTopicTag(lemma,topic,weight,source){
  const k=lemma.toLowerCase();if(!topicIndex.has(k))topicIndex.set(k,[]);
  const tags=topicIndex.get(k),old=tags.find(x=>x.topic===topic);
  if(old){if(weight>old.weight){old.weight=weight;old.source=source}}else tags.push({topic,weight,source});
 }
 for(const t of topics)for(const [i,lemma]of t.words.split(' ').entries())addTopicTag(lemma,t.name,Math.max(15,100-i*2),'curated');
 // Build an additional semantic index from actual Core-13000 sense glosses.
 // A tag is inferred only when a meaning contains a precise category term.
 const glossRules=[
  {topic:'水果',patterns:['水果','果实','浆果','柑橘','苹果','香蕉','葡萄','桃子','梨子','芒果','草莓','樱桃','西瓜','菠萝']},
  {topic:'鱼类',patterns:['鱼类','鱼种','淡水鱼','海水鱼','鲑鱼','鳕鱼','鲤鱼','鲶鱼','鲈鱼','鳗鱼','鲱鱼','鲭鱼','沙丁鱼','金枪鱼','鳟鱼','鲨鱼','比目鱼','鳃','鱼鳍']},
  {topic:'海鲜',patterns:['海鲜','贝类','甲壳类','虾','螃蟹','牡蛎','扇贝','贻贝','龙虾','鱿鱼','章鱼','鲑鱼','金枪鱼','沙丁鱼']},
  {topic:'蔬菜与烹饪',patterns:['蔬菜','绿叶菜','胡萝卜','卷心菜','菠菜','黄瓜','茄子','洋葱','烹饪','烹调']},
  {topic:'动物园',patterns:['动物园','野生动物','哺乳动物','长颈鹿','斑马','大象','狮子','老虎','猴子']},
  {topic:'机场与登机',patterns:['机场','登机','航班','航站楼','行李托运']},
  {topic:'医院就诊',patterns:['医院','就诊','诊断','处方','症状','病人']},
  {topic:'餐厅点餐',patterns:['餐厅','点餐','菜单','服务员','账单']},
  {topic:'酒店住宿',patterns:['酒店','旅馆','住宿','前台','客房']},
  {topic:'超市购物',patterns:['超市','收银','购物车','货架']},
  {topic:'天气与自然',patterns:['天气','气温','气象','暴风雨','降雨']},
  {topic:'学校与课堂',patterns:['学校','教室','课堂','学生','教师']},
  {topic:'体育与运动',patterns:['体育','运动员','比赛','训练','帆船']},
  {topic:'肉类',patterns:['肉类','牛肉','猪肉','羊肉','鸡肉','香肠']},
  {topic:'饮料',patterns:['饮料','果汁','咖啡','茶饮','汽水']},
  {topic:'甜点与烘焙',patterns:['甜点','甜品','糕点','蛋糕','烘焙']}
 ];
 const taxonomy=[
  {id:'nature',label:'自然界',parent:null,topics:['天气与自然','动物园','鱼类']},
  {id:'animals',label:'动物',parent:'nature',topics:['动物园','鱼类']},
  {id:'aquatic',label:'水生动物',parent:'animals',topics:['鱼类','海鲜']},
  {id:'fish',label:'鱼类',parent:'aquatic',topics:['鱼类']},
  {id:'wildlife',label:'野生动物',parent:'animals',topics:['动物园']},
  {id:'food',label:'食品',parent:null,topics:['水果','蔬菜与烹饪','海鲜','鱼类','肉类','饮料','甜点与烘焙']},
  {id:'produce',label:'果蔬',parent:'food',topics:['水果','蔬菜与烹饪']},
  {id:'fruit',label:'水果',parent:'produce',topics:['水果']},
  {id:'vegetable',label:'蔬菜',parent:'produce',topics:['蔬菜与烹饪']},
  {id:'seafood',label:'海鲜',parent:'food',topics:['海鲜','鱼类']},
  {id:'meat',label:'肉类',parent:'food',topics:['肉类']},
  {id:'drink',label:'饮料',parent:'food',topics:['饮料']},
  {id:'dessert',label:'甜点',parent:'food',topics:['甜点与烘焙']},
  {id:'activities',label:'生活场景',parent:null,topics:['机场与登机','医院就诊','餐厅点餐','酒店住宿','超市购物','学校与课堂','体育与运动']},
  {id:'travel',label:'出行住宿',parent:'activities',topics:['机场与登机','酒店住宿']},
  {id:'shopping',label:'购物',parent:'activities',topics:['超市购物']},
  {id:'dining',label:'餐饮',parent:'activities',topics:['餐厅点餐']},
  {id:'health',label:'医疗',parent:'activities',topics:['医院就诊']},
  {id:'education',label:'教育',parent:'activities',topics:['学校与课堂']},
  {id:'sports',label:'运动',parent:'activities',topics:['体育与运动']}
 ];
 const taxonomyById=new Map(taxonomy.map(n=>[n.id,n]));
 const taxonomyTopicMap=new Map();
 for(const node of taxonomy)for(const topic of node.topics){if(!taxonomyTopicMap.has(topic))taxonomyTopicMap.set(topic,[]);taxonomyTopicMap.get(topic).push(node.id)}
 const taxonomyAncestors=id=>{const ids=[];let n=taxonomyById.get(id);while(n){ids.push(n.id);n=n.parent?taxonomyById.get(n.parent):null}return ids};
 const senseTags=new Map(),indexStats={catalogWords:core.words.length,catalogKU:core.byKU.size,glossTaggedKU:0,curatedHeadwords:topicIndex.size};
 for(const w of core.words)for(const s of Object.values(w.s)){
  if(s.kuType!=='sense')continue;
  const meaning=String(s.m||'')+' '+String(s.kuTitle||''),tags=[];
  for(const rule of glossRules)if(rule.patterns.some(p=>meaning.includes(p)))tags.push(rule.topic);
  if(tags.length){senseTags.set(s.ku_id,tags);indexStats.glossTaggedKU++}
 }
 const topicCoverage={};
 for(const t of topics)topicCoverage[t.name]={curatedAvailable:0,glossTaggedKU:0,glossTaggedHeadwords:0};
 for(const w of core.words){
  const curated=new Set((topicIndex.get(w.w.toLowerCase())||[]).map(x=>x.topic));
  const inferred=new Set();
  for(const s of Object.values(w.s))for(const tag of senseTags.get(s.ku_id)||[]){topicCoverage[tag].glossTaggedKU++;inferred.add(tag)}
  for(const tag of curated)topicCoverage[tag].curatedAvailable++;
  for(const tag of inferred)topicCoverage[tag].glossTaggedHeadwords++;
 }
 indexStats.topics=topicCoverage;
 indexStats.taggedHeadwords=[...new Set([...topicIndex.keys(),...core.words.filter(w=>Object.values(w.s).some(s=>senseTags.has(s.ku_id))).map(w=>w.w.toLowerCase())])].length;
 window.PAI_TOPIC_INDEX_QA=indexStats;
 indexStats.taxonomyNodes=taxonomy.length;
 const kuSemanticIndex=new Map();
 for(const w of core.words){
  const curated=topicIndex.get(w.w.toLowerCase())||[];
  for(const s of Object.values(w.s)){
   if(s.kuType!=='sense')continue;
   const inferred=senseTags.get(s.ku_id)||[];
   const sources=[...curated.map(x=>({topic:x.topic,source:'curated',confidence:0.8})),...inferred.map(topic=>({topic,source:'gloss_rule',confidence:0.55}))];
   if(!sources.length)continue;
   const nodes=new Set();
   for(const source of sources)for(const id of taxonomyTopicMap.get(source.topic)||[])for(const ancestor of taxonomyAncestors(id))nodes.add(ancestor);
   kuSemanticIndex.set(s.ku_id,{nodes:[...nodes],sources});
  }
 }
 indexStats.indexedSenseKU=kuSemanticIndex.size;
 window.PAI_TOPIC_INDEX_QA=indexStats;
 window.PAI_TOPIC_INDEX_REPORT=()=>JSON.parse(JSON.stringify(indexStats));
 window.PAI_TOPIC_TAXONOMY=taxonomy.map(n=>({...n}));
 window.PAI_TOPIC_KU_TAGS=key=>{const v=kuSemanticIndex.get(key);return v?JSON.parse(JSON.stringify(v)):null};

 function topicMatch(input){
  const q=input.trim().toLowerCase(),scores=new Map();
  for(const t of topics){const hit=t.terms.reduce((n,term)=>n+(q.includes(term.toLowerCase())?term.length+2:0),0);if(hit)scores.set(t.name,hit*12)}
  for(const group of semanticGroups)if(group.aliases.some(a=>q.includes(a.toLowerCase())))for(const child of group.children)scores.set(child,Math.max(scores.get(child)||0,20));
  if(/鱼类|鱼种|淡水鱼|海水鱼|各种鱼|fish species|types of fish/.test(q))scores.set('鱼类',Math.max(scores.get('鱼类')||0,120));
  if(/海鲜|海产品|seafood/.test(q))scores.set('鱼类',Math.max(scores.get('鱼类')||0,30));
  return [...scores].sort((a,b)=>b[1]-a[1]).map(([name,weight])=>({topic:topicByName.get(name),weight}));
 }
 function topicCandidates(q,matches){
  const normalized=q.trim().toLowerCase();
  const clean=normalized.replace(/[，。！？、；：,.!?;:()（）]/g,' ').replace(/^(我想|我想要|我要|我需要|请|帮我|学习|背|关于|有关|一些|去|在|的|英语|单词|词汇|场景)+/g,'').replace(/(相关|场景|单词|词汇|英语|怎么说|有哪些|的)+$/g,'').trim();
  const tokens=[clean,normalized].filter((x,i,a)=>x.length>=2&&a.indexOf(x)===i);
  const weights=new Map(matches.map(x=>[x.topic.name,x.weight]));
  const scored=[];
  for(const w of core.words){
   const lemma=w.w.toLowerCase(),tags=topicIndex.get(lemma)||[];
   let best=null;
   for(const s of Object.values(w.s)){
    if(s.kuType!=='sense')continue;
    const gloss=String(s.m||'').toLowerCase(),title=String(s.kuTitle||'').toLowerCase();
    const direct=tokens.some(x=>gloss.includes(x)||title.includes(x));
    const inferred=senseTags.get(s.ku_id)||[];const matchedTags=[...tags.filter(x=>weights.has(x.topic)),...inferred.filter(x=>weights.has(x)).map(topic=>({topic,weight:65}))];
    const tagScore=matchedTags.length?Math.max(...matchedTags.map(x=>x.weight+weights.get(x.topic)*2)):0;
    const context=matches.some(x=>x.topic.terms.some(term=>term.length>=2&&(gloss.includes(term.toLowerCase())||title.includes(term.toLowerCase()))));
    if(!direct&&!tagScore&&!context)continue;
    const score=tagScore+(direct?160:0)+(context?35:0)-w.rank/5000;
    if(!best||score>best.score)best={key:s.ku_id,score};
   }
   if(best)scored.push({...best,rank:w.rank,known:!!state.records[best.key]});
  }
  return scored.sort((a,b)=>Number(a.known)-Number(b.known)||b.score-a.score||a.rank-b.rank).map(x=>x.key);
 }
 window.continueTopicStudy=()=>{
  const q=state.topicStudyQuery;if(!q)return;
  const keys=topicCandidates(q,topicMatch(q));
  const unseen=keys.filter(k=>!state.records[k]);
  if(!unseen.length){topicFeedback='本场景已没有未接触的 KU；已学习内容将按复习计划出现。';active=false;state.view='scenes';render();return}
  start(unseen.slice(0,TOPIC_BATCH_SIZE),(state.topicStudyTitle||q)+' · 继续学习','topic')
 };
 const topicWordCount=keys=>new Set(keys.map(k=>byKey(k)?.w?.w?.toLowerCase()).filter(Boolean)).size;
 const cachedTopicCandidates=topics.map(t=>({name:t.name,keys:topicCandidates(t.terms[0],topicMatch(t.terms[0]))}));
 const topicCatalog=()=>cachedTopicCandidates.map(t=>({name:t.name,words:topicWordCount(t.keys),ku:t.keys.length,unseen:t.keys.filter(k=>!state.records[k]).length}));
 window.PAI_TOPIC_CATALOG=topicCatalog;
 // Independently audit all proposed themes; this is a candidate index, not verification.
 let additionalDimensions=null;
 const dimensionKeys=new Map();
 async function loadAdditionalDimensions(){
  try{
   const response=await fetch('data/scene-dimensions-v1.json');
   if(!response.ok)throw Error('dimension HTTP '+response.status);
   const doc=await response.json();
   additionalDimensions=doc.dimensions;
   const entries=additionalDimensions.flatMap(d=>d.groups.flatMap(g=>g.items.map(i=>({id:i.id,name:i.name,dimension:d.id,keys:[],words:new Set(),evidence:new Map()}))));
   const explicitTaskTerms={
    '处理航班延误':['航班延误','航班取消','延误','改签'],
    '行李丢失申报':['行李丢失','遗失行李','行李认领'],
    '退货退款':['退款','退货','退还货款'],
    '问路导航':['问路','指路','导航','路线'],
    '描述症状':['症状','疼痛','发烧','咳嗽'],
    '遵医嘱用药':['处方','剂量','服药','用药'],
    '检索文献':['文献检索','参考文献','检索'],
    '撰写摘要':['摘要','概述'],
    '回复审稿意见':['审稿','评审意见','同行评议'],
    '报告数据':['统计数据','实验数据','数据报告'],
    '谈合同':['合同','协议','签约'],
    '报告风险':['风险评估','风险管理'],
    '原因与结果':['因果','原因','结果','导致'],
    '条件与假设':['假设','条件','前提'],
    '比较与对比':['比较','对比','差异'],
    '表达不确定性':['不确定','可能性','怀疑'],
    '证据与结论':['证据','结论','推论'],
    '权衡利弊':['利弊','权衡','取舍'],
    '批判与质疑':['质疑','批判','反驳']
   };
   const matchTerms=new Map(entries.map(e=>[e.id,[e.name,...(explicitTaskTerms[e.name]||[])].filter(x=>x.length>=2)]));
   // Only explicit full-label gloss matches are admitted. Each match records
   // the source field, never an invented dictionary verification status.
   const reverse=new Map();
   if(sceneCacheRows.size!==312){
   for(const w of core.words)for(const s of Object.values(w.s)){
    if(s.kuType!=='sense')continue;
    const gloss=String(s.m||''),title=String(s.kuTitle||'');
    for(const e of entries){
     const term=(matchTerms.get(e.id)||[]).find(t=>gloss.includes(t)||title.includes(t));
     const source=term?(gloss.includes(term)?(term===e.name?'sense_gloss_exact':'sense_gloss_alias'):(term===e.name?'ku_title_exact':'ku_title_alias')):null;
     if(!source)continue;
     e.keys.push(s.ku_id);e.words.add(w.rank);
     const evidence={dimension:e.dimension,sceneId:e.id,sceneName:e.name,kuId:s.ku_id,word:w.w,rank:w.rank,source,matchedText:term,verified:false,reviewStatus:'pending'};
     e.evidence.set(s.ku_id,evidence);
     if(!reverse.has(s.ku_id))reverse.set(s.ku_id,[]);
     reverse.get(s.ku_id).push(evidence);
    }
   }
   }
   for(const e of entries){const cached=sceneCacheRows.get(e.id);if(cached){e.keys=(cached.keys||[]).filter(k=>byKey(k));for(const k of e.keys)e.words.add(byKey(k).w.rank)}dimensionKeys.set(e.id,e.keys)}
   saveSceneCache();
   const stats=new Map(entries.map(e=>[e.id,{ku:e.keys.length,words:e.words.size,status:'candidate_unverified'}]));
   window.PAI_SCENE_DIMENSIONS=()=>additionalDimensions.map(d=>({id:d.id,label:d.label,groups:d.groups.map(g=>({name:g.name,count:g.items.length,items:g.items.map(i=>({id:i.id,name:i.name,...stats.get(i.id)}))}))}));
   window.PAI_DIMENSION_KU_TAGS=kuId=>(reverse.get(kuId)||[]).map(e=>({...e}));
   window.PAI_DIMENSION_EVIDENCE=(sceneId,limit=30)=>{
    const e=entries.find(x=>x.id===sceneId);
    return e?[...e.evidence.values()].slice(0,Math.max(0,Math.min(500,Number(limit)||30))).map(x=>({...x})):[];
   };
   window.PAI_SCENE_AUDIT_EXPORT=()=>{
    const dimensions=entries.map(e=>({
     id:e.id,name:e.name,dimension:e.dimension,words:e.words.size,ku:e.keys.length,
     evidence:[...e.evidence.values()].map(v=>({...v}))
    }));
    return {schemaVersion:1,generatedAt:new Date().toISOString(),source:'runtime_gloss_exact_matching',reviewed:false,dimensions};
   };
   window.PAI_SCENE_AUDIT_DOWNLOAD=()=>{
    const payload=JSON.stringify(window.PAI_SCENE_AUDIT_EXPORT());
    const blob=new Blob([payload],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download='pai-scene-audit-candidates.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
   };
   window.PAI_DIMENSION_QA=()=>{
    const empty=entries.filter(e=>!e.keys.length).map(e=>({id:e.id,name:e.name,dimension:e.dimension}));
    const sparse=entries.filter(e=>e.keys.length>0&&e.words.size<10).map(e=>({id:e.id,name:e.name,words:e.words.size,ku:e.keys.length}));
    const totalLinks=entries.reduce((n,e)=>n+e.keys.length,0);
    return {total:entries.length,nonempty:entries.length-empty.length,empty,lowCoverage:sparse,totalCandidateLinks:totalLinks,reviewedLinks:0,verification:'not_verified'};
   };
   if(state.view==='scenes')render();
  }catch(e){window.PAI_SCENE_DIMENSION_ERROR=String(e)}
 }
 window.PAI_EXPORT_SCENE_INDEX=()=>{
  const topicRows=(proposedCoverage||[]).map(x=>({id:x.id,name:x.name,dimension:'topic',keys:proposedKeys.get(x.id)||[],status:'candidate_unverified'}));
  const dimensionRows=(additionalDimensions||[]).flatMap(d=>d.groups.flatMap(g=>g.items.map(i=>({id:i.id,name:i.name,dimension:d.id,keys:dimensionKeys.get(i.id)||[],status:'candidate_unverified'}))));
  const scenes=[...topicRows,...dimensionRows];
  const allKeys=new Set(scenes.flatMap(x=>x.keys));
  return {schemaVersion:1,source:'PAI Word Core-13000 runtime',status:'candidate_unverified',generatedAt:new Date().toISOString(),
   sceneCount:scenes.length,nonemptySceneCount:scenes.filter(x=>x.keys.length>0).length,uniqueKUCount:allKeys.size,scenes};
 };
 window.PAI_DOWNLOAD_SCENE_INDEX=()=>{
  const data=window.PAI_EXPORT_SCENE_INDEX();
  if(data.sceneCount!==312)throw Error('场景目录尚未加载完整，稍后重试');
  const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='pai-word-scene-index-v1.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 window.startDimensionScene=id=>{
  const keys=dimensionKeys.get(id)||[];
  if(!keys.length){topicFeedback='该场景尚无直接匹配的 KU，待人工扩展语义映射。';render();return}
  const item=additionalDimensions?.flatMap(d=>d.groups.flatMap(g=>g.items)).find(i=>i.id===id);
  state.dimensionSceneId=id;state.topicStudyTitle=item?.name||'任务学习';state.topicStudyTotal=keys.length;
  const unseen=keys.filter(k=>!state.records[k]);
  persist();start((unseen.length?unseen:keys).slice(0,TOPIC_BATCH_SIZE),state.topicStudyTitle+' · 任务学习','dimension')
 };
 window.continueDimensionScene=()=>{
  const unseen=(dimensionKeys.get(state.dimensionSceneId)||[]).filter(k=>!state.records[k]);
  if(!unseen.length){state.view='scenes';topicFeedback='该场景暂无未接触的 KU。';render();return}
  start(unseen.slice(0,TOPIC_BATCH_SIZE),(state.topicStudyTitle||'任务')+' · 继续学习','dimension')
 };
 loadAdditionalDimensions();
 let proposedCoverage=null;
 const SCENE_CACHE_KEY='pai-word:scene-ku-index:core13000:v49';
 let sceneCache=null;
 try{
  const saved=localStorage.getItem(SCENE_CACHE_KEY);
  if(saved){const parsed=JSON.parse(saved);if(parsed.schemaVersion===1&&parsed.scenes?.length===312)sceneCache=parsed}
 }catch(_){}
 const sceneCacheRows=new Map((sceneCache?.scenes||[]).map(x=>[x.id,x]));
 const saveSceneCache=()=>{
  if(!proposedCoverage||!additionalDimensions)return;
  const scenes=[...proposedCoverage.map(x=>({id:x.id,keys:proposedKeys.get(x.id)||[],directKU:x.directKU})),
   ...additionalDimensions.flatMap(d=>d.groups.flatMap(g=>g.items.map(i=>({id:i.id,keys:dimensionKeys.get(i.id)||[]}))))];
  if(scenes.length!==312)return;
  try{localStorage.setItem(SCENE_CACHE_KEY,JSON.stringify({schemaVersion:1,scenes}))}catch(_){}
 };
 const proposedKeys=new Map();
 async function loadProposedCoverage(){
  try{
   const response=await fetch('data/scene-taxonomy-proposal-v1.json');
   if(!response.ok)throw Error('taxonomy HTTP '+response.status);
   const doc=await response.json();
   const rows=doc.domains.flatMap(domain=>domain.topics.map(t=>({id:t.id,domain:domain.name,name:t.name,wordRanks:new Set(),kuIds:new Set(),directKU:new Set()})));
   const ruleResponse=await fetch('data/scene-semantic-rules-v1.json');
   if(!ruleResponse.ok)throw Error('scene rules HTTP '+ruleResponse.status);
   const ruleDoc=await ruleResponse.json();
   const aliases=ruleDoc.aliases||{};
   const ruleCoverage=rows.reduce((acc,row)=>{if((aliases[row.name]||[]).length)acc.withExpansion++;else acc.directOnly++;return acc},{totalThemes:rows.length,withExpansion:0,directOnly:0});
   window.PAI_SCENE_RULE_COVERAGE=()=>({...ruleCoverage});

   // Build the rule lookup once: avoid splitting curated lists for every KU.
   const curatedByLemma=new Map();
   const rules=rows.map(row=>{
    const terms=[row.name,...(aliases[row.name]||[])].filter(x=>typeof x==='string'&&x.length>=2);
    return {row,terms:[...new Set(terms)]};
   });
   const rowByName=new Map(rows.map(row=>[row.name,row]));
   for(const t of topics){
    const row=rowByName.get(t.name);
    if(!row||typeof t.words!=='string')continue;
    for(const lemma of t.words.toLowerCase().split(/\s+/).filter(Boolean)){
     if(!curatedByLemma.has(lemma))curatedByLemma.set(lemma,new Set());
     curatedByLemma.get(lemma).add(row);
    }
   }
   if(sceneCacheRows.size!==188&&sceneCacheRows.size!==312){
   for(const w of core.words){
    const curatedRows=curatedByLemma.get(w.w.toLowerCase())||new Set();
    for(const s of Object.values(w.s)){
     if(s.kuType!=='sense')continue;
     const gloss=String(s.m||'')+' '+String(s.kuTitle||'');
     for(const {row,terms} of rules){
      const direct=gloss.includes(row.name);
      const expanded=!direct&&terms.some(term=>gloss.includes(term));
      const curated=curatedRows.has(row)&&Object.values(w.s).filter(x=>x.kuType==='sense').length===1;
      if(!direct&&!expanded&&!curated)continue;
      row.wordRanks.add(w.rank);row.kuIds.add(s.ku_id);
      if(direct)row.directKU.add(s.ku_id);
     }
    }
   }
   }
   for(const row of rows){
    const cached=sceneCacheRows.get(row.id);
    if(cached){for(const k of cached.keys||[]){if(byKey(k)){row.kuIds.add(k);row.wordRanks.add(byKey(k).w.rank)}}for(const k of cached.directKU||[])row.directKU.add(k)}
    proposedKeys.set(row.id,[...row.kuIds]);
   }
   saveSceneCache();
   proposedCoverage=rows.map(row=>({id:row.id,domain:row.domain,name:row.name,words:row.wordRanks.size,ku:row.kuIds.size,directKU:row.directKU.size,unseenKU:[...row.kuIds].filter(k=>!state.records[k]).length,status:'candidate_unverified'}));
   window.PAI_PROPOSED_SCENE_COVERAGE=()=>proposedCoverage.map(x=>({...x}));
   window.PAI_SCENE_COVERAGE_QA=()=>{
    const total=proposedCoverage.length,nonempty=proposedCoverage.filter(x=>x.ku>0).length;
    const empty=proposedCoverage.filter(x=>x.ku===0).map(x=>({id:x.id,name:x.name,domain:x.domain}));
    const low=proposedCoverage.filter(x=>x.ku>0&&x.words<10).map(x=>({id:x.id,name:x.name,words:x.words,ku:x.ku}));
    const inflated=proposedCoverage.filter(x=>x.ku>1000).map(x=>({id:x.id,name:x.name,words:x.words,ku:x.ku}));
    return {totalThemes:total,nonemptyThemes:nonempty,emptyThemes:total-nonempty,expandedRules:ruleCoverage.withExpansion,directOnly:ruleCoverage.directOnly,empty,lowCoverage:low,possibleOvermatching:inflated,verification:'not_verified'};
   };

   if(state.view==='scenes')render();
  }catch(e){window.PAI_PROPOSED_SCENE_ERROR=String(e)}
 }
 window.startProposedScene=id=>{
  const scene=proposedCoverage?.find(x=>x.id===id),keys=proposedKeys.get(id)||[];
  if(!scene||!keys.length){topicFeedback='此主题暂无可靠候选，请选择其他主题。';render();return}
  state.proposedSceneId=id;state.topicStudyQuery='';state.topicStudyTitle=scene.name;state.topicStudyTotal=keys.length;
  persist();start(keys.filter(k=>!state.records[k]).slice(0,TOPIC_BATCH_SIZE).length?keys.filter(k=>!state.records[k]).slice(0,TOPIC_BATCH_SIZE):keys.slice(0,TOPIC_BATCH_SIZE),scene.name+' · 场景学习','proposed')
 };
 window.continueProposedScene=()=>{
  const keys=proposedKeys.get(state.proposedSceneId)||[];
  const unseen=keys.filter(k=>!state.records[k]);
  if(!unseen.length){active=false;state.view='scenes';topicFeedback='本主题暂无未接触的 KU。';render();return}
  start(unseen.slice(0,TOPIC_BATCH_SIZE),(state.topicStudyTitle||'场景')+' · 继续学习','proposed')
 };
 loadProposedCoverage();

  window.PAI_TOPIC_PREVIEW=q=>{const keys=topicCandidates(q,topicMatch(q));return {totalWords:topicWordCount(keys),totalKU:keys.length,unseenKU:keys.filter(k=>!state.records[k]).length,batchSize:TOPIC_BATCH_SIZE}};
 window.startTopicStudy=()=>{
  const q=topicInput.trim();if(!q){topicFeedback='请输入场景或一句话。';render();return}
  const matches=topicMatch(q),keys=topicCandidates(q,matches);
  if(!keys.length){topicFeedback='未找到足够匹配的词义。请尝试更具体的主题，例如“蔬菜”或“动物园”。';render();return}
  topicFeedback='';state.topicStudyQuery=q;state.topicStudyTitle=matches[0]?.topic.name||q.slice(0,24);state.topicStudyTotal=keys.length;persist();start(keys.slice(0,TOPIC_BATCH_SIZE),state.topicStudyTitle+' · 场景学习','topic')
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
  const topicCards=()=>topicCatalog().map(t=>`<button class="scene-card" onclick="setTopicInput('${esc(t.name)}');startTopicStudy()"><span class="scene-name">${esc(t.name)}</span><span class="scene-count"><b>${t.words}</b><small>单词 · ${t.ku} KU</small></span></button>`).join('');
  const cards=ids=>ids.map(id=>`<button class="scene-card" onclick="openScene('${id}')"><span class="scene-name">${esc(SCENES[id])}</span><span class="scene-count"><b>${unlearned(id).length}</b><small>未学词</small></span></button>`).join('');
  return `<div class="screen scene-screen"><div class="scene-head"><h1>PAI Word</h1><div class="scene-tools"><button class="text-btn" onclick="openLexicon()">词库</button><button class="text-btn" onclick="openPanel('stats')">统计</button><button class="text-btn" onclick="openPanel('settings')">设置</button></div></div><p class="home-intro">选一个场景，先回忆，再看答案。</p><section class="topic-search"><label for="topic-input">一句话选择背词场景</label><form onsubmit="event.preventDefault();startTopicStudy()"><input id="topic-input" aria-label="描述想学的场景" maxlength="160" placeholder="例如：蔬菜、动物园、我想去机场登机" oninput="setTopicInput(this.value)" value="${esc(topicInput)}"><button type="submit" class="primary-btn">开始场景背词</button></form><p class="scene-note">支持常见主题与简短描述；从现有 Core-13000 中选词，不生成新词条。</p>${topicFeedback?`<p class="topic-feedback" role="status">${esc(topicFeedback)}</p>`:""}</section><section class="today-plan"><label for="scene-choice">今日新词来源</label><select id="scene-choice" onchange="selectLearningScene(this.value)">${Object.entries(SCENES).map(([id,name])=>`<option value="${id}" ${id===state.selectedScene?'selected':''}>${category(id)} · ${esc(name)}</option>`).join('')}</select><p>今日已接触 ${completed} 个新词 · 待学 ${state.daily.newWordKeys.filter(k=>!state.records[k]).length} 个</p><button class="primary-btn" onclick="openToday()">${n||r?'开始今日学习':'今日分配已完成'}${n||r?` · ${n+r} 项`:''}</button>${resume?`<button class="secondary-btn" onclick="resumeLearning()">继续上次学习 · 剩余 ${resume} 项</button>`:''}<button class="text-btn" onclick="openReview()">优先复习 ${r} 项</button></section><h2 class="group-title">主题场景 · 全部候选单词数</h2><p class="scene-note">按当前词库动态统计；每个场景内同一单词只计一次。</p><div class="scene-grid">${topicCards()}</div><details class="scene-taxonomy-audit"><summary>任务场景与语言功能 · 新增124项</summary><p class="scene-note">仅展示词义中直接出现完整场景名称的初步候选；有 KU 的条目可试学。未匹配不代表词库无相关词，所有映射均待审核。</p>${additionalDimensions?additionalDimensions.map(d=>`<h3>${esc(d.label)}</h3>${d.groups.map(g=>`<p class="scene-note"><b>${esc(g.name)}</b>：${g.items.map(i=>{const keys=dimensionKeys.get(i.id)||[];return keys.length?`<button onclick="startDimensionScene('${i.id}')">${esc(i.name)} (${keys.length} KU)</button>`:`${esc(i.name)} (待映射)`}).join('、')}</p>`).join('')}`).join(''):'正在加载目录…'}</details><details class="scene-taxonomy-audit"><summary>完整场景目录与候选覆盖（188个主题）</summary><p class="scene-note">仅按中文释义中的主题名称直接匹配，属于未经验证的保守候选统计；0不表示词库没有相关词。</p>${proposedCoverage?proposedCoverage.map(t=>`<button class="scene-card" onclick="startProposedScene(\'${t.id}\')" ${t.ku?'':'disabled'}><span class="scene-name">${esc(t.domain)} / ${esc(t.name)}</span><span class="scene-count"><b>${t.words}</b><small>单词 · ${t.ku} KU</small></span></button>`).join(''):'正在统计场景候选…'}</details><h2 class="group-title">按场景学习</h2><div class="scene-grid">${cards(Object.keys(SCENES).filter(id=>category(id)==='场景'))}</div><h2 class="group-title">基础与词频分层</h2><p class="scene-note">以下词汇尚未完成场景细分，按词频范围学习。功能词单独练习。</p><div class="scene-grid">${cards(Object.keys(SCENES).filter(id=>category(id)!=='场景'&&(core.byScene.get(id)||[]).length))}</div><p class="scene-note">内容持续校订中；收录数量不代表已完成词典核验。<br>${statusText()}</p></div>`;
 }
 function learning(){
  const s=state.learningSession,u=browsedUnit||unit();if(!s)return home();
  if(!u)return `<div class="screen study-screen">${top(s.title,'完成')}<div class="done"><div><h2>本轮回忆已完成</h2><p>${s.completed.length} 项已通过本轮回忆，共作答 ${s.attempts} 次。<br>本轮错词已重新出现；长期记忆仍需后续复习。</p>${(s.kind==='topic'||s.kind==='proposed'||s.kind==='dimension')?`<p>当前场景候选共 ${state.topicStudyTotal||0} 个 KU；每轮最多 ${TOPIC_BATCH_SIZE} 个。</p><button class="primary-btn" onclick="${s.kind==='dimension'?'continueDimensionScene()':s.kind==='proposed'?'continueProposedScene()':'continueTopicStudy()'}">继续本场景</button>`:''}${s.kind==='scene'?`<p>此分类还有 ${unlearned(state.selectedScene).length} 个未接触词。</p><button class="primary-btn" onclick="openScene('${state.selectedScene}')">再学 10 个</button>`:''}<button class="secondary-btn" onclick="goScenes()">返回首页</button></div></div></div>`;
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
