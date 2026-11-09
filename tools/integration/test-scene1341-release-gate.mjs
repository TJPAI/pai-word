import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateScene1341Release,createScene1341ReleaseIndex} from '../../rebuild-preview/scene1341-release-gate.mjs';
const dir='tools/integration/scene1341-teaching/';
const packs=[
 'enteach-v51-first20-answer-only-v2.json',
 'scene1341-v51-sc0001-answer-only-021-050.v2.json',
 'scene1341-v51-sc0001-answer-only-051-100.v2.json',
 'scene1341-v51-sc0001-answer-only-101-130.v2.json',
 'scene1341-v51-sc0001-answer-only-131-180.v2.json',
 'scene1341-v51-sc0001-answer-only-181-234.v2.json',
 'scene1341-v51-sc0002-answer-only-001-020.v2.json',
 'scene1341-v51-sc0002-answer-only-021-070.v2.json'].map(p=>JSON.parse(fs.readFileSync(dir+p,'utf8')));
const items=packs.flatMap(x=>x.records),sourceBlob='eaa6d729bb04a9bedbafd8e1081a11fc791caa39';
assert.equal(items.length,304);
assert(items.every(r=>r.activation_allowed===false&&!Object.hasOwn(r,'question')));
const decisions=createScene1341ReleaseIndex({items,sourceBlob,
 packBlobsByKu:{},manifest:null});
assert.equal(decisions.count,304);assert.equal(decisions.approved,0);
for(const item of items){
 assert.equal(decisions.get(item.scene_ku_id).eligible,false);
 assert.equal(decisions.get(item.scene_ku_id).reason,'NO_APPROVED_MANIFEST');
}
const first=items[0],packBlob='b6c39ebcebf4d6ce9848122cc60ecc899274c74f';
const manifest={schema_version:'scene1341-answer-only-release-v1',source_git_blob:sourceBlob,
 master_approved:true,master_release_status:'APPROVED',production_approved:true,
 entries:[{scene_ku_id:first.scene_ku_id,scene_id:first.scene_id,
 source_sense_id:first.source_sense_id,source_rank:first.source_rank,
 pack_git_blob:packBlob,cg_qa:'PASS',mu_qa:'PASS',
 resolution_status:'CLOSED',approved_for_learning:true}]};
const evaluate=(item=first,m=manifest,source=sourceBlob,blob=packBlob)=>
 evaluateScene1341Release({item,manifest:m,sourceBlob:source,packBlob:blob});
assert.equal(evaluate().eligible,false,'author draft must never activate');
assert.equal(evaluate().reason,'KU_NOT_ACTIVATED');
assert.equal(evaluate({...first,activation_allowed:true}).eligible,true,
 'strictly synthetic fully-approved fixture should work');
assert.equal(evaluate({...first,activation_allowed:true}, {...manifest,production_approved:false}).eligible,false);
assert.equal(evaluate({...first,activation_allowed:true}, {...manifest,master_approved:false}).eligible,false);
assert.equal(evaluate({...first,activation_allowed:true}, {...manifest,entries:[{...manifest.entries[0],mu_qa:'HOLD'}]}).eligible,false);
assert.equal(evaluate({...first,activation_allowed:true}, {...manifest,entries:[{...manifest.entries[0],resolution_status:'OPEN'}]}).eligible,false);
assert.equal(evaluate({...first,activation_allowed:true},manifest,sourceBlob,'0000000000000000000000000000000000000000').eligible,false);
assert.equal(evaluate({...first,activation_allowed:true,question:{type:'quiz'}}).eligible,false);
console.log(JSON.stringify({status:'PASS',actualAuthorDrafts:items.length,
 actualReleaseEligible:decisions.approved,masterApproval:'NOT_GRANTED',
 dualQaRequirement:true,questionPayloads:0,realSrsWrites:0}));
