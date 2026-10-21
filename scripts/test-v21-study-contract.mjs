import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const extract=(regex,label)=>{const m=source.match(regex);assert(m,label+' missing');return m[0]};
const defaults=extract(/const defaults=\{[^\n]+\};/,'timing defaults');
const config=extract(/const config=\(\)=>\{[^\n]+\};/,'timing config');
const classify=extract(/function classify\(ms\)\{[^\n]+\}/,'timing classification');
for(const [settings,ms,expected] of [
 [{},1000,'good'],[{},3500,'hard'],[{},6500,'again'],
 [{goodWithin:1.5,hardWithin:4},1400,'good'],
 [{goodWithin:1.5,hardWithin:4},2500,'hard'],
 [{goodWithin:1.5,hardWithin:4},5000,'again']
]){
 const ctx={state:{tapTiming:settings}};vm.createContext(ctx);
 assert.equal(vm.runInContext(defaults+config+classify+';classify('+ms+')',ctx),expected);
}
for(const pattern of [
 /if\(gestureSpeech&&autoQuestion&&u\.w\?\.w\)/,
 /if\(!gestureSpeech&&autoQuestion\)speak\(u\.w\.w\)/,
 /\(wasRevealed\?state\.autoPronounce\.swipe:state\.autoPronounce\.question\)/,
 /if\(state\.autoPronounce\?\.swipe\)window\.PAI_AUDIO\?\.play\(current\.w\.w/,
 /const k=visibleKey,score=classify\(responseMs\)/,
 /phase='repeating';repeated=0;repeat\(generation\)/,
 /clearPendingGrade:k=>\{pendingGrades\.delete\(k\)/,
 /const gradeFor=k=>pendingGrades\.get\(k\)\|\|\(state\.records\?\.\[k\]\?\.lastGrade\|\|'again'\)/
])assert(pattern.test(source),'missing runtime contract '+pattern);
assert(!/phase='repeating';grade='again'/.test(source),'reread must not overwrite grade');
console.log('PASS: 6 executed timing cases and 8 source-contract assertions');
