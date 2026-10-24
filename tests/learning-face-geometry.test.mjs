import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../learning.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../rebuild-preview/index.html',import.meta.url),'utf8');
const runtime=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');

test('question and answer share fixed hero row geometry',()=>{
 for(const row of ['.word-line','.ipa-line','.recall-controls-row']){
   assert.ok(css.includes('.learning-screen .word-hero '+row+'{'));
 }
 assert.match(css,/justify-content:flex-start!important/);
 assert.ok(css.includes('flex:0 0 45px'));
 assert.ok(css.includes('flex:0 0 40px'));
 assert.ok(css.includes('flex:0 0 41px'));
});
test('listen-only hides text without removing word and IPA layout boxes',()=>{
 assert.match(css,/\.learning-screen \.word-hero\.listen-only \.word,\s*\.learning-screen \.word-hero\.listen-only \.ipa\s*\{\s*display:block!important;\s*visibility:hidden!important;/);
 assert.ok(css.includes('.word-hero.listen-only .speak-btn'));
 assert.ok(css.includes('.word-hero.listen-only .auto-word-toggle'));
});
test('compact iPhone retains the same row geometry',()=>{
 assert.ok(css.includes('@media(max-height:680px)'));
 for(const size of ['flex-basis:35px','flex-basis:34px'])assert.ok(css.includes(size));
});
test('page-toggle is a shared hero, with answer contents below it',()=>{
 assert.ok(runtime.includes('<div class="word-hero${hidden}"><div class="word-line">'));
 assert.ok(runtime.includes('<div class="study-body">${state.revealed?answerHtml(u):\'\'}</div>'));
});
test('Safari receives the corrected stylesheet URL',()=>{
 assert.ok(html.includes('learning.css?v=repeat-align-left-v8'));
});
