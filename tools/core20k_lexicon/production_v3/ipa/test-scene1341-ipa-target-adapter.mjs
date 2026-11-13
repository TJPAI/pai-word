import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'enlex-sc1341-ipa-'));
try {
 const source={schema:'cg-enteach-v51-qa1778-kaikki-ipa-author-request-v1',source_qa_manifest:{blob:'f8967fb97573bbccd89b4c645303dd2c983bb1da'},source_kaikki_drive_file_id:'1zIgVQhJGILx4ZtyF7FIB3MP37SgAi1lF',records:[
 {scene_ku_id:'SC1341-KU-00001',scene_id:'SC50-0001',source_sense_id:'SC-SENSE-00001',source_rank:1,expression:'wake up',source_qa_blob:'qa1',source_pack_blob:'pack1',master_approved:false,release_allowed:false},
 {scene_ku_id:'SC1341-KU-00002',scene_id:'SC50-0001',source_sense_id:'SC-SENSE-00002',source_rank:2,expression:'get up',source_qa_blob:'qa1',source_pack_blob:'pack1',master_approved:false,release_allowed:false}
 ]};
 const sourcePath=path.join(dir,'source.json'),targetPath=path.join(dir,'targets.json');
 fs.writeFileSync(sourcePath,JSON.stringify(source));
 const bin=new URL('./prepare-scene1341-ipa-targets.mjs',import.meta.url).pathname;
 const run=spawnSync(process.execPath,[bin,sourcePath,targetPath,'2'],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const got=JSON.parse(fs.readFileSync(targetPath,'utf8'));
 assert.equal(got.targets.length,2);assert.equal(got.unique_normalized_expressions,2);assert.equal(got.targets[0].id,'SC1341-KU-00001');assert.equal(got.targets[0].source_sense_id,'SC-SENSE-00001');assert.equal(got.release_allowed,false);
 source.records.push({...source.records[0]});fs.writeFileSync(sourcePath,JSON.stringify(source));
 const bad=spawnSync(process.execPath,[bin,sourcePath,targetPath,'3'],{encoding:'utf8'});assert.notEqual(bad.status,0);assert.match(bad.stderr,/INVALID_OR_DUPLICATE_KU_ID/);
 console.log('PASS: KU identity/provenance, exact count, no release, duplicate fail-closed');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
