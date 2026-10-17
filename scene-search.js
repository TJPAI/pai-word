// One-sentence Scene500 search MVP. Pure front-end: no LLM/API, no generated learning words.
(function(){
  const LEGACY_ALIASES=new Set(['cs206','cs215','cs223','cs254','cs321']);
  const FAMILY={cs043:'hotel',cs044:'hotel',cs046:'flight',cs047:'flight',cs092:'academic',cs096:'academic'};
  const MIN_SCORE=3;
  const bundles=[
    {terms:['学术会议','参加会议','conference','academic conference','会议报告','论文报告','答辩'],targets:{cs096:18,cs092:5,cs076:4}},
    {terms:['坐飞机','飞机','航班','机场','airport','flight','登机'],targets:{cs047:12,cs046:10,cs049:4}},
    {terms:['值机','托运','安检','check in','security','luggage'],targets:{cs046:18,cs047:5}},
    {terms:['延误','改签','取消航班','转机','delay','reschedule'],targets:{cs047:18,cs046:3}},
    {terms:['入境','海关','签证','边境','immigration','customs','visa','passport','美国入境'],targets:{cs049:18,cs046:3}},
    {terms:['美国','出国','海外','国外'],targets:{cs049:10,cs046:5,cs043:3,cs044:3}},
    {terms:['酒店','住宿','hotel','住酒店','订房'],targets:{cs044:12,cs043:11}},
    {terms:['预订酒店','订酒店','订房','reservation','booking'],targets:{cs043:18,cs044:5}},
    {terms:['入住','前台','房间服务','check in hotel','front desk'],targets:{cs044:18,cs043:4}},
    {terms:['商务社交','商务交流','networking','社交'],targets:{cs096:7,cs076:6,cs079:3}},
    {terms:['租房','看房','房东','租约','lease','landlord','rent apartment'],targets:{cs018:20}},
    {terms:['水电','燃气','utilities','electricity','water bill'],targets:{cs018:10}},
    {terms:['合同','contract'],targets:{cs018:5,cs079:2}},
    {terms:['无人机','drone','机器人','robot','人工智能','ai','视觉','计算机视觉','machine learning'],targets:{cs088:17,cs090:7}},
    {terms:['仓库','仓储','盘点','库存','物流','warehouse','inventory','logistics'],targets:{cs090:18,cs088:8}},
    {terms:['自动化','生产','工厂','质量控制','factory','automation'],targets:{cs090:16,cs088:5}},
    {terms:['看医生','医生','医院','问诊','症状','doctor','hospital','symptom'],targets:{cs057:18}},
    {terms:['面试','求职','招聘','interview','job interview'],targets:{cs073:18}},
    {terms:['工作会议','主持会议','议程','meeting','agenda'],targets:{cs076:16,cs096:3}},
    {terms:['客户','客服','投诉','client','customer','complaint'],targets:{cs079:17}},
    {terms:['手机','软件','app','电脑','device','software'],targets:{cs081:15}},
    {terms:['论文','文献','paper','research','研究'],targets:{cs092:14,cs096:8}},
    {terms:['课堂','听课','讲座','记笔记','lecture','class'],targets:{cs062:16}},
    {terms:['小组讨论','同学合作','group discussion','teamwork'],targets:{cs064:16}},
    {terms:['气候','碳排放','可持续','climate','carbon','sustainable'],targets:{cs468:18}}
  ];
  const stop=/[，。！？、；：,.!?;:\s]+/;
  const norm=s=>String(s||'').trim().toLowerCase();
  function specs(){return (window.PAI_SCENE500?.specs||[]).filter(s=>!LEGACY_ALIASES.has(s.id))}
  function units(scene){try{return allUnits(scene)||[]}catch(_){return[]}}
  function uniqueWords(scene,difficulty='all'){
    const out=new Map();
    for(const u of units(scene)){
      const rank=Number(u?.w?.rank)||999999;if(!rankAllowed(rank,difficulty))continue;
      const key=u?.w?.rank??u?.w?.w;if(key!==undefined&&!out.has(key))out.set(key,u);
    }
    return [...out.values()];
  }
  function rankAllowed(rank,difficulty){
    if(difficulty==='all')return true;
    if(difficulty==='basic')return rank<=4000;
    if(difficulty==='common')return rank>4000&&rank<=8000;
    if(difficulty==='advanced')return rank>8000&&rank<=11000;
    if(difficulty==='high')return rank>11000;
    return true;
  }
  function lexicalScore(q,s){
    const hay=norm([s.name,s.desc,...(s.tags||[])].join(' '));let score=0;
    for(const tag of (s.tags||[])){const t=norm(tag);if(t.length>=2&&q.includes(t))score+=Math.min(12,3+t.length)}
    if(q.includes(norm(s.name)))score+=20;
    const tokens=q.split(stop).filter(x=>x.length>=2);
    for(const t of tokens){if(hay.includes(t))score+=4}
    const cn=[...q.replace(/[\x00-\xff]/g,'')];
    const bigrams=[];for(let i=0;i<cn.length-1;i++)bigrams.push(cn[i]+cn[i+1]);
    for(const bg of new Set(bigrams))if(hay.includes(bg))score+=.65;
    return score;
  }
  function bundleScores(q){
    const scores={};
    for(const b of bundles){
      let hits=0;for(const term of b.terms)if(q.includes(norm(term)))hits++;
      if(!hits)continue;
      for(const [id,w] of Object.entries(b.targets))scores[id]=(scores[id]||0)+w+Math.min(4,hits-1);
    }
    return scores;
  }
  function diversify(rows,limit){
    const chosen=[],deferred=[],seen=new Set();
    for(const row of rows){const family=FAMILY[row.id]||row.id;if(seen.has(family)){deferred.push(row);continue}seen.add(family);chosen.push(row);if(chosen.length>=limit)return chosen}
    for(const row of deferred){chosen.push(row);if(chosen.length>=limit)break}
    return chosen;
  }
  function search(query,difficulty='all',limit=5){
    const q=norm(query);if(!q)return[];
    const bs=bundleScores(q),rows=[];
    for(const s of specs()){
      const words=uniqueWords(s.id,difficulty);if(!words.length)continue;
      let score=(bs[s.id]||0)+lexicalScore(q,s);
      if(score<MIN_SCORE)continue;
      score+=Math.min(2,words.length/10);
      rows.push({...s,score,wordCount:words.length,difficulty});
    }
    rows.sort((a,b)=>b.score-a.score||b.wordCount-a.wordCount||a.name.localeCompare(b.name,'zh-CN'));
    return diversify(rows,Math.max(1,Math.min(5,limit)));
  }
  function remember(scene){
    const arr=Array.isArray(state.scene500Recent)?state.scene500Recent:[];
    state.scene500Recent=[scene,...arr.filter(x=>x!==scene)].slice(0,5);save();
  }
  function open(scene){remember(scene);return window.openScene(scene)}
  function recent(){return (state.scene500Recent||[]).map(id=>specs().find(s=>s.id===id)).filter(Boolean)}
  window.PAI_SCENE_SEARCH={search,open,recent,wordCount:(id,d='all')=>uniqueWords(id,d).length,rankAllowed};
})();
