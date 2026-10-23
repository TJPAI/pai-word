import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tool=new URL('./propose-associations.mjs',import.meta.url);
test('offline expansion preserves term IDs, excludes ambiguous keys and existing pairs',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-proposal-'));
 try{
  const lex={source_version:'fixture',terms:[
   {term_id:'t1',term:'洗衣服',normalized_term:'洗衣服',aliases:[],source_version:'fixture'},
   {term_id:'t4',term:'猫',normalized_term:'猫',aliases:[],source_version:'fixture'},
   {term_id:'t2',term:'碰撞甲',normalized_term:'冲突',aliases:[],source_version:'fixture'},
   {term_id:'t3',term:'碰撞乙',normalized_term:'冲突',aliases:[],source_version:'fixture'}
  ]};
  const assoc={association_version:'fixture',links:[]};
  const lp=path.join(dir,'lex.json'),ap=path.join(dir,'assoc.json'),out=path.join(dir,'out.json');
  fs.writeFileSync(lp,JSON.stringify(lex));fs.writeFileSync(ap,JSON.stringify(assoc));
  const r=spawnSync(process.execPath,[tool.pathname,lp,ap,out],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const result=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(result.status,'CANDIDATES_NOT_APPROVED');
  assert.ok(result.candidates.some(c=>c.term_id==='t1'&&c.scene_id==='S006'));
  assert.ok(result.candidates.some(c=>c.term_id==='t4'&&c.scene_id==='S015'));
  assert.ok(result.candidates.every(c=>['t1','t4'].includes(c.term_id)));
  assert.equal(new Set(result.candidates.map(c=>c.term_id+'|'+c.scene_id)).size,result.candidates.length);
  assert.equal(result.exclusions.ambiguousTermIds,2);
  assert.ok(result.candidates.every(c=>c.status==='candidate_review_only'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
