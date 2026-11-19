#!/usr/bin/env node
/**
 * CG-MASTER protected one-commit bulk production.
 *
 * node tools/scene1341_master/run_atomic_bulk.mjs --start 151 --end 1341 --batch-size 3000
 *
 * Requires a complete Git checkout, Node 20+, git, and an authenticated
 * origin remote. Never rewrites a shared checkout: uses a temporary detached
 * worktree and a non-force push. If another CG-MASTER writer advances the
 * remote branch, push FAILS rather than overwriting their release.
 */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
const BRANCH='cg-master-kaikki-evidence-intake-20261111';
const dir='tools/scene1341_master/production';
const INDEX=path.join(dir,'SCENE1341_LIVE_INDEX.json');
const args=process.argv.slice(2);
const get=(flag,def)=>{const k=args.indexOf(flag);return k<0?def:Number(args[k+1]);};
const start=get('--start',151),end=get('--end',1341),size=get('--batch-size',3000);
if(![start,end,size].every(Number.isInteger)||start<1||end>1341||start>end||size<1)throw Error('bad arguments');
const run=(cmd,argv,cwd,show=false)=>{
 const r=spawnSync(cmd,argv,{cwd,encoding:'utf8',maxBuffer:32*1024*1024});
 if(r.status!==0)throw Error(cmd+' '+argv.join(' ')+' failed: '+(r.stderr||r.stdout||''));
 if(show&&r.stdout)process.stdout.write(r.stdout);
 return r.stdout.trim();
};
const cwd=run('git',['rev-parse','--show-toplevel'],process.cwd());
run('git',['fetch','origin','refs/heads/'+BRANCH+':refs/remotes/origin/'+BRANCH],cwd);
const expected=run('git',['rev-parse','refs/remotes/origin/'+BRANCH],cwd);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cgmaster-atomic-'));
const wt=path.join(temp,'checkout');
let added=false;
const blob=(data)=>crypto.createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');
function validate(worktree){
 const idx=JSON.parse(fs.readFileSync(path.join(worktree,INDEX),'utf8'));
 if(idx.scene_count!==1341||idx.source_associations!==230289||idx.release_allowed!==false||idx.srs_eligible!==false)throw Error('immutable index invariants failed');
 let total=0;const seen=new Set();
 for(let i=1;i<=1341;i++){
  const sceneId='SC50-'+String(i).padStart(4,'0'),s=idx.scenes?.[sceneId];
  if(!s?.path||s.path!==dir+'/scenes/'+sceneId+'.json')throw Error('invalid index path '+sceneId);
  const raw=fs.readFileSync(path.join(worktree,s.path));
  if(blob(raw)!==s.git_blob_sha1)throw Error('Git blob mismatch '+sceneId);
  const x=JSON.parse(raw.toString('utf8'));
  if(x.scene_id!==sceneId||x.records?.length!==s.records||x.record_count!==s.records||x.release_allowed!==false||x.srs_eligible!==false)throw Error('scene contract '+sceneId);
  for(const row of x.records){
   if(row.scene_id!==sceneId||!Number.isInteger(row.source_final_row)||seen.has(row.source_final_row)||row.release_allowed!==false||row.srs_eligible!==false)throw Error('source identity/flag '+sceneId);
   seen.add(row.source_final_row);
  }
  total+=x.records.length;
 }
 if(total!==230289||seen.size!==230289)throw Error('source association count/identity mismatch');
 return idx;
}
try{
 run('git',['worktree','add','--detach',wt,expected],cwd);added=true;
 const before=validate(wt); // fail closed; never silently heal an existing stale index
 const m=/^V(\d+)$/.exec(before.master_release?.version);
 if(!m)throw Error('Unexpected live release version: '+before.master_release?.version);
 const next='V'+(Number(m[1])+1);
 run('node',['tools/scene1341_master/batch_enrich_master.mjs','--start',String(start),'--end',String(end),'--batch-size',String(size)],wt,true);
 const afterPath=path.join(wt,INDEX),after=JSON.parse(fs.readFileSync(afterPath,'utf8'));
 const changed=run('git',['diff','--name-only'],wt).split('\n').filter(Boolean);
 if(!changed.length){console.log('NOOP: no eligible new content');process.exitCode=0;}
 else{
  const scenes=changed.filter(p=>p.startsWith(dir+'/scenes/')&&p.endsWith('.json'));
  const changedFields=scenes.reduce((n,p)=>{
   const newRows=JSON.parse(fs.readFileSync(path.join(wt,p),'utf8')).records;
   const old=JSON.parse(run('git',['show',expected+':'+p],wt)).records;
   const oldByRow=new Map(old.map(x=>[x.source_final_row,x]));
   for(const row of newRows){
    const prev=oldByRow.get(row.source_final_row);
    if(!prev||JSON.stringify(prev.source)!==JSON.stringify(row.source)||row.scene_id!==prev.scene_id||JSON.stringify({...prev.question_page,ipa_candidate:row.question_page?.ipa_candidate,ipa_provenance:row.question_page?.ipa_provenance})!==JSON.stringify(row.question_page))throw Error('immutable row altered '+p);
    if(!prev.answer_page.gloss_en&&row.answer_page.gloss_en)n.glosses++;
    if(!prev.answer_page.example_en&&row.answer_page.example_en)n.examples++;
    if(!prev.answer_page.pos&&row.answer_page.pos)n.pos++;
    if(!prev.question_page?.ipa_candidate&&row.question_page?.ipa_candidate)n.ipa++;
   }
   return n;
  },{glosses:0,examples:0,pos:0,ipa:0});
  if(scenes.length===0 || (changedFields.glosses===0 && changedFields.examples===0 && changedFields.pos===0 && changedFields.ipa===0)){
   console.log(JSON.stringify({status:'NOOP_NO_NEW_GLOSSES',release_unchanged:before.master_release.version,scene_documents_changed:scenes.length,new_glosses:changedFields.glosses,new_english_examples:changedFields.examples,new_pos:changedFields.pos,new_ipa:changedFields.ipa}));
   process.exitCode=0;
  }else{
  after.master_release={metadata_schema:'scene1341-master-release/v1',version:next,content_baseline:'ATOMIC_KAIKKI_SOURCE_GLOSSES_SC'+String(start).padStart(4,'0')+'_SC'+String(end).padStart(4,'0'),published_date:new Date().toISOString().slice(0,10),stage:'TEST_ONLY_QA_PENDING',headline:'Kaikki唯一义项来源绑定英文释义批量增补（待审）',changes:[{category:'answer_page_gloss_en_source_pinned',count:changedFields.glosses},{category:'answer_page_example_en_source_pinned',count:changedFields.examples},{category:'answer_page_pos_source_pinned',count:changedFields.pos},{category:'question_page_ipa_source_pinned',count:changedFields.ipa},{category:'scene_documents_updated',count:scenes.length}],changed_scene_ids:scenes.map(p=>path.basename(p,'.json')),qa_stage:'待审',release_allowed:false,srs_eligible:false};
  fs.writeFileSync(afterPath,JSON.stringify(after,null,2)+'\n');
  validate(wt);
  const checkpointPath=path.join(wt,'tools/scene1341_master/CGMASTER_CURRENT_STATE.json');
  const checkpoint=JSON.parse(fs.readFileSync(checkpointPath,'utf8'));
  checkpoint.version=next+'_ATOMIC_KAIKKI_SOURCE_GLOSSES';
  checkpoint.updated_at=new Date().toISOString().slice(0,10);
  checkpoint.handoff_id='SC1341-'+next+'-ATOMIC-SC'+String(start).padStart(4,'0')+'-SC'+String(end).padStart(4,'0');
  checkpoint['v'+next.slice(1)]={scene_range:'SC50-'+String(start).padStart(4,'0')+'..SC50-'+String(end).padStart(4,'0'),scene_documents_updated:scenes.length,new_english_glosses:changedFields.glosses,new_english_examples:changedFields.examples,new_pos:changedFields.pos,new_ipa:changedFields.ipa,qa_stage:'待审',release_allowed:false,srs_eligible:false,full1341_integrity_verified:true};
  fs.writeFileSync(checkpointPath,JSON.stringify(checkpoint,null,2)+'\n');
  run('git',['add','--',dir,'tools/scene1341_master/CGMASTER_CURRENT_STATE.json'],wt);
  run('git',['commit','-m','data(cg-master): '+next+' atomic Kaikki enrichment '+start+'-'+end+' ('+changedFields.glosses+' glosses, '+changedFields.examples+' examples)'],wt);
  const commit=run('git',['rev-parse','HEAD'],wt);
  // The remote cannot be force-updated. A concurrent writer makes this push fail.
  run('git',['push','origin','HEAD:refs/heads/'+BRANCH],wt,true);
  console.log(JSON.stringify({status:'PUSHED_AND_VALIDATED',expected_remote:expected,commit,release:next,changed_scene_documents:scenes.length,new_glosses:changedFields.glosses,new_english_examples:changedFields.examples,new_ipa:changedFields.ipa,associations:230289,qa:'待审',srs:false}));
  }
 }
}finally{
 if(added)run('git',['worktree','remove','--force',wt],cwd);
 fs.rmSync(temp,{recursive:true,force:true});
}
