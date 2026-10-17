// Per-round study policy overlay.
// Keeps the legacy state.newPerDay field for localStorage compatibility, but
// interprets it in the Scene500 experience as words per round.
(function(){
  const ALLOWED=new Set([10,20,30,50]);
  const roundSize=()=>ALLOWED.has(Number(state.newPerDay))?Number(state.newPerDay):20;
  const isScene500=scene=>(window.PAI_SCENE500?.sceneIds||[]).includes(scene);
  const rankAllowed=(rank,difficulty)=>difficulty==='basic'?rank<=4000:difficulty==='common'?rank>4000&&rank<=8000:difficulty==='advanced'?rank>8000&&rank<=11000:difficulty==='high'?rank>11000:true;
  const dayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const unitKeyOf=u=>unitKey(u.w,u.sid);

  function seedScene500Round(scene){
    if(!isScene500(scene))return;
    const difficulty=state.scene500DifficultyByScene?.[scene]||'all';
    const units=(allUnits(scene)||[])
      .filter(u=>rankAllowed(Number(u?.w?.rank)||999999,difficulty))
      .filter(u=>!state.records?.[unitKeyOf(u)]);
    const keys=[];const seen=new Set();
    for(const u of units){
      const k=unitKeyOf(u);if(seen.has(k))continue;
      seen.add(k);keys.push(k);if(keys.length>=roundSize())break;
    }
    const version=window.PAI_SCENE500?.version||'scene500';
    if(!state.scene500Pilot||state.scene500Pilot.version!==version)state.scene500Pilot={version,days:{}};
    state.scene500Pilot.days=state.scene500Pilot.days||{};
    const date=dayKey();state.scene500Pilot.days[date]=state.scene500Pilot.days[date]||{};
    state.scene500Pilot.days[date][`${scene}::${difficulty}`]=keys;
    save();
  }

  const baseOpenScene=window.openScene;
  window.openScene=function(scene){
    if(isScene500(scene))seedScene500Round(scene);
    return baseOpenScene(scene);
  };

  // Keep the old setter as a compatibility API, but expose the new product term.
  const baseSet=window.setNewPerDay;
  window.setWordsPerRound=function(n){
    n=Number(n);if(!ALLOWED.has(n))n=20;
    state.newPerDay=n;
    state.daily=null;
    save();
    if(typeof render==='function')render();
  };
  window.setNewPerDay=function(n){return window.setWordsPerRound(n)};
  window.wordsPerRound=roundSize;

  // Patch legacy settings copy after every render without disturbing the learning UI.
  const baseRender=window.render;
  window.render=function(){
    const out=baseRender();
    if(state.view==='settings'){
      const rows=[...document.querySelectorAll('.setting-row')];
      const row=rows.find(x=>x.querySelector('span')?.textContent?.trim()==='每日新词');
      if(row){
        row.querySelector('span').textContent='每轮单词数';
        const select=row.querySelector('select');
        if(select)select.setAttribute('onchange','setWordsPerRound(+this.value)');
      }
      for(const el of document.querySelectorAll('.panel-block.muted')){
        if(el.textContent.includes('新词数量固定'))el.textContent='每轮新词数量固定；到期复习不计入每轮上限。';
      }
    }
    return out;
  };
})();
