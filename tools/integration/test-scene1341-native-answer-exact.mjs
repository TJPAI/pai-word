import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {renderWithRealScene500AnswerHtml} from './scene1341-native-answer-renderer-harness.mjs';
const native=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
const page=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert(page.includes('<script src="./scene500-native-answer-exact.js"></script>'));
assert(page.includes("get('nativeAnswer')==='1'"),'source-exact answer is opt-in, never silently enabled');
assert(page.includes('window.PAI_SCENE1341_NATIVE_ANSWER.render(draftUnit,prefs)'));
assert(page.includes("#scene1341-native-answer-pilot:not([hidden]){display:contents}"),
 'native A/B must expose the actual native .answer block without extra flex geometry');
assert(page.includes("#scene1341-native-answer-pilot[hidden]{display:none!important}"),
 'hidden answer may never leak on question face');
const detach=page.indexOf("const enlexNode=$('enlex-section');");
const replace=page.indexOf("nativeSlot.innerHTML=window.PAI_SCENE1341_NATIVE_ANSWER.render(draftUnit,prefs)");
const attach=page.indexOf("nativeSlot.querySelector('.answer')?.append($('enlex-section'))");
assert(detach>=0&&replace>detach&&attach>replace,
 'detach the stable ENLEX details BEFORE replacing disposable native HTML, then reattach');
assert(page.includes("$('answer').append($('enlex-section'))"),
 'default view must regain the same ENLEX reference node');
assert(page.includes("button.dataset.speak!==subset()[index]?.answer.example_en"),
 'native example speaker must reject stale-card speech requests');
assert(page.includes("e.target.closest('#scene1341-native-answer-pilot .example-play[data-example-audio]')"),
 'dynamic Scene500 example speaker must use delegated event handling');
assert(page.includes("playCurrentExample()")&&page.includes("phaseController.beginExample()")&&
 page.includes("phaseController.exampleFinished()"),
 'both example buttons must share isolated speech/phase lifecycle');

assert(page.includes("nativeSlot.hidden=!revealed"),'native answer obeys question/answer state');
assert(page.includes("readOnly:true,canWriteSrs:false,productionReleaseAllowed:false"),
 'pilot must explicitly quarantine every projected unit');

const adapter=fs.readFileSync('rebuild-preview/scene1341-readonly/scene500-native-answer-exact.js','utf8');
const start=native.indexOf('  window.answerHtml=function(u){');
const end=native.indexOf('\n  // Settings actions',start);
assert(start>=0&&end>start,'native renderer source location changed');
const exact=native.slice(start,end);
assert(adapter.includes(exact),'browser adapter must retain byte-identical original Scene500 answerHtml');
assert.equal(adapter.split(exact).length,2,'exact source must appear once');
const sandbox={window:{}};
vm.runInNewContext(adapter,sandbox,{timeout:1500,filename:'scene500-native-answer-exact.js'});
const render=sandbox.window.PAI_SCENE1341_NATIVE_ANSWER.render;
const unit={
 k:'SC1341-KU-00001',
 w:{w:'wake up',pos:'',allSenses:[]},
 s:{ku_id:'SC1341-KU-00001',kuType:'scene1341',pos:'',
   m:'醒来',c:'wake up early',e:['I wake up at seven.'],
   example_zh:'我七点醒来。',x:'注意语境',playable:false},
 readOnly:true,canWriteSrs:false,productionReleaseAllowed:false
};
const own=render(unit,{showCollocations:true,showExamples:true,showCompare:true});
const nativeHtml=renderWithRealScene500AnswerHtml(unit);
assert.equal(own,nativeHtml,'browser preview output must exactly match native Scene500 for the same quarantined unit');
assert(own.includes('scene1341-example-translation'));
assert(own.includes('wake up early'));
assert(!own.includes('undefined'));
const hidden=render(unit,{showExamples:false,showCollocations:false,showCompare:false});
assert(!hidden.includes('I wake up at seven.'));
assert(!hidden.includes('wake up early'));
assert(!hidden.includes('scene1341-example-translation'));
for(const changed of [
 {...unit,canWriteSrs:true},
 {...unit,readOnly:false},
 {...unit,productionReleaseAllowed:true},
 {...unit,s:{...unit.s,playable:true}}
])assert.throws(()=>render(changed),/NONQUARANTINED/);
const injection={...unit,s:{...unit.s,m:'<img src=x onerror=alert(1)>'}};
const escaped=render(injection);
assert(escaped.includes('&lt;img'), 'native renderer escapes malicious source fields');
assert(!escaped.includes('<img'));

const cycleAdapter=fs.readFileSync('rebuild-preview/scene1341-readonly/scene500-native-cycle-exact.js','utf8');
const cycleStart=native.indexOf(' const cycleKeys=()=>{');
const cycleStop=native.indexOf('\n let pendingRatedBatchDirection',cycleStart);
assert(cycleStart>=0&&cycleStop>cycleStart);
const nativeCycleExact=native.slice(cycleStart,cycleStop);
assert(cycleAdapter.includes(nativeCycleExact),
 'Scene1341 cycleKeys must be byte-identical to native Scene500 source');
