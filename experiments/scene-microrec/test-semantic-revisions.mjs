import fs from 'node:fs';
import assert from 'node:assert/strict';
import {bilingualSeeds} from './bilingual-seeds.mjs';
const proposals=JSON.parse(fs.readFileSync(new URL('./semantic-revision-proposals.json',import.meta.url)));
const catalog=JSON.parse(fs.readFileSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url))).scenes;
const original=new Map(bilingualSeeds.map(x=>[x.scene_id,x]));
assert.equal(original.size,500);
const seen=new Set(),changes=[];
for(const p of proposals.items){
 assert.ok(catalog[p.scene_id],'UNKNOWN_SCENE');
 assert.ok(original.has(p.scene_id)&&!seen.has(p.scene_id),'DUPLICATE_OR_BAD_ID');
 assert.equal(p.status,'PROPOSED');
 assert.equal(p.training_approved,false);assert.equal(p.independent_review,false);
 assert.ok(p.revised_en&&p.revised_en!==original.get(p.scene_id).candidate_en);
 seen.add(p.scene_id);
 changes.push({scene_id:p.scene_id,original_en:original.get(p.scene_id).candidate_en,proposed_en:p.revised_en,chinese:catalog[p.scene_id].name,review_status:'PENDING_INDEPENDENT_BLIND_REVIEW',training_approved:false});
}
assert.equal(seen.size,12);
const out={schema:'scene500-english-change-review-v1',status:'REVISION_PROPOSAL_ONLY',changes};
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./semantic-revision-diff.json',import.meta.url),JSON.stringify(out,null,2));
console.log(JSON.stringify({status:out.status,revisions:changes.length,approved:0,unchangedSource:true}));
