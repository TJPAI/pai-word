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
assert(script.includes('尚无本预览对应的逐条QA证据'));
assert(html.includes('scene500-mobile.css'));
assert(html.includes('scene500-learning.css'));
assert(html.includes('scene500-home.css'));
for(const speed of [200,600,2000,5000])assert(html.includes('value="'+speed+'"'));
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
assert(html.includes('#learning .demo-qa{display:none!important}'),'staging QA notices must not add another row on question/answer faces');
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
 script.includes('isBusy:()=>phaseController.state().pending||!!window.speechSynthesis?.speaking') &&
 script.includes('navigate:()=>{if(subset().length<2)return false;move(1,true);return true}'),
 'Scene1341 must use Scene500-like speech-idle and correction-idle AUTO NEXT, not automatic answer flip');
assert(!script.includes('if(!revealed)show();else if(index<subset().length-1)move(1)'),
 'old alternate reveal/move auto-browse loop must never return');
let automaticID=0,busy=false,allowed=true;
const automaticTimers=new Map(),autoMoves=[],autoStates=[];
const auto=api.createReadOnlyAutoBrowse({
 shouldRun:()=>allowed,isBusy:()=>busy,
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
assert.equal(auto.setDelay(600),true);
assert.equal(auto.setDelay(1234),false);
auto.start();assert.equal(auto.isEnabled(),true);
assert.equal([...automaticTimers.values()][0].ms,600);
busy=true;assert.equal(fireOne(),600);
assert.equal(autoMoves.length,0,'speech in progress must block auto navigation');
assert.equal([...automaticTimers.values()][0].ms,120);
busy=false;assert.equal(fireOne(),120);
assert.equal([...automaticTimers.values()][0].ms,600,'wait full selected interval AFTER speech is idle');
assert.equal(fireOne(),600);assert.equal(autoMoves.length,1);
auto.setDelay(200);assert.equal([...automaticTimers.values()][0].ms,200);
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
 script.includes('playWord(subset()[0].expression)') &&
 script.includes("if(!autoBrowse.isEnabled())playWord(subset()[index]?.expression)"),
 'Scene500 speech should occur on entry, manual/auto navigation and manual face flip');
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
console.log(JSON.stringify({status:'PASS',authorManifest:'1182/30 fixed',legacyQaFlags:27,releaseApproved:0,readonly:true,inlineScriptSyntax:true}));
