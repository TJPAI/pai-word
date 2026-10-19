// Real-data, read-only cross-join regression for frozen Core20K and Core13K rich candidates.
// node scripts/rebuild-v1/test-real-rich-join.mjs <Core20K_Runtime_Unified_20000.json.gz> <core20k_joined_rich_candidates_v2.json.gz>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const [runtimePath,joinPath]=process.argv.slice(2);
assert(runtimePath&&joinPath,'Two explicit input paths required');
const parse=p=>JSON.parse(gunzipSync(fs.readFileSync(p)).toString('utf8'));
const runtime=parse(runtimePath),joined=parse(joinPath);
assert.equal(runtime.headwords.length,20000);
assert.equal(joined.items.length,12990);
const words=new Map(),ids=new Set();
for(const row of runtime.headwords){
 const [rank,lemma,,,,]=row;assert(!words.has(lemma.toLowerCase()));words.set(lemma.toLowerCase(),row);
 for(const ku of row[4]){assert(!ids.has(ku[0]),'duplicate target KU '+ku[0]);ids.add(ku[0]);}
}
const seen=new Set(),legacyTypes={};let kuCount=0,examples=0,collocations=0,usage=0;
for(const w of joined.items){
 assert(!seen.has(w.id),'duplicate legacy word '+w.id);seen.add(w.id);
 const target=words.get(w.lemma.toLowerCase());
 assert(target,'missing lemma '+w.lemma);assert.equal(target[0],w.target_rank,'rank mismatch '+w.lemma);
 const targetKus=new Map(target[4].map(k=>[k[0],k]));
 for(const ku of w.knowledge_units){
  const ref=targetKus.get(ku.id);
  assert(ref,'missing KU '+ku.id);
  assert.equal(ref[1],ku.type,'KU type mismatch '+ku.id);
  legacyTypes[ku.type]=(legacyTypes[ku.type]||0)+1;kuCount++;
 }
 examples+=(w.examples||[]).length;collocations+=(w.collocations||[]).length;usage+=(w.usage_notes||[]).length;
 assert.equal(w.status,'joined_candidate_review_required','not a releasable record');
}
assert.equal(kuCount,16574);assert.equal(examples,38970);assert.equal(collocations,38958);assert.equal(usage,6182);
console.log(JSON.stringify({result:'PASS_STRUCTURAL_ONLY',words:seen.size,kuCount,examples,collocations,usage,legacyTypes,notReleaseCertified:true}));
