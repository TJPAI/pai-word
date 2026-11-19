import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../../rebuild-preview/scene1341-readonly/index.html',import.meta.url),'utf8');
const start=s.indexOf('async function openMasterScene('),end=s.indexOf('let exampleToWordPending=false;',start);
const entry=s.slice(start,end);
assert.match(entry,/const fresh=await masterSceneAdapter\.resolveMasterSceneIndex\(\);\s*if\(request!==latestSceneEntryRequest\)return;/);
assert.match(entry,/scene=await masterSceneAdapter\.fetchMasterScene\(fresh,id\);\s*if\(request!==latestSceneEntryRequest\)return;\s*masterSceneSnapshot=fresh;/);
assert.match(entry,/if\(request!==latestSceneEntryRequest\)return;\s*items=masterSceneAdapter\.mergeMasterScene/);
console.log('PASS: superseded mismatch retries cannot overwrite active Master snapshot');
