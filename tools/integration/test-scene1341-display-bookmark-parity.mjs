import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const script=readFileSync('rebuild-preview/scene1341-readonly/scene1341-display-bookmark.js','utf8');
const writes=[],store=new Map();
const makeRoot=()=>({
 localStorage:{
  getItem:key=>store.get(key)??null,
  setItem:(key,value)=>{writes.push({key,value});store.set(key,value)}
 }
});
const first=makeRoot();
runInNewContext(script,{window:first});
const bookmark=first.PAI_SCENE1341_DISPLAY_BOOKMARK;
assert.equal(bookmark.load().lastScene,'SC50-0001');
assert.equal(bookmark.save('SC50-0027',12,'answer'),true);
assert.equal(bookmark.save('SC50-0032',4,'question'),true);
assert.equal(bookmark.save('SC50-0027',20,'answer'),true);
const second=makeRoot();
runInNewContext(script,{window:second});
const snapshot=second.PAI_SCENE1341_DISPLAY_BOOKMARK.load();
assert.equal(snapshot.lastScene,'SC50-0027');
assert.equal(snapshot.cursors['SC50-0027'].index,20);
assert.equal(snapshot.cursors['SC50-0027'].face,'answer');
assert.equal(snapshot.cursors['SC50-0032'].index,4);
assert.equal(second.PAI_SCENE1341_DISPLAY_BOOKMARK.save('SC50-0001',-1,'answer'),false);
assert.equal(second.PAI_SCENE1341_DISPLAY_BOOKMARK.save('SC50-0001',1,'graded'),false);
assert.ok(writes.length===3);
assert.ok(writes.every(x=>x.key==='pai-word-scene1341-readonly-display-bookmark-v1'));
assert.ok(writes.every(x=>!/(?:grade|srs|learningProgress|reviewQueue)/i.test(x.value)),
 'isolated bookmark can store only scene, index and question/answer face');

const html=readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
assert.match(html,/const savedDisplay=displayBookmark\.load\(\)/);
assert.match(html,/displayBookmark\.save\(sceneId,index,phase\.preferredFace\)/,
 'navigation and question/answer face updates should refresh display bookmark');
assert.match(html,/displayBookmark\.save\(sceneId,index,face\)/,
 'leaving a study screen should preserve its exact display cursor');
assert.match(html,/available\(lastScene\)\|\|masterSceneSnapshot\?\.index\?\.scenes\?\.\[lastScene\]/,
 'recent scene remains visible even before its cards have been fetched');
assert.match(html,/if\(!catalog\.some\(scene=>scene\.id===lastScene\)\)lastScene=/,
 'startup must not overwrite a valid 1341-scene bookmark just because legacy 14-scene local content excludes it');
assert.doesNotMatch(html,/if\(!countByScene\.has\(lastScene\)\)lastScene=/,
 'legacy local pack coverage must not invalidate Master scene bookmarks');
assert.doesNotMatch(html,/const savedDisplay=\{lastScene:/,
 'do not silently erase previously saved display cursor on every page load');
console.log('PASS: Scene1341 UI-only bookmark persists scene, card and face; Master dynamic continue, SRS isolated');
