const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function run(file,ctx){vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file})}
function word(rank,lemma,scene='daily'){
  const ku='ku'+rank,s={ku_id:ku,sense_id:'s'+rank,pos:'n.',m:'释义'+rank,scene,domain:'',c:'',e:[],x:''};
  return {rank,w:lemma,pos:'n.',ipaUK:'',ipaUS:'',s:{[ku]:s}};
}

test('daily quota is app-wide, not per scene',()=>{
  const ctx={console,window:null,SCENES:{daily:'d',work:'w',unclassified:'u'},state:{newPerDay:20,records:{},lexiconLimit:5000},save(){},render(){},unitKey(_w,sid){return sid}};
  ctx.window=ctx;ctx.units=[];
  for(let i=1;i<=90;i++){const scene=i%3===0?'work':i%3===1?'daily':'unclassified';ctx.units.push({w:{rank:i,w:'w'+i},sid:'ku'+i,s:{scene,sense_id:'s'+i}})}
  ctx.allUnits=scene=>ctx.units.filter(u=>u.s.scene===scene);ctx.findUnitByKey=k=>ctx.units.find(u=>u.sid===k)||null;ctx.dueUnits=()=>[];
  vm.createContext(ctx);run('daily.js',ctx);
  const assigned=Object.values(ctx.state.daily.assigned).flat();
  assert.equal(assigned.length,20);assert.equal(new Set(assigned).size,20);
  ctx.state.records[assigned[0]]={reps:1};assert.equal(ctx.globalNewRemaining(),19);
  ctx.setNewPerDay(10);assert.equal(Object.values(ctx.state.daily.assigned).flat().length,10);
});

test('Core-5000 is default and switching scope preserves ku_id progress',()=>{
  const words=[word(1,'alpha'),word(5000,'omega'),word(5001,'beyond'),word(13000,'zulu')];
  const byKU=new Map(),byScene=new Map([['daily',[]],['unclassified',[]]]);
  for(const w of words)for(const s of Object.values(w.s)){const u={w,sid:s.ku_id,s,k:s.ku_id};byKU.set(s.ku_id,u);byScene.get('daily').push(u)}
  const state={records:{ku5001:{reps:2,due:123}},daily:{lexiconLimit:13000},newPerDay:20,voiceAccent:'us'};
  const ctx={console,state,SCENES:{daily:'日常',unclassified:'通用'},window:null,document:{getElementById(){return {innerHTML:''}},querySelector(){return null},querySelectorAll(){return []}},PAI_CORE:{words,byKU,byScene},save(){},render(){},answerHtml(){return '<div/>'},rebuildDailyAssignments(){state.daily={lexiconLimit:state.lexiconLimit}},globalNewRemaining(){return 20}};
  ctx.window=ctx;ctx.allUnits=scene=>byScene.get(scene)||[];vm.createContext(ctx);run('product-v2.js',ctx);
  assert.equal(state.lexiconLimit,5000);assert.deepEqual(ctx.allUnits('daily').map(u=>u.w.rank),[1,5000]);
  ctx.setLexiconLimit(13000);assert.deepEqual(state.records.ku5001,{reps:2,due:123});
  ctx.openLexiconWord(5001);assert.equal(state.previewKU,'ku5001');assert.equal(state.view,'lexiconWord');assert.deepEqual(state.records.ku5001,{reps:2,due:123});
});
