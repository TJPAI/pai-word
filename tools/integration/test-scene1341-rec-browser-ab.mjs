import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createScene1341HomeCatalog} from '../../rebuild-preview/scene1341-home-adapter.mjs';
import {createRankedStore} from '../../rebuild-preview/scene1341-ranked-preview.mjs';

const local=async url=>new Response(await fs.readFile(fileURLToPath(url)),{status:200});
const ranked=createRankedStore({fetchImpl:local,base:new URL('./scene1341-ranked/',import.meta.url)});
const adapter=createScene1341HomeCatalog({fetchImpl:local,ranked});
const catalog=await adapter.initialize();
assert.equal(catalog.scenes.length,1341);
assert.equal(adapter.canCreateStudyQueue,false);
assert.equal(adapter.canWriteSrs,false);
assert.equal(adapter.releaseEligible,false);
const examples=['oversleep','睡过头','wake up 醒来','SC50-0037','不要外卖，想知道订单状态'];
const cases=[];
for(const query of examples){
  const ab=await adapter.compareSearch(query,{limit:10});
  assert.equal(ab.source,'VERIFIED_V51_V61_19371');
  assert.equal(ab.certified,false);
  assert.equal(ab.releaseAllowed,false);
  assert.equal(ab.canCreateStudyQueue,false);
  assert.equal(ab.canWriteSrs,false);
  for(const key of ['current','candidate']){
    assert.equal(new Set(ab[key].map(x=>x.id)).size,ab[key].length);
    assert(ab[key].length<=10);
    assert(ab[key].every(x=>x.production_release_allowed===false));
    assert(ab[key].every(x=>x.studyStatus==='KU_NOT_CONNECTED'));
  }
  assert(ab.candidate.every(x=>x.cg_qa==='NOT_REVIEWED_FOR_THIS_INDEX'));
  assert(ab.candidate.every(x=>x.release_status==='BLOCKED_PENDING_CG_QA_AND_MUSE'));
  assert(ab.candidate.every(x=>x.searchEvidence==='CG_REC_LEXICAL_UNCERTIFIED'));
  assert(ab.candidate.every(x=>x.provenance.source_commit==='17c6c758e1dfd27cfa2fe1669d3f1784bedb0668'));
  assert(ab.candidate.every(x=>x.provenance.ranked_manifest_blob==='803d2fccfd2d1ec200723f7f38e73d57495a5dd0'));
  cases.push({query,existingTop1:ab.current[0]?.id??null,recTop1:ab.candidate[0]?.id??null,overlap:ab.overlap});
}
// Neither a tampered manifest nor a tampered index may supply trusted shard hashes.
for(const poisoned of ['manifest.json','index.json']){
  const tamper=async url=>{
    const bytes=await fs.readFile(fileURLToPath(url));
    const payload=url.pathname.endsWith('/'+poisoned)?Buffer.concat([bytes,Buffer.from(' ')]):bytes;
    return new Response(payload,{status:200});
  };
  const badStore=createRankedStore({fetchImpl:tamper,base:new URL('./scene1341-ranked/',import.meta.url)});
  await assert.rejects(()=>badStore.initialize(),/RANKED_SOURCE_BLOB_MISMATCH/);
}
await assert.rejects(()=>adapter.compareSearch('wake up',{limit:11}),/SCENE1341_REC_AB_LIMIT_INVALID/);
assert.deepEqual(await adapter.searchWithRecEngine(''),[]);
assert((await adapter.search('oversleep')).length>0,'Existing browser default must remain usable');
console.log(JSON.stringify({status:'PASS',mode:'OPT_IN_AB_ONLY',candidateSource:'EXACT_CG_REC_BROWSER_CORE',catalog:1341,rankedScenes:110,expressions:19371,production:false,srs:false,cases},null,2));
