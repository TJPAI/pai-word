import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createScene500ContractAdapter} from '../scene500-recommendation/contract-adapter.mjs';
import {createScene500Recommender} from '../scene500-recommendation/engine.mjs';
import {loadScene500WithChineseLexicon} from '../scene500-recommendation/chinese-lexicon-loader.mjs';

const read=path=>fs.readFileSync(new URL(path,import.meta.url));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const catalog=JSON.parse(read('../scene500-recommendation/catalog-v0.2.json'));
const lexBytes=read('../scene500-recommendation/zh-core20k-v094.min.json');
const edgeBytes=read('../scene500-recommendation/v094-lexical-associations.json');
assert.equal(sha(lexBytes),'9be43c35c1e0d1b1926c11726acb2d707bb052634e1ebc60ed445e4b35c63335');
assert.equal(sha(edgeBytes),'d6de9818f5056330b6d57d6b7c728a1457e66a4d241aac173ba7eb1c5f770213');
const raw=JSON.parse(lexBytes),associations=JSON.parse(edgeBytes);
assert.equal(raw.terms.length,20000);
assert.equal(associations.links.length,3553);
assert.equal(Object.keys(catalog.scenes).length,500);
assert.equal(associations.source.lexicon_sha256,sha(lexBytes));
const lexicon={source_version:raw.version,terms:raw.terms.map(x=>({
 term_id:x.id,term:x.t,normalized_term:x.n,frequency_rank:null,
 frequency_score:null,pos:null,aliases:[],source_version:raw.version
}))};
const hybrid=createScene500ContractAdapter({catalog,lexicon,associations});
const rule=createScene500Recommender({catalog});
const queries=['我想乘公交车，还要买车票。','我要预订酒店',
 '我要去机场登机','帮我回复审稿意见','我想写提示词给AI助手',
 '我想提出科研假设'];
for(const q of queries){
 const first=hybrid.search(q,{limit:500});
 const repeat=hybrid.search(q,{limit:500});
 assert.deepEqual(repeat,first,'deterministic query '+q);
 assert.equal(first.results.length,new Set(first.results.map(r=>r.sceneId)).size);
 assert(first.results.every(r=>/^S\d{3}$/.test(r.sceneId)&&catalog.scenes[r.sceneId]));
 const seen=new Set();
 for(let page=0;page<Math.ceil(first.results.length/5);page++)
  for(const item of hybrid.getPage(first,page,5)){
   assert(!seen.has(item.sceneId),'pagination overlap '+item.sceneId);
   seen.add(item.sceneId);
  }
 assert.equal(seen.size,first.results.length,'pagination coverage');
}
const bus=hybrid.search(queries[0],{limit:5}).results.map(x=>x.sceneId);
assert(bus.includes('S078')&&bus.includes('S092'),'multi-intent bus/ticket');
assert.deepEqual(hybrid.search('',{limit:5}).results,[]);
assert.equal(hybrid.search(queries[0],{eligibleSceneIds:['S078'],limit:500}).results.every(x=>x.sceneId==='S078'),true);
assert.equal(hybrid.search(queries[0],{eligibleSceneIds:[],limit:500}).results.length,0);
assert.notEqual(catalog.scenes.S155.name,undefined);
assert.notEqual(catalog.scenes.S494.name,undefined);
const fallback=await loadScene500WithChineseLexicon({
 catalog,lexiconUrl:'invalid.json',associationUrl:'invalid-associations.json',
 fetchImpl:async()=>({ok:false,status:404}),timeoutMs:100
});
assert.equal(fallback.mode,'rule_fallback');
assert.deepEqual(fallback.search(queries[0],{limit:5}).results.map(x=>x.sceneId),
 rule.search(queries[0],{limit:5}).results.map(x=>x.sceneId));
console.log('SCENE500_MAIN_INTEGRATION_QA_PASS',JSON.stringify({
 terms:20000,links:3553,scenes:500,queries:queries.length,bus
}));