assert.equal(cycleAdapter.split(nativeCycleExact).length,2);
const cycleSandbox={window:{}};
vm.runInNewContext(cycleAdapter,cycleSandbox,{timeout:1500});
const nextIndex=cycleSandbox.window.PAI_SCENE1341_NATIVE_CYCLE.nextIndex;
for(const [count,batch,current,direction,expected] of [
 [26,10,9,1,0],[26,10,0,-1,9],[26,10,19,1,10],
 [26,10,25,1,20],[26,25,24,1,0],
 [26,50,25,1,0],[1,10,0,1,0]
]){
 const rows=Array.from({length:count},(_,i)=>({scene_ku_id:'SC1341-KU-'+String(i).padStart(5,'0')}));
 assert.equal(nextIndex(rows,current,direction,batch),expected);
}
assert.equal(nextIndex([],0,1,10),-1);
assert.throws(()=>nextIndex([{scene_ku_id:'DUP'},{scene_ku_id:'DUP'}],0,1,10),/BAD_KU_IDENTITY/);
assert(page.includes('window.PAI_SCENE1341_NATIVE_CYCLE.nextIndex(rows,current,direction,BATCH)'));


const ratingSource=fs.readFileSync('rebuild-preview/scene1341-readonly/scene500-native-rating-policy-exact.js','utf8');
const ratingBegin=native.indexOf(' const defaults={goodWithin:2,hardWithin:5,goodShow:2,hardShow:4,againShow:6,repeatCount:3,repeatGap:1};');
const ratingEnd=native.indexOf('\n let ratedVisibleKey=',ratingBegin);
assert(ratingBegin>=0&&ratingEnd>ratingBegin);
const nativeRatingPolicy=native.slice(ratingBegin,ratingEnd);
assert(ratingSource.includes(nativeRatingPolicy),'rating defaults and config must be byte-identical to native tap-flow');
assert.equal(ratingSource.split(nativeRatingPolicy).length,2);
assert(ratingSource.includes('const count={again:3,hard:2,good:1}[score]'),
 'native rated speech repetition counts must match Scene500');
const policySandbox={window:{}};
vm.runInNewContext(ratingSource,policySandbox,{timeout:1000});
const ratingPlan=policySandbox.window.PAI_SCENE500_NATIVE_RATING_POLICY.ratingPlan;
for(const [grade,showMs,repeatCount] of [['again',6000,3],['hard',4000,2],['good',2000,1]]){
 const plan=ratingPlan(grade);
 assert.equal(plan.showMs,showMs);assert.equal(plan.repeatCount,repeatCount);
 assert.equal(plan.repeatGapMs,1000);
}
assert.equal(ratingPlan('invalid'),null);
assert(page.indexOf('<script src="./scene500-native-rating-policy-exact.js"></script>')>=0);
assert(page.indexOf('<script src="./scene500-native-rating-policy-exact.js"></script>')<
 page.indexOf('<script src="./scene500-readonly-phase.js"></script>'),
 'native rating policy must be loaded before Scene1341 read-only phase controller');
const phaseSource=fs.readFileSync('rebuild-preview/scene1341-readonly/scene500-readonly-phase.js','utf8');
assert(phaseSource.includes('root.PAI_SCENE500_NATIVE_RATING_POLICY?.ratingPlan(grade)'));
const clock=new Map(),grades=[],advances=[],speaks=[];let clockId=0;
const context={window:{PAI_SCENE500_NATIVE_RATING_POLICY:policySandbox.window.PAI_SCENE500_NATIVE_RATING_POLICY}};
vm.runInNewContext(phaseSource,context,{timeout:1000});
const ctrl=context.window.PAI_SCENE500_READONLY_PHASE.createReadOnlyPhaseController({
 onUpdate:()=>{},onGradeComplete:(g,k)=>grades.push([g,k]),
 onAdvance:(g,k)=>advances.push([g,k]),
 playRatedWord:(g,i,done)=>{speaks.push([g,i]);done();return null},
 schedule:(fn,ms)=>{let id=++clockId;clock.set(id,{fn,ms});return id},
 unschedule:id=>clock.delete(id)
});
ctrl.start('SC1341-KU-00001');
for(const [grade,ms,count] of [['again',6000,3],['hard',4000,2],['good',2000,1]]){
 ctrl.choose(grade);
 const entries=[...clock.entries()];
 assert(entries.some(([id,x])=>x.ms===ms),'native rating show duration not scheduled: '+grade);
 const repeatedBefore=speaks.length;
 for(let guard=0;guard<10&&clock.size;guard++){
  const [id,x]=clock.entries().next().value;clock.delete(id);x.fn();
 }
 assert.equal(speaks.length-repeatedBefore,count,'native grade spoken repetitions: '+grade);
 assert.equal(advances.at(-1)?.[0],grade,'native grade must resolve to quarantined callback');
 ctrl.navigate('SC1341-KU-00001');
}
assert.equal(grades.length,3);
assert.equal(advances.length,3);

console.log('SC1341_EXACT_NATIVE_ANSWER_SOURCE_AND_BROWSER_ISOLATION_PASS');
