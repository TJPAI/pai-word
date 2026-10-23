import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('review gate refuses candidate-only and accepts only independently evidenced decisions',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-gate-'));
 try{
  const paths=['lex','catalog','baseline','review','out'].map(x=>path.join(dir,x+'.json'));
  const lex={data_version:'0.10.1-evidence-compat',source_version:'0.10.1-evidence-compat',terms:Array.from({length:20000},(_,i)=>({term_id:'zh_'+i,term:i===1?'数学':'词项'+i,normalized_term:i===1?'数学':'词项'+i,aliases:[],source_version:'source'}))};
  const catalog={scene_count:500,scenes:Object.fromEntries(Array.from({length:500},(_,i)=>{
   const id='S'+String(i+1).padStart(3,'0');return [id,{name:id}];
  }))};
  const baseline={association_version:'v',links:[]};
  [lex,catalog,baseline].forEach((x,i)=>fs.writeFileSync(paths[i],JSON.stringify(x)));
  const run=()=>spawnSync(process.execPath,[new URL('./review-and-publish-associations.mjs',import.meta.url).pathname,...paths],{encoding:'utf8'});
  const proposal={term_id:'zh_1',term:'数学',scene_id:'S126',scene_name:'S126',
   decision:'approve',score:.8,confidence:.8};
  fs.writeFileSync(paths[3],JSON.stringify({schema:'scene500-human-review-v0.1',decisions:[proposal]}));
  let r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/UNVERIFIED_APPROVAL/);
  fs.writeFileSync(paths[3],JSON.stringify({schema:'scene500-human-review-v0.1',decisions:[
   {...proposal,reviewer_id:'audit-123',evidence_reference:'evidence:human-1',
    sense_alignment_verified:true,independent_review_verified:true,
    negative_examples_checked:true,production_authorized:true}
  ]}));
  r=run();assert.equal(r.status,0,r.stderr);
  const out=JSON.parse(fs.readFileSync(paths[4],'utf8'));
  assert.equal(out.status,'REVIEW_CLAIMS_VALIDATED_NOT_CERTIFIED');
  assert.equal(out.approved_added,1);
  assert.equal(out.associations.links[0].term_id,'zh_1');
  assert.equal(out.associations.links[0].association_version,'v');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
