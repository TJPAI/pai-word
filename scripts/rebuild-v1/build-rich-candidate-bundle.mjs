// Reproducible NON-PUBLISHABLE Core20K + Core13K rich-sidecar bundle.
// node scripts/rebuild-v1/build-rich-candidate-bundle.mjs <frozen20k.gz> <joined13k.gz> <output.gz>
import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
const [runtimePath,legacyPath,output]=process.argv.slice(2);
assert(runtimePath&&legacyPath&&output,'Explicit runtime, joined legacy and output paths required');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>{const b=fs.readFileSync(p);return {digest:sha(b),data:JSON.parse(zlib.gunzipSync(b))}};
const runtime=read(runtimePath),legacy=read(legacyPath);
assert.equal(runtime.data.schema,'pai-core20k-runtime-v1');
assert.equal(runtime.data.headwords.length,20000);
assert.equal(legacy.data.items.length,12990);
const words=new Map(runtime.data.headwords.map(w=>[w[1].toLowerCase(),w]));
assert.equal(words.size,20000);
const rich=[],seen=new Set(),kuIDs=new Set();let totalKU=0;
const counts={examples:0,collocations:0,usage_notes:0,grammar_patterns:0,synonym_contrasts:0,word_family:0};
for(const word of legacy.data.items){
 const key=word.lemma.toLowerCase(),target=words.get(key);
 assert(target&&target[0]===word.target_rank,'Target identity mismatch '+word.lemma);
 assert(!seen.has(key),'Ambiguous lemma '+word.lemma);seen.add(key);
 const indexed=new Map(target[4].map(ku=>[ku[0],ku]));
 for(const ku of word.knowledge_units){
  const item=indexed.get(ku.id);
  assert(item&&item[1]===ku.type,'KU type or ID mismatch '+ku.id);
  assert(!kuIDs.has(ku.id),'Duplicate KU '+ku.id);kuIDs.add(ku.id);totalKU++;
 }
 for(const f of Object.keys(counts))counts[f]+=word[f]?.length||0;
 assert.equal(word.status,'candidate_not_editorially_approved');
 const fields=['rank','senses','knowledge_units',...Object.keys(counts),'provenance','content_status'];
 rich.push({target_rank:target[0],source_word_id:word.id,lemma:word.lemma,
  legacy:Object.fromEntries(fields.map(k=>[k,word[k]])),
  quality:{dictionary_verified:false,editorial_approved_for_release:false,release_eligible:false,state:'preserved_legacy_candidate_requires_review'}});
}
assert.equal(totalKU,16574);
assert.equal(counts.examples,38970);
assert.equal(counts.collocations,38958);
assert.equal(counts.usage_notes,6182);
const bundle={schema:'pai-core20k-rebuild-v1-candidate-bundle',publishable:false,
 input_hashes:{frozen_core20k_gzip_sha256:runtime.digest,joined_legacy_gzip_sha256:legacy.digest},
 core20k:runtime.data,legacy_rich_by_target_rank:rich,
 migration_policy:{legacy_assets:'candidate_only_not_auto-approved',non_sense_ku:'never_auto_coerced_to_sense'}};
const gz=zlib.gzipSync(Buffer.from(JSON.stringify(bundle)),{level:7});
fs.writeFileSync(output,gz);
const validated=JSON.parse(zlib.gunzipSync(fs.readFileSync(output)).toString());
assert.equal(validated.publishable,false);
assert.equal(validated.legacy_rich_by_target_rank.length,12990);
assert(validated.legacy_rich_by_target_rank.every(w=>w.quality.release_eligible===false));
console.log(JSON.stringify({status:'PASS_STRUCTURAL_CANDIDATE_ONLY',headwords:20000,matchedWords:rich.length,matchedKU:totalKU,counts,bytes:gz.length,sha256:sha(gz)}));
