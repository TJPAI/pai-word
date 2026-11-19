#!/usr/bin/env node
/**
 * Atomic source-safe IPA/POS publisher. No force push. Entire 1341-scene
 * identity/hash check before and after staging, then one commit and push.
 * Usage: node tools/scene1341_master/run_atomic_ipa_pos.mjs --max-rows 3000
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const branch='cg-master-kaikki-evidence-intake-20261111';
const args=process.argv.slice(2);
const get=(k,d)=>{const i=args.indexOf(k);return i<0?d:Number(args[i+1]);};
const start=get('--start',1),end=get('--end',1341),max=get('--max-rows',3000);
if(![start,end,max].every(Number.isInteger)||start<1||end>1341||start>end||max<1||max>3000)throw Error('invalid scope');
const exec=(cmd,a,cwd)=>{const r=spawnSync(cmd,a,{cwd,encoding:'utf8',maxBuffer:64*1024*1024});if(r.status!==0)throw Error(cmd+' '+a.join(' ')+': '+(r.stderr||r.stdout));return r.stdout.trim();};
const root=exec('git',['rev-parse','--show-toplevel'],process.cwd());
exec('git',['fetch','origin','refs/heads/'+branch+':refs/remotes/origin/'+branch],root);
const base=exec('git',['rev-parse','refs/remotes/origin/'+branch],root);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cgmaster-ipa-pos-')),wt=path.join(temp,'wt');
const indexRel='tools/scene1341_master/production/SCENE1341_LIVE_INDEX.json';
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\\0')).update(b).digest('hex');
function validate(){
 const idx=JSON.parse(fs.readFileSync(path.join(wt,indexRel),'utf8'));
 if(idx.scene_count!==1341||idx.source_associations!==230289||idx.release_allowed!==false||idx.srs_eligible!==false)throw Error('index invariants');
 const seen=new Set();let total=0;
 for(let i=1;i<=1341;i++){
  const id='SC50-'+String(i).padStart(4,'0'),m=idx.scenes[id];
  if(!m||m.path!=='tools/scene1341_master/production/scenes/'+id+'.json')throw Error('index path '+id);
  const b=fs.readFileSync(path.join(wt,m.path));if(blob(b)!==m.git_blob_sha1)throw Error('blob mismatch '+id);
  const s=JSON.parse(b);if(s.scene_id!==id||s.record_count!==m.records||s.records?.length!==m.records||s.release_allowed!==false||s.srs_eligible!==false)throw Error('scene '+id);
  for(const r of s.records){if(r.scene_id!==id||!Number.isInteger(r.source_final_row)||seen.has(r.source_final_row)||r.release_allowed!==false||r.srs_eligible!==false)throw Error('record '+id);seen.add(r.source_final_row);total++;}
 }
 if(total!==230289||seen.size!==230289)throw Error('frozen total mismatch');
 return idx;
}
let added=false;
try{
 exec('git',['worktree','add','--detach',wt,base],root);added=true;
 const before=validate(),v=/^V(\\d+)$/.exec(before.master_release?.version||'');
 if(!v)throw Error('invalid current release');
 const next='V'+(Number(v[1])+1);
 const output=exec('node',['tools/scene1341_master/apply_source_safe_ipa_pos.mjs','--start',String(start),'--end',String(end),'--max-rows',String(max),'--write','--atomic-release-context'],wt);
 // apply requires env CGMASTER_NEXT_RELEASE; pass it through child process environment below.
 const result=JSON.parse(output);
 if(result.changed_rows===0){console.log(JSON.stringify({status:'NOOP',base,release:before.master_release.version}));}
 else{
  const after=validate();
  if(after.master_release?.version!==next||after.release_allowed!==false||after.srs_eligible!==false)throw Error('release metadata mismatch');
  const changed=exec('git',['diff','--name-only'],wt).split('\\n').filter(Boolean);
  const allowed=p=>p===indexRel||p==='tools/scene1341_master/CGMASTER_CURRENT_STATE.json'||/^tools\\/scene1341_master\\/production\\/scenes\\/SC50-\\d{4}\\.json$/.test(p);
  if(changed.some(p=>!allowed(p)))throw Error('unexpected changed paths');
  exec('git',['add','--','tools/scene1341_master/production','tools/scene1341_master/CGMASTER_CURRENT_STATE.json'],wt);
  exec('git',['commit','-m','data(cg-master): '+next+' source-safe IPA/POS '+result.changed_rows+' records'],wt);
  const commit=exec('git',['rev-parse','HEAD'],wt);
  exec('git',['push','origin','HEAD:refs/heads/'+branch],wt);
  console.log(JSON.stringify({status:'PUSHED_AND_VALIDATED',commit,release:next,changed_rows:result.changed_rows,changed_scenes:result.changed_scenes,associations:230289,qa:'待审',srs:false}));
 }
}finally{if(added)exec('git',['worktree','remove','--force',wt],root);fs.rmSync(temp,{recursive:true,force:true});}
