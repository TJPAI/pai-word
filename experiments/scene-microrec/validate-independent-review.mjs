import fs from 'node:fs';
import assert from 'node:assert/strict';
import {bilingualSeeds} from './bilingual-seeds.mjs';
const path=new URL('./independent-blind-review-results.json',import.meta.url);
const source=new Set(bilingualSeeds.map(x=>x.scene_id));
const empty={schema:'scene500-independent-review-v1',status:'AWAITING_EXTERNAL_REVIEW',reviewer:'',blind_input_run:'',items:[]};
const doc=fs.existsSync(path)?JSON.parse(fs.readFileSync(path,'utf8')):empty;
assert.equal(doc.schema,'scene500-independent-review-v1');
assert.ok(['AWAITING_EXTERNAL_REVIEW','IN_PROGRESS','COMPLETE'].includes(doc.status));
const seen=new Set(),counts={PASS:0,REVISE:0,REJECT:0};
for(const x of doc.items){
 assert.ok(source.has(x.scene_id)&&!seen.has(x.scene_id),'BAD_OR_DUPLICATE_ID '+x.scene_id);
 seen.add(x.scene_id);
 assert.ok(['PASS','REVISE','REJECT'].includes(x.verdict));
 assert.ok(typeof x.rationale==='string'&&x.rationale.length>=30,'NO_INDIVIDUAL_REASON '+x.scene_id);
 if(x.verdict==='REVISE')assert.ok(typeof x.revised_en==='string'&&x.revised_en.length>=8,'MISSING_REVISION '+x.scene_id);
 counts[x.verdict]++;
}
if(doc.items.length)assert.ok(doc.reviewer&&doc.blind_input_run,'MISSING_EXTERNAL_REVIEWER_PROVENANCE');
if(doc.status==='COMPLETE')assert.equal(doc.items.length,500,'INCOMPLETE_INDEPENDENT_BLIND_REVIEW');
const publishable=doc.status==='COMPLETE'&&doc.items.length===500;
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./independent-review-readiness.json',import.meta.url),JSON.stringify({schema:'scene500-independent-review-readiness-v1',review_complete:publishable,reviewed:seen.size,remaining:500-seen.size,counts,training_permitted:false,reason:'Review provenance and supervised training approval require separate release decision'},null,2)+'\n');
console.log(JSON.stringify({status:publishable?'EXTERNAL_BLIND_REVIEW_COMPLETE_NOT_TRAINING_AUTHORIZED':'PENDING_EXTERNAL_BLIND_REVIEW',reviewed:seen.size,remaining:500-seen.size,counts,training_permitted:false}));
