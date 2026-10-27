import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bilingualSeeds} from './bilingual-seeds.mjs';
import {semanticReviewPilot} from './semantic-review-pilot.mjs';
const cat=JSON.parse(fs.readFileSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url)));
const byId=new Map(bilingualSeeds.map(x=>[x.scene_id,x]));
const counts={PASS_CANDIDATE:0,AMBIGUOUS:0,NEEDS_REVISION:0};
const seen=new Set();
for(const r of semanticReviewPilot){
 assert.ok(cat.scenes[r.scene_id]&&byId.has(r.scene_id),'UNKNOWN_SCENE');
 assert.ok(!seen.has(r.scene_id),'DUPLICATE_REVIEW');seen.add(r.scene_id);
 assert.ok(Object.hasOwn(counts,r.verdict),'UNKNOWN_VERDICT');
 assert.ok(r.rationale.length>=32,'INSUFFICIENT_REASON '+r.scene_id);
 assert.equal(r.independent_review,false);
 assert.equal(r.training_approved,false);
 if(r.suggested_en)assert.ok(r.verdict!=='PASS_CANDIDATE');
 counts[r.verdict]++;
}
console.log(JSON.stringify({status:'FIRST_PASS_ONLY_NOT_CERTIFIED',reviewed:seen.size,counts,approvedForTraining:0}));
