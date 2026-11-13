#!/usr/bin/env node
// Preserve existing KU identity; adapt author source requirements to the Kaikki IPA extractor.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const [inputPath, outputPath, expectedArg='1778']=process.argv.slice(2);
if(!inputPath||!outputPath||!/^[1-9][0-9]*$/.test(expectedArg)){
  console.error('Usage: node prepare-scene1341-ipa-targets.mjs <author-request.json> <targets.json> [expected_count=1778]');
  process.exit(2);
}
const src=fs.readFileSync(inputPath);
const root=JSON.parse(src.toString('utf8'));
const records=root.records;
const expected=Number(expectedArg);
if(!Array.isArray(records)||records.length!==expected)throw Error('SOURCE_COUNT_MISMATCH');
if(root.schema!=='cg-enteach-v51-qa1778-kaikki-ipa-author-request-v1')throw Error('UNRECOGNIZED_SOURCE_SCHEMA');
const norm=s=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const ids=new Set(), expressions=new Set(), targets=[];
for(const r of records){
  if(!r.scene_ku_id||!r.scene_id||!r.source_sense_id||!r.expression||
     typeof r.expression!=='string'||ids.has(r.scene_ku_id))throw Error('INVALID_OR_DUPLICATE_KU_ID');
  if(r.master_approved!==false||r.release_allowed!==false)throw Error('UNEXPECTED_SOURCE_AUTHORIZATION');
  ids.add(r.scene_ku_id);
  expressions.add(norm(r.expression));
  targets.push({id:r.scene_ku_id,expression:r.expression,
    scene_id:r.scene_id,source_sense_id:r.source_sense_id,
    source_rank:r.source_rank,source_qa_blob:r.source_qa_blob,
    source_pack_blob:r.source_pack_blob});
}
const authorSha=crypto.createHash('sha256').update(src).digest('hex');
const result={
  schema:'cg-enlex-scene1341-kaikki-ipa-targets-v1',
  source_author_schema:root.schema,
  source_author_file_sha256:authorSha,
  source_author_git_blob:'4b5651ad5d49cddc9dfabf64571440ecde317681',
  source_qa_manifest_blob:root.source_qa_manifest?.blob??null,
  unique_ku_ids:ids.size,unique_normalized_expressions:expressions.size,
  source_kaikki_drive_file_id:root.source_kaikki_drive_file_id??null,
  policy:'source-target-identity-only; Kaikki matching and pronunciation QA not yet performed',
  master_approved:false,muse_certified:false,release_allowed:false,
  targets
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({targets:ids.size,uniqueExpressions:expressions.size,authorSha,releaseAllowed:false}));
