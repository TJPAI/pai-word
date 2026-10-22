const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
cp.execFileSync(process.execPath,['scripts/build-scene500-recommendation-catalog.cjs'],{stdio:'inherit'});
const full=JSON.parse(fs.readFileSync('data/scene500-recommendation-catalog-v0.1.json','utf8'));
const compact=JSON.parse(fs.readFileSync('scene500-recommendation/catalog-v0.2.json','utf8'));
const overlay=JSON.parse(fs.readFileSync('data/scene500-semantic-overlay-v0.9.json','utf8'));
const expected=Object.keys(overlay.scenes).length;
assert.equal(Object.keys(full.scenes).length,500);
assert.equal(Object.keys(compact.scenes).length,500);
for(const data of [full,compact]){
 assert.equal(Object.values(data.scenes).filter(x=>x.quality==='draft_unverified').length,expected);
 assert.equal(Object.values(data.scenes).filter(x=>x.quality==='name_only_fallback').length,500-expected);
}
const search=require('../scripts/scene500-semantic-ranker.cjs');
assert.equal(search.rank('起床与晨间准备',full.scenes,{limit:5})[0].id,'S001');
console.log('PASS 500 scene catalog with',expected,'draft profiles and',500-expected,'fallbacks');
