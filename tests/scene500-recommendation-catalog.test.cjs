const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
cp.execFileSync(process.execPath,['scripts/build-scene500-recommendation-catalog.cjs'],{stdio:'inherit'});
const full=JSON.parse(fs.readFileSync('data/scene500-recommendation-catalog-v0.1.json','utf8'));
const compact=JSON.parse(fs.readFileSync('scene500-recommendation/catalog-v0.2.json','utf8'));
const overlay=JSON.parse(fs.readFileSync('data/scene500-semantic-overlay-v1.2.json','utf8'));
const draft=Object.values(overlay.scenes).filter(s=>s.review_status==='draft_unverified').length;
const generated=Object.values(overlay.scenes).filter(s=>s.review_status==='machine_generated_unverified').length;
assert.equal(Object.keys(full.scenes).length,500);
assert.equal(Object.keys(compact.scenes).length,500);
for(const data of [full,compact]){
 assert.equal(Object.values(data.scenes).filter(x=>x.quality==='draft_unverified').length,draft);
 assert.equal(Object.values(data.scenes).filter(x=>x.quality==='machine_generated_unverified').length,generated);
}
for(const [id,scene] of Object.entries(compact.scenes)){
 if(scene.quality==='machine_generated_unverified'){
  assert.ok(!(scene.aliases||[]).some(a=>a.endsWith('相关交流')||/^关于.+的问题$/.test(a)),id+' contains generic aliases');
 }
}
const search=require('../scripts/scene500-semantic-ranker.cjs');
assert.equal(search.rank('起床与晨间准备',full.scenes,{limit:5})[0].id,'S001');
console.log('PASS 500 scene catalog with',draft,'draft profiles and',generated,'machine-generated candidates');
