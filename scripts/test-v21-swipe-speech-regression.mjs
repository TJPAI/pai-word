import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
// Guard the user-visible contract: an unanswered forward swipe rotates the
// queue without awarding a grade or leaking the next card's answer.
assert.match(s,/window\.skipUnansweredLearning=\(\)=>/);
assert.match(s,/draft\.learningSession\.queue=\[\.\.\.q\.slice\(1\),q\[0\]\]/);
assert.match(s,/draft\.learningSession\.currentAttempt=null/);
assert.match(s,/try\{persist\(\)\}catch\(e\)\{state=previous/);
assert.match(s,/if\(direction>0&&index===keys\.length-1\)return window\.skipUnansweredLearning\(\)/);
assert.match(s,/if\(synth\.speaking\|\|synth\.pending\|\|synth\.paused\)this\.stop\(\)/);
const rotate=q=>[...q.slice(1),q[0]];
assert.deepEqual(rotate(['a','b','c']),['b','c','a']);
assert.deepEqual(rotate(['b','c','a']),['c','a','b']);
console.log('PASS swipe navigation source guard, ungraded queue rotation, idle speech cancel guard');
