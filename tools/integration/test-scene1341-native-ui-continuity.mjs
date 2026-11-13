import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const page=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const script=page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,'Scene1341 inline script must exist');
new vm.Script(script,{filename:'scene1341-inline.js'});

assert(page.includes("get('nativeUI')==='1'"));
assert(script.includes("get('nativeQuestion')==='1'||nativeUI"),
 'combined nativeUI opt-in must activate native question renderer');
assert(script.includes("get('nativeAnswer')==='1'||nativeUI"),
 'combined nativeUI opt-in must activate native answer renderer');
assert(script.includes("original.dataset.nativeQuestionSource!=='scene500'"),
 'question hero must keep stable DOM during rating, speech and face rerender');
assert(script.includes("hero.dataset.nativeQuestionSource='scene500'"));
assert(script.includes("auto.removeAttribute('onchange')"),
 'native app SRS-affecting onChange must never be inserted');
assert(script.includes("$('auto-toggle').checked=autoBrowse.isEnabled()"),
 'stable question control must reflect ongoing auto-browse state');
assert(script.includes("$('speak').dataset.speak=r.expression"),
 'word audio element must be refreshed when KU changes');
assert(script.includes("legacyAutoInput.dispatchEvent(new Event('change'))"),
 'source-exact switch must delegate to isolated runtime');
assert(script.includes("legacyWordSpeaker.click()"),
 'source-exact speaker must delegate to isolated runtime');

const begin=script.indexOf('const ipaDisplayCache=new Map(),ipaPendingByKU=new Map();');
const end=script.indexOf('\nasync function renderLexiconReference(card){',begin);
assert(begin>0&&end>begin,'extract real IPA async/cache logic');
const original=script.slice(begin,end);
assert(original.includes('ipaDisplayCache.set(expectedKU,display)'),
 'only a policy-projected, source-pinned IPA result can be cached');
assert(original.includes('const cached=ipaDisplayCache.get(expectedKU)'));
assert(original.includes('ipaPendingByKU.get(expectedKU)'));
assert(original.includes('ticket!==ipaSequence'),
 'stale lookups must never overwrite the current KU display');
assert(original.includes("el.dataset.ipaStatus='missing'"),
 'missing or failed IPA must be openly labeled');
assert(original.includes('const display=describeScene1341IPA(card,result)'),
 'source-pinned phonetic display policy cannot be bypassed');

// Execute unchanged IPA algorithm with only its dynamic module imports replaced
// by a deterministic in-memory stub, so cache/dedup/race tests are real.
const simulated=original
 .replace("import('./scene1341-ipa-display-policy.mjs')",'deps.policy()')
 .replace("import('./scene1341-ipa-preview.mjs')",'deps.preview()');
assert(!simulated.includes("import('./scene1341-ipa-"),
 'test must substitute both module loads');
const cardA={scene_ku_id:'SC1341-KU-00001',expression:'wake up'};
const cardB={scene_ku_id:'SC1341-KU-00002',expression:'soon'};
let rows=[cardA],lookups=0;
const dom={ipa:{textContent:'',title:'',dataset:{}},learning:{hidden:false}};
const deps={
 policy:async()=>({describeScene1341IPA:(card,result)=>({
  text:result.ipa,title:'source-pinned',status:'matched'
 })}),
 preview:async()=>({scene1341IPAReference:{
  lookup:async card=>{lookups++;return {ipa:card.scene_ku_id===cardA.scene_ku_id?'/weɪk ʌp/':'/suːn/'};}
 }})
};
const ctx={
 Map,Promise,deps,window:{},ipaSequence:0,ipaIndexPromise:null,index:0,
 $:id=>dom[id],subset:()=>rows
};
vm.runInNewContext(simulated+'\nthis.renderIPA=renderQuestionIPA;',ctx,{timeout:1500});
await Promise.all([ctx.renderIPA(cardA),ctx.renderIPA(cardA),ctx.renderIPA(cardA)]);
assert.equal(lookups,1,'concurrent rerenders of same KU must dedupe IPA lookup');
assert.equal(dom.ipa.textContent,'/weɪk ʌp/');
assert.equal(dom.ipa.dataset.ipaStatus,'matched');
await ctx.renderIPA(cardA);
assert.equal(lookups,1,'later grade/face renders must use cached IPA');
assert.equal(dom.ipa.textContent,'/weɪk ʌp/');
rows=[cardB];await ctx.renderIPA(cardB);
assert.equal(lookups,2);
assert.equal(dom.ipa.textContent,'/suːn/');
rows=[cardA];await ctx.renderIPA(cardA);
assert.equal(lookups,2,'return to prior KU should reuse its own cached phonetic value');
assert.equal(dom.ipa.textContent,'/weɪk ʌp/');


// Native Scene500's conditional function-word hint is word-specific.
// A persistent hero must recompute it when swiping a/the -> ordinary KU.
const hintStart=script.indexOf("const hero=$('hero'),isFunctionWord=/^(the|a|an|and|to|of)$/.test(r.expression);");
const hintEnd=script.indexOf("\n }",hintStart);
assert(hintStart>0&&hintEnd>hintStart,'per-KU native hint must update in stable DOM');
const hintCode=script.slice(hintStart,hintEnd);
const hints=[];
const fakeHint={remove(){const i=hints.indexOf(this);if(i>=0)hints.splice(i,1)}};
const fakeHero={
 querySelector(selector){
  if(selector===':scope > small.muted')return hints[0]||null;
  if(selector==='.recall-controls-row')return {before(node){hints.push(node)}};
  throw Error('unexpected selector '+selector);
 }
};
const hintContext={
 r:{expression:'the'},$:()=>fakeHero,
 document:{createElement:tag=>{assert.equal(tag,'small');return fakeHint}}
};
const runHint=()=>vm.runInNewContext('{'+hintCode+'}',hintContext,{timeout:1000});
runHint();assert.equal(hints.length,1,'function word should add native hint');
hintContext.r={expression:'soon'};runHint();
assert.equal(hints.length,0,'normal word must remove previous KU function-word hint');
hintContext.r={expression:'an'};runHint();
assert.equal(hints.length,1,'function word after normal word must restore hint');
hintContext.r={expression:'and'};runHint();
assert.equal(hints.length,1,'function word hint must not duplicate on rerender');

console.log('SC1341_NATIVE_UI_COMBINED_STABLE_HERO_AND_IPA_CACHE_PASS');
