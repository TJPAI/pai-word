import assert from 'node:assert/strict';
import {inspectMasterIPA} from './audit-scene1341-master-ipa.mjs';

const scenes={},recordsPerScene=Math.floor(230289/1341),extra=230289%1341;
let offset=1,expectedWithIPA=0;
for(let n=1;n<=1341;n++){
 const id='SC50-'+String(n).padStart(4,'0');
 const count=recordsPerScene+(n<=extra?1:0);
 scenes[id]={path:'tools/scene1341_master/production/scenes/'+id+'.json',
  records:count,git_blob_sha1:'a'.repeat(40)};
}
const index={schema_version:'scene1341-master-index/v1',scene_count:1341,
 source_associations:230289,scenes,
 master_release:{version:'V260'},source_master_sha256:'f'.repeat(64)};
const result=await inspectMasterIPA(index,async(_path,id)=>{
 const n=Number(id.slice(-4)),count=scenes[id].records;
 const records=Array.from({length:count},(_,i)=>{
  const source_final_row=offset+i;
  const expression=source_final_row%2?'wake up':'get out of bed';
  const ipa_candidate=source_final_row%10===0?'/test/':null;
  if(ipa_candidate)expectedWithIPA++;
  return {source_final_row,scene_id:id,release_allowed:false,srs_eligible:false,
   question_page:{expression,ipa_candidate}};
 });
 offset+=count;
 return {scene_id:id,record_count:count,release_allowed:false,srs_eligible:false,records};
});
assert.equal(result.totals.associations,230289);
assert.equal(result.totals.withIPA,expectedWithIPA);
assert.equal(result.totals.withIPA,23028);
assert.equal(result.totals.withoutIPA,207261);
assert.equal(result.totals.uniqueExpressions,2);
assert.equal(result.totals.uniqueWithIPA,1);
assert.equal(result.totals.uniqueWithoutIPA,1);
assert.equal(result.scenes.length,1341);
assert.equal(result.masterRelease,'V260');
assert.equal(result.releaseAllowed,false);
assert.equal(result.srsEligible,false);
assert.equal(result.provenanceObserved[0].name,'UNSPECIFIED');
assert.equal(result.conflictSamples.length,0);
console.log('PASS 1341 scenes 230289 immutable rows, IPA coverage, expression grouping, review isolation');
