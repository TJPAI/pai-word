#!/usr/bin/env node
/* Read-only CG-MAIN independent verification of a CG-MASTER atomic live index.
 * Run from a checkout holding tools/scene1341_master/production/.
 * No mutation, QA promotion or SRS activity.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,relative,sep} from 'node:path';

const root=resolve(process.argv[2]||'tools/scene1341_master/production');
const repoRoot=resolve(root,'../../..');
const indexPath=join(root,'SCENE1341_LIVE_INDEX.json');
const gitBlob=bytes=>createHash('sha1')
 .update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const isSHA=sha=>typeof sha==='string'&&/^[0-9a-f]{40}$/.test(sha);
const fail=message=>{throw Error('MASTER_BLOB_AUDIT_'+message)};
export async function inspectMasterBlobIndex({rootDir=root,read=readFile}={}){
 const directory=resolve(rootDir),repository=resolve(directory,'../../..');
 const index=JSON.parse(await read(join(directory,'SCENE1341_LIVE_INDEX.json'),'utf8'));
 if(index.schema_version!=='scene1341-master-index/v1'||index.scene_count!==1341||
    index.source_associations!==230289||!index.scenes||
    Object.keys(index.scenes).length!==1341)fail('INDEX_CONTRACT');
 let checked=0,records=0;
 const missing=[],mismatch=[],invalid=[];
 for(const [id,entry] of Object.entries(index.scenes)){
  const expected='tools/scene1341_master/production/scenes/'+id+'.json';
  if(!/^SC50-\d{4}$/.test(id)||entry.path!==expected||!isSHA(entry.git_blob_sha1)||
    !Number.isSafeInteger(entry.records)||entry.records<1){
   invalid.push({id,issue:'INDEX_ENTRY_INVALID'});continue;
  }
  const target=resolve(repository,entry.path);
  if(relative(repository,target).startsWith('..'+sep)){invalid.push({id,issue:'PATH_ESCAPE'});continue}
  let raw;
  try{raw=await read(target)}catch(error){missing.push({id,path:entry.path,error:String(error.code||error.message)});continue}
  const sha=gitBlob(raw);
  if(sha!==entry.git_blob_sha1){
   mismatch.push({id,expected:entry.git_blob_sha1,actual:sha,path:entry.path});continue;
  }
  let doc;
  try{doc=JSON.parse(raw)}catch(_){invalid.push({id,issue:'SCENE_JSON_PARSE'});continue}
  if(doc.scene_id!==id||doc.record_count!==entry.records||
    !Array.isArray(doc.records)||doc.records.length!==entry.records||
    doc.release_allowed!==false||doc.srs_eligible!==false){
   invalid.push({id,issue:'SCENE_CONTRACT'});continue;
  }
  checked++;records+=entry.records;
 }
 const ok=checked===1341&&records===230289&&
  !missing.length&&!mismatch.length&&!invalid.length;
 return {ok,release:index.master_release?.version||null,checked,
  records,expectedScenes:1341,expectedAssociations:230289,
  mismatch,missing,invalid};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 try{
  const out=await inspectMasterBlobIndex();
  process.stdout.write(JSON.stringify(out,null,2)+'\n');
  if(!out.ok)process.exitCode=1;
 }catch(error){process.stderr.write(String(error.stack||error)+'\n');process.exitCode=1}
}
