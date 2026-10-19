// Core20K Rebuild V1: read-only baseline manifest and identity preflight.
// Usage: node scripts/rebuild-v1-preflight.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const file=p=>fs.readFileSync(p);
const json=p=>JSON.parse(file(p).toString('utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
const base=json('data/learning-v3/manifest.json');
const v25=json('data/core13000-v25.5/manifest.json');
const overlap=json('data/core20k-final-v206/scene500-v40-intersection-audit.json');
assert.equal(base.wordCount,13000);
assert.equal(base.kuCount,16616);
assert.equal(base.chunkSize,250);
assert.equal(v25.word_count,13000);
assert.equal(overlap.coverage['100'].total_hits,49931);
assert.equal(overlap.coverage['100'].total_slots,50000);
const packed=file('data/core20k-runtime.json.gz');
const core=JSON.parse(gunzipSync(packed).toString('utf8'));
assert.equal(core.schema,'pai-core20k-runtime-v1');
assert.equal(core.headwords.length,20000);
const lemmas=new Set(),kus=new Set();let playable=0;
for(let i=0;i<core.headwords.length;i++){
 const [rank,lemma,_pos,_ipa,units]=core.headwords[i];
 assert.equal(rank,i+1);
 assert(lemma&&typeof lemma==='string');
 const normalized=lemma.toLowerCase();
 assert(!lemmas.has(normalized),'duplicate Core20K lemma: '+normalized);
 lemmas.add(normalized);
 for(const [id,type,zh,_en,eligible]of units){
  assert(!kus.has(id),'duplicate KU: '+id);kus.add(id);
  if(type==='sense'&&eligible===true&&String(zh||'').trim())playable++;
 }
}
assert(playable>=12000);
for(const entry of [base.catalog,...base.chunks]){
 const p='data/learning-v3/'+entry.file;
 const bytes=file(p).toString('utf8').trim();
 assert.equal(Buffer.byteLength(bytes),entry.bytes,p+' encoded length');
 assert.equal(sha(bytes),entry.sha256,p+' digest');
}
const report={
 schema:'pai-core20k-rebuild-v1-preflight-report',
 baseline:{manifest:'data/learning-v3/manifest.json',release:base.release,headwords:base.wordCount,kus:base.kuCount,chunkSize:base.chunkSize},
 frozen20k:{path:'data/core20k-runtime.json.gz',sha256:sha(packed),headwords:core.headwords.length,kuIds:kus.size,playableSense:playable},
 scenes:{rankSource:overlap.sceneRank,top100Intersection:49931,top100Positions:50000},
 status:'INPUT_CONTRACT_PASS',
 caveat:'Input contract only. Does not demonstrate rich-content preservation or runtime/UI equivalence.'
};
fs.mkdirSync('audit-output',{recursive:true});
fs.writeFileSync('audit-output/core20k-rebuild-v1-preflight.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
