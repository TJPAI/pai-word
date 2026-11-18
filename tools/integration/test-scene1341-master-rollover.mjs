// CG-MAIN source regression: Master scene rollover may retry only after
// a verified new immutable index, never bypass the scene Git blob SHA gate.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../rebuild-preview/scene1341-readonly/index.html',import.meta.url),'utf8');
const adapter=readFileSync(new URL('../../rebuild-preview/scene1341-readonly/scene1341-master-scene-v1.mjs',import.meta.url),'utf8');
const open=html.slice(html.indexOf('async function openMasterScene('),html.indexOf('let exampleToWordPending=',html.indexOf('async function openMasterScene(')));
assert.match(open,/catch\(firstError\)/);
assert.match(open,/MASTER_SCENE_V1_SCENE_BLOB/);
assert.match(open,/resolveMasterSceneIndex\(\)/);
assert.match(open,/fresh\.commit===previous\.commit/);
assert.match(open,/fresh\.index\.scenes\[id\]\?\.git_blob_sha1===previous\.index\.scenes\[id\]\?\.git_blob_sha1/);
assert.match(open,/fetchMasterScene\(fresh,id\)/);
assert.match(open,/masterSceneSnapshot=fresh/);
assert.match(open,/catch\(error\)[\s\S]*?sceneEntryError=mismatch/);
assert.match(adapter,/blobHash\(raw,cryptoImpl\)!==entry\.git_blob_sha1/);
assert.match(adapter,/cache:'no-store'/);
assert.match(adapter,/source_associations!==230289/);
assert.match(adapter,/index\.scene_count!==1341/);
console.log('PASS: scene rollover retries only with new SHA-pinned Master; unchanged/mismatch fails closed.');
