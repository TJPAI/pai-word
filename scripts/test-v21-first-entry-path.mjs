import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const boot=readFileSync(new URL('../rebuild-preview/bootstrap.js',import.meta.url),'utf8');
const runtime=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
assert.match(boot,/function preloadStudyScripts\(\)/);
assert.match(boot,/if\(navigation\)return navigation;[\s\S]*preloadStudyScripts\(\);/);
assert.match(boot,/for\(const path of \['rebuild-preview\/learning-runtime.js','rebuild-preview\/round-policy.js','audio-compat.js'\]\)/);
for(const phase of ['intent','core-ready','top100-ready','runtime-ready','engine-ready','open-start','open-returned'])
 assert.ok(boot.includes("stage('"+phase+"')")||boot.includes("STUDY_ENTRY_STAGE?.('"+phase+"')"),'missing '+phase);
assert.match(runtime,/PAI_STUDY_ENTRY_STAGE\?\.\('first-question-rendered'\)/);
assert.match(runtime,/if\(direction>0&&index===keys\.length-1\)return window\.skipUnansweredLearning\(\)/);
console.log('PASS click-triggered study script preload, first-question timing, swipe boundary');
