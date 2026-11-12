import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert(html.startsWith('<!doctype html>'));
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,'isolated demo must include executable inline JS');
new vm.Script(script,{filename:'scene1341-readonly-inline.js'});

/* Long phrases on the QUESTION page must remain on exactly one row
   at actual viewport width, without reducing the standard short-word size. */
assert(html.includes('white-space:nowrap!important') &&
 html.includes('overflow-wrap:normal!important') &&
 html.includes('word-break:normal!important'),
 'long question expressions must not wrap even before the font-size fit');
assert(script.includes("set('expression',r.expression);scheduleQuestionFit()") &&
 script.includes("window.addEventListener('resize',scheduleQuestionFit)"),
 'every new word and viewport resize must re-measure the question expression');
const fitStart=script.indexOf('function fitQuestionExpression(){');
const fitEnd=script.indexOf('\nlet questionFitFrame=',fitStart);
assert(fitStart>0&&fitEnd>fitStart,'must expose the actual responsive text fit function');
const fitBody=script.slice(fitStart,fitEnd);
const makeFit=(label,room)=>{
 let value=null,scale=null;
 const style={
  setProperty:(key,text,priority)=>{assert.equal(priority,'important');if(key==='font-size')value=parseFloat(text);if(key==='transform')scale=text},
  removeProperty:key=>{if(key==='font-size')value=null;if(key==='transform')scale=null},
  set transform(text){scale=text},
  get transform(){return scale}
 };
 const word={textContent:label,style,parentElement:{clientWidth:room},
  getBoundingClientRect:()=>({width:label.length*(value??44)*.58})};
 const fit=vm.runInNewContext('('+fitBody+')',{
  $:()=>word,getComputedStyle:()=>({fontSize:(value??44)+'px'})
 });
 fit();return {size:value??44,scale,width:label.length*(value??44)*.58};
};
const shortFit=makeFit('soon',300);
assert.equal(shortFit.size,44,'short word must keep original Scene500 typography');
assert.equal(shortFit.scale,null);
const longFit=makeFit('I am looking forward to hearing from you',300);
assert(longFit.size<44,'long phrase must reduce font size');
assert(longFit.width<=298.5,'long phrase must fit within one viewport line');
const veryLongFit=makeFit('extraordinary '.repeat(24),300);
assert(veryLongFit.size>=8&&veryLongFit.scale?.startsWith('scaleX('),
 'extremely long expressions must stay on one line using a last-resort horizontal fit');

/* Auto-toggle state parity: unlike SRS and KU, the user's ON/OFF UI
 * preference is saved in an isolated key and must survive home/reload.
 * Test actual JS adapter with persistent mock store and private Safari fallback. */
const autoPreferencePath='rebuild-preview/scene1341-readonly/scene1341-auto-preference.js';
const autoPreferenceSource=fs.readFileSync(autoPreferencePath,'utf8');
assert(html.includes('<script src="./scene1341-auto-preference.js"></script>'),
 'load the isolated auto preference before learning script');
