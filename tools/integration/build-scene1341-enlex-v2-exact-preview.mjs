/* OFFLINE, source-pinned read-only lexicon projection for Scene1341.
 * Combines EXACT lemma matches only. No guessing Sense identity, rewriting
 * QA authors' meanings, publishing English quizzes or production SRS mutation.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const qaRoot=path.resolve(process.env.SCENE1341_QA_SOURCE_DIR||'qa-source');
const lexRoot=path.resolve(process.env.SCENE1341_ENLEX_SOURCE_DIR||'enlex-source');
const qaPrefix='tools/core20k_lexicon/qa/';
const lexPrefix='tools/core20k_lexicon/production_v3/qa_reports/cg_enlex_mu_integrated_v2/full_pack/';
const qaManifestPath=qaPrefix+'CG_QA_SCENE1341_V51_STAGING_ANSWER_PROVISIONAL_1778_MANIFEST_20261112.v2.json';
const lexManifestPath=lexPrefix+'V2_INTEGRATION_FREEZE_20261102.json';
const shaBlob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
function readPinned(root,file,blob){
 if(!/^[a-f0-9]{40}$/.test(blob||''))throw Error('INVALID_PIN');
 const raw=fs.readFileSync(path.join(root,file));
 if(shaBlob(raw)!==blob)throw Error('PINNED_SHA_MISMATCH_'+file);
 return raw.toString('utf8');
}
const qaManifest=JSON.parse(readPinned(qaRoot,qaManifestPath,'f8967fb97573bbccd89b4c645303dd2c983bb1da'));
const lexManifest=JSON.parse(readPinned(lexRoot,lexManifestPath,'30fbd1fdde9d7ee59bc88da6465bbd9b772511a8'));
if(qaManifest.counts?.included_cg_pass_no_known_mu_objection!==1778||
   lexManifest.records!==27471||lexManifest.shards?.length!==6)throw Error('SOURCE_MANIFEST_COUNT');
const normalize=w=>String(w||'').normalize('NFKC').toLowerCase().replace(/\s+/gu,' ').trim();
const qaExpressions=new Set();
let qaTotal=0;
for(const shard of qaManifest.shards){
 const rows=JSON.parse(readPinned(qaRoot,shard.path,shard.blob)).records;
 if(rows.length!==shard.counts.included)throw Error('QA_SHARD_COUNT');
 for(const row of rows){
  if(row.cg_qa!=='PASS'||row.production_release_allowed!==false||!row.expression)
    throw Error('QA_NOT_PROVISIONAL');
  qaExpressions.add(normalize(row.expression));qaTotal++;
 }
}
if(qaTotal!==1778)throw Error('QA_TOTAL');
const found=new Map(),seen=new Set();
let lexRows=0;
for(const shard of lexManifest.shards){
 const raw=readPinned(lexRoot,shard.path,shard.blob_sha);
 for(const line of raw.split('\n')){
  if(!line.trim())continue;
  const v=JSON.parse(line);lexRows++;
  if(!v.teaching_sense_id||!v.lemma||!v.gloss_zh||!v.gloss_en)
   throw Error('ENLEX_REQUIRED_FIELD');
  if(seen.has(v.teaching_sense_id))throw Error('ENLEX_DUPLICATE_SENSE');
  seen.add(v.teaching_sense_id);
  const key=normalize(v.lemma);
  if(!qaExpressions.has(key))continue;
  const arr=found.get(key)||[];
  arr.push({sense_id:v.teaching_sense_id,lemma:v.lemma,
   pos:v.pos||'',rank:v.rank,gloss_zh:v.gloss_zh,gloss_en:v.gloss_en});
  found.set(key,arr);
 }
}
if(lexRows!==27471||seen.size!==27471)throw Error('ENLEX_FROZEN_RECORD_COUNT');
const entries=Object.fromEntries([...found.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,arr])=>
 [key,arr.sort((a,b)=>Number(a.rank)-Number(b.rank)||a.sense_id.localeCompare(b.sense_id)).slice(0,6)]));
const out={schema:'pai-scene1341-core20k-v2-exact-lexicon-preview-v1',
status:'ISOLATED_PREVIEW_ONLY_NOT_SEMANTICALLY_CERTIFIED',
source_enlex_commit:'9a740bd3ce898cff9da778ea0af8a1c4ea07c936',
source_enlex_manifest_blob:'30fbd1fdde9d7ee59bc88da6465bbd9b772511a8',
source_qa_manifest_blob:'f8967fb97573bbccd89b4c645303dd2c983bb1da',
source_sense_count:lexRows,source_qa_ku_count:qaTotal,
unique_qa_expressions:qaExpressions.size,
exact_lemma_matches:Object.keys(entries).length,
not_released:true,can_write_srs:false,
matching_policy:'EXACT_NFKC_CASEFOLD_LEMMA_ONLY_NO_SENSE_INFERENCE',
entries};
const text=JSON.stringify(out);
if(!out.exact_lemma_matches||out.exact_lemma_matches>qaExpressions.size)throw Error('LEXICON_JOIN_INVALID');
console.log('CG_ENLEX_MATCH_SUMMARY '+JSON.stringify({
 totalSense:lexRows,qa:qaTotal,uniqueExpression:qaExpressions.size,
 exactMatched:out.exact_lemma_matches,outputBytes:Buffer.byteLength(text)}));
console.log('CG_ENLEX_JSON_BEGIN');
console.log(text);
console.log('CG_ENLEX_JSON_END');
