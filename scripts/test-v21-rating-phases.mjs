import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const correct=source.match(/function correct\(score\)\{[^\n]+\}/)?.[0];
assert(correct,'correct() missing');
for(const phase of ['answer','answer-paused','example','repeating']){
 const context={phase,entryMode:'tap',generation:1,grade:null,timer:null,visibleKey:'ku1',
  window:{PAI_AUDIO:{stop(){}},render(){}},clearTimeout(){},later(_fn,ms){this.scheduled=ms},config(){return {goodShow:2,hardShow:4,againShow:6}},finish(){}};
 vm.createContext(context);
 vm.runInContext(correct+'; correct(\'hard\');',context);
 assert.equal(context.grade,'hard',phase+' should permit correction');
}
console.log('PASS: answer, answer-paused, example, reread correction');
