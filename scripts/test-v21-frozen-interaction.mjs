// Frozen interaction audit. Run from repository checkout with: node scripts/test-v21-frozen-interaction.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const frozen=execFileSync('git',['show','116a3b40:rebuild-preview/learning-runtime.js'],{encoding:'utf8'});
const current=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
const snippet=(source,start,end)=>{
 const i=source.indexOf(start);assert.ok(i>=0,'missing '+start);
 const j=source.indexOf(end,i+start.length);assert.ok(j>i,'missing end '+end);
 return source.slice(i,j);
};
const contracts=[
 ['tap timing defaults','const defaults=',' const labels='],
 ['manual pronunciation','  window.PAI_AUDIO={','  window.speak='],
 ['tap and repeat controls',' function repeat(g)',' function tap()'],
 ['settings and instructions',' function settings()',' function hint()']
];
let differences=0;
for(const [name,start,end] of contracts){
 const a=snippet(frozen,start,end),c=snippet(current,start,end);
 const equal=a===c;
 console.log((equal?'MATCH':'DIFF')+' '+name);
 if(!equal)differences++;
}
const necessary=[
 ['automatic speech options','state.autoPronounce={question:true,swipe:true'],
 ['touch navigation',"document.addEventListener('touchend'"],
 ['answer reveal','window.reveal='],
 ['word browsing','window.browseAnswer=async'],
 ['safe attempt','const ensureAttempt='],
 ['SRS commit','window.rateLearning=']
];
for(const [name,needle]of necessary){
 assert.ok(frozen.includes(needle)&&current.includes(needle),'missing contract '+name);
 console.log('PRESENT '+name);
}
assert.match(current,/window\.PAI_PREVIEW_WRITABLE|PAI_SAVE_DEFERRED/);
console.log('Frozen audit: '+differences+' behavior block(s) differ; manual parity review required.');
// Report differences without failing solely because persistence and retry guards changed.
// Actual behavioral parity must be proven with browser tests.
