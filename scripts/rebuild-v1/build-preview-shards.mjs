// Build an isolated, non-publishable 20K preview with 250-word gzip shards.
// node scripts/rebuild-v1/build-preview-shards.mjs <bundle.gz> <output-dir>
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [source,out]=process.argv.slice(2);assert(source&&out,'Requires source and output dir');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const input=fs.readFileSync(source),data=JSON.parse(zlib.gunzipSync(input));
assert.equal(data.schema,'pai-core20k-rebuild-v1-candidate-bundle');
assert.equal(data.publishable,false);
const words=data.core20k.headwords,legacy=new Map(data.legacy_rich_by_target_rank.map(w=>[w.target_rank,w]));
assert.equal(words.length,20000);assert.equal(legacy.size,12990);
fs.mkdirSync(out,{recursive:true});
let richWords=0,richKUs=0,examples=0;const chunks=[];
for(let start=0;start<words.length;start+=250){
 const rows=words.slice(start,start+250).map((w,i)=>{
  const [rank,lemma,pos,ipa,units]=w;assert.equal(rank,start+i+1);
  const r=legacy.get(rank);
  if(r){assert.equal(r.lemma.toLowerCase(),lemma.toLowerCase());richWords++;
   const byId=new Map(units.map(k=>[k[0],k]));
   for(const ku of r.legacy.knowledge_units){assert.equal(byId.get(ku.id)?.[1],ku.type);richKUs++;}
   examples+=(r.legacy.examples||[]).length;
   assert.equal(r.quality.release_eligible,false);assert.equal(r.quality.dictionary_verified,false);
  }
  return {rank,lemma,pos,ipa,units,legacy:r?.legacy||null,legacy_quality:r?.quality||null};
 });
 const b=zlib.gzipSync(Buffer.from(JSON.stringify({schema:'pai-core20k-preview-shard-v1',publishable:false,rows})),{level:7});
 const file='words-'+String(start/250+1).padStart(2,'0')+'.json.gz';
 fs.writeFileSync(path.join(out,file),b);
 chunks.push({file,firstRank:start+1,lastRank:start+rows.length,words:rows.length,bytes:b.length,sha256:hash(b),richWords:rows.filter(x=>x.legacy).length});
}
const manifest={schema:'pai-core20k-preview-shards-manifest-v1',publishable:false,sourceSha256:hash(input),totalWords:words.length,richWords,richKUs,legacyExamples:examples,chunkSize:250,chunks};
assert.equal(chunks.length,80);assert.equal(richWords,12990);assert.equal(richKUs,16574);assert.equal(examples,38970);
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
let verified=0;
for(const c of chunks){const b=fs.readFileSync(path.join(out,c.file));assert.equal(b.length,c.bytes);assert.equal(hash(b),c.sha256);
 const shard=JSON.parse(zlib.gunzipSync(b));assert.equal(shard.publishable,false);assert.equal(shard.rows.length,250);
 for(const row of shard.rows){assert.equal(row.rank,++verified);if(row.legacy)assert.equal(row.legacy_quality.release_eligible,false);}
}
assert.equal(verified,20000);
console.log(JSON.stringify({result:'PASS_NON_PUBLISHABLE',shards:chunks.length,words:verified,richWords,richKUs,examples}));
