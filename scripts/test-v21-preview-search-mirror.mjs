// node scripts/test-v21-preview-search-mirror.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.equal(read('scene-search.js'),read('rebuild-preview/scene-search.js'),'preview search drifted from canonical search algorithm');
const boot=read('rebuild-preview/bootstrap.js'),sw=read('rebuild-preview/sw.js');
assert.match(boot,/script\('rebuild-preview\/scene-search\.js'\)/);
assert.match(sw,/'rebuild-preview\/scene-search\.js'/);
assert.doesNotMatch(boot,/await script\('scene-search\.js'\)/);
console.log('PASS preview search mirror and worker scoped asset references');
