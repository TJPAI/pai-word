import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bilingualSeeds} from './bilingual-seeds.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url)));
const seen=new Set();
for(const x of bilingualSeeds){
 assert.ok(catalog.scenes[x.scene_id],'UNKNOWN_SCENE '+x.scene_id);
 assert.ok(!seen.has(x.scene_id),'DUPLICATE_SCENE');seen.add(x.scene_id);
 assert.match(x.candidate_en,/^[A-Za-z][\x20-\x7e]+$/);
 assert.equal(x.review_status,'UNREVIEWED');
 assert.equal(x.use_for_training,false,'UNCERTIFIED_DATA_ENTERED_TRAINING');
 assert.ok(x.provenance);
}
console.log(JSON.stringify({status:'PASS_CANDIDATE_SCHEMA_ONLY',proposedPairs:bilingualSeeds.length,trainingApproved:0,remainingScenes:500-seen.size}));
