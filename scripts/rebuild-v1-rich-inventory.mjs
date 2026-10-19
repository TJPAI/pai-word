// Core20K Rebuild V1: build a NON-PUBLISHABLE legacy-rich-content inventory.
// Inputs are V26.7I sanitized 13K word chunks + frozen Core20K runtime.
// Never overwrite core data or claim dictionary validation on this path.
// Usage: node scripts/rebuild-v1-rich-inventory.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {classifyLegacyRich} from './rich-migration-policy.mjs';
import {gunzipSync} from 'node:zlib';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const outDir='audit-output';fs.mkdirSync(outDir,{recursive:true});
const m=json('data/learning-v3/manifest.json');
const decode=p=>JSON.parse(gunzipSync(Buffer.from(fs.readFileSync('data/learning-v3/'+p,'utf8').trim(),'base64')).toString('utf8'));
const catalog=decode(m.catalog.file);
const chunks=m.chunks.flatMap(c=>decode(c.file));
const payload=JSON.parse(gunzipSync(fs.readFileSync('data/core20k-runtime.json.gz')).toString('utf8'));
assert.equal(catalog.length,13000);assert.equal(payload.headwords.length,20000);
const target=new Map(),coreKU=new Map();
for(const row of payload.headwords){
 const [rank,lemma,_pos,_ipa,kus]=row;
 target.set(lemma.toLowerCase(),{lemma,rank,kus});
 for(const ku of kus){if(coreKU.has(ku[0]))throw Error('duplicate target KU');coreKU.set(ku[0],{lemma,id:ku[0],type:ku[1],zh:ku[2]});}
}
const oldCatalog=new Map();
for(const [rank,lemma,_pos,senses] of catalog){
 const lower=lemma.toLowerCase();
 const list=oldCatalog.get(lower)||[];list.push({rank,lemma,senses});oldCatalog.set(lower,list);
}
const counters={legacyRecords:catalog.length,legacyDistinctLemmas:oldCatalog.size,newHeadwords:target.size,chunkRecords:chunks.length,matchedWordRecords:0,orphanWordRecords:0,missingKURecords:0,matchedKURecords:0,collisions:0,richCandidateKUs:0};
const changes=[],collisions=[],missing=[];
for(const full of chunks){
 const lemma=String(full.w||'').toLowerCase();
 const hit=target.get(lemma);
 const legacy=oldCatalog.get(lemma)||[];
 if(legacy.length>1){collisions.push({lemma,legacyRanks:legacy.map(l=>l.rank)});counters.collisions++;continue;}
 if(!hit){counters.orphanWordRecords++;missing.push({lemma,reason:'lemma_not_in_core20k'});continue;}
 counters.matchedWordRecords++;
 for(const [id,s] of Object.entries(full.s||{})){
  const ref=coreKU.get(id);
  if(!ref||ref.lemma.toLowerCase()!==lemma){counters.missingKURecords++;missing.push({lemma,id,reason:'ku_identity_or_lemma_mismatch'});continue;}
  counters.matchedKURecords++;
  const rich=full.rich?.[id]||{};
  const e=Array.isArray(rich.e)?rich.e:(Array.isArray(s.e)?s.e:[]),c=rich.c??s.c??'',x=rich.x??s.x??'';
  const legacyKU=legacy[0]?.senses?.find(row=>row[0]===id);
  const verdict=classifyLegacyRich({lemma,legacyMatches:legacy.length,targetWord:hit,
   oldKU:legacyKU?{id,lemma,type:legacyKU[2]}:null,
   targetKU:{id,lemma:ref.lemma,type:ref.type},rich:{e,c,x}});
  if(verdict.status==='quarantine_ku_identity'){counters.missingKURecords++;missing.push({lemma,id,reason:'ku_type_mismatch'});continue;}
  if(verdict.status==='empty_rich_content')continue;
  assert.equal(verdict.status,'review_required','unexpected rich migration status');
  counters.richCandidateKUs++;
  changes.push({ku_id:id,lemma,legacy_rank:legacy[0]?.rank,examples:e,collocations:c,usage:x,
   evidence_status:'legacy_sanitized_not_independently_dictionary_verified',
   eligibility:'review_required',publishable:false});
 }
}
const report={schema:'pai-core20k-v1-rich-content-inventory',counters,collisionLemmas:[...new Set(collisions.map(x=>x.lemma))],missingIdentityExamples:missing.slice(0,100),source:'Core-13000 V26.7I sanitized runtime chunks',publicationAllowed:false,limitations:['Rich-content presence is not proof of source verification','Duplicate-lemma records are deliberately quarantined','No Core20K runtime files changed']};
fs.writeFileSync(outDir+'/core20k-v1-rich-inventory-report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(outDir+'/core20k-v1-rich-review-candidates.json',JSON.stringify({schema:'pai-core20k-v1-rich-review-queue',items:changes},null,2)+'\n');
console.log(JSON.stringify(report,null,2));
