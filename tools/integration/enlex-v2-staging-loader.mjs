// Read-only offline loader. Explicit source root required; no production runtime writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function inspectFrozenEnlexV2({root,manifestRelativePath,expectedCommit,includeRows=false}){
 if(typeof root!=='string'||!root||typeof manifestRelativePath!=='string'||!manifestRelativePath)throw Error('ENLEX_V2_SOURCE_REQUIRED');
 if(!/^[0-9a-f]{40}$/.test(expectedCommit||''))throw Error('ENLEX_V2_COMMIT_REQUIRED');
 const canonical=fs.realpathSync(root);
 const safeRead=(relative)=>{
  if(path.isAbsolute(relative)||relative.split(/[\\/]/).some(x=>x==='..'))throw Error('ENLEX_V2_UNSAFE_PATH');
  const actual=fs.realpathSync(path.join(canonical,relative));
  if(!actual.startsWith(canonical+path.sep))throw Error('ENLEX_V2_PATH_ESCAPE');
  return fs.readFileSync(actual);
 };
 const manifest=JSON.parse(safeRead(manifestRelativePath).toString('utf8'));
 if(manifest.status!=='INTEGRATION_SNAPSHOT_FROZEN_NOT_RELEASE_ELIGIBLE'||manifest.runtime_modified!==false||manifest.records!==27471||manifest.shards?.length!==6)throw Error('ENLEX_V2_INVALID_MANIFEST');
 if(!Array.isArray(manifest.integration_rules)||!manifest.integration_rules.length)throw Error('ENLEX_V2_MISSING_GATES');
 const result={version:manifest.version,sourceCommit:expectedCommit,records:0,shards:0,semanticReview:0,questionRebuild:0,stagingOnly:true,productionEligible:false};
 const candidateRows=[];
 const seen=new Set();
 for(const shard of manifest.shards){
  if(seen.has(shard.path))throw Error('ENLEX_V2_DUPLICATE_SHARD');
  seen.add(shard.path);
  const raw=safeRead(shard.path);
  const gitBlob=crypto.createHash('sha1').update('blob '+raw.length+'\0').update(raw).digest('hex');
  if(gitBlob!==shard.blob_sha)throw Error('ENLEX_V2_SHARD_DRIFT');
  for(const text of raw.toString('utf8').split(/\\r?\\n/)){
   if(!text.trim())continue;
   const row=JSON.parse(text);
   result.records++;
   if(row.v2_needs_semantic_review===true)result.semanticReview++;
   if(row.question_requires_rebuild===true)result.questionRebuild++;
   if(includeRows)candidateRows.push(row);
  }
  result.shards++;
 }
 if(result.records!==manifest.records)throw Error('ENLEX_V2_COUNT_MISMATCH');
 return Object.freeze(includeRows?{...result,candidateRows:Object.freeze(candidateRows)}:result);
}
