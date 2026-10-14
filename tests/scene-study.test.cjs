const fs=require('fs'),vm=require('vm'),assert=require('assert');
const words=[];const byKU=new Map(),byScene=new Map([['travel',[]]]);
for(let i=1;i<=25;i++){
  const k='k'+i,w={rank:i,w:'w'+i,s:{s:{ku_id:k,kuType:'sense',scene:'travel',m:'m'+i}}},u={w,sid:'s',s:w.s.s,k};
  words.push(w);byKU.set(k,u);byScene.get('travel').push(u);
}
const state={view:'scenes',scene:null,records:{},daily:{assigned:{travel:[]}},stats:{},newPerDay:20};
const ctx={window:null,state,PAI_CORE:{byKU,byScene,words},SCENES:{travel:'旅行出行'},document:{getElementById:()=>({innerHTML:''})},setTimeout:(f)=>f(),unitKey:(w,sid)=>w.s[sid].ku_id,allUnits:s=>byScene.get(s)||[],save(){},render(){},speak(){},globalNewRemaining(){},answerHtml:()=>'<div>a</div>',console};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('scene-study.js','utf8'),ctx);
ctx.openScene('travel');assert.strictEqual(ctx.currentQueue().length,10,'today=0 should still yield 10 targeted units');
state.records.k1={due:1};ctx.render();assert.strictEqual(ctx.currentQueue().length,9);
ctx.addSceneBatch();assert.strictEqual(ctx.currentQueue().length,19,'append should add next 10 unseen');
state.daily.assigned.travel=['k25'];state.records={};ctx.openScene('travel');assert.strictEqual(ctx.currentQueue()[0].k,'k25','today recommended item should be first');
assert.strictEqual(ctx.currentQueue().length,10,'recommended+extras should still form a 10-card batch');
console.log('scene-study QA PASS');
