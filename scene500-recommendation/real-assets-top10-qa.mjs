// Execute against REAL matching V0.9.4 assets, never fixtures.
// node scene500-recommendation/real-assets-top10-qa.mjs <catalog.json> <lexicon.json> <associations.json>
import fs from 'node:fs';
import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {loadScene500WithChineseLexicon} from './chinese-lexicon-loader.mjs';
const [catalogPath,lexPath,assocPath]=process.argv.slice(2);
if(!catalogPath||!lexPath||!assocPath){console.error('Usage: node real-assets-top10-qa.mjs catalog lexicon associations');process.exit(2);}
const read=path=>fs.readFileSync(path);
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const bytes=[catalogPath,lexPath,assocPath].map(read);
const [catalog,lexicon,associations]=bytes.map(b=>JSON.parse(b.toString('utf8')));
const expected={catalog:'35a680bee9ec2fe207c877c82da306b1bc1c77685457cfb489193732453bc4e8',lexicon:'9be43c35c1e0d1b1926c11726acb2d707bb052634e1ebc60ed445e4b35c63335'};
const hashes=bytes.map(sha);
if(hashes[0]!==expected.catalog||hashes[1]!==expected.lexicon||associations.source?.catalog_sha256!==hashes[0]||associations.source?.lexicon_sha256!==hashes[1])throw Error('ASSET_SHA_MISMATCH');
const reply=obj=>({ok:true,json:async()=>obj});
const begin=performance.now();
const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lex',associationUrl:'assoc',fetchImpl:async url=>reply(url==='lex'?lexicon:associations)});
const initMs=performance.now()-begin;
if(engine.mode!=='hybrid')throw Error('HYBRID_NOT_LOADED');
const queries=['我想坐地铁换乘','早餐怎么准备','How to order coffee','数学','物理','人工智能','AI','量子计算','quantum computing','学习英语发音'];
const measurements=[];
for(const query of queries){
 const t=performance.now();const snapshot=engine.search(query,{limit:10});const ms=performance.now()-t;
 const again=engine.search(query,{limit:10});
 if(JSON.stringify(snapshot.results)!==JSON.stringify(again.results))throw Error('UNSTABLE_ORDER '+query);
 const ids=snapshot.results.map(x=>x.sceneId);
 if(new Set(ids).size!==ids.length||ids.some(id=>!catalog.scenes[id]))throw Error('INVALID_RESULT '+query);
 measurements.push({query,ms:Number(ms.toFixed(3)),top5:snapshot.results.slice(0,5).map(x=>({sceneId:x.sceneId,name:x.name,score:x.score})),returned:snapshot.results.length});
}
const fallback=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lex',associationUrl:'assoc',fetchImpl:async()=>({ok:false,status:404})});
if(fallback.mode!=='rule_fallback')throw Error('FALLBACK_FAILED');
const result={status:'PASS',engineVersion:engine.version,mode:engine.mode,hashes:{catalog:hashes[0],lexicon:hashes[1],associations:hashes[2]},counts:{scenes:Object.keys(catalog.scenes).length,terms:lexicon.terms.length,links:associations.links.length,linkedTerms:new Set(associations.links.map(x=>x.term_id)).size,linkedScenes:new Set(associations.links.map(x=>x.scene_id)).size},initMs:Number(initMs.toFixed(3)),queries:measurements,fallbackMode:fallback.mode};
console.log(JSON.stringify(result,null,2));
