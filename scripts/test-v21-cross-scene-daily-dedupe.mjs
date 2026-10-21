// Run: node scripts/test-v21-cross-scene-daily-dedupe.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const wordFunction=source.match(/function wordIntroduced\(w\)\{[^\n]+\}/)?.[0];
const start=source.indexOf('window.markDailyNewComplete=function(k){');
const end=source.indexOf('\n  window.setNewPerDay=',start);
assert(wordFunction&&start>=0&&end>start,'daily policy functions missing');
const dailyFunction=source.slice(start,end);
const state={records:{'shared-ku':{last:1}},dailyNewProgress:{completed:[],newWordsCompleted:[],reinforcementCompleted:[]}};
const unitMap={'shared-ku':{},'alternate-ku':{}};
const context={state,window:{},unitIsPlayable:u=>Boolean(u),findUnitByKey:k=>unitMap[k],
 ensureProgress:()=>state.dailyNewProgress,ensureDaily:()=>({newWordKeys:['shared-ku'],reinforcementKeys:[]}),
 oldSave(){}};
vm.createContext(context);
vm.runInContext(wordFunction+';'+dailyFunction+';window.PAI_TEST_WORD_INTRODUCED=wordIntroduced',context);
assert.equal(context.window.PAI_TEST_WORD_INTRODUCED({s:{'shared-ku':{},'alternate-ku':{}}}),true,
 'same word must be recognized across multiple senses/scenes');
assert.equal(context.window.PAI_TEST_WORD_INTRODUCED({s:{'alternate-ku':{}}}),false,
 'unlearned word must remain available');
context.window.markDailyNewComplete('shared-ku');
context.window.markDailyNewComplete('shared-ku');
assert.equal(state.dailyNewProgress.newWordsCompleted.length,1,'repeat same KU must not increase daily word completion');
assert.equal(state.dailyNewProgress.completed.length,1,'same KU must have one completion entry');
console.log('PASS: cross-scene introduced-word detection and repeated KU daily completion dedupe');
