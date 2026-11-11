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
console.log(JSON.stringify({status:'PASS',authorManifest:'1182/30 fixed',legacyQaFlags:27,releaseApproved:0,readonly:true,inlineScriptSyntax:true}));
