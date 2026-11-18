// Prevent a stale async Master request from overriding the latest tap.
// This is a source-structure guard, not a real-browser Safari acceptance test.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../rebuild-preview/scene1341-readonly/index.html',import.meta.url),'utf8');
const start=html.indexOf('async function openMasterScene(');
const end=html.indexOf('let exampleToWordPending=',start);
assert.ok(start>0&&end>start);
const fn=html.slice(start,end);
assert.match(html,/masterSceneLoading=new Set\(\),latestSceneEntryRequest=0/);
assert.match(fn,/if\(masterSceneLoading\.has\(id\)\)return/);
assert.match(fn,/const request=\+\+latestSceneEntryRequest/);
assert.match(fn,/if\(request!==latestSceneEntryRequest\)return;\s*items=masterSceneAdapter\.mergeMasterScene/);
assert.match(fn,/catch\(error\)\{\s*if\(request!==latestSceneEntryRequest\)return/);
assert.match(fn,/finally\{masterSceneLoading\.delete\(id\);if\(request===latestSceneEntryRequest\)renderHome\(\)/);
assert.match(fn,/masterSceneAdapter\.fetchMasterScene\(masterSceneSnapshot,id\)/);
assert.match(fn,/MASTER_SCENE_V1_SCENE_BLOB/);
console.log('PASS scene entry last-tap-wins source guard; same-id taps coalesced, stale errors suppressed, SHA gate retained');
