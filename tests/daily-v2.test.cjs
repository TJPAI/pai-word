const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(ROOT,'daily.js'),'utf8');
function makeContext({words=60,newPerDay=20,records={}}={}){
  const byKU=new Map(),list=[];
  for(let rank=1;rank<=words;rank++){
    const w={rank,w:'w'+rank,s:{}};
    const p='p'+rank,e='e'+rank;
    w.s[p]={ku_id:p,scene:rank%5===0?'work':'daily',kuType:'sense',sense_id:'s1'};
    w.s[e]={ku_id:e,scene:rank%5===0?'work':'daily',kuType:rank%3===0?'contrast':'grammar',sense_id:'s1'};
    const pu={k:p,w,s:w.s[p],sid:p},eu={k:e,w,s:w.s[e],sid:e};
    byKU.set(p,pu);byKU.set(e,eu);list.push(w);
  }
  const state={newPerDay,records:{...records},daily:null,dailyNewProgress:null};
  const ctx={console,Date,state,SCENES:{daily:'日常生活',work:'职场商务',general:'通用基础'},PAI_CORE:{words:list,byKU},save(){},render(){},queueFor(){return[]},todayCount(){return 0},dueUnits(){return[]},findUnitByKey(k){return byKU.get(k)||null},unitKey(w,sid){return w.s[sid]?.ku_id||sid}};
  ctx.window=ctx;vm.runInNewContext(source,ctx);return ctx;
}
test('daily V2 is lazy and assigns 20 ranked new words plus 30% reinforcement',()=>{
  const records=Object.fromEntries(Array.from({length:10},(_,i)=>['p'+(i+1),{due:Infinity}]));
  const c=makeContext({records});
  assert.equal(c.state.daily,null,'policy must wait until product scene repair is finished');
  const qa=c.dailyPolicyQA();
  assert.equal(qa.policy,'rank-first-words+reinforcement-v2');
  assert.equal(qa.newWords,20);assert.equal(qa.reinforcement,6);assert.equal(qa.totalFresh,26);
  assert.deepEqual(c.state.daily.newWordKeys,Array.from({length:20},(_,i)=>'p'+(i+11)));
  assert.equal(new Set(c.state.daily.reinforcementKeys.map(k=>Number(k.slice(1)))).size,6,'at most one reinforcement KU per word/day');
});
test('secondary legacy record never suppresses an unlearned primary word KU',()=>{
  const records=Object.fromEntries(Array.from({length:30},(_,i)=>['p'+(i+1),{due:Infinity}]));records.e31={due:Infinity};
  const c=makeContext({newPerDay:10,records});c.dailyPolicyQA();
  assert.equal(c.state.daily.newWordKeys[0],'p31');
  assert.ok(c.state.daily.newWordKeys.includes('p31'));
});
test('completion accounting separates words from reinforcement KUs',()=>{
  const records=Object.fromEntries(Array.from({length:10},(_,i)=>['p'+(i+1),{due:Infinity}]));
  const c=makeContext({records});c.dailyPolicyQA();
  const nw=c.state.daily.newWordKeys[0],rk=c.state.daily.reinforcementKeys[0];
  c.markDailyNewComplete(nw);assert.equal(c.globalNewCompleted(),1);assert.equal(c.globalReinforcementCompleted(),0);
  c.markDailyNewComplete(rk);assert.equal(c.globalNewCompleted(),1);assert.equal(c.globalReinforcementCompleted(),1);
});
test('setting 50 means 50 new words with a separate 15-KU reinforcement budget',()=>{
  const records=Object.fromEntries(Array.from({length:20},(_,i)=>['p'+(i+1),{due:Infinity}]));
  const c=makeContext({words:100,newPerDay:50,records});const qa=c.dailyPolicyQA();
  assert.equal(qa.newWordQuota,50);assert.equal(qa.newWords,50);assert.equal(qa.reinforcementQuota,15);assert.equal(qa.reinforcement,15);
});
test('cache busts activate daily V2 on Safari/CDN clients',()=>{
  const bootstrap=fs.readFileSync(path.join(ROOT,'core-bootstrap.js'),'utf8');
  const index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  assert.match(bootstrap,/daily\.js\?v=v267i-daily-2/);
  assert.match(index,/core-bootstrap\.js\?v=v267i-3/);
});
