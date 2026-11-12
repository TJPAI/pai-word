import assert from 'node:assert/strict';
import {loadInputs,csv} from '../scene1341-isolated-search.mjs';
import {buildCatalog,negatedSpans} from '../scene1341-search-core.mjs';
import fs from 'node:fs';
import path from 'node:path';
const [catalog,dir,commit,blob]=process.argv.slice(2);
assert.deepEqual(negatedSpans('不是搬家只是整理卧室'),['搬家']);
assert.deepEqual(negatedSpans('不是整理房间，而是洗衣与晾晒'),['整理房间']);
assert.deepEqual(negatedSpans('not hotel check in, but taxi'),['hotel check in']);
assert.deepEqual(negatedSpans('wake up 醒来'),[]);

const index=loadInputs(catalog,dir,{sourceCommit:commit,manifestSha:blob});
// Browser-safe pure core must reproduce the Node loader's ranking byte-for-byte.
const browserCore=buildCatalog(fs.readFileSync(catalog,'utf8'),Array.from({length:11},(_,i)=>fs.readFileSync(path.join(dir,'v'+(51+i)+'-ranked.csv'),'utf8')),{sourceCommit:commit,manifestSha:blob});
for(const q of ['醒来 wake up','不是搬家，只是整理卧室','酒店入住 hotel check in','食物会不会过期']){
 assert.deepEqual(browserCore.search(q),index.search(q),'browser-vs-Node core mismatch: '+q);
}
// Precomputed normalization must not change deterministic results over representative queries.
const cacheParityQueries=[
 '起床与晨间准备','洗漱与个人清洁','整理房间','wake up','洗衣与晾晒',
 '早上 wake up 之后洗漱','hotel 预订入住','我想找 nearby coffee',
 '机场 check in','地铁停运 take taxi','我不是搬家，只是整理卧室',
 '不是搬家只是整理卧室','不是整理房间，而是洗衣与晾晒',
 'not hotel check in, but taxi','刚下单的外卖什么时候送达',
 '食物会不会过期','takeaway 外卖送到哪儿了','SC50-1341'
];
for(const q of cacheParityQueries){
 assert.deepEqual(index.search(q),browserCore.search(q), 'normalized cache parity: '+q);
}
assert.deepEqual(negatedSpans('notebook and notes'),[],'not in notebook is not negation');
// The editorial catalog is a canonical contiguous 1..1341 identity set, not merely 1341 well-formed rows.
{
 const catalogRows=csv(fs.readFileSync(catalog,'utf8'));
 const originalIds=new Set(catalogRows.map(r=>r.id));
 assert.equal(originalIds.size,1341);
 for(let id=1;id<=1341;id++)assert.ok(originalIds.has('SC50-'+String(id).padStart(4,'0')));
 const mutated=catalogRows.map(r=>({...r}));
 mutated[mutated.length-1].id='SC50-9999';
 const columns=Object.keys(mutated[0]);
 const quote=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
 const tampered=[columns.join(','),...mutated.map(row=>columns.map(k=>quote(row[k])).join(','))].join(String.fromCharCode(10))+String.fromCharCode(10);
 const ranked=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(dir,'v'+(51+i)+'-ranked.csv'),'utf8'));
 assert.throws(()=>buildCatalog(tampered,ranked,{sourceCommit:commit,manifestSha:blob}),/INVALID_SCENE_ID|MISSING_CANONICAL_SCENE/);
}
// Reject numeric-equivalent duplicate ranks (e.g., 1 vs 01) even when source strings differ.
// Work on a copied authentic shard; frozen source CSVs remain unchanged.
{
 const shards=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(dir,'v'+(51+i)+'-ranked.csv'),'utf8'));
 let mutated=false;
 for(let shard=0;shard<shards.length&&!mutated;shard++){
   const rows=csv(shards[shard]),seen=new Map();
   for(const row of rows){
     const previous=seen.get(row.scene_id);
     if(previous){
       row.rank='0'+previous.rank;
       const cols=Object.keys(rows[0]);
       const quote=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
       shards[shard]=[cols.join(','),...rows.map(r=>cols.map(k=>quote(r[k])).join(','))].join('\n')+'\n';
       mutated=true;break;
     }
     seen.set(row.scene_id,row);
   }
 }
 assert.ok(mutated,'source needs two ranked expressions in one scene');
 assert.throws(()=>buildCatalog(fs.readFileSync(catalog,'utf8'),shards,{sourceCommit:commit,manifestSha:blob}),/DUPLICATE_OR_BAD_RANK/);
}
// Enforce canonical ASCII positive-decimal rank identity in authentic source copies.
// Each invalid encoding must fail even without colliding with another source rank.
{
 const valid=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(dir,'v'+(51+i)+'-ranked.csv'),'utf8'));
 const catalogText=fs.readFileSync(catalog,'utf8');
 const rows=csv(valid[0]),columns=Object.keys(rows[0]);
 const firstRank=rows[0].rank;
 assert.match(firstRank,/^[1-9][0-9]*$/,'original source should use canonical ranks');
 const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 for(const invalid of ['0'+firstRank,firstRank+'.0','1e2','0x10','9007199254740993','+1','-1',' 1 ','1_000','1.5','Infinity']){
   rows[0].rank=invalid;
   const shard=[columns.join(','),...rows.map(row=>columns.map(k=>quote(row[k])).join(','))].join(String.fromCharCode(10))+String.fromCharCode(10);
   const changed=[shard,...valid.slice(1)];
   assert.throws(()=>buildCatalog(catalogText,changed,{sourceCommit:commit,manifestSha:blob}),/DUPLICATE_OR_BAD_RANK/, 'invalid rank encoding '+invalid);
 }
}
// Blank scene titles/categories in an otherwise count-valid authentic catalog must fail closed.
{
 const rows=csv(fs.readFileSync(catalog,'utf8'));
 const cols=Object.keys(rows[0]);
 const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const ranked=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(dir,'v'+(51+i)+'-ranked.csv'),'utf8'));
 const make=()=>[cols.join(','),...rows.map(r=>cols.map(k=>quote(r[k])).join(','))].join('\n')+'\n';
 const sample=rows.find(r=>r.id==='SC50-1341');
 assert.ok(sample,'source scene 1341 missing');
 for(const key of [sample.revised_name?.trim()?'revised_name':'name','category']){
  const original=sample[key];sample[key]=' ';
  assert.throws(()=>buildCatalog(make(),ranked,{sourceCommit:commit,manifestSha:blob}),/EMPTY_SCENE_METADATA/,'blank '+key+' must fail');
  sample[key]=original;
 }
}
assert.equal(index.sceneCount,1341);assert.equal(index.rankedSceneCount,110);assert.equal(index.expressionCount,19371);assert.equal(index.certifiedCount,0);assert.equal(index.release_allowed,false);
const queries=[
 ['起床与晨间准备','SC50-0001'],
 ['洗漱与个人清洁','SC50-0002'],
 ['整理房间','SC50-0004'],
 ['wake up','SC50-0001'],
 ['洗衣与晾晒','SC50-0006']
];
for(const [q,id] of queries){const got=index.search(q);assert.equal(got[0]?.scene_id,id,JSON.stringify({q,top:got.slice(0,3)}));assert.deepEqual(got,index.search(q));assert.ok(got.length<=10);assert.equal(got[0].release_status,'BLOCKED_PENDING_CG_QA_AND_MUSE');}
const mixed=['早上 wake up 之后洗漱','hotel 预订入住','我想找 nearby coffee','机场 check in','地铁停运 take taxi','我不是搬家，只是整理卧室'];
const diagnostic=mixed.map(query=>({query,top5:index.search(query).slice(0,5).map(x=>({scene_id:x.scene_id,score:x.score,has_ranked_data:x.has_ranked_data,explanations:x.explanations}))}));
for(const d of diagnostic){assert.ok(d.top5.length<=5);assert.equal(new Set(d.top5.map(x=>x.scene_id)).size,d.top5.length);}
// Regression: negated scene titles must be downweighted, not treated as positive intent.
const negativeDiagnostics=[
 '不是搬家，只是整理卧室',
 '不是搬家只是整理卧室',
 '不是整理房间，只是洗衣与晾晒',
 'not hotel check in, instead of that I need a taxi'
];
for(const query of negativeDiagnostics){
 const results=index.search(query,{limit:10});
 assert.ok(results.length>0,JSON.stringify({query,results}));
 assert.deepEqual(results,index.search(query,{limit:10}));
 assert.equal(new Set(results.map(x=>x.scene_id)).size,results.length);
}
// A negated full scene title cannot receive the strong affirmative title-phrase boost.
for(const query of ['不是整理房间，而是洗衣与晾晒','不是整理房间只是洗衣与晾晒']){
 const negated=index.search(query).find(x=>x.scene_id==='SC50-0004');
 assert.ok(!negated?.explanations.includes('scene_title_phrase'),JSON.stringify({query,negated}));
}
// A negative query referencing a delivered scene must never be treated as certification.
for(const result of index.search('不是整理房间，只是洗衣与晾晒')){
 assert.equal(result.release_status,'BLOCKED_PENDING_CG_QA_AND_MUSE');
 assert.equal(result.muse_recheck_required,true);
}
const notDelivered=index.search('SC50-1341')[0];assert.equal(notDelivered.scene_id,'SC50-1341');assert.equal(notDelivered.has_ranked_data,false);assert.equal(notDelivered.ranked_records,0);
// Experiments must be opt-in, source anchored and never mutate baseline results.
const missed=[
 {q:'刚下单的外卖什么时候送达',expected:'SC50-0037',anchor:'SC50-0037-0017'},
 {q:'食物会不会过期',expected:'SC50-0042',anchor:'SC50-0042-0020'},
 {q:'takeaway 外卖送到哪儿了',expected:'SC50-0037',anchor:'SC50-0037-0017'}
];
for(const c of missed){
 const baseline=index.search(c.q,{limit:10});
 const optin=index.search(c.q,{limit:10,experimentalIntentAliases:true});
 assert.ok(optin.some(x=>x.scene_id===c.expected&&x.explanations.some(e=>e.includes('EXPERIMENTAL_UNCERTIFIED_INTENT')&&e.includes(c.anchor))),JSON.stringify(c));
 assert.deepEqual(index.search(c.q,{limit:10}),baseline,'baseline must remain identical after experiments');
 assert.equal(optin[0].release_status,'BLOCKED_PENDING_CG_QA_AND_MUSE');
}
const noLeak=index.search('我要买外卖，但还没下单',{experimentalIntentAliases:true});
assert.ok(!noLeak.some(x=>x.explanations.some(e=>e.startsWith('EXPERIMENTAL_UNCERTIFIED_INTENT'))));
assert.deepEqual(csv('one,two\na,"b,c"\n'),[{one:'a',two:'b,c'}]);
assert.throws(()=>loadInputs(catalog,dir,{sourceCommit:'unversioned',manifestSha:blob}),/PINNED_SOURCE/);
const experimentalCaseComparisons=missed.map(c=>({query:c.q,provisional_target:c.expected,baseline_top10:index.search(c.q,{limit:10}).map(x=>x.scene_id),optin_top10:index.search(c.q,{limit:10,experimentalIntentAliases:true}).map(x=>x.scene_id),review_status:'UNADJUDICATED_EXPERIMENT_ONLY'}));
console.log(JSON.stringify({experimentalCaseComparisons,status:'PASS_ISOLATED_STRUCTURE_AND_SMOKE',gold_labels:'PROVISIONAL_NON_BLIND',source_commit:commit,manifest_blob:blob,scenes:index.sceneCount,ranked_scenes:index.rankedSceneCount,ranked_expressions:index.expressionCount,independent_certified:0,release_allowed:false,smoke_query_count:queries.length,mixed_diagnostic_count:diagnostic.length,diagnostic},null,2));
