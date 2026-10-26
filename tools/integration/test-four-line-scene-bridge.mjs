import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createFourLineSceneBridge} from '../../scripts/four-line-scene-bridge.mjs';
// Run from repository root: node tools/integration/test-four-line-scene-bridge.mjs
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read('scene500-recommendation/catalog-v0.2.json');
const activeSceneMembership=read('data/scene500-playable-membership-v2.json');
const english={words:Array(20000),byKU:new Map(),byRank:new Map()};
const bridge=createFourLineSceneBridge({catalog,english,activeSceneMembership});
const result=bridge.search('我要预订酒店',{limit:5});
assert(result.results.length>0);
assert.equal(result.results[0].scene_id,'S113');
assert.equal(result.results[0].name,'预订酒店');
assert.equal(result.results[0].playable,false);
assert.equal(result.results[0].legacy_scene_id,null);
assert.equal(bridge.resolvePlayable('S113').allowed,false);
assert(result.results.every(r=>!r.playable));
assert(result.results.every(r=>r.scene_id.startsWith('S')));
assert.throws(()=>createFourLineSceneBridge({catalog,english,activeSceneMembership,
 sceneMappings:[{scene_id:'S113',legacy_id:'cs043',provenance_verified:false,source_sha:'fake'}]
}),/UNVERIFIED_SCENE_MAPPING/);
console.log('PASS four-line scene bridge: S113 hotel recommendation, safe no-navigation, rejected unverified cs043 mapping');
