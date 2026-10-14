const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(ROOT,'flow-v2.js'),'utf8');
const DAY=86400000,TEN=10*60000;
function unit(id,rank=1,type='sense'){return {k:id,w:{w:id,rank,ipa:'/x/'},sid:id,s:{ku_id:id,kuType:type,kuTitle:type==='sense'?'释义':'规则',scene:'daily',pos:'n.',m:'答案'}}}
function make(){
  const u1=unit('u1',1),u2=unit('u2',2),u3=unit('u3',3,'grammar'),byKU=new Map([['u1',u1],['u2',u2],['u3',u3]]);
  const ctx={console,Date,setTimeout:fn=>fn(),state:{view:'scenes',records:{},stats:{},daily:{newWordKeys:['u1','u2'],reinforcementKeys:['u3']},freeKeys:[],reviewBrowseIndex:0,revealed:false,hideWord:false},PAI_CORE:{byKU},SCENES:{daily:'日常生活'},unitKey:(w,sid)=>sid,globalNewRemaining:()=>2,globalReinforcementRemaining:()=>1,markDailyNewComplete:()=>{},save(){},currentUnit:()=>u1,speak(){},answerHtml:()=>'<answer/>',render(){},reveal(){},rateKnown(){},rateReview(){},rateFreeReview(){},goScenes(){},document:{head:{appendChild(){}},createElement:()=>({textContent:''}),getElementById:()=>({innerHTML:''}),querySelector:()=>null}};
  ctx.window=ctx;vm.runInNewContext(source,ctx);return {ctx,u1,u2,u3};
}
test('two-button SRS v2 follows 1d -> 3d -> about 7d and 10m fail',()=>{const {ctx}=make(),h=ctx.PAI_SRS_V2;assert.equal(h.intervalFor(null,true),DAY);assert.equal(h.intervalFor({reps:1,lastKnown:true,interval:DAY},true),3*DAY);assert.equal(h.intervalFor({reps:2,lastKnown:true,interval:3*DAY},true),7*DAY);assert.equal(h.intervalFor({reps:3,lastKnown:false,interval:TEN},true),DAY);assert.equal(h.intervalFor({reps:2,lastKnown:true,interval:3*DAY},false),TEN)});
test('Today queue is due-first then new words then reinforcement with no duplicates',()=>{const {ctx}=make();assert.deepEqual(Array.from(ctx.PAI_SRS_V2.todayQueue(),x=>x.k),['u1','u2','u3']);ctx.state.records.u2={due:Date.now()-1000,interval:DAY,reps:1,lastKnown:true};assert.deepEqual(Array.from(ctx.PAI_SRS_V2.todayQueue(),x=>x.k),['u2','u1','u3'])});
test('Today scoring writes exact KU and advances without changing KU identity',()=>{const {ctx}=make();ctx.openToday();assert.equal(ctx.state.view,'today');assert.equal(ctx.state.todayTotal,3);ctx.rateToday(true);assert.equal(ctx.state.records.u1.interval,DAY);assert.equal(ctx.state.records.u1.srsPolicy,'two-button-v2');assert.deepEqual(Array.from(ctx.PAI_SRS_V2.todayQueue(),x=>x.k),['u2','u3'])});
test('free-review known does not postpone formal due; unknown may bring it sooner',()=>{const {ctx}=make(),oldDue=Date.now()+5*DAY;ctx.state.records.u2={due:oldDue,interval:3*DAY,reps:2,lastKnown:true};ctx.state.freeKeys=['u2'];ctx.rateFreeReview(true);assert.equal(ctx.state.records.u2.due,oldDue);ctx.state.freeKeys=['u2'];ctx.rateFreeReview(false);assert.ok(ctx.state.records.u2.due<oldDue);assert.equal(ctx.state.records.u2.interval,TEN)});
test('flow is an after-product patch and bootstrap/cache bust activates it',()=>{const bootstrap=fs.readFileSync(path.join(ROOT,'core-bootstrap.js'),'utf8'),index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');assert.match(bootstrap,/product-v2\.js\?v=v267i-product-1','flow must load after product');assert.match(bootstrap,/flow-v2\.js\?v=v267i-flow-1/);assert.ok(bootstrap.indexOf('flow-v2.js')>bootstrap.indexOf('product-v2.js'));assert.match(index,/core-bootstrap\.js\?v=v267i-4/) });
