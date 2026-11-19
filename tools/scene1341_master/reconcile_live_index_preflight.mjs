#!/usr/bin/env node
/**
 * CG-MASTER one-shot full 1341-scene integrity repair BEFORE the strict bulk runner.
 * Corrects ONLY stale git_blob_sha1 pointers, never source scene files, QA labels,
 * frozen source identities, original rows or SRS flags.
 *
 * Requires full authenticated Git checkout. Non-force push fails on concurrent edits.
 * If any structural/identity invariant is broken, aborts without writing anything.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const BRANCH='cg-master-kaikki-evidence-intake-20261111';
const ROOT='tools/scene1341_master/production';
const INDEX=ROOT+'/SCENE1341_LIVE_INDEX.json';
const CHECKPOINT='tools/scene1341_master/CGMASTER_CURRENT_STATE.json';
function run(command,args,cwd){
 const r=spawnSync(command,args,{cwd,encoding:'utf8',maxBuffer:64*1024*1024});
 if(r.status!==0)throw new Error(command+' '+args.join(' ')+' failed: '+(r.stderr||r.stdout||''));
 return r.stdout.trim();
}
const blob=buf=>crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\\0'.replace('\\0','\0'))).update(buf).digest('hex');
const repo=run('git',['rev-parse','--show-toplevel'],process.cwd());
run('git',['fetch','origin','refs/heads/'+BRANCH+':refs/remotes/origin/'+BRANCH],repo);
const expected=run('git',['rev-parse','refs/remotes/origin/'+BRANCH],repo);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cgmaster-index-repair-')), wt=path.join(temp,'checkout');
let added=false;
try {
 run('git',['worktree','add','--detach',wt,expected],repo);added=true;
 const file=path.join(wt,INDEX), j=JSON.parse(fs.readFileSync(file,'utf8'));
 if(j.scene_count!==1341||j.source_associations!==230289||j.release_allowed!==false||j.srs_eligible!==false)throw Error('release contract mismatch; aborting');
 const seen=new Set(), mismatches=[];let count=0;
 for(let i=1;i<=1341;i++){
  const id='SC50-'+String(i).padStart(4,'0'), ent=j.scenes?.[id];
  const correctPath=ROOT+'/scenes/'+id+'.json';
  if(!ent||ent.path!==correctPath||!Number.isInteger(ent.records))throw Error('invalid scene index '+id);
  const bytes=fs.readFileSync(path.join(wt,correctPath)), scene=JSON.parse(bytes.toString('utf8'));
  if(scene.scene_id!==id||scene.records?.length!==ent.records||scene.record_count!==ent.records||scene.release_allowed!==false||scene.srs_eligible!==false)throw Error('scene contract mismatch '+id);
  for(const r of scene.records){
   if(r.scene_id!==id||!Number.isInteger(r.source_final_row)||seen.has(r.source_final_row)||r.release_allowed!==false||r.srs_eligible!==false)throw Error('frozen row identity or eligibility violation '+id);
   seen.add(r.source_final_row);
  }
  count+=scene.records.length;
  const actual=blob(bytes);
  if(ent.git_blob_sha1!==actual)mismatches.push({scene:id,was:ent.git_blob_sha1,now:actual});
 }
 if(count!==230289||seen.size!==230289)throw Error('original source association count/identity mismatch');
 console.log(JSON.stringify({stage:'FULL_AUDIT_BEFORE_REPAIR',scenes:1341,associations:count,stale_sha_pointers:mismatches},null,2));
 if(!mismatches.length){console.log('PASS: No index blob repairs necessary');}
 else {
  for(const m of mismatches)j.scenes[m.scene].git_blob_sha1=m.now;
  j.master_release.integrity_reconciliation={date:new Date().toISOString().slice(0,10),method:'full_scene_identity_and_git_blob_audit',number_repaired:mismatches.length,repaired_scene_ids:mismatches.map(x=>x.scene),all_230289_source_ids_verified:true,scene_content_modified:false,qa_status_modified:false};
  fs.writeFileSync(file,JSON.stringify(j,null,2)+'\n');
  const cpFile=path.join(wt,CHECKPOINT),cp=JSON.parse(fs.readFileSync(cpFile,'utf8'));
  cp.last_index_integrity_reconciliation={date:new Date().toISOString().slice(0,10),number_repaired:mismatches.length,repaired_scene_ids:mismatches.map(x=>x.scene),full_scene_count_verified:1341,source_rows_verified:230289,content_modified:false,qa_promotions:0};
  fs.writeFileSync(cpFile,JSON.stringify(cp,null,2)+'\n');
  run('git',['add','--',INDEX,CHECKPOINT],wt);
  run('git',['commit','-m','fix(cg-master): reconcile stale blob pointers after full 1341 identity audit'],wt);
  const commit=run('git',['rev-parse','HEAD'],wt);
  run('git',['push','origin','HEAD:refs/heads/'+BRANCH],wt);
  console.log(JSON.stringify({stage:'REPAIRED_AND_PUSHED',commit,corrected:mismatches.length,source_records_unchanged:true}));
 }
} finally {
 if(added)run('git',['worktree','remove','--force',wt],repo);
 fs.rmSync(temp,{recursive:true,force:true});
}