assert(!/pai-word-scene500|ku-durable|scene1341-v2|indexedDB|\.commit\(|\.transaction\(/i.test(autoPreferenceSource),
 'auto preference adapter cannot read or write Scene500/SRS state');
assert(autoPreferenceSource.includes('pai-word-scene1341-readonly-auto-enabled-v1'),
 'auto preference must use its own read-only preview namespace');
const stateStore=new Map();
const mockLocalStorage={
 getItem:key=>stateStore.get(key)||null,
 setItem:(key,val)=>stateStore.set(key,String(val)),
 removeItem:key=>stateStore.delete(key)
};
const autoPrefContext={window:{localStorage:mockLocalStorage}};
vm.runInNewContext(autoPreferenceSource,autoPrefContext);
const prefStore=autoPrefContext.window.PAI_SCENE1341_AUTO_PREFERENCE;
assert.equal(prefStore.get(),false,'auto toggle OFF on first visit');
prefStore.set(true);
assert.equal(prefStore.get(),true,'toggle ON immediately');
assert.equal(stateStore.size,1,'only one isolated auto preference record written');
vm.runInNewContext(autoPreferenceSource,autoPrefContext);
assert.equal(autoPrefContext.window.PAI_SCENE1341_AUTO_PREFERENCE.get(),true,'reload restores auto ON');
autoPrefContext.window.PAI_SCENE1341_AUTO_PREFERENCE.set(false);
assert.equal(autoPrefContext.window.PAI_SCENE1341_AUTO_PREFERENCE.get(),false);
assert.equal(stateStore.size,0,'explicit OFF clears the preference record');
assert.equal(prefStore.getSpeed(),1.5,'auto speed defaults to native 1.5s');
assert.equal(prefStore.setSpeed(2),false,'only Scene500 speed options may persist');
assert.equal(prefStore.setSpeed(3),true);
assert.equal(prefStore.getSpeed(),3,'changed speed applies immediately');
assert.equal(stateStore.size,1,'speed uses its own isolated preference key');
vm.runInNewContext(autoPreferenceSource,autoPrefContext);
assert.equal(autoPrefContext.window.PAI_SCENE1341_AUTO_PREFERENCE.getSpeed(),3,
 'reload restores selected 3-second auto interval');
autoPrefContext.window.PAI_SCENE1341_AUTO_PREFERENCE.setSpeed(1.5);
assert.equal(autoPrefContext.window.PAI_SCENE1341_AUTO_PREFERENCE.getSpeed(),1.5);
assert(script.includes("autoPreference.setSpeed(prefs.autoBrowseInterval);autoBrowse.setDelay(") &&
 script.includes("readOnlyPrefs.set('autoBrowseInterval',autoPreference.getSpeed())"),
 'auto interval saves changes and is restored before first scene opens');

const privateSafari={window:{localStorage:{getItem(){throw Error('private')},setItem(){throw Error('private')},removeItem(){throw Error('private')}}}};
vm.runInNewContext(autoPreferenceSource,privateSafari);
privateSafari.window.PAI_SCENE1341_AUTO_PREFERENCE.set(true);
assert.equal(privateSafari.window.PAI_SCENE1341_AUTO_PREFERENCE.get(),true,'private Safari keeps in-memory auto ON');
privateSafari.window.PAI_SCENE1341_AUTO_PREFERENCE.setSpeed(6);
assert.equal(privateSafari.window.PAI_SCENE1341_AUTO_PREFERENCE.getSpeed(),6,
 'private Safari uses in-memory auto interval fallback');

assert(script.includes('autoBrowse.pause();sceneId=id') &&
 script.includes("autoBrowse.pause();stopWordAudio();resetScratch();$('learning').hidden=true;"),
 'entering/leaving the scene must PAUSE the timer instead of clearing enabled flag');
assert(script.includes("if(autoPreference.get())autoBrowse.start();else autoBrowse.stop();"),
 'reentering scene restores the ON preference and restarts the timer');
assert(script.includes('function stopAuto(){autoBrowse.stop();autoPreference.set(false)}') &&
 script.includes('function startAuto(){autoPreference.set(true);autoBrowse.start()}'),
 'only explicit toggle changes persisted ON/OFF state');
assert(script.includes("readOnlyPrefs.reset();stopAuto()"),
 'restore defaults turns auto OFF as native Scene500 does');
const autoNativeSource=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
assert(autoNativeSource.includes('state.autoBrowseEnabled=!!enabled;save();restartAutoBrowse();render();') &&
 autoNativeSource.includes('window.PAI_AUTOBROWSE?.stop();') &&
 autoNativeSource.includes('state.autoBrowseEnabled=false;'),
 'UI persistence and reset are grounded in native Scene500 behavior');

// The canonical 1341 scene catalog remains pinned; the visible content now
// comes from the newer 1778 CG-QA screened provisional answers, read-only.
assert(script.includes("const SOURCE='2cecf85fdb1b6b73fcd4b96c11bcb872a30c92db'"));
assert(script.includes('scene1341-qa-preview-loader.mjs'));
assert(script.includes('items.length!==1778'));
assert(script.includes('CG-QA 暂通过'));
assert(!script.includes('pai-word-preview-ku-durable'));

// No browser-side persisted learning state and no service worker inside isolated preview.
assert(!/localStorage\b|sessionStorage\b|indexedDB\b|navigator\.serviceWorker\b|\.commit\s*\(/.test(script),
 'isolated demo must not persist SRS or user records');
assert(html.includes('data-grade="again" disabled'));
assert(html.includes('data-grade="hard" disabled'));
assert(html.includes('data-grade="good" disabled'));
assert(script.includes('transientRatings'));
assert(!html.includes('class="demo-qa"'), 'internal QA metadata cannot add learning UI rows');
assert(html.includes('scene500-mobile.css'));
assert(html.includes('scene500-learning.css'));
assert(html.includes('scene500-home.css'));
for(const speed of ['0.9','1.5','3','6'])assert(html.includes('value="'+speed+'"'), 'Scene500 native auto-browse speed in seconds');
for(const file of ['scene500-mobile.css','scene500-learning.css','scene500-home.css'])
 assert(fs.statSync('rebuild-preview/scene1341-readonly/'+file).size>0);

// The older 304 records remain only as historical QA fixtures; no longer the demo limit.
const root='tools/integration/scene1341-teaching/';
const qa=JSON.parse(fs.readFileSync(root+'qa-304-status-staging.v1.json','utf8'));
assert.equal(qa.release_eligible,false);
assert.equal(qa.counts.release_approved,0);
assert.equal(qa.flags.length,27);

const nativeIndex=fs.readFileSync('rebuild-preview/index.html','utf8');
const nativeCss=nativeIndex.match(/<style id="pai-preview-rating-bar">([\s\S]*?)<\/style>/)?.[1];
assert(nativeCss && html.includes(nativeCss),'Scene500 native preview geometry CSS must remain identical');
assert(html.indexOf('Scene1341 responsive expression sizing')>html.indexOf(nativeCss)+nativeCss.length,
 'responsive long-question typography must live AFTER the unmodified Scene500 layout block');
for(const cls of [
 'class="screen study-screen learning-screen demo-learning"',
 'class="study-top"','class="study-scene"','class="study-progress"',
 'class="study-body"','class="word-hero"','class="word-line"',
 'class="word"','class="speak-btn"','class="ipa"',
 'class="answer"','class="answer-section"','class="answer-label"',
 'class="definition-line"','class="definition"','class="collocations"',
 'class="example"','class="example-num"','class="example-play"',
 'class="recall-correction"'
])assert(html.includes(cls),'Scene500 DOM contract missing: '+cls);
assert(!html.includes('Fidelity patch'),'do not reintroduce isolated Scene1341 layout imitation');
assert(html.includes('id="example-speak"'),'native answer example playback must exist');

const learningFace=html.slice(html.indexOf('<section id="learning"'),html.indexOf('</section>',html.indexOf('<section id="learning"')));
assert(/class="word-line"[^>]*><div class="word"/.test(learningFace),'word-only Scene500 first row');
assert(/class="ipa-line"[^>]*>.*?class="ipa".*?class="speak-btn"/s.test(learningFace),'speaker must share native IPA row');
assert(/class="recall-controls-row"[^>]*>.*?class="recall-cue".*?class="auto-word-toggle"/s.test(learningFace),'auto browse must share native recall row');
assert(!learningFace.includes('id="auto-speed"'),'speed settings must not shift the study hero geometry');
assert(!learningFace.includes('class="demo-ops"') && !learningFace.includes('class="demo-qa"') && !learningFace.includes('class="tap-hint"'), 'no Scene1341-only learning controls or notices');
assert(script.includes("b.disabled=false"),'both faces must retain Scene500 three-button visual layout');
assert(script.includes('scene1341-qa-preview-loader.mjs'),'QA provisional, immutable preview source');

assert(html.includes('id="collocations-section"') && html.includes('id="usage-section"'),
 'optional answer teaching sections must have distinct view containers');
assert(script.includes("$('collocations-section').hidden=collocations.length===0"),
 'empty collocation rows must not appear');
assert(script.includes("$('usage-section').hidden=teachingNotes.length===0"),
 'empty usage sections must not appear');
assert(script.includes('qaInternal.test(v)'),'internal QA/source notes must be quarantined from learner-visible teaching text');
assert(html.includes('id="meaning"') && html.includes('id="example"') && html.includes('id="translation"'),
 'full answer must retain zh meaning and bilingual example');
assert(script.includes("$('answer').hidden=!revealed"),'question face must not reveal teaching answer data');
assert(!html.includes('data-approved-teaching-ku'), 'author drafts must not carry approved teaching DOM flags');
assert(html.includes('data-test-teaching="example" data-publication-status="author-draft"'), 'bilingual examples must remain in Scene500 test teaching layout and explicitly marked draft');
assert(html.includes('data-srs-write="disabled"'), 'unapproved drafts never write SRS');

const scene500StylePaths=[
 ['mobile.css','scene500-mobile.css'],
 ['ux-fix.css','scene500-ux-fix.css'],
 ['product-v2.css','scene500-product-v2.css'],
 ['learning.css','scene500-learning.css'],
 ['home-dashboard.css','scene500-home.css']
];
const linkedStylePaths=[...html.matchAll(/<link rel="stylesheet" href="\.\/([^"]+\.css)"/g)].map(x=>x[1]);
assert.deepEqual(linkedStylePaths,scene500StylePaths.map(x=>x[1]),
  'Scene1341 must load EXACT original Scene500 five-CSS cascade in native order');
for(const [original,mirror] of scene500StylePaths){
 const originBytes=fs.readFileSync(original);
 const mirrorBytes=fs.readFileSync('rebuild-preview/scene1341-readonly/'+mirror);
 assert(originBytes.equals(mirrorBytes),mirror+' must match source byte-for-byte');
}
const nativeTapFlow=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
assert(nativeTapFlow.includes("function choose(score){") && nativeTapFlow.includes("startRatedSequence(score);"),
 'current Scene500 controller must accept question-side grade via choose');
assert(script.includes('function demoGrade(grade){') &&
 script.includes('phaseController.choose(grade)') &&
 script.includes('window.PAI_SCRATCH_BEGIN_RATING?.()') &&
 script.includes('window.PAI_SCRATCH_FINISH_RATING?.()'),
 'Scene1341 must delegate grading to read-only phase controller with native scratch hooks');

const scene500Renderer=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
const scene500Face=scene500Renderer.slice(scene500Renderer.indexOf('const autoSwitch=`'),scene500Renderer.indexOf(" let query='';",scene500Renderer.indexOf('const autoSwitch=`')));
assert(scene500Face.includes('<div class="word-hero') && scene500Face.includes('<div class="study-body">'),
 'native Scene500 renderer must expose original hero/body shell');
assert(scene500Face.indexOf('<div class="word-hero')<scene500Face.indexOf('<div class="study-body">'),
 'native Scene500 word hero must precede body');
const heroIndex=learningFace.indexOf('<div class="word-hero" id="hero">');
const studyBodyIndex=learningFace.indexOf('<div class="study-body" id="studybody">');
assert(heroIndex>0&&studyBodyIndex>heroIndex,
 'Scene1341 learning face MUST use native fixed hero sibling BEFORE scrollable study-body');
assert(learningFace.includes('</div>\n <div class="study-body" id="studybody">'),
 'Scene1341 hero closing boundary must be outside study-body');
assert(learningFace.includes('<label class="auto-word-toggle"') &&
 learningFace.includes('id="auto-toggle" type="checkbox"') &&
 learningFace.includes('class="auto-word-symbol"') &&
 learningFace.includes('<svg viewBox="0 0 24 24"'),
 'Scene1341 auto-browse DOM must match the original Scene500 checkbox/SVG control');
assert(scene500Face.includes('<label class="auto-word-toggle"')&&scene500Face.includes('type="checkbox"'),
 'Scene500 auto-browse reference must be the original checkbox implementation');
assert(!html.includes('#learning .word-hero .ipa-line{'),
 'do not silently reintroduce isolated hero geometry overrides');
assert(script.includes('suppressTapUntil=window.__paiTapSuppressUntil=Date.now()+700'),
 'swipe must suppress synthesized Safari tap through the native Scene500 shared click guard');
assert(script.includes("Math.abs(dx)>=65") && script.includes("Math.abs(dy)>=75") &&
 script.includes("Math.abs(dy)*1.3"),'native Scene500 swipe gesture thresholds');
assert(!script.includes('function enterHand()') && !html.includes('class="handwrite-board"'),
 'old bespoke Scene1341 handwriting must be removed in favor of native Scene500 scratch');

const phaseAssetPath='rebuild-preview/scene1341-readonly/scene500-readonly-phase.js';
const phaseSource=fs.readFileSync(phaseAssetPath,'utf8');
assert(html.includes('<script src="./scene500-readonly-phase.js"></script>'),
 'preview must load real local read-only phase adapter before inline learning script');
assert(!['localStorage','sessionStorage','indexedDB','navigator.serviceWorker','.commit('].some(x=>phaseSource.includes(x)), 'isolated controller must be free of durable learning state / storage APIs');
assert(script.includes('phaseController.start(') && script.includes('phaseController.navigate(')
 && script.includes('phaseController.tap()') && script.includes('phaseController.choose(grade)'),
 'both question and answer pages must share one read-only interaction state machine');
assert(scene500Renderer.includes("function choose(score){") &&
 scene500Renderer.includes("const defaults={goodWithin:2,hardWithin:5,goodShow:2,hardShow:4,againShow:6"),
 'reference current ACTIVE Scene500 phase contract, not obsolete tap-flow.js');
const context={};vm.runInNewContext(phaseSource,context,{filename:phaseAssetPath});
const api=context.PAI_SCENE500_READONLY_PHASE;
assert(api&&typeof api.createReadOnlyPhaseController==='function','read-only controller loaded in V8');
assert.equal(api.DEFAULT_SHOW_MS.good,2000);
assert.equal(api.DEFAULT_SHOW_MS.hard,4000);
assert.equal(api.DEFAULT_SHOW_MS.again,6000);
let timerID=0;const pendingTimers=new Map(),actualGrades=[],actualAdvance=[],seenFaces=[];
const schedule=(fn,ms)=>{const id=++timerID;pendingTimers.set(id,{fn,ms});return id};
const unschedule=id=>pendingTimers.delete(id);
const phase=api.createReadOnlyPhaseController({
 onUpdate:state=>seenFaces.push({face:state.phase,selected:state.selected}),
 onGradeComplete:(grade,key)=>actualGrades.push([grade,key]),
 onAdvance:(grade,key)=>actualAdvance.push([grade,key]),
 schedule,unschedule
});
phase.start('SC1341-KU-00001');
assert.equal(phase.state().revealed,false);
assert.equal(phase.choose('good'),true,'native Scene500 permits direct rating from question');
assert.equal(phase.state().revealed,true);
assert.equal(phase.state().selected,'good');
assert.equal([...pendingTimers.values()][0].ms,2000);
for(const [id,x] of [...pendingTimers]){pendingTimers.delete(id);x.fn()}
assert.equal(actualGrades.length,1);
assert.equal(actualAdvance.length,1);
assert.equal(actualAdvance[0][0],'good');
phase.start('SC1341-KU-00002');phase.choose('hard');
assert.equal([...pendingTimers.values()][0].ms,4000);
phase.tap();
assert.equal(phase.state().revealed,false);
assert.equal(actualGrades.length,2);
assert.equal(actualAdvance.length,1,'blank tap must not create an extra advance');
assert.equal(pendingTimers.size,0,'tap cancels the pending grade timer');
phase.choose('again');assert.equal([...pendingTimers.values()][0].ms,6000);
phase.navigate('SC1341-KU-00003');
assert.equal(phase.state().revealed,false);
assert.equal(pendingTimers.size,0,'swipe cancels old pending delayed advance');
assert.equal(actualGrades.length,3,'navigation settles pending transient grade once');
assert.equal(actualAdvance.length,1,'no background timer can advance after swipe');
assert.equal(phase.choose('invalid'),false);
phase.cancel();assert.equal(phase.state().cardKey,null);

assert(scene500Renderer.includes('const autoInterval=(speechEnded=false)=>') &&
 scene500Renderer.includes('const afterSpeech={0.9:0.2,1.5:0.6,3:2,6:5}'),
 'native Scene500 auto-browse waits for post-speech interval');
assert(script.includes('createReadOnlyAutoBrowse(') &&
 script.includes('isBusy:()=>phaseController.state().pending||wordAudioActive||!!(window.speechSynthesis?.speaking||window.speechSynthesis?.pending)') &&
 script.includes('navigate:()=>autoNextWithinBatch()'),
 'Scene1341 must use Scene500-like speech-idle and correction-idle AUTO NEXT, not automatic answer flip');
assert(!script.includes('if(!revealed)show();else if(index<subset().length-1)move(1)'),
 'old alternate reveal/move auto-browse loop must never return');
let automaticID=0,busy=false,speaking=false,allowed=true;
const automaticTimers=new Map(),autoMoves=[],autoStates=[];
const auto=api.createReadOnlyAutoBrowse({
 shouldRun:()=>allowed,isBusy:()=>busy,isSpeaking:()=>speaking,
 navigate:()=>{autoMoves.push('next');return autoMoves.length<3},
 onState:on=>autoStates.push(on),
 schedule:(fn,ms)=>{const id=++automaticID;automaticTimers.set(id,{fn,ms});return id},
 unschedule:id=>automaticTimers.delete(id)
});
const fireOne=()=>{
 const first=automaticTimers.entries().next().value;
 assert(first,'auto timer expected');
 automaticTimers.delete(first[0]);first[1].fn();return first[1].ms;
};
assert.equal(auto.getDelay(),1500,'Scene500 native default is 快: 1.5s normal wait');
assert.equal(auto.setDelay(1500),true);
assert.equal(auto.setDelay(600),false,'post-speech 0.6s is not itself a speed tier');
assert.equal(auto.setDelay(1234),false);
auto.start();assert.equal(auto.isEnabled(),true);
assert.equal([...automaticTimers.values()][0].ms,1500);
busy=true;speaking=true;assert.equal(fireOne(),1500);
assert.equal(autoMoves.length,0,'speech in progress must block auto navigation');
assert.equal([...automaticTimers.values()][0].ms,120);
busy=false;speaking=false;assert.equal(fireOne(),120);
assert.equal([...automaticTimers.values()][0].ms,600,'native 快 tier waits 0.6s AFTER spoken word');
assert.equal(fireOne(),600);assert.equal(autoMoves.length,1);
auto.setDelay(900);assert.equal([...automaticTimers.values()][0].ms,900);
auto.stop();assert.equal(automaticTimers.size,0);
auto.start();allowed=false;fireOne();
assert.equal(auto.isEnabled(),true,'background/hidden must stop timing but preserve auto enabled state');
assert.equal(automaticTimers.size,0);
allowed=true;auto.resume();
assert.equal([...automaticTimers.values()][0].ms,900,'foreground restores selected auto speed');
auto.stop();assert.equal(auto.isEnabled(),false,'only explicit OFF should clear enabled flag');

/* Native Scene500 screen Wake Lock lifecycle: optional, never blocks
 * timer operation, releases on hidden/home, and reacquires on foreground. */
assert(phaseSource.includes("navigator.wakeLock.request('screen')") &&
 phaseSource.includes("lock.addEventListener?.('release'") &&
 phaseSource.includes('function pause(){clear();releaseWake()}'),
 'read-only Scene1341 auto mode must honor native wake-lock lifecycle');
let wakeRequests=0,wakeReleases=0;
const wakeCtx={
 navigator:{wakeLock:{request:async()=>{
  wakeRequests++;
  return {release:async()=>{wakeReleases++},addEventListener:()=>{}};
 }}}
};
vm.runInNewContext(phaseSource,wakeCtx);
let wakeId=0;const wakeTimers=new Map();
const wakeAuto=wakeCtx.PAI_SCENE500_READONLY_PHASE.createReadOnlyAutoBrowse({
 shouldRun:()=>true,isBusy:()=>false,navigate:()=>true,onState:()=>{},
 schedule:(fn,ms)=>{const id=++wakeId;wakeTimers.set(id,{fn,ms});return id},
 unschedule:id=>wakeTimers.delete(id)
});
wakeAuto.start();
await Promise.resolve();await Promise.resolve();
assert.equal(wakeRequests,1,'auto ON requests wake lock when supported');
wakeAuto.pause();
await Promise.resolve();await Promise.resolve();
assert.equal(wakeReleases,1,'pausing on hidden/home releases screen wake lock');
assert.equal(wakeAuto.isEnabled(),true,'pause must not turn off user-selected auto mode');
wakeAuto.resume();
await Promise.resolve();await Promise.resolve();
assert.equal(wakeRequests,2,'foreground auto resume reacquires wake lock');
wakeAuto.stop();
await Promise.resolve();await Promise.resolve();
assert.equal(wakeReleases,2,'explicit OFF releases wake lock');
assert.equal(wakeAuto.isEnabled(),false);

const nativeScratchPath='rebuild-preview/scene1341-readonly/scene500-native-scratch.js';
const nativeScratch=fs.readFileSync(nativeScratchPath,'utf8');
new vm.Script(nativeScratch,{filename:nativeScratchPath});
const originalScratch=scene500Renderer.slice(scene500Renderer.indexOf('// Ephemeral handwriting mode:'));
assert(originalScratch.startsWith('// Ephemeral handwriting mode:') && originalScratch.includes("ctx.quadraticCurveTo(lastInk.x,lastInk.y,mid.x,mid.y)"),
 'active Scene500 native handwriting source and smoothed stroke implementation required');
assert(html.includes('<script src="./scene500-native-scratch.js"></script>'),
 'native handwriting controller must load on the isolated page');
assert(html.includes('class="pai-scratch-area"') && html.includes('class="pai-scratch-canvas"'),
 'question and answer must use native Scene500 scratch DOM');
assert(!html.includes('class="handwrite-board"') && !html.includes('id="draw-canvas"'),
 'reject legacy cropped Scene1341 handwriting surface');
for(const fragment of [
 "ctx.quadraticCurveTo(lastInk.x,lastInk.y,mid.x,mid.y)",
 "getCoalescedEvents",
 "activeSurface.classList.remove('is-drawing')",
 "window.PAI_SCENE1341_SCRATCH_RESET=reset",
 "screen.appendChild(surface)",
 "screen.classList.add('pai-scratch-active')",
 "ordinaryTimer=setTimeout(()=>{",
 "},600)",
 "Math.hypot(e.clientX-ordinaryPress.x,e.clientY-ordinaryPress.y)>8",
 "document.addEventListener('selectstart'"
])assert(nativeScratch.includes(fragment),'native Scene500 scratch contract missing: '+fragment);
assert(!['localStorage','sessionStorage','indexedDB','.commit('].some(t=>nativeScratch.includes(t)),
 'scratch subsystem must not persist unapproved KU or SRS');
assert(script.includes('const scratchDrawing=()=>window.PAI_SCRATCH_DRAWING?.()===true') &&
 script.includes('window.render=renderCard;') &&
 script.includes('window.getVisibleLearningUnit=()=>'),
 'source controller must consume only isolated Scene1341 read-only view adapter');
assert(script.includes('resetScratch();stopWordAudio();phaseController.navigate('),
 'word and batch navigation must reset handwriting safely');

/* Active Scene500 scratch integration expects FINISH after delayed advance,
   not synchronously with button click (2/4/6 sec graded answer display). */
const gradeFn=script.slice(script.indexOf('function demoGrade('),script.indexOf("$('back').addEventListener",script.indexOf('function demoGrade(')));
const advanceHandler=script.slice(script.indexOf('onAdvance:()=>'),script.indexOf('});',script.indexOf('onAdvance:()=>'))+3);
assert(gradeFn.includes('window.PAI_SCRATCH_BEGIN_RATING?.()'),'grading must record active drawing');
assert(gradeFn.includes('phaseController.choose(grade)'),'grading must reveal the timed answer');
assert(!gradeFn.includes('PAI_SCRATCH_FINISH_RATING'),'do not restore drawing onto previous answer before timer expires');
assert(advanceHandler.includes("move(1,false,true)"),'rated advance must mark navigation as delayed rating transition');
assert(advanceHandler.indexOf('move(1,false,true)')<advanceHandler.indexOf('PAI_SCRATCH_FINISH_RATING?.()'),
 'scratch finish must follow rated advance, never precede it');
const manualMove=script.slice(script.indexOf('function move('),script.indexOf('function demoGrade('));
assert(manualMove.includes('if(hadPending&&!fromRatedAdvance)window.PAI_SCRATCH_FINISH_RATING?.()'),
 'manual swipe during pending grade must cancel and settle scratch once');
const blankTap=script.slice(script.indexOf('function show(){'),script.indexOf('function move('));
assert(blankTap.includes('if(pending){stopWordAudio();window.PAI_SCRATCH_FINISH_RATING?.();autoBrowse.restart()}'),
 'blank tap cancellation must clear pending drawing rating');
let advancedDuringRating=0,scratchFinishes=0;
const delayedTasks=new Map();let taskID=0;
const transition=api.createReadOnlyPhaseController({
 onUpdate:()=>{},
 onGradeComplete:()=>{},
 onAdvance:()=>{advancedDuringRating++;scratchFinishes++},
 schedule:(fn,ms)=>{const id=++taskID;delayedTasks.set(id,{fn,ms});return id},
 unschedule:id=>delayedTasks.delete(id)
});
transition.start('KU-SCRATCH-01');
transition.choose('good');
assert.equal(advancedDuringRating,0);
assert.equal(scratchFinishes,0,'must not call scratch finish at grade click');
const scheduled=delayedTasks.values().next().value;
assert.equal(scheduled.ms,2000);
scheduled.fn();
assert.equal(advancedDuringRating,1);
assert.equal(scratchFinishes,1,'one scratch finish after actual timed navigation');

/* Scene500 persistent face contract: explicitly chosen answer remains answer
 * across automatic navigation, horizontal word swipe, vertical batch change,
 * and graded progression, without any SRS persistence. */
assert(scene500Renderer.includes("preferredPageState='QUESTION'") &&
 scene500Renderer.includes("wasRevealed=window.PAI_PREFERRED_CARD_FACE?.()==='ANSWER'") &&
 scene500Renderer.includes("PAI_TAP_FLOW.browseReady(u.k,()=>window.advanceBrowsedAnswer(),wasRevealed)"),
 'ground face persistence in ACTIVE Scene500 browseAnswer controller');
assert(phaseSource.includes("preferredFace") &&
 phaseSource.includes("phase=preferredFace==='answer'?'answer-paused':'question'"),
 'Scene1341 navigate must inherit explicit preferred face, not force question');
assert(script.includes('phaseController.navigate(rows[index].scene_ku_id)'),
 'horizontal and vertical user navigation must share persistent-face controller');
assert(script.includes('move(1,true)') &&
 script.includes("phaseController.navigate(subset()[index].scene_ku_id)"),
 'automatic and final rated navigation must also inherit preferred face');
const faceUpdates=[],faceTimers=new Map();let faceTimerID=0;
const face=api.createReadOnlyPhaseController({
 onUpdate:next=>faceUpdates.push(next),
 onGradeComplete:()=>{},
 onAdvance:()=>{},
 schedule:(fn,ms)=>{const id=++faceTimerID;faceTimers.set(id,{fn,ms});return id},
 unschedule:id=>faceTimers.delete(id)
});
face.start('F-1');
assert.equal(face.state().revealed,false,'fresh Scene1341 session begins on question');
face.tap();
assert.equal(face.state().revealed,true);
assert.equal(face.state().preferredFace,'answer');
for(const [route,key] of [['horizontal forward','F-2'],['horizontal backward','F-1'],['vertical next batch','F-26'],['vertical previous batch','F-1'],['auto next','F-3']]){
 face.navigate(key);
 assert.equal(face.state().revealed,true,route+' MUST retain answer face');
 assert.equal(face.state().preferredFace,'answer',route+' must not change preference');
}
face.choose('good');
assert.equal(face.state().revealed,true,'rated answer remains visible');
face.navigate('F-4');
assert.equal(face.state().revealed,true,'rated advance preserves chosen answer face');
assert.equal(faceTimers.size,0,'navigation cancels stale rated countdown');
face.tap();
assert.equal(face.state().revealed,false,'explicit blank tap exits answer mode');
face.navigate('F-5');
assert.equal(face.state().revealed,false,'question mode persists after manual switch back');
face.choose('hard');
assert.equal(face.state().revealed,true,'direct question-side grading temporarily reveals answer');
assert.equal(face.state().preferredFace,'question','rating does not redefine selected face');
face.navigate('F-6');
assert.equal(face.state().revealed,false,'rating from question mode must not permanently switch to answer');
face.tap();face.navigate('F-7');
assert.equal(face.state().revealed,true);
face.cancel();face.start('F-NEW-SCENE');
assert.equal(face.state().revealed,false,'starting a new scene resets initial face to question');

/* Check direct source parity of navigation and native entry voice. */
assert(scene500Renderer.includes("const next=(index+direction+keys.length)%keys.length"),
 'native Scene500 word browsing wraps at both edges');
assert(scene500Renderer.includes("const nextBatch=(Math.floor(position/size)+direction+batches)%batches"),
 'native Scene500 batch browsing wraps at both ends');
assert(scene500Renderer.includes("const batchSize=Math.max(1,Number(state.wordsPerRound)||10)") &&
 scene500Renderer.includes("state.wordsPerRound=10;"),
 'native Scene500 default batch size is ten KU');
assert(script.includes("let BATCH=10,selectedGrade=null;") && script.includes("BATCH=prefs.wordsPerRound;"),'Scene1341 default must match native 10-KU batch');
/* Native Scene500 auto browse wraps INSIDE the current scene batch, not
   across the entire Scene1341 catalog. Execute the real staged handler with
   multiple full, partial and singleton batches, at all supported batch sizes. */
assert(scene500Renderer.includes('const cycleKeys=()=>') &&
 scene500Renderer.includes('return all.slice(start,start+size);') &&
 scene500Renderer.includes('const next=(index+direction+keys.length)%keys.length;'),
 'Scene500 native auto-navigation must cycle within the current batch');
const batchCycleBegin=script.indexOf('function currentBatchNextIndex(');
const batchCycleEnd=script.indexOf('\nfunction syncReadOnlySettingsControls(',batchCycleBegin);
assert(batchCycleBegin>0&&batchCycleEnd>batchCycleBegin,'locate one shared batch-index algorithm');
const batchCycleCode=script.slice(batchCycleBegin,batchCycleEnd);
assert(batchCycleCode.includes('const keys=rows.slice(start,start+size)') &&
 batchCycleCode.includes('const next=(position+direction%keys.length+keys.length)%keys.length'),
 'both manual and automatic index rules must reuse native Scene500 cycleKeys + browseAnswer strategy');
assert(script.includes('navigate:()=>autoNextWithinBatch()') &&
 script.includes('move(1,true)') &&
 script.includes('const nextIndex=currentBatchNextIndex(rows,index,delta);if(nextIndex<0)return;') &&
 script.includes('}else move(1,false,true);'),
 'auto, manual and rated advancement must ALL use the same current-batch index owner');
for(const [count,batch,current,delta,expected] of [
 [26,10,0,1,1],[26,10,8,1,9],[26,10,9,1,0],
 [26,10,0,-1,9],[26,10,10,-1,19],
 [26,10,10,1,11],[26,10,19,1,10],
 [26,10,20,1,21],[26,10,25,1,20],[26,10,20,-1,25],
 [26,25,24,1,0],[26,25,0,-1,24],[26,25,25,1,25],
 [26,50,25,1,0],[10,10,9,1,0],[1,10,0,1,0]
]){
 const rows=Array.from({length:count},(_,i)=>({scene_ku_id:'K'+i,expression:'word'+i}));
 const ctx={BATCH:batch,index:current,subset:()=>rows,moves:0};
 ctx.move=(d,auto)=>{
  assert.equal(auto,true);ctx.moves++;
  ctx.index=ctx.currentBatchNextIndex(rows,ctx.index,d);
 };
 vm.runInNewContext(batchCycleCode+'\nthis.currentBatchNextIndex=currentBatchNextIndex;this.autoNextWithinBatch=autoNextWithinBatch;',ctx);
 assert.equal(ctx.currentBatchNextIndex(rows,current,delta),expected,
  `MANUAL count=${count} batch=${batch} current=${current} delta=${delta}`);
 if(delta===1){
  assert.equal(ctx.autoNextWithinBatch(),true);
  assert.equal(ctx.index,expected,`AUTO count=${count} batch=${batch} current=${current}`);
  assert.equal(ctx.moves,1);
 }
}
const empty={BATCH:10,index:0,subset:()=>[],move:()=>{throw Error('no navigation')}};
vm.runInNewContext(batchCycleCode+'\nthis.autoNextWithinBatch=autoNextWithinBatch;',empty);
assert.equal(empty.autoNextWithinBatch(),false,'empty current batch must stop auto');
/* Call the actual horizontal/keyboard move function, not just batch math.
   It must navigate to the correctly wrapped KU and preserve the preferred
   ANSWER face through the native scene phase adapter. */
const moveSourceBegin=script.indexOf('function move(delta,fromAuto=false,fromRatedAdvance=false){');
const moveSourceEnd=script.indexOf('\nfunction moveBatch(',moveSourceBegin);
assert(moveSourceBegin>0&&moveSourceEnd>moveSourceBegin);
const moveSource=script.slice(moveSourceBegin,moveSourceEnd);
for(const [start,dir,want] of [[9,1,0],[0,-1,9],[19,1,10],[25,1,20]]){
 const rows=Array.from({length:26},(_,i)=>({scene_ku_id:'K'+i,expression:'word'+i}));
 const controller=api.createReadOnlyPhaseController({onUpdate:()=>{},onGradeComplete:()=>{},onAdvance:()=>{}});
 controller.start('K'+start);controller.tap();
 const ctx={index:start,BATCH:10,revealed:true,subset:()=>rows,phaseController:controller,
  scratchDrawing:()=>false,resetScratch:()=>{},stopWordAudio:()=>{},
  readOnlyPrefs:{get:()=>false},autoBrowse:{restart:()=>{}},
  window:{PAI_SCRATCH_FINISH_RATING:()=>{},PAI_SCRATCH_AUTO_TRANSITION:false}};
 vm.runInNewContext(batchCycleCode+'\n'+moveSource+'\nthis.manualMove=move;',ctx);
 ctx.manualMove(dir);
 assert.equal(ctx.index,want,'manual navigation stays in current round');
 assert.equal(controller.state().cardKey,'K'+want);
 assert.equal(controller.state().revealed,true,'manual navigation retains ANSWER face');
}
/* Independent PASS 2: EXECUTE the composed UI navigation paths in order,
   rather than checking manual, auto and vertical swipes in isolation.
   This guards the exact failure where auto was batch-local while manual
   accidentally looped over the entire Scene1341 catalog. */
const composedRows=Array.from({length:26},(_,i)=>({scene_ku_id:'N-'+i,expression:'word '+i}));
let composedScratch=0,composedAudioStops=0,composedAutoRestarts=0,composedSpeeches=0;
const composed={index:9,BATCH:10,revealed:true,subset:()=>composedRows,
 scratchDrawing:()=>false,resetScratch:()=>{composedScratch++},
 stopWordAudio:()=>{composedAudioStops++},
 readOnlyPrefs:{get:()=>false},
 playWord:()=>{composedSpeeches++},
 autoBrowse:{restart:()=>{composedAutoRestarts++}},
 window:{PAI_SCRATCH_FINISH_RATING:()=>{},PAI_SCRATCH_AUTO_TRANSITION:false}};
const composedPhase=api.createReadOnlyPhaseController({
 onUpdate:state=>{composed.revealed=state.revealed},
 onGradeComplete:()=>{},onAdvance:()=>{}});
composed.phaseController=composedPhase;
composedPhase.start('N-9');composedPhase.tap();
const composedBatchCode=script.slice(script.indexOf('function moveBatch(delta){'),script.indexOf('function demoGrade(',script.indexOf('function moveBatch(delta){')));
vm.runInNewContext(batchCycleCode+'\n'+moveSource+'\n'+composedBatchCode+
 '\nthis.manualMove=move;this.manualBatch=moveBatch;this.autoStep=autoNextWithinBatch;',composed);
const checkComposed=(expected,label)=>{
 assert.equal(composed.index,expected,label+' index');
 assert.equal(composedPhase.state().cardKey,'N-'+expected,label+' KU');
 assert.equal(composedPhase.state().revealed,true,label+' ANSWER face');
};
composed.manualMove(1);checkComposed(0,'manual end-of-batch forward wrap');
composed.manualMove(-1);checkComposed(9,'manual first-to-last backward wrap');
assert.equal(composed.autoStep(),true);checkComposed(0,'auto wrap from last of batch 1');
composed.manualBatch(1);checkComposed(10,'vertical swipe selects batch 2');
composed.manualMove(-1);checkComposed(19,'manual backward wrap in batch 2');
assert.equal(composed.autoStep(),true);checkComposed(10,'automatic wrap in batch 2');
composed.manualBatch(1);checkComposed(20,'vertical swipe selects partial batch 3');
composed.manualMove(-1);checkComposed(25,'partial batch backward wrap');
assert.equal(composed.autoStep(),true);checkComposed(20,'partial batch automatic wrap');
composed.manualBatch(1);checkComposed(0,'vertical last-batch-to-first wrap');
assert.equal(composedSpeeches,0,'pronunciation-disabled sequence should not speak');
assert.equal(composedAudioStops,10,'every real navigation cancels previous word speech');
assert.equal(composedScratch,10,'every manual navigation and vertical transition resets scratch');
assert.equal(composedAutoRestarts,7,'manual or vertical navigation restarts auto; auto timer itself does not');

assert(script.includes('const nextIndex=currentBatchNextIndex(rows,index,delta);if(nextIndex<0)return;'),
 'Scene1341 must perform circular word navigation');
assert(script.includes("((now+delta%batches+batches)%batches)*BATCH"),
 'Scene1341 must perform circular batch navigation');
assert(script.includes('navigate:()=>autoNextWithinBatch()'),
 'automatic browse must use the current Scene500 batch cycle, even for a singleton');
for(const [size,index,offset,expected] of [
 [10,9,1,0],[10,0,-1,9],[10,3,1,4],[10,3,-1,2],[3,2,1,0],[3,0,-1,2]]){
 const next=(index+offset%size+size)%size;
 assert.equal(next,expected,'circular word index parity');
}
for(const [count,size,index,delta,expected] of [
 [26,10,25,1,0],[26,10,0,-1,20],[26,10,8,1,10],[26,10,12,-1,0]]){
 const batches=Math.ceil(count/size),now=Math.floor(index/size);
 assert.equal(((now+delta%batches+batches)%batches)*size,expected,'circular batch index parity');
}
assert(script.includes("if(readOnlyPrefs.get(revealed?'autoPronounce.swipe':'autoPronounce.question'))playWord(rows[index].expression)") &&
 script.includes('function openStudy(id,resume=false)') &&
 script.includes("if(!autoBrowse.isEnabled()&&readOnlyPrefs.get(revealed?'autoPronounce.swipe':'autoPronounce.question'))"),
 'Scene500 speech preferences must control entry, navigation and manual face flip');
assert(script.includes("utterance.lang=prefs.voiceAccent==='gb'?'en-GB':'en-US'") &&
 script.includes("utterance.rate=baseRate*prefs.speechSpeed/100") &&
 script.includes("window.speechSynthesis.speak(utterance)"),
 'native US/UK voice and 80/100/120/150% synthesis speed must be respected');
assert(script.includes("$('learning').addEventListener('click',e=>") &&
 !script.includes("$('hero').addEventListener('click'") &&
 !script.includes("$('studybody').addEventListener('click'"),
 'only ONE delegated native blank-click handler may toggle question/answer');
assert(script.includes("window.getSelection?.()?.toString()") &&
 script.includes("e.code==='Space'") &&
 script.includes("/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)"),
 'Scene500 text selection / focused control / Space key guards');

assert(scene500Renderer.includes('onclick="event.stopPropagation()"'),
 'native Scene500 answer panel suppresses blank-click face switch');
assert(script.includes("e.target.closest('.answer,button,a,input,select"),
 'Scene1341 answer-content taps must not toggle question face');
assert(script.includes("isSpeaking:()=>wordAudioActive||!!(window.speechSynthesis?.speaking||window.speechSynthesis?.pending)"),
 'Scene1341 must distinguish busy grading from actual TTS for auto timer');
assert(phaseSource.includes('const postSpeech=Object.freeze({900:200,1500:600,3000:2000,6000:5000})'),
 'normal 0.9/1.5/3/6 sec must map to 0.2/0.6/2/5 sec after audio');

/* Native Scene500 auto-browse remains enabled across background and supports
 * continuing to the next item while a scratch overlay is active. */
assert(scene500Renderer.includes("const keepDrawing=source==='auto'&&window.PAI_SCRATCH_DRAWING?.()===true"),
 'native Scene500 only preserves drawing overlay for automatic navigation');
assert(scene500Renderer.includes("if(keepDrawing)window.PAI_SCRATCH_AUTO_TRANSITION=true"),
 'active Scene500 uses scratch transition flag for auto next');
assert(script.includes("shouldRun:()=>!$('learning').hidden&&!document.hidden,"),
 'auto browse must NOT stop merely because scratch drawing is active');
assert(script.includes('const keepDrawing=fromAuto&&scratchDrawing()') &&
 script.includes('if(keepDrawing)window.PAI_SCRATCH_AUTO_TRANSITION=true') &&
 script.includes('if(!keepDrawing)resetScratch()') &&
 script.includes('if(keepDrawing)window.PAI_SCRATCH_AUTO_TRANSITION=false'),
 'auto next must preserve and subsequently restore native scratch overlay');
assert(script.includes("document.addEventListener('visibilitychange',()=>{") &&
 script.includes("if(document.hidden){\n  autoBrowse.pause();") &&
 script.includes('phaseController.suspend();') &&
 script.includes('}else autoBrowse.resume();'),
 'visibilitychange must pause auto and pending graded answer without losing selected toggle');
assert(phaseSource.includes('function pause(){clear();releaseWake()}') &&
 phaseSource.includes('function resume(){if(enabled){clear();next();void syncWake()}}'),
 'visibility pause-resume must preserve enabled flag but cancel timers');
let pauseID=0,canAuto=true;const pauseTimers=new Map();
const backgroundAuto=api.createReadOnlyAutoBrowse({
 shouldRun:()=>canAuto,isBusy:()=>false,isSpeaking:()=>false,
 navigate:()=>true,onState:()=>{},
 schedule:(fn,ms)=>{const id=++pauseID;pauseTimers.set(id,{fn,ms});return id},
 unschedule:id=>pauseTimers.delete(id)
});
backgroundAuto.start();
assert.equal(backgroundAuto.isEnabled(),true);
assert.equal(pauseTimers.size,1);
canAuto=false;backgroundAuto.pause();
assert.equal(backgroundAuto.isEnabled(),true,'background must preserve auto mode selection');
assert.equal(pauseTimers.size,0,'background must cancel pending timer');
canAuto=true;backgroundAuto.resume();
assert.equal(backgroundAuto.isEnabled(),true);
assert.equal(pauseTimers.size,1,'foreground resumes auto browsing');
backgroundAuto.stop();
assert.equal(backgroundAuto.isEnabled(),false);
assert.equal(pauseTimers.size,0);

/* Active Scene500 rating speech: AGAIN 3, HARD 2, GOOD 1 repetitions,
   1-second separation and completion only after speech AND display deadline. */
assert(scene500Renderer.includes("const count={again:3,hard:2,good:1}[score]") &&
 scene500Renderer.includes("repeatGap:1") &&
 scene500Renderer.includes("Math.max(0,ratingDeadline-Date.now())"),
 'rating voice schedule must be grounded in native Scene500');
assert(phaseSource.includes("count={again:3,hard:2,good:1}[grade]") &&
 phaseSource.includes("if(spoken<count)repeatTimer=schedule(repeat,1000)") &&
 phaseSource.includes("if(!live()||!elapsed||!audioDone)return"),
 'read-only controller must gate finish on audio+deadline and repeat counts');
assert(script.includes('playRatedWord:(grade,iteration,done)=>') &&
 script.includes("utterance.onend=finish;utterance.onerror=finish") &&
 script.includes("watchdog=setTimeout(()=>{") &&
 script.includes("Math.min(15000,Math.max(1500,Math.ceil(String(text).length*650/scaledRate)+1500))"),
 'Safari-safe voice replay callback must be wired to isolated controller');
let voiceID=0,voiceCancels=0;
const voiceTasks=new Map(),voicePlays=[],voiceDone=[],voiceAdvances=[];
const voice=api.createReadOnlyPhaseController({
 onUpdate:()=>{},onGradeComplete:()=>{},
 onAdvance:(grade,key)=>voiceAdvances.push([grade,key]),
 playRatedWord:(grade,number,done)=>{
  voicePlays.push([grade,number]);voiceDone.push(done);
  return ()=>{voiceCancels++}
 },
 schedule:(fn,ms)=>{const id=++voiceID;voiceTasks.set(id,{fn,ms});return id},
 unschedule:id=>voiceTasks.delete(id)
});
function fireVoice(ms){
 const entry=[...voiceTasks].find(([,x])=>x.ms===ms);
 assert(entry,'expected voice timer '+ms);
 voiceTasks.delete(entry[0]);entry[1].fn()
}
voice.start('VOICE-AGAIN');voice.choose('again');
assert.equal(voice.state().pending,true);
assert.equal(voicePlays.length,1);
voiceDone[0]();fireVoice(1000);
assert.equal(voicePlays.length,2);
voiceDone[1]();fireVoice(1000);
assert.equal(voicePlays.length,3);
voiceDone[2]();
assert.equal(voiceAdvances.length,0,'all speech done, but 6s minimum display not yet elapsed');
fireVoice(6000);assert.equal(voiceAdvances.length,1);
assert.equal(voiceAdvances[0][0],'again');
voice.navigate('VOICE-GOOD');voice.choose('good');
assert.equal(voicePlays.length,4);
fireVoice(2000);
assert.equal(voiceAdvances.length,1,'2s passed but voice still playing, do not advance');
voiceDone[3]();assert.equal(voiceAdvances.length,2);
voice.navigate('VOICE-CANCEL');voice.choose('hard');
assert.equal(voicePlays.length,5);
voice.navigate('VOICE-NEXT');
assert.equal(voiceCancels,1,'manual swipe must cancel in-flight rated voice once');
voiceDone[4]();
assert.equal(voiceAdvances.length,2,'stale speech callback cannot advance a later word');
assert.equal(voiceTasks.size,0);

/* Native Scene500 continue/resume keeps last card position and preferred face.
 * For draft-only Scene1341 the cursor is ephemeral, never written to SRS. */
assert(script.includes('const transientCursors=new Map(Object.entries(savedDisplay.cursors))') &&
 script.includes('const savedDisplay=displayBookmark.load()') &&
 script.includes('displayBookmark.save(sceneId,index,phaseController.state().preferredFace)'),
 'Scene1341 must retain isolated UI bookmarks');
assert(script.includes('function openStudy(id,resume=false)') &&
 script.includes('resume?transientCursors.get(id):null') &&
 script.includes('index=saved?Math.max(0,Math.min(rows.length-1,saved.index)):0'),
 'continue must restore last index safely with bounds check');
assert(script.includes("if(saved?.face==='answer')phaseController.tap()"),
 'continue must restore chosen answer face');
assert(script.includes("transientCursors.set(sceneId,{index,face:phaseController.state().preferredFace})"),
 'leaving a scene must retain last cursor and explicit face choice');
assert(script.includes("$('continue').addEventListener('click',()=>openStudy(lastScene,true))"),
 'continue action should restore saved cursor instead of entering from first item');
assert(!/localStorage|sessionStorage|indexedDB/.test(script),
 'inline script must not write SRS; UI bookmarks live in isolated adapter');

/* Executable UI persistence across reload, isolated from formal SRS. */
const uiStore=new Map();
const uiLocal={getItem:key=>uiStore.get(key)??null,setItem:(key,value)=>uiStore.set(key,String(value)),removeItem:key=>uiStore.delete(key)};
const settingCtx={window:{localStorage:uiLocal}};
vm.runInNewContext(fs.readFileSync('rebuild-preview/scene1341-readonly/scene500-readonly-settings.js','utf8'),settingCtx);
const settingsA=settingCtx.window.PAI_SCENE500_READONLY_SETTINGS.createReadOnlySettings();
for(const [key,value] of [['voiceAccent','gb'],['speechSpeed',120],['wordsPerRound',25],['autoPronounce.swipe',false],['showExamples',false]])
 assert.equal(settingsA.set(key,value),true);
assert(fs.readFileSync('rebuild-preview/scene1341-readonly/scene500-readonly-settings.js','utf8').includes('function reset(){values=clone();save(values);'),
 'reset must persist defaults, not only clear in-memory preferences');
const settingsB=settingCtx.window.PAI_SCENE500_READONLY_SETTINGS.createReadOnlySettings();
for(const [key,value] of [['voiceAccent','gb'],['speechSpeed',120],['wordsPerRound',25],['autoPronounce.swipe',false],['showExamples',false]])
 assert.equal(settingsB.get(key),value,'preference must survive reload: '+key);
settingsB.reset();
assert.equal(settingCtx.window.PAI_SCENE500_READONLY_SETTINGS.createReadOnlySettings().get('voiceAccent'),'us');
const bookmarkPath='rebuild-preview/scene1341-readonly/scene1341-display-bookmark.js';
const bookmarkJs=fs.readFileSync(bookmarkPath,'utf8');
assert(html.includes('<script src="./scene1341-display-bookmark.js"></script>'));
assert(!/indexedDB|\.commit\(|\.transaction\(/.test(bookmarkJs));
const bookmarkCtx={window:{localStorage:uiLocal}};
vm.runInNewContext(bookmarkJs,bookmarkCtx);
const bookmarkStore=bookmarkCtx.window.PAI_SCENE1341_DISPLAY_BOOKMARK;
assert.equal(bookmarkStore.save('SC50-0001',9,'answer'),true);
assert.equal(bookmarkStore.save('SC50-0002',23,'question'),true);
assert.equal(bookmarkStore.save('bad',1,'answer'),false);
vm.runInNewContext(bookmarkJs,bookmarkCtx);
const recovered=bookmarkCtx.window.PAI_SCENE1341_DISPLAY_BOOKMARK.load();
assert.equal(recovered.lastScene,'SC50-0002');
assert.equal(recovered.cursors['SC50-0001'].index,9);
assert.equal(recovered.cursors['SC50-0001'].face,'answer');
assert.equal(recovered.cursors['SC50-0002'].index,23);
assert.equal(recovered.cursors['SC50-0002'].face,'question');
assert([...uiStore.keys()].every(key=>key.startsWith('pai-word-scene1341-readonly-')),
 'only isolated Scene1341 UI keys can persist');

/* PASS 1 source-backed visual hierarchy: canonical native Scene500 footer. */
const canonicalLearningFragment=scene500Renderer.slice(scene500Renderer.indexOf('const autoSwitch=\`'),scene500Renderer.indexOf(" let query='';",scene500Renderer.indexOf('const autoSwitch=\`')));
const ratingIndex=learningFace.indexOf('class="recall-correction"');
const hintIndex=learningFace.indexOf('class="recall-note"');
const footIndex=learningFace.indexOf('class="session-footnote"');
assert(canonicalLearningFragment.includes('class="recall-correction"') &&
 canonicalLearningFragment.includes('class="recall-note"') &&
 canonicalLearningFragment.includes('class="session-footnote"'),
 'Scene500 native reference must include all three footer elements');
assert(ratingIndex>=0&&hintIndex>ratingIndex&&footIndex>hintIndex,
 'Scene1341 must show grading rail then recall hint then native session-footnote');
assert(learningFace.includes('id="demo-note" aria-live="polite"'),
 'native hint accessible-live behavior must be preserved');
assert(!learningFace.includes('id="prev"') && !learningFace.includes('id="next"') &&
 !learningFace.includes('id="reveal"') &&
 !learningFace.includes('id="qa"') &&
 !learningFace.includes('id="tap-hint"'),
 'staging-only learning controls and QA must not be in learner page DOM');
assert(!script.includes("set('qa'") &&
 !script.includes("$('prev')") &&
 !script.includes("$('reveal')") &&
 !script.includes("$('next')"),
 'no orphan listener or metadata access after removing preview controls');

/* PASS 2 independently checks real source handlers and header grammar. */
const nativeClickStart=scene500Renderer.indexOf("document.addEventListener('click',e=>{if(state.view!=='learning'");
assert(nativeClickStart>=0,'native Scene500 delegated learning click handler not found');
const nativeClick=scene500Renderer.slice(nativeClickStart,nativeClickStart+580);
const previewClickStart=script.indexOf("$('learning').addEventListener('click',e=>{");
assert(previewClickStart>=0,'Scene1341 must have one delegated learning click handler');
const previewClick=script.slice(previewClickStart,previewClickStart+580);
assert(nativeClick.includes("e.target.closest('button,a,input,select,textarea,summary,details,.auto-word-toggle,[data-word-audio],[data-example-audio]')"),
 'native global handler excludes only controls, while answerHtml independently shields its own content');
assert(scene500Renderer.includes('onclick="event.stopPropagation()"'),
 'complete Scene500 answerHtml explicitly stops answer-content taps bubbling to global listener');
assert(previewClick.includes("e.target.closest('.answer,"),
 'Scene1341 must implement native answer-container propagation shield while allowing non-answer blank taps');
for(const ctrl of ['button','a','input','select','textarea','summary','details','.auto-word-toggle','[data-word-audio]','[data-example-audio]'])
 assert(previewClick.includes(ctrl),'Scene1341 blank click must ignore native control '+ctrl);
assert(previewClick.includes('window.getSelection?.()?.toString()'),
 'text selection must suppress accidental face flips');
assert(learningFace.includes('<span class="study-batch-line" id="batch-position">') &&
 learningFace.includes('<span class="study-batch-line" id="progress">'),
 'native Scene500 two-line batch header must use .study-batch-line spans');
assert(scene500Renderer.includes('class="study-batch-line"'),
 'native Scene500 top renderer must have same batch header class');
assert(!learningFace.includes('<div id="batch-position">') &&
 !learningFace.includes('<div id="progress">'),
 'do not reintroduce non-native block header geometry');

/* Double audit #2: actively execute rating-TTS handoff against ACTIVE native
   Scene500 semantics: existing speech must finish; no premature cancellation. */
assert(scene500Renderer.includes('window.PAI_AUDIO?.whenIdle?.(begin)'),
 'native Scene500 waits for existing question speech before graded repeats');
const ratedStart=script.indexOf('playRatedWord:(grade,iteration,done)=>{');
const ratedEnd=script.indexOf('\n onAdvance:()=>',ratedStart);
assert(ratedStart>=0&&ratedEnd>ratedStart,'locate actual rated speech callback');
const ratedSource=script.slice(ratedStart,ratedEnd).trim();
assert(ratedSource.endsWith('},'),'rating callback must be object property');
const ratedExpr='('+ratedSource.slice('playRatedWord:'.length,-1)+')';
const speechTasks=new Map();let speechTaskID=0,speechCanceled=0,speechCalls=0,gradedFinished=0,startedUtterance=null;
const synthesizer={
 speaking:true,pending:false,
 speak:u=>{speechCalls++;startedUtterance=u},
 cancel:()=>{speechCanceled++}
};
const ratedCallback=vm.runInNewContext(ratedExpr,{
 subset:()=>[{expression:'wake up'}],index:0,
 window:{speechSynthesis:synthesizer},
 SpeechSynthesisUtterance:class{constructor(v){this.text=v}},
 readOnlyPrefs:{get:()=>true},
 buildReadOnlyUtterance:text=>({text,lang:'en-US',rate:1}),wordAudioActive:false,
 setTimeout:(fn,ms)=>{const id=++speechTaskID;speechTasks.set(id,{fn,ms});return id},
 clearTimeout:id=>speechTasks.delete(id)
});
const cancelQueued=ratedCallback('good',1,()=>{gradedFinished++});
assert.equal(speechCalls,0,'rated voice must not interrupt existing speech');
assert.equal(speechCanceled,0,'native normal speech must NOT be canceled on grade tap');
assert.equal(speechTasks.size,1);
assert.equal([...speechTasks.values()][0].ms,80,'wait for browser speech synthesis idle');
cancelQueued();
assert.equal(speechTasks.size,0,'cancel before speech start clears idle poll');
assert.equal(speechCanceled,0,'cancel before rating starts must preserve existing question audio');
const cancelActive=ratedCallback('good',1,()=>{gradedFinished++});
synthesizer.speaking=false;
const poll=speechTasks.entries().next().value;
speechTasks.delete(poll[0]);poll[1].fn();
assert.equal(speechCalls,1,'graded pronunciation starts once prior audio has ended');
assert.equal(startedUtterance.text,'wake up');
assert.equal(startedUtterance.lang,'en-US');
assert.equal(speechCanceled,0,'starting graded pronunciation must not cancel previous audio');
startedUtterance.onend();
assert.equal(gradedFinished,1,'onend completes exactly once');
startedUtterance.onend();
assert.equal(gradedFinished,1,'duplicate voice completion must be ignored');
cancelActive();
assert.equal(speechCanceled,0,'completed callback must not cancel subsequent audio');
assert.equal(speechTasks.size,0,'watchdog clears after completed voice');

/* Independent re-audit A: absolute answer CSS parity, not just file hashes. */
const nativeUx=fs.readFileSync('ux-fix.css','utf8');
assert(nativeUx.includes('.answer-section{padding:6px 0}') &&
 nativeUx.includes('.answer-label{margin-bottom:2px;font-size:10.5px'),
 'read the ACTIVE native Scene500 compact answer dimensions');
for(const forbidden of [
 '#learning .answer .answer-section{',
 '#learning .answer .answer-label{',
 '#learning .answer .definition-line{',
 '#learning .answer .example-translation{',
 '#learning .answer .example-text{'
])assert(!html.includes(forbidden),'no isolated CSS may override native Scene500 answer styling: '+forbidden);
assert(html.includes('scene500-ux-fix.css') && html.includes('scene500-learning.css'),
 'original Scene500 answer geometry and bilingual example layout must be imported');

/* Independent re-audit B: worst-case alternating face, repeated grading,
   navigation, and old-timer invalidation across a long set of moves. */
const stormTimers=new Map(),stormCommits=[],stormAdvance=[];
let stormID=0;
const storm=api.createReadOnlyPhaseController({
 onUpdate:()=>{},
 onGradeComplete:(grade,key)=>stormCommits.push([grade,key]),
 onAdvance:(grade,key)=>stormAdvance.push([grade,key]),
 schedule:(fn,ms)=>{const id=++stormID;stormTimers.set(id,{fn,ms});return id},
 unschedule:id=>stormTimers.delete(id)
});
storm.start('STORM-000');
storm.tap();
for(let k=1;k<=120;k++){
 const current='STORM-'+String(k).padStart(3,'0');
 storm.navigate(current);
 assert.equal(storm.state().revealed,true,'ANSWER preference lost during rapid navigation #'+k);
 if(k%7===0){
  const grade=k%2?'hard':'good';
  storm.choose(grade);
  assert.equal(storm.state().revealed,true);
  assert.equal(storm.state().preferredFace,'answer');
  storm.navigate('NEXT-'+String(k));
  assert.equal(stormTimers.size,0,'stale delayed grade timer after a horizontal/vertical/auto move');
  assert.equal(storm.state().revealed,true,'rated navigation must preserve answer preference');
 }
}
assert.equal(stormAdvance.length,0,'no stale scheduled grade may advance after rapid manual switching');
assert.equal(stormCommits.length,17,'each interrupted grade must settle exactly once');
storm.tap();assert.equal(storm.state().revealed,false);
for(let k=0;k<40;k++){
 storm.navigate('QUESTION-'+k);
 assert.equal(storm.state().revealed,false,'QUESTION preference lost during rapid navigation #'+k);
}
storm.cancel();assert.equal(stormTimers.size,0);

/* New independent PASS 1: queued but not yet speaking browser speech is busy.
   Exercise the EXACT callbacks extracted from the staged HTML, not a retyped mock. */
assert(scene500Renderer.includes('window.PAI_AUDIO?.isActive?.()'),
 'live Scene500 audio controls guard queued/active utterances');
const busyStart=script.indexOf('isBusy:()=>');
const busyEnd=script.indexOf('\n isSpeaking:',busyStart);
const speakingEnd=script.indexOf('\n navigate:',busyEnd);
assert(busyStart>0&&busyEnd>busyStart&&speakingEnd>busyEnd,'locate auto busy callbacks');
const queueContext={
 phaseController:{state:()=>({pending:false})},
 window:{speechSynthesis:{speaking:false,pending:true}},wordAudioActive:false
};
const extractAutoCallback=src=>vm.runInNewContext(
 '('+src.slice(src.indexOf(':')+1).trim().replace(/,$/,'')+')',queueContext
);
const queueBusy=extractAutoCallback(script.slice(busyStart,busyEnd));
const queueSpeaking=extractAutoCallback(script.slice(busyEnd+2,speakingEnd));
assert.equal(queueBusy(),true,'speechSynthesis.pending=true must block auto navigation');
assert.equal(queueSpeaking(),true,'queued speech must count as post-speech sequence');
queueContext.window.speechSynthesis.pending=false;
assert.equal(queueBusy(),false);
assert.equal(queueSpeaking(),false);
queueContext.window.speechSynthesis.speaking=true;
assert.equal(queueBusy(),true);
queueContext.window.speechSynthesis.speaking=false;
queueContext.phaseController.state=()=>({pending:true});
assert.equal(queueBusy(),true,'pending grade also blocks auto navigation');
queueContext.phaseController.state=()=>({pending:false});
const pendingClock=new Map();let pendingId=0,pendingMoves=0;
const pendingAuto=api.createReadOnlyAutoBrowse({
 shouldRun:()=>true,isBusy:queueBusy,isSpeaking:queueSpeaking,
 navigate:()=>{pendingMoves++;return true},
 onState:()=>{},
 schedule:(fn,ms)=>{const id=++pendingId;pendingClock.set(id,{fn,ms});return id},
 unschedule:id=>pendingClock.delete(id)
});
const tickPending=()=>{
 const entry=pendingClock.entries().next().value;
 assert(entry,'auto queue timer needed');
 pendingClock.delete(entry[0]);entry[1].fn();return entry[1].ms;
};
pendingAuto.start();
assert.equal([...pendingClock.values()][0].ms,1500,'initial idle auto gap');
queueContext.window.speechSynthesis.pending=true;
assert.equal(tickPending(),1500);
assert.equal(pendingMoves,0,'late queued speech must preempt a pending auto transition');
assert.equal([...pendingClock.values()][0].ms,120);
assert.equal(tickPending(),120);
assert.equal(pendingMoves,0);
queueContext.window.speechSynthesis.pending=false;
assert.equal(tickPending(),120);
assert.equal([...pendingClock.values()][0].ms,600,'post-speech gap starts only after queued TTS is fully idle');
assert.equal(tickPending(),600);
assert.equal(pendingMoves,1);
pendingAuto.pause();assert.equal(pendingClock.size,0,'background pause clears scheduled timers');
pendingAuto.resume();assert.equal([...pendingClock.values()][0].ms,1500);
pendingAuto.stop();assert.equal(pendingClock.size,0);

/* New independent PASS 2: run original vertical-batch handler with one
   batch vs multiple; ensure no change in card, answer face, audio, or scratch. */
assert(scene500Renderer.includes('if(batches<2)return false;'),
 'active Scene500 vertical batch swipe is a no-op with fewer than two batches');
const batchBegin=script.indexOf('function moveBatch(delta){');
const batchEnd=script.indexOf('function demoGrade(',batchBegin);
assert(batchBegin>=0&&batchEnd>batchBegin,'find actual staged vertical-swipe handler');
const nativeBatchCode=script.slice(batchBegin,batchEnd).trim();
let batchScratchResets=0,batchSpeeches=0,batchRestarts=0,batchNavigates=0;
const batchRows=Array.from({length:8},(_,i)=>({scene_ku_id:'ONE-'+i,expression:'sample '+i}));
const batchFaceUpdates=[];
const batchFace=api.createReadOnlyPhaseController({
 onUpdate:state=>batchFaceUpdates.push(state),
 onGradeComplete:()=>{},onAdvance:()=>{}
});
batchFace.start('ONE-7');batchFace.tap();
const batchContext={
 BATCH:10,index:7,revealed:true,
 subset:()=>batchRows,
 phaseController:{state:()=>({selected:null}),navigate:key=>{batchNavigates++;batchFace.navigate(key)}},
 resetScratch:()=>{batchScratchResets++},stopWordAudio:()=>{},
 playWord:()=>{batchSpeeches++},
 readOnlyPrefs:{get:()=>true},
 autoBrowse:{restart:()=>{batchRestarts++}},
 window:{PAI_SCRATCH_FINISH_RATING:()=>{}}
};
const actualMoveBatch=vm.runInNewContext('('+nativeBatchCode+')',batchContext);
actualMoveBatch(1);actualMoveBatch(-1);
assert.equal(batchContext.index,7,'single batch swipe must stay at the current card, not reset to first');
assert.equal(batchNavigates,0,'no page re-render/navigation on single batch');
assert.equal(batchScratchResets,0);
assert.equal(batchSpeeches,0,'no spurious speech after no-op vertical swipe');
assert.equal(batchRestarts,0,'no auto timer restart on no-op vertical swipe');
assert.equal(batchFace.state().revealed,true,'single-batch swipe must retain ANSWER mode');
const multipleRows=Array.from({length:23},(_,i)=>({scene_ku_id:'MULTI-'+i,expression:'example '+i}));
batchContext.subset=()=>multipleRows;
actualMoveBatch(1);assert.equal(batchContext.index,10);
assert.equal(batchFace.state().revealed,true,'next batch stays in answer mode');
actualMoveBatch(1);assert.equal(batchContext.index,20);
actualMoveBatch(1);assert.equal(batchContext.index,0,'native multi-batch navigation wraps to first batch');
actualMoveBatch(-1);assert.equal(batchContext.index,20,'native previous-batch wraps to last batch');
assert.equal(batchNavigates,4);
assert.equal(batchScratchResets,4);

/* Independent lifecycle pass: real Scene500 stops rated timeout on background;
   the Scene1341 isolated phase must preserve current visible ANSWER without
   late timers, audio repeats, grade commits or hidden navigation. */
assert(scene500Renderer.includes("if(document.hidden){\n   hiddenAt=Date.now();hiddenPhase=phase;") &&
 scene500Renderer.includes("if(phase==='answer'||phase==='repeating'||phase==='example')phase='answer-paused'"),
 'native Scene500 background visibility contract must remain source-backed');
assert(phaseSource.includes('function suspend(){') &&
 phaseSource.includes("phase=wasRevealed?'answer-paused':'question'") &&
 phaseSource.includes('return Object.freeze({start,tap,choose,navigate,beginExample,exampleFinished,suspend,cancel,state})'),
 'read-only controller must expose suspend preserving revealed answer');
assert(script.includes("document.addEventListener('visibilitychange',()=>{") &&
 script.includes("if(document.hidden){\n  autoBrowse.pause();") &&
 script.includes("phaseController.suspend();") &&
 script.includes("stopWordAudio();"),
 'Safari page-background event must stop rating, auto and voice together');
let lifecycleID=0;
const lifecycleTimers=new Map(),lifecycleGrades=[],lifecycleMoves=[];
const lifecycle=api.createReadOnlyPhaseController({
 onUpdate:()=>{},
 onGradeComplete:(grade,key)=>lifecycleGrades.push([grade,key]),
 onAdvance:(grade,key)=>lifecycleMoves.push([grade,key]),
 schedule:(fn,ms)=>{const id=++lifecycleID;lifecycleTimers.set(id,{fn,ms});return id},
 unschedule:id=>lifecycleTimers.delete(id)
});
lifecycle.start('BG-Q1');
lifecycle.choose('hard');
assert.equal(lifecycle.state().revealed,true);
assert.equal(lifecycle.state().selected,'hard');
const queuedBeforeBg=lifecycleTimers.values().next().value;
assert.equal(queuedBeforeBg.ms,4000);
lifecycle.suspend();
assert.equal(lifecycleTimers.size,0,'hidden Safari tab cancels graded countdown');
assert.equal(lifecycle.state().phase,'answer-paused','revealed answer must stay visible while backgrounded');
assert.equal(lifecycle.state().selected,null,'no deferred grade may fire in hidden tab');
queuedBeforeBg.fn(); // simulate an already dequeued callback despite unschedule
assert.equal(lifecycleMoves.length,0,'stale timer must never navigate in background');
assert.equal(lifecycleGrades.length,0,'background suspend must not settle SRS or transient grade');
lifecycle.navigate('BG-Q2');
assert.equal(lifecycle.state().revealed,false,'question preference survives temporary background answer');
lifecycle.tap();lifecycle.navigate('BG-A1');lifecycle.choose('again');
const prior=lifecycleTimers.values().next().value;
lifecycle.suspend();
assert.equal(lifecycle.state().revealed,true,'answer preference and answer visibility persist after background');
assert.equal(lifecycle.state().preferredFace,'answer');
prior.fn();assert.equal(lifecycleMoves.length,0);
lifecycle.navigate('BG-A2');assert.equal(lifecycle.state().revealed,true,'foreground next card retains ANSWER preference');
lifecycle.start('BG-QUESTION');
lifecycle.suspend();
assert.equal(lifecycle.state().revealed,false,'hiding a normal question should not reveal it');
assert.equal(lifecycleTimers.size,0);

/* Scene500 shared preference contract: in-memory only and exact native
   defaults/options; no draft KU/SRS persist, no extra study-page controls. */
const prefsPath='rebuild-preview/scene1341-readonly/scene500-readonly-settings.js';
const prefsSource=fs.readFileSync(prefsPath,'utf8');
new vm.Script(prefsSource,{filename:prefsPath});
const prefsContext={};vm.runInNewContext(prefsSource,prefsContext);
const prefsApi=prefsContext.PAI_SCENE500_READONLY_SETTINGS;
assert(prefsApi&&typeof prefsApi.createReadOnlySettings==='function');
assert(html.includes('<script src="./scene500-readonly-settings.js"></script>'),'settings contract loads before learning adapter');
assert(prefsSource.includes('pai-word-scene1341-readonly-preferences-v1') &&
 !['indexedDB','fetch(','.commit(','.write('].some(x=>prefsSource.includes(x)),
 'UI settings may save isolated preferences, never SRS or KU records');
assert(scene500Renderer.includes("state.wordsPerRound=10;") &&
 scene500Renderer.includes("[10,25,50].includes(Number(state.wordsPerRound))"),
 'native Scene500 choices for batch size');
assert(scene500Renderer.includes("state.autoBrowseInterval=1.5;") &&
 scene500Renderer.includes("['0.9','更快']") &&
 scene500Renderer.includes("['1.5','快']") &&
 scene500Renderer.includes("['3','中']") &&
 scene500Renderer.includes("['6','慢']"),
 'native Scene500 browse speed labels and intervals');
assert(scene500Renderer.includes('[80,100,120,150]') &&
 scene500Renderer.includes("state.voiceAccent='us'") &&
 scene500Renderer.includes("state.hideWord=false;") &&
 scene500Renderer.includes("state.showCollocations=true;") &&
 scene500Renderer.includes("state.showExamples=true;") &&
 scene500Renderer.includes("state.showCompare=true;"),
 'native Scene500 speech, word visibility and answer defaults');
const prefChanges=[],pref=prefsApi.createReadOnlySettings({onChange:(key,values)=>prefChanges.push({key,values})});
assert.equal(pref.get('wordsPerRound'),10);
assert.equal(pref.get('autoBrowseInterval'),1.5);
assert.equal(pref.get('speechSpeed'),100);
assert.equal(pref.get('voiceAccent'),'us');
for(const key of ['hideWord','showCollocations','showExamples','showCompare']){
 assert.equal(pref.get(key),prefsApi.defaults[key]);
 assert(html.includes('data-toggle-setting="'+key+'"'),'home settings toggle missing '+key);
}
for(const key of ['autoPronounce.question','autoPronounce.swipe']){
 assert.equal(pref.get(key),true);
 assert(html.includes('data-toggle-setting="'+key+'"'),'home pronunciation setting missing '+key);
}
for(const [key,vals] of [
 ['wordsPerRound',[10,25,50]],
 ['autoBrowseInterval',[0.9,1.5,3,6]],
 ['speechSpeed',[80,100,120,150]],
 ['voiceAccent',['us','gb']]
]){
 assert(html.includes('data-setting="'+key+'"'),'native choice missing '+key);
 for(const value of vals){
  assert(prefsApi.choices[key].includes(value),'option missing from contract '+key+'/'+value);
  assert.equal(pref.set(key,String(value)),true,'supported setting must accept DOM select values');
  assert.equal(pref.get(key),value);
  assert(html.includes('value="'+String(value)+'"'),'home selector missing '+key+'/'+value);
 }
}
assert.equal(pref.set('wordsPerRound',30),false);
assert.equal(pref.set('speechSpeed',70),false);
assert.equal(pref.set('voiceAccent','fr'),false);
assert.equal(pref.set('autoBrowseInterval',0.2),false,'post-speech delay is not a normal speed tier');
assert.equal(pref.set('unknown','x'),false);
assert.equal(pref.set('hideWord','false'),false,'boolean preferences must not accept truthy strings');
assert.equal(pref.set('autoPronounce.question',false),true);
assert.equal(pref.get('autoPronounce.question'),false);
assert.equal(pref.set('showExamples',false),true);
assert.equal(pref.get('showExamples'),false);
assert(prefChanges.length>=2 && prefChanges.every(p=>p.values&&p.key),'settings callbacks must receive detached snapshots');
const captured=pref.snapshot();pref.reset();
assert.equal(pref.get('wordsPerRound'),10);
assert.equal(pref.get('showExamples'),true);
assert.equal(pref.get('autoPronounce.question'),true);
assert.equal(captured.autoPronounce.question,false,'snapshots must be detached from subsequent reset');

assert(learningFace.indexOf('settings-panel')<0 && learningFace.indexOf('data-setting=')<0,
 'preferences must not change pixel geometry of Scene500 learning face');
assert(html.includes('id="settings-panel"') &&
 html.includes('id="settings-reset"') &&
 html.includes('class="setting-row"') &&
 html.includes('class="switch"'),
 'home preferences reuse native Scene500 setting-row/switch CSS and reset control');
assert(script.includes("BATCH=prefs.wordsPerRound") &&
 script.includes("autoBrowse.setDelay(Math.round(prefs.autoBrowseInterval*1000))"),
 'settings must actually drive batch calculation and auto timer');
assert(script.includes("$('hero').classList.toggle('listen-only',prefs.hideWord&&!revealed)") &&
 script.includes("$('examples-section').hidden=!prefs.showExamples") &&
 script.includes('prefs.showCollocations') &&
 script.includes('prefs.showCompare'),
 'native word hiding and answer-section options must control card output');
assert(script.includes("readOnlyPrefs.get('autoPronounce.swipe')") &&
 script.includes("readOnlyPrefs.get(revealed?'autoPronounce.swipe':'autoPronounce.question')"),
 'native question/swipe auto voice preferences must gate real audio');
const makeVoiceStart=script.indexOf('function buildReadOnlyUtterance(text,baseRate=.84){');
const makeVoiceEnd=script.indexOf('\nfunction parseCsv(',makeVoiceStart);
assert(makeVoiceStart>0&&makeVoiceEnd>makeVoiceStart,'read-only voice builder must exist');
const voiceFactory=vm.runInNewContext('('+script.slice(makeVoiceStart,makeVoiceEnd).trim()+')',{
 readOnlyPrefs:pref,window:{speechSynthesis:{getVoices:()=>[{lang:'en-US',name:'US'},{lang:'en-GB',name:'UK'}]}},
 SpeechSynthesisUtterance:class{constructor(value){this.text=value}}
});
pref.set('speechSpeed',120);pref.set('voiceAccent','gb');
const ukVoice=voiceFactory('wake up');
assert.equal(ukVoice.lang,'en-GB');
assert(Math.abs(ukVoice.rate-.84*1.2)<1e-10,'native word base rate .84 x speed');
const ukExample=voiceFactory('Example',.9);
assert(Math.abs(ukExample.rate-.9*1.2)<1e-10,'native example base rate .9 x speed');
assert(script.includes('playWord(subset()[index].answer.example_en,.9,finishExample)')&&script.includes('const utterance=buildReadOnlyUtterance(text,baseRate)'),'example and word must share audio lifecycle with native example .9 base rate');
assert.equal(ukVoice.voice.name,'UK');
pref.set('speechSpeed',80);pref.set('voiceAccent','us');
const usVoice=voiceFactory('soon');
assert.equal(usVoice.lang,'en-US');
assert(Math.abs(usVoice.rate-.84*.8)<1e-10,'native word base rate .84 x speed');
assert.equal(usVoice.voice.name,'US');

const currentBatch=10,largeBatch=25,largestBatch=50;
for(const size of [currentBatch,largeBatch,largestBatch]){
 const rowCount=101,position=66;
 const batches=Math.ceil(rowCount/size),batch=Math.floor(position/size);
 const target=((batch+1)%batches)*size;
 assert(target>=0&&target<rowCount,'native dynamic batch target must remain in bounds');
}

/* Regression: rating preserves the user's automatic-browse selection, pauses
   its timer only, and re-arms it after rated navigation. */
const gradeAutoCode=script.slice(script.indexOf('function demoGrade('),script.indexOf("$('back').addEventListener",script.indexOf('function demoGrade('))).trim();
assert(gradeAutoCode.includes('autoBrowse.pause()')&&!gradeAutoCode.includes('stopAuto()'),
 'grading may pause automatic navigation but must never disable it');
assert(advanceHandler.includes('autoBrowse.resume()')&&manualMove.includes('autoBrowse.restart()'),
 'rated next and final card must restore automatic navigation');
let gradePauseCount=0,gradeStopCount=0,gradeChosen=null;
const liveGrade=vm.runInNewContext('('+gradeAutoCode+')',{
 $:()=>({hidden:false}),
 window:{PAI_SCRATCH_BEGIN_RATING:()=>{}},
 autoBrowse:{pause:()=>{gradePauseCount++}},
 stopAuto:()=>{gradeStopCount++},
 phaseController:{choose:grade=>{gradeChosen=grade}}
});
for(const choice of ['good','hard','again']){liveGrade(choice);assert.equal(gradeChosen,choice)}
assert.equal(gradePauseCount,3,'all three grading buttons pause rather than disable auto');
assert.equal(gradeStopCount,0);

/* Formal Scene500 rated-auto parity: AFTER a rated result, the same KU
   remains visible until the next automatic timer. Never skip directly from
   the rating display into the next KU; manual mode still moves forward.
   Exercise the actual Scene1341 callback, not a reimplementation. */
assert(scene500Renderer.includes('window.PAI_RESUME_AUTO_RATED_CARD=(k)=>') &&
 scene500Renderer.includes('Rating has already committed. Keep the same KU visible, with no navigation here.'),
 'native Scene500 rated-auto behavior must be source-anchored');
const ratedAdvanceStart=script.indexOf(' onAdvance:()=>{');
const ratedAdvanceEnd=script.indexOf('\n }\n});',ratedAdvanceStart);
assert(ratedAdvanceStart>=0&&ratedAdvanceEnd>ratedAdvanceStart,'find actual rated-auto handler');
const ratedAdvanceFnText=script.slice(ratedAdvanceStart,ratedAdvanceEnd+3).trim().replace(/^onAdvance:/,'');
for(const enabled of [true,false]){
 let index=0,moves=0,resumes=0,rests=0,finishes=0;
 const ctx={
   index,subset:()=>[{scene_ku_id:'A'},{scene_ku_id:'B'}],
   autoBrowse:{isEnabled:()=>enabled,resume:()=>{resumes++}},
   phaseController:{navigate:key=>{rests++;assert.equal(key,'A')}},
   move:(delta,fromAuto,fromRated)=>{moves++;assert.equal(delta,1);assert.equal(fromAuto,false);assert.equal(fromRated,true)},
   $:()=>({textContent:''}),set:()=>{},
   window:{PAI_SCRATCH_FINISH_RATING:()=>{finishes++}}
 };
 const actualRatedAdvance=vm.runInNewContext('('+ratedAdvanceFnText+')',ctx);
 actualRatedAdvance();
 assert.equal(moves,enabled?0:1,'AUTO-rated must hold same KU; manual mode advances');
 assert.equal(rests,enabled?1:0,'AUTO-rated stays on same visible KU');
 assert.equal(resumes,enabled?1:0,'AUTO-rated restarts timer on same card');
 assert.equal(finishes,1,'handwriting completion exactly once');
}
assert(script.includes('data-srs-write="disabled"') === false ||
 html.includes('data-srs-write="disabled"'),
 'never silently enable SRS for unapproved Scene1341 author drafts');
assert(html.includes('data-srs-write="disabled"') &&
 script.includes('onGradeComplete:grade=>{transientRatings[grade]++}'),
 'read-only draft rating is transient, not a persisted Scene500 SRS record');

/* Execute the REAL isolated word-audio handlers, including the Safari stale
   callback race and changing to a next card with pronunciation disabled. */
const wordAudioStart=script.indexOf('let wordAudioGeneration=0');
const wordAudioEnd=script.indexOf("$('speak').addEventListener",wordAudioStart);
assert(wordAudioStart>=0&&wordAudioEnd>wordAudioStart,'find shared speech lifecycle');
const audioEvents=[],audioTimers=new Map();let audioTimerId=0;
const audioSynth={
 speaking:false,pending:false,
 speak(u){audioEvents.push(['speak',u.text]);this.speaking=true;this.last=u},
 cancel(){audioEvents.push(['cancel']);this.speaking=false;this.pending=false}
};
const activeAudio=vm.runInNewContext(script.slice(wordAudioStart,wordAudioEnd)+'\n({playWord,stopWordAudio,isActive:()=>wordAudioActive})',{
 window:{speechSynthesis:audioSynth},document:{hidden:false},
 SpeechSynthesisUtterance:class{},
 buildReadOnlyUtterance:(t,rate=.84)=>({text:t,rate}),
 setTimeout:(fn,ms)=>{const id=++audioTimerId;audioTimers.set(id,{fn,ms});return id},
 clearTimeout:id=>audioTimers.delete(id)
});
assert.equal(activeAudio.playWord('wake up'),true);
const oldUtterance=audioSynth.last;
assert.equal(activeAudio.isActive(),true);
assert.equal(activeAudio.playWord('soon'),true);
const newestUtterance=audioSynth.last;
assert.deepEqual(audioEvents.map(e=>e[0]),['speak','cancel','speak']);
oldUtterance.onend(); // Safari may deliver this after canceling the old word
assert.equal(activeAudio.isActive(),true,'stale onend cannot mark NEW speech idle');
newestUtterance.onend();
assert.equal(activeAudio.isActive(),false);
activeAudio.playWord('next');
activeAudio.stopWordAudio();
assert.equal(activeAudio.isActive(),false);
assert.equal(audioTimers.size,0,'no lingering speech timeouts on silent new card');
assert.equal(activeAudio.playWord('Example sentence',.9),true);
assert.equal(audioSynth.last.rate,.9,'example speech must preserve native 0.9 base rate');
activeAudio.stopWordAudio();
assert.equal(audioTimers.size,0,'example speech cancellation must clear shared watchdog');
assert(script.includes('if(wordAudioActive||synthesis.speaking||synthesis.pending)'),
 'graded audio must wait for queued word utterances even before Safari sets speaking');
assert(script.includes('stopWordAudio(); // Scene500 cancels previous word TTS on every card change'),
 'word navigation must stop old TTS regardless of next-card auto-pronounce setting');


/* Double-audit mobile TTS hardening: native Scene500 uses a bounded,
   rate/length-aware watchdog and resumes speechSynthesis after Safari pause. */
assert(script.includes('const maxWait=Math.min(15000,Math.max(1500,Math.ceil(String(text).length*650/scaledRate)+1500))'),
 'rated speech must use Scene500 dynamic watchdog, not fixed 8s');
assert(!script.includes('watchdog=setTimeout(finish,8000)'),
 'remove fixed rated-audio 8 second cutoff');
assert(script.includes('if(synthesis.paused)synthesis.resume()') &&
 script.includes('if(window.speechSynthesis.paused)window.speechSynthesis.resume()'),
 'both rated and ordinary/exemplar speech must wake a Safari-paused queue');
assert(script.includes('if(synthesis.speaking||synthesis.pending)synthesis.cancel()'),
 'rated watchdog must invalidate a stuck utterance before continuing');

/* Combined Scene500 state-contract matrix on REAL Scene1341 handlers.
 * Reproduce rating + manual swipe, rating correction, blank-tap early
 * completion, stale timer, auto-rated hold and next auto movement. */
const crossMoveText=script.slice(script.indexOf('function move(delta,fromAuto=false,fromRatedAdvance=false){'),script.indexOf('\nfunction moveBatch(',script.indexOf('function move(delta,fromAuto=false,fromRatedAdvance=false){')));
const crossGradeText=script.slice(script.indexOf('function demoGrade('),script.indexOf("$('back').addEventListener",script.indexOf('function demoGrade(')));
const crossShowText=script.slice(script.indexOf('function show(){'),script.indexOf('\nfunction move(delta,',script.indexOf('function show(){')));
const crossCycleText=script.slice(script.indexOf('function currentBatchNextIndex('),script.indexOf('\nfunction syncReadOnlySettingsControls(',script.indexOf('function currentBatchNextIndex(')));
const crossRatedStart=script.indexOf(' onAdvance:()=>{');
const crossRatedEnd=script.indexOf('\n }\n});',crossRatedStart);
const crossRatedText=script.slice(crossRatedStart,crossRatedEnd+3).trim().replace(/^onAdvance:/,'');
const crossClock=new Map(),crossGrades=[],crossAudio=[];let crossTick=0,crossTimer=0,autoOn=false,paused=0,resumed=0,restarted=0;
const crossRows=Array.from({length:26},(_,i)=>({scene_ku_id:'C-'+i,expression:'word '+i}));
const crossCtx={index:9,BATCH:10,selectedGrade:null,revealed:false,suppressTapUntil:0,
 subset:()=>crossRows,scratchDrawing:()=>false,resetScratch:()=>{},
 stopWordAudio:()=>{crossAudio.push('stop')},playWord:()=>false,
 readOnlyPrefs:{get:()=>false},
 window:{PAI_SCRATCH_BEGIN_RATING:()=>{},PAI_SCRATCH_FINISH_RATING:()=>{},PAI_SCRATCH_AUTO_TRANSITION:false},
 $:()=>({hidden:false}),Date,
 autoBrowse:{isEnabled:()=>autoOn,pause:()=>{paused++},resume:()=>{resumed++},restart:()=>{restarted++}},
};
const crossPhase=api.createReadOnlyPhaseController({
 onUpdate:state=>{crossCtx.revealed=state.revealed;crossCtx.selectedGrade=state.selected},
 onGradeComplete:(grade,key)=>crossGrades.push([grade,key]),
 onAdvance:()=>crossCtx.ratedAdvance(),
 playRatedWord:null,
 schedule:(fn,ms)=>{const id=++crossTimer;crossClock.set(id,{fn,ms});return id},
 unschedule:id=>crossClock.delete(id)
});
crossCtx.phaseController=crossPhase;
vm.runInNewContext(crossCycleText+'\n'+crossMoveText+'\n'+crossGradeText+'\n'+crossShowText+
 '\nthis.move=move;this.demoGrade=demoGrade;this.show=show;this.ratedAdvance='+crossRatedText+';',crossCtx);
const fireCross=()=>{
 const entry=[...crossClock.entries()][0];
 assert(entry,'expected cross-state rating timer');
 crossClock.delete(entry[0]);entry[1].fn();
};
crossPhase.start('C-9');crossPhase.tap();
assert.equal(crossPhase.state().revealed,true);
crossCtx.demoGrade('good');assert.equal(paused,1);
crossCtx.move(1); // Swipe while rated answer timer pending; commit once and move inside round.
assert.equal(crossCtx.index,0);
assert.equal(crossPhase.state().cardKey,'C-0');
assert.equal(crossPhase.state().revealed,true,'ANSWER face must persist after interrupted grading swipe');
assert.deepEqual(crossGrades,[['good','C-9']]);
assert.equal(crossClock.size,0,'interrupted rating removes old pending timer');
crossCtx.demoGrade('hard');
crossCtx.show(); // Native blank-tap early settlement must HOLD same KU.
assert.equal(crossCtx.index,0,'blank rating tap must not advance');
assert.equal(crossPhase.state().cardKey,'C-0');
assert.equal(crossPhase.state().revealed,false,'blank tap returns to QUESTION');
assert.equal(crossGrades.length,2);
assert.deepEqual(crossGrades[1],['hard','C-0']);
assert.equal(crossClock.size,0,'blank tap removes pending rating timer');
crossCtx.demoGrade('again');
crossCtx.demoGrade('good'); // Correction before the first rating commits.
assert.equal(crossClock.size,1,'rating correction keeps only current countdown');
fireCross();
assert.deepEqual(crossGrades[2],['good','C-0'],'only corrected grade is settled');
assert.equal(crossGrades.length,3,'no extra stale grade commits');
assert.equal(crossCtx.index,1,'manual-mode rated completion moves forward exactly one word');
assert.equal(crossPhase.state().revealed,false,'manual-rated completion preserves QUESTION mode');
autoOn=true;
crossCtx.demoGrade('hard');
fireCross();
assert.deepEqual(crossGrades[3],['hard','C-1']);
assert.equal(crossCtx.index,1,'AUTO-rated must hold current KU until next timer');
assert.equal(crossPhase.state().cardKey,'C-1');
assert(resumed>0,'AUTO-rated completion must resume timer');
crossCtx.move(1,true);
assert.equal(crossCtx.index,2,'next auto tick advances only then');
assert.equal(crossPhase.state().revealed,false,'automatic movement preserves QUESTION face');
assert.equal(crossGrades.length,4,'auto movement must not create any additional score');
assert(restarted>0,'manual swipe and blank tap must restore auto timer');

/* Scene500 after-speech timing contract for example audio:
   full-gap starts only from normal resume; example completion must use the
   native shorter gap (0.2 / 0.6 / 2 / 5 seconds) for its selected tier. */
assert(phaseSource.includes('function resumeAfterSpeech(){') &&
 phaseSource.includes('next(true);void syncWake()') &&
 script.includes('autoBrowse.resumeAfterSpeech()'),
 'example completion must use post-speech short gap, not ordinary speed delay');
for(const [tier,after] of [[900,200],[1500,600],[3000,2000],[6000,5000]]){
 const timers=new Map();let id=0,steps=0;
 const controller=api.createReadOnlyAutoBrowse({
  shouldRun:()=>true,isBusy:()=>false,isSpeaking:()=>false,
  navigate:()=>{steps++;return true},onState:()=>{},
  schedule:(fn,ms)=>{const nextId=++id;timers.set(nextId,{fn,ms});return nextId},
  unschedule:n=>timers.delete(n)
 });
 assert.equal(controller.setDelay(tier),true);
 controller.start();assert.equal([...timers.values()][0].ms,tier,'normal gap '+tier);
 controller.pause();assert.equal(timers.size,0);
 controller.resumeAfterSpeech();
 assert.equal([...timers.values()][0].ms,after,'post-example gap '+tier);
 const task=[...timers.entries()][0];timers.delete(task[0]);task[1].fn();
 assert.equal(steps,1,'post-example interval fires once');
 controller.stop();assert.equal(timers.size,0);
}

/* Second independent state-contract audit: example audio is a phase transition,
 * not merely speechSynthesis.speak(). The native PAI_TAP_FLOW.beginExample()
 * invalidates rating timers; exampleFinished() restores paused ANSWER. */
assert(scene500Renderer.includes("function beginExample(){") &&
 scene500Renderer.includes("function exampleFinished(){"),
 'anchor this state transition to active Scene500 rather than ad-hoc preview behavior');
assert(phaseSource.includes('function beginExample(){') &&
 phaseSource.includes('function exampleFinished(){') &&
 phaseSource.includes('beginExample,exampleFinished'),
 'isolated phase adapter must expose the native example-audio lifecycle');
assert(script.includes('if(!phaseController.beginExample())return;') &&
 script.includes('autoBrowse.pause();') &&
 script.includes('if(phaseController.exampleFinished())autoBrowse.resumeAfterSpeech()') &&
 script.includes('playWord(subset()[index].answer.example_en,.9,finishExample)'),
 'real example speaker must pause grade and resume after audio completion');
const exampleTimers=new Map(),exampleSettled=[];let exampleId=0,exampleMoved=0;
const examplePhase=api.createReadOnlyPhaseController({
 onUpdate:()=>{},onGradeComplete:(grade,key)=>exampleSettled.push([grade,key]),
 onAdvance:()=>{exampleMoved++},
 schedule:(fn,ms)=>{const id=++exampleId;exampleTimers.set(id,fn);return id},
 unschedule:id=>exampleTimers.delete(id)
});
examplePhase.start('EX-1');
assert.equal(examplePhase.beginExample(),false,'example cannot start from hidden question');
examplePhase.tap();assert.equal(examplePhase.state().revealed,true);
assert.equal(examplePhase.beginExample(),true);
assert.equal(examplePhase.state().phase,'example');
assert.equal(examplePhase.state().revealed,true,'answer remains visible while playing example');
assert.equal(examplePhase.exampleFinished(),true);
assert.equal(examplePhase.state().phase,'answer-paused');
examplePhase.choose('hard');
assert.equal(examplePhase.state().selected,'hard');
assert.equal(exampleTimers.size,1);
const oldExampleCountdown=[...exampleTimers.values()][0];
assert.equal(examplePhase.beginExample(),true,'new example interrupts graded answer');
assert.equal(exampleTimers.size,0,'rated countdown cancelled by example');
assert.equal(examplePhase.state().selected,null,'pending rating must not be silently committed');
assert.equal(examplePhase.state().revealed,true);
oldExampleCountdown();
assert.equal(exampleSettled.length,0,'cancelled timer cannot commit an orphan grade');
assert.equal(exampleMoved,0,'cancelled timer cannot advance during example speech');
assert.equal(examplePhase.exampleFinished(),true);
examplePhase.navigate('EX-2');
assert.equal(examplePhase.state().revealed,true,'ANSWER preference survives example and navigation');
examplePhase.beginExample();examplePhase.suspend();
assert.equal(examplePhase.state().revealed,true,'background preserves ANSWER while example was speaking');
assert.equal(examplePhase.exampleFinished(),false,'stale example onend cannot alter background phase');
assert.equal(exampleSettled.length,0);
let exampleCallbacks=0;
assert.equal(activeAudio.playWord('Example playback',.9,()=>{exampleCallbacks++}),true);
const audibleExample=audioSynth.last;
audibleExample.onend();assert.equal(exampleCallbacks,1,'example speech completion fires once');
audibleExample.onend();assert.equal(exampleCallbacks,1,'repeated Safari onend must be idempotent');
assert.equal(activeAudio.playWord('Interrupted example',.9,()=>{exampleCallbacks++}),true);
const cancelledExample=audioSynth.last;
activeAudio.stopWordAudio();
cancelledExample.onend();
assert.equal(exampleCallbacks,1,'cancelled example voice never invokes stale completion');

/* Second-pass composed browser-handler test: explicitly tapping the WORD
 * speaker while an EXAMPLE is playing must not strand the phase or auto
 * timer. Repeated word taps cannot let stale Safari onend resume twice. */
const wordButtonStart=script.indexOf("$('speak').addEventListener('click',e=>{");
const wordButtonEnd=script.indexOf("$('example-speak').addEventListener",wordButtonStart);
assert(wordButtonStart>0&&wordButtonEnd>wordButtonStart,'extract real word-speaker handler');
assert(script.includes('if(phaseController.state().phase===\'example\')') &&
 script.includes('autoBrowse.resumeAfterSpeech()') &&
 script.includes('exampleToWordPending=false;'),
 'word speaker must take over example state and explicitly resume automatic browsing');
const realSpeakerHandlers={};let takeOverPaused=0,takeOverResumed=0;
const wordSpeakerContext={
 $:id=>({addEventListener:(event,fn)=>{realSpeakerHandlers[id+':'+event]=fn}}),
 phaseController:examplePhase,
 autoBrowse:{pause:()=>{takeOverPaused++},resumeAfterSpeech:()=>{takeOverResumed++}},
 subset:()=>[{expression:'wake up'}],index:0,
 playWord:(...args)=>activeAudio.playWord(...args)
};
vm.runInNewContext("let exampleToWordPending=false;\n"+script.slice(wordButtonStart,wordButtonEnd)+
 "\nthis.getPending=()=>exampleToWordPending;",wordSpeakerContext);
const wordClick=()=>realSpeakerHandlers['speak:click']({stopPropagation:()=>{}});
examplePhase.beginExample();
assert.equal(examplePhase.state().phase,'example');
wordClick();
assert.equal(examplePhase.state().phase,'answer-paused','word speaker must leave example phase');
assert.equal(takeOverPaused,1,'word speaker pauses until its own utterance completes');
const replacedWord=audioSynth.last;
wordClick();
const latestWord=audioSynth.last;
assert.equal(takeOverPaused,1,'repeated word speaker does not double-pause');
replacedWord.onend();
assert.equal(takeOverResumed,0,'late Safari onend from cancelled word cannot resume auto early');
latestWord.onend();
assert.equal(takeOverResumed,1,'latest word speech resumes auto after spoken delay once');
assert.equal(wordSpeakerContext.getPending(),false,'word speaker clears example takeover state');
latestWord.onend();
assert.equal(takeOverResumed,1,'duplicate Safari onend is idempotent');

/* Actual example click handler: Safari's synchronous speak() failure invokes
 * onDone in playWord's catch AND the caller's false-return fallback. The
 * answer phase must be exited only once, and auto resumed only once. */
const exampleClickStart=script.indexOf("$('example-speak').addEventListener('click',e=>{");
const exampleClickEnd=script.indexOf('\nlet start=null;',exampleClickStart);
assert(exampleClickStart>0&&exampleClickEnd>exampleClickStart);
const realExampleButtons={};let failedAudioPauses=0,failedAudioResumes=0,failedAudioAttempts=0;
const failedExampleContext={
 $:id=>({addEventListener:(type,fn)=>{realExampleButtons[id+':'+type]=fn}}),
 phaseController:examplePhase,
 autoBrowse:{pause:()=>{failedAudioPauses++},resumeAfterSpeech:()=>{failedAudioResumes++}},
 subset:()=>[{answer:{example_en:'A short example sentence.'}}],index:0,
 playWord:(text,rate,onDone)=>{
  failedAudioAttempts++;
  assert.equal(rate,.9);
  onDone(); // synchronous exception recovery in real playWord()
  return false;
 }
};
vm.runInNewContext(script.slice(exampleClickStart,exampleClickEnd),failedExampleContext);
examplePhase.navigate('EX-3');
realExampleButtons['example-speak:click']({stopPropagation:()=>{}});
assert.equal(failedAudioAttempts,1);
assert.equal(failedAudioPauses,1);
assert.equal(failedAudioResumes,1,'synchronous failed audio must not restore the auto timer twice');
assert.equal(examplePhase.state().phase,'answer-paused');

console.log(JSON.stringify({status:'PASS',preview:'1778 SHA-pinned QA provisional',blocked:260,releaseApproved:0,readonly:true,inlineScriptSyntax:true}));
