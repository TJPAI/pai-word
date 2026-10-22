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
const genericActions=new Set(["操作","设置","访问","解决问题","理解原理","使用工具","讨论应用","描述情况","咨询医生","安排检查","参加活动","练习技能","注意安全","欣赏","参与","交流体验","表达态度","回应他人","维护关系","办理手续","寻求服务","沟通问题","提出观点","回应","澄清","描述现象","理解原因","讨论影响","分析","描述","解释","论证"]);
for(const [id,item] of Object.entries(compact.scenes))if(item.quality==='machine_generated_unverified'){
 assert.ok((item.actions||[]).every(action=>!genericActions.has(action)),id+' generic action leaked');
}
const search=require('../scripts/scene500-semantic-ranker.cjs');
assert.equal(search.rank('起床与晨间准备',full.scenes,{limit:5})[0].id,'S001');
console.log('PASS 500 scene catalog with',draft,'draft profiles and',generated,'machine-generated candidates');
