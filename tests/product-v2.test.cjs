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

test('daily quota is app-wide, balanced across scenes, and survives queue rebuilds',()=>{
  const ctx={console,window:null,SCENES:{daily:'d',work:'w',unclassified:'u'},state:{newPerDay:20,records:{}},save(){},render(){},unitKey(_w,sid){return sid}};
  ctx.window=ctx;ctx.units=[];
  for(let i=1;i<=90;i++){const scene=i%3===0?'work':i%3===1?'daily':'unclassified';ctx.units.push({w:{rank:i,w:'w'+i},sid:'ku'+i,s:{scene,sense_id:'s'+i}})}
  ctx.allUnits=scene=>ctx.units.filter(u=>u.s.scene===scene);ctx.findUnitByKey=k=>ctx.units.find(u=>u.sid===k)||null;ctx.dueUnits=()=>[];
  vm.createContext(ctx);run('daily.js',ctx);
  const assigned=Object.values(ctx.state.daily.assigned).flat();assert.equal(assigned.length,20);assert.equal(new Set(assigned).size,20);assert.equal(ctx.state.daily.lexiconLimit,13000);assert.equal(ctx.state.daily.policy,'balanced-scenes-v1');
  const counts=Object.values(ctx.state.daily.assigned).map(x=>x.length);assert.ok(counts.every(n=>n>0));assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
  for(const k of assigned.slice(0,5)){ctx.markDailyNewComplete(k);ctx.state.records[k]={reps:1}}
  ctx.rebuildDailyAssignments();
  assert.equal(ctx.globalNewCompleted(),5);assert.equal(Object.values(ctx.state.daily.assigned).flat().length,15);assert.equal(ctx.globalNewAssigned(),20);
});

test('Core-13000 is the only scope and browsing preserves ku_id progress',()=>{
  const words=[word(1,'alpha'),word(5000,'omega'),word(5001,'beyond'),word(13000,'zulu')];
  const byKU=new Map(),byScene=new Map([['daily',[]],['unclassified',[]]]);
  for(const w of words)for(const s of Object.values(w.s)){const u={w,sid:s.ku_id,s,k:s.ku_id};byKU.set(s.ku_id,u);byScene.get('daily').push(u)}
  const state={records:{ku5001:{reps:2,due:123}},daily:{lexiconLimit:5000,assigned:{daily:['ku5001']}},dailyNewProgress:{date:new Date().toISOString().slice(0,10),completed:[]},newPerDay:20,voiceAccent:'us',lexiconLimit:5000};
  const ctx={console,state,SCENES:{daily:'日常',unclassified:'通用'},window:null,document:{getElementById(){return {innerHTML:''}},querySelector(){return null},querySelectorAll(){return []}},PAI_CORE:{words,byKU,byScene},save(){},render(){},answerHtml(){return '<div/>'},rebuildDailyAssignments(){state.daily={lexiconLimit:13000,assigned:{daily:[],unclassified:[]}}},globalNewRemaining(){return 20},rateKnown(){},currentUnit(){return null},unitKey(_w,sid){return sid}};
  ctx.window=ctx;ctx.allUnits=scene=>byScene.get(scene)||[];vm.createContext(ctx);run('product-v2.js',ctx);
  assert.equal(state.lexiconLimit,13000);assert.equal(state.daily.lexiconLimit,13000);assert.deepEqual(ctx.allUnits('daily').map(u=>u.w.rank),[1,5000,5001,13000]);
  assert.deepEqual(state.records.ku5001,{reps:2,due:123});
  ctx.openLexiconWord(5001);assert.equal(state.previewKU,'ku5001');assert.equal(state.view,'lexiconWord');assert.deepEqual(state.records.ku5001,{reps:2,due:123});
});
