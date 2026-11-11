import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert(html.startsWith('<!doctype html>'));
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,'isolated demo must include executable inline JS');
new vm.Script(script,{filename:'scene1341-readonly-inline.js'});

// The catalog and author KU data are pinned to immutable, distinct commits.
assert(script.includes("const SOURCE='2cecf85fdb1b6b73fcd4b96c11bcb872a30c92db'"));
assert(script.includes("const AUTHOR_SHA='5211c3b17078101c286fb9c3c01fb07a7684d07c'"));
assert(script.includes("const MANIFEST='tools/answer-enrichment/scene1341-v51-answer-only-v2-manifest-1182.json'"));
assert(script.includes('packs.length!==30'));
assert(script.includes('items.length!==1182'));
assert(script.includes('manifest.counts?.production_playable!==0'));
assert(script.includes('manifest.counts?.question_payloads!==0'));
assert(script.includes("pack.identity?.srs_namespace!=='scene1341-v2'"));
assert(script.includes('r.activation_allowed!==false'));
assert(script.includes("Object.hasOwn(r,'question')"));
assert(script.includes('qa.counts?.release_approved!==0'));

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
for(const speed of [900,1500,3000,6000])assert(html.includes('value="'+speed+'"'));
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
assert(script.includes("const MANIFEST='tools/answer-enrichment/scene1341-v51-answer-only-v2-manifest-1182.json'"),'read-only draft source unchanged');

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
 script.includes('isBusy:()=>phaseController.state().pending||!!(window.speechSynthesis?.speaking||window.speechSynthesis?.pending)') &&
 script.includes('navigate:()=>{if(subset().length<2)return false;move(1,true);return true}'),
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
assert.equal(auto.isEnabled(),false,'background/hidden/handwriting must fail closed');
assert.equal(automaticTimers.size,0);

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
assert(script.includes('resetScratch();phaseController.navigate('),
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
assert(blankTap.includes('if(pending)window.PAI_SCRATCH_FINISH_RATING?.()'),
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
assert(script.includes("const BATCH=10;"),'Scene1341 default must match native 10-KU batch');
assert(script.includes("index=(index+delta%rows.length+rows.length)%rows.length"),
 'Scene1341 must perform circular word navigation');
assert(script.includes("((now+delta%batches+batches)%batches)*BATCH"),
 'Scene1341 must perform circular batch navigation');
assert(script.includes('navigate:()=>{if(subset().length<2)return false;move(1,true);return true}'),
 'auto browse must loop too when more than one KU exists');
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
assert(script.includes('playWord(rows[index].expression)') &&
 script.includes('function openStudy(id,resume=false)') &&
 script.includes("if(!autoBrowse.isEnabled())playWord(subset()[index]?.expression)"),
 'Scene500 speech should occur on resumed entry, navigation and manual face flip');
assert(script.includes("utterance.lang='en-US'") &&
 script.includes("window.speechSynthesis.speak(utterance)"),
 'native US-English voice and synthesis fallback required');
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
assert(script.includes("isSpeaking:()=>!!(window.speechSynthesis?.speaking||window.speechSynthesis?.pending)"),
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
assert(phaseSource.includes('function pause(){clear()}') &&
 phaseSource.includes('function resume(){if(enabled){clear();next()}}'),
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
 script.includes("setTimeout(finish,8000)"),
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
assert(script.includes('const transientCursors=new Map()'),
 'Scene1341 must maintain a no-storage scene cursor');
assert(script.includes('function openStudy(id,resume=false)') &&
 script.includes('resume?transientCursors.get(id):null') &&
 script.includes('index=saved?Math.max(0,Math.min(rows.length-1,saved.index)):0'),
 'continue must restore last index safely with bounds check');
assert(script.includes("if(saved?.face==='answer')phaseController.tap()"),
 'continue must restore chosen answer face');
assert(script.includes("transientCursors.set(sceneId,{index,face:phaseController.state().preferredFace})"),
 'leaving a scene must save in-memory cursor and explicit face choice');
assert(script.includes("$('continue').addEventListener('click',()=>openStudy(lastScene,true))"),
 'continue action should restore saved cursor instead of entering from first item');
assert(!/localStorage|sessionStorage|indexedDB/.test(script),
 'read-only preview cursor must not persist any user data');

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
 window:{speechSynthesis:{speaking:false,pending:true}}
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
 BATCH:10,index:7,
 subset:()=>batchRows,
 phaseController:{state:()=>({selected:null}),navigate:key=>{batchNavigates++;batchFace.navigate(key)}},
 resetScratch:()=>{batchScratchResets++},
 playWord:()=>{batchSpeeches++},
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
 phaseSource.includes('return Object.freeze({start,tap,choose,navigate,suspend,cancel,state})'),
 'read-only controller must expose suspend preserving revealed answer');
assert(script.includes("document.addEventListener('visibilitychange',()=>{") &&
 script.includes("if(document.hidden){\n  autoBrowse.pause();") &&
 script.includes("phaseController.suspend();") &&
 script.includes("window.speechSynthesis?.cancel();"),
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
console.log(JSON.stringify({status:'PASS',authorManifest:'1182/30 fixed',legacyQaFlags:27,releaseApproved:0,readonly:true,inlineScriptSyntax:true}));
