#!/usr/bin/env node
/**
 * Protected, non-force atomic CG-ENTEACH publisher. Consumes ONLY validated
 * nine-field packages. Never changes frozen identities or QA/release guards.
 * Run from a full authenticated checkout:
 * node tools/scene1341_master/publish_enteach_ready.mjs /absolute/path/ready.jsonl
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const BRANCH='cg-master-kaikki-evidence-intake-20261111';
const BASE='tools/scene1341_master/production';
const INDEX=BASE+'/SCENE1341_LIVE_INDEX.json';
const CHECKPOINT='tools/scene1341_master/CGMASTER_CURRENT_STATE.json';
const input=process.argv[2];
if(!input||!fs.existsSync(input))throw Error('provide an existing ready JSONL');
const rows=fs.readFileSync(input,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
if(rows.length>3000)throw Error('maximum 3000 rows per release');
const fields=['pos','meaning_zh','gloss_en','example_en','example_zh','collocations','usage_note'];
const valid=v=>typeof v==='string'&&v.trim().length>0&&v.length<=800&&!/[<>]/.test(v);
const fieldValid=(k,v)=>k==='collocations'?Array.isArray(v)&&v.length>0&&v.every(valid):valid(v);
const blob=data=>crypto.createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');
function run(cmd,args,cwd){const p=spawnSync(cmd,args,{cwd,encoding:'utf8',maxBuffer:64*1024*1024});if(p.status!==0)throw Error(cmd+' '+args.join(' ')+' '+(p.stderr||p.stdout));return p.stdout.trim();}
const root=run('git',['rev-parse','--show-toplevel'],process.cwd());
run('git',['fetch','origin','refs/heads/'+BRANCH+':refs/remotes/origin/'+BRANCH],root);
const expected=run('git',['rev-parse','refs/remotes/origin/'+BRANCH],root);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cgmaster-enteach-'));
const wt=path.join(tmp,'worktree');
let added=false;
try{
 run('git',['worktree','add','--detach',wt,expected],root);added=true;
 const indexPath=path.join(wt,INDEX);
 const idx=JSON.parse(fs.readFileSync(indexPath,'utf8'));
 if(idx.scene_count!==1341||idx.source_associations!==230289||idx.release_allowed!==false||idx.srs_eligible!==false)throw Error('frozen index invariants');
 const grouped=new Map(),seen=new Set();
 for(const row of rows){
  const key=row.scene_id+':'+row.source_final_row;
  if(seen.has(key)||!idx.scenes[row.scene_id]||!Number.isInteger(row.source_final_row))throw Error('invalid or duplicate identity '+key);
  seen.add(key);
  if(!valid(row.question_page?.expression)||!valid(row.question_page?.ipa_candidate)||fields.some(k=>!fieldValid(k,row.answer_page?.[k]))||Object.keys(row.answer_page||{}).some(k=>!fields.includes(k)))throw Error('incomplete package '+key);
  if(!row.provenance?.source||!row.provenance?.source_id||row.qa_stage!=='待审'||row.release_allowed!==false||row.srs_eligible!==false)throw Error('unsafe provenance or release guard '+key);
  if(!grouped.has(row.scene_id))grouped.set(row.scene_id,[]);
  grouped.get(row.scene_id).push(row);
 }
 let changedRows=0,changedFields=0;const changedScenes=[];
 for(const [id,items] of grouped){
  const meta=idx.scenes[id],file=path.join(wt,meta.path),raw=fs.readFileSync(file);
  if(blob(raw)!==meta.git_blob_sha1)throw Error('stale scene blob '+id);
  const scene=JSON.parse(raw);
  if(scene.scene_id!==id||scene.record_count!==meta.records||scene.records.length!==meta.records||scene.release_allowed!==false||scene.srs_eligible!==false)throw Error('scene contract '+id);
  const byRow=new Map(scene.records.map(r=>[r.source_final_row,r]));let changed=false;
  for(const item of items){
   const rec=byRow.get(item.source_final_row);
   if(!rec||rec.scene_id!==id||rec.question_page?.expression!==item.question_page.expression||rec.question_page?.ipa_candidate!==item.question_page.ipa_candidate||rec.release_allowed!==false||rec.srs_eligible!==false)throw Error('frozen identity/question mismatch '+id);
   let one=false;
   for(const k of fields){
    const existing=rec.answer_page?.[k],incoming=item.answer_page[k];
    if(existing!==undefined&&existing!==null&&existing!==''&&!(Array.isArray(existing)&&existing.length===0)){
     if(JSON.stringify(existing)!==JSON.stringify(incoming))throw Error('existing field conflict '+id+' '+k);
     continue;
    }
    rec.answer_page[k]=incoming;
    rec.answer_page[k+'_provenance']={...item.provenance,qa_stage:'待审',first_review:false};
    changedFields++;one=true;changed=true;
   }
   if(one)changedRows++;
  }
  if(changed){
   const bytes=Buffer.from(JSON.stringify(scene,null,2)+'\n');
   fs.writeFileSync(file,bytes);
   meta.git_blob_sha1=blob(bytes);
   changedScenes.push(id);
  }
 }
 if(changedRows===0){console.log(JSON.stringify({status:'NOOP',candidate_rows:rows.length,release:idx.master_release.version}));}
 else{
  const match=/^V(\d+)$/.exec(idx.master_release?.version);
  if(!match)throw Error('invalid prior release');
  const version='V'+(Number(match[1])+1),date=new Date().toISOString().slice(0,10);
  idx.master_release={metadata_schema:'scene1341-master-release/v1',version,content_baseline:'ATOMIC_CG_ENTEACH_V51_FULL_TWO_PAGE',published_date:date,stage:'TEST_ONLY_QA_PENDING',headline:'CG-ENTEACH来源绑定双页面完整包（待审）',changes:[{category:'complete_two_page_author_intake',count:changedRows},{category:'answer_fields_filled',count:changedFields},{category:'scene_documents_updated',count:changedScenes.length}],changed_scene_ids:changedScenes,qa_stage:'待审',release_allowed:false,srs_eligible:false};
  fs.writeFileSync(indexPath,JSON.stringify(idx,null,2)+'\n');
  const cpPath=path.join(wt,CHECKPOINT),cp=JSON.parse(fs.readFileSync(cpPath,'utf8'));
  cp.version=version+'_ATOMIC_ENTEACH_V51';cp.updated_at=date;cp.handoff_id='SC1341-'+version+'-ATOMIC-ENTEACH';
  cp['v'+version.slice(1)]={complete_two_page_author_intake:changedRows,answer_fields_filled:changedFields,scene_documents_updated:changedScenes.length,qa_stage:'待审',release_allowed:false,srs_eligible:false};
  fs.writeFileSync(cpPath,JSON.stringify(cp,null,2)+'\n');
  // Verify the complete frozen catalog before a single atomic commit.
  let total=0,identities=new Set();
  for(let n=1;n<=1341;n++){
   const id='SC50-'+String(n).padStart(4,'0'),meta=idx.scenes[id];
   if(meta?.path!==BASE+'/scenes/'+id+'.json')throw Error('bad catalog path '+id);
   const raw=fs.readFileSync(path.join(wt,meta.path));
   if(blob(raw)!==meta.git_blob_sha1)throw Error('index blob mismatch '+id);
   const scene=JSON.parse(raw);
   if(scene.scene_id!==id||scene.records.length!==meta.records||scene.record_count!==meta.records||scene.release_allowed!==false||scene.srs_eligible!==false)throw Error('catalog scene mismatch '+id);
   for(const row of scene.records){
    if(row.scene_id!==id||identities.has(row.source_final_row)||row.release_allowed!==false||row.srs_eligible!==false)throw Error('catalog identity mismatch '+id);
    identities.add(row.source_final_row);
   }
   total+=scene.records.length;
  }
  if(total!==230289||identities.size!==230289)throw Error('catalog count mismatch');
  run('git',['add','--',BASE,CHECKPOINT],wt);
  run('git',['commit','-m','data(cg-master): '+version+' atomic ENTEACH full teaching packages ('+changedRows+' Sense)'],wt);
  const commit=run('git',['rev-parse','HEAD'],wt);
  run('git',['push','origin','HEAD:refs/heads/'+BRANCH],wt);
  console.log(JSON.stringify({status:'PUSHED_AND_VALIDATED',version,commit,changed_senses:changedRows,changed_fields:changedFields,changed_scenes:changedScenes.length,source_associations:total,qa_stage:'待审',release_allowed:false,srs_eligible:false}));
 }
}finally{
 if(added)run('git',['worktree','remove','--force',wt],root);
 fs.rmSync(tmp,{recursive:true,force:true});
}
