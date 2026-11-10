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
console.log(JSON.stringify({status:'PASS',authorManifest:'1182/30 fixed',legacyQaFlags:27,releaseApproved:0,readonly:true,inlineScriptSyntax:true}));
