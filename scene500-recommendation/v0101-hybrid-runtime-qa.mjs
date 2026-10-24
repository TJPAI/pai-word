// Real V0.10.1 × existing 3553 associations: end-to-end Hybrid runtime gate.
// node scene500-recommendation/v0101-hybrid-runtime-qa.mjs catalog.json runtime-v0101.json associations.json
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {loadScene500WithChineseLexicon} from './chinese-lexicon-loader.mjs';
const [catalogFile,runtimeFile,associationFile]=process.argv.slice(2);
if(!catalogFile||!runtimeFile||!associationFile)throw Error('USAGE: catalog runtime-v0101 associations');
const read=p=>fs.readFileSync(p);
const files=[catalogFile,runtimeFile,associationFile].map(read);
const sha=files.map(b=>createHash('sha256').update(b).digest('hex'));
const expected=['35a680bee9ec2fe207c877c82da306b1bc1c77685457cfb489193732453bc4e8','18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093','d6de9818f5056330b6d57d6b7c728a1457e66a4d241aac173ba7eb1c5f770213'];
assert.deepEqual(sha,expected,'INPUT_SHA256_MISMATCH');
const [catalog,lexicon,associations]=files.map(b=>JSON.parse(b));
assert.equal(catalog.scene_count,500);
assert.equal(lexicon.terms.length,20000);
assert.equal(associations.links.length,3553);
const byId=new Map(lexicon.terms.map(x=>[x.term_id,x]));
assert.equal(byId.size,20000);
for(const x of associations.links){assert.equal(byId.get(x.term_id)?.term,x.term);assert.ok(catalog.scenes[x.scene_id]);}
const response=obj=>({ok:true,json:async()=>obj});
const started=performance.now();
const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'runtime',associationUrl:'associations',fetchImpl:async url=>response(url==='runtime'?lexicon:associations)});
const initMs=performance.now()-started;
assert.equal(engine.mode,'hybrid','V0101_HYBRID_FAILED');
assert.equal(engine.runtimeDataVersion,'0.10.1-evidence-compat');
const queries=['我想坐地铁换乘','早餐怎么准备','How to order coffee','数学','物理','人工智能','AI','量子计算','quantum computing','学习英语发音','不要坐地铁，改坐公交','洗衣服和晾衣服','租房退押金','软件打不开',''];
const rows=[];
for(const query of queries){
 const t=performance.now(),r=engine.search(query,{limit:10}),ms=performance.now()-t;
 assert.ok(r.results.length<=10);
 assert.deepEqual(r.results,engine.search(query,{limit:10}).results,'NONDETERMINISTIC');
 assert.equal(new Set(r.results.map(x=>x.sceneId)).size,r.results.length,'DUPLICATE_SCENE');
 assert.ok(r.results.every(x=>catalog.scenes[x.sceneId]),'UNKNOWN_SCENE');
 const allowed=new Set(['S001','S002','S003']);
 const filtered=engine.search(query,{limit:10,eligibleSceneIds:allowed});
 assert.ok(filtered.results.every(x=>allowed.has(x.sceneId)),'ELIGIBILITY_BYPASS');
 rows.push({query,ms:Number(ms.toFixed(3)),top5:r.results.slice(0,5).map(x=>({id:x.sceneId,name:x.name,score:x.score})),top10:r.results.map(x=>x.sceneId)});
}
assert.equal(engine.search('',{limit:10}).results.length,0,'EMPTY_QUERY');
const fallback=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'runtime',associationUrl:'associations',fetchImpl:async()=>({ok:false,status:404})});
assert.equal(fallback.mode,'rule_fallback');
const report={status:'PASS_RUNTIME_STRUCTURAL_ONLY',source:'real GitHub ESM + SHA-pinned input files',sha256:{catalog:sha[0],runtime:sha[1],associations:sha[2]},engineVersion:engine.version,mode:engine.mode,initMs:Number(initMs.toFixed(2)),queries:rows,fallback:fallback.mode,semanticQuality:'NOT_INDEPENDENTLY_GRADED',browserE2E:'NOT_TESTED'};
console.log(JSON.stringify(report,null,2));
