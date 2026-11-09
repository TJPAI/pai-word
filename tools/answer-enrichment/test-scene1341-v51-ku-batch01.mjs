import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
function parseCSV(src) {
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<src.length;i++){const c=src[i];
  if(quoted){if(c==='"'&&src[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}
  else if(c==='"')quoted=true;
  else if(c===','){row.push(cell);cell='';}
  else if(c==='\n'){row.push(cell.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 if(cell||row.length){row.push(cell);rows.push(row);}
 const keys=rows.shift().map(k=>k.replace(/^\uFEFF/,''));
 return rows.map(values=>Object.fromEntries(keys.map((k,i)=>[k,values[i]??''])));
}
const source=parseCSV(read('tools/integration/scene1341-ranked/v51-ranked.csv'));
const ledger=parseCSV(read('tools/answer-enrichment/scene1341-v51-2038-source-coverage-ledger.v2.csv'));
const pack=JSON.parse(read('tools/answer-enrichment/scene1341-v51-sc0001-ku001-020-draft.v1.json'));
const sourceBySense=new Map(source.map(r=>[r.sense_id,r]));
const kuById=new Map(pack.records.map(r=>[r.scene_ku_id,r]));
assert.equal(source.length,2038);
assert.equal(sourceBySense.size,2038);
assert.equal(ledger.length,2038);
assert.equal(kuById.size,20);
assert.equal(pack.records.length,20);
assert.equal(pack.release.activation_allowed,false);
assert.equal(pack.release.core20k_ku_reused,false);
const ranks=new Map();
let generated=0, notGenerated=0, others=0;
for(const [i,row] of ledger.entries()){
 const src=source[i];
 assert.equal(row.scene_id,src.scene_id);
 assert.equal(row.sense_id,src.sense_id);
 assert.equal(row.rank,src.rank);
 assert.equal(row.source_tier,src.tier);
 assert.equal(row.source_version,'V51');
 assert.equal(row.scene_ku_id,'SC1341-KU-'+src.sense_id.slice('SC-SENSE-'.length));
 assert.equal(row.playable,'false');
 assert.ok(row.scene_ku_id.startsWith('SC1341-KU-'));
 const rank=Number(src.rank),prior=ranks.get(src.scene_id)||0;
 assert.equal(rank,prior+1);
 ranks.set(src.scene_id,rank);
 const ku=kuById.get(row.scene_ku_id);
 if(ku){generated++;assert.equal(row.production_state,'GENERATED_QA_PENDING');
   assert.equal(ku.scene_id,src.scene_id);assert.equal(ku.source_sense_id,src.sense_id);
   assert.equal(ku.source_rank,rank);assert.equal(ku.expression,src.expression);
   assert.equal(ku.sense_zh,src.sense_zh);assert.equal(ku.source_tier,src.tier);
   assert.equal(ku.source_version,'V51');
   assert.equal(ku.production_ready,false);assert.equal(ku.activation_allowed,false);
   assert.equal(ku.qa.independent_semantic_verified,false);
   assert.equal(ku.question.type,'single_choice');
   assert.equal(ku.question.scoring,'exact_choice_id');
   assert.equal(ku.question.choices.length,4);
   assert.equal(new Set(ku.question.choices.map(c=>c.text)).size,4);
   const answer=ku.question.choices.find(c=>c.id===ku.question.correct_choice_id);
   assert.ok(answer);assert.equal(answer.text,src.expression);
   assert.equal(ku.question.correct_answer,src.expression);
   for(const field of ['example_en','example_zh','explanation_zh'])
     assert.ok(ku.answer[field]?.trim(),field+' missing '+ku.scene_ku_id);
   assert.ok(ku.answer.collocations.length>=2);
 } else {notGenerated++;assert.equal(row.production_state,'NOT_GENERATED');}
 if(!['NOT_GENERATED','GENERATED_QA_PENDING'].includes(row.production_state))others++;
}
assert.equal(ranks.size,10);
assert.equal(generated,20);
assert.equal(notGenerated,2018);
assert.equal(others,0);
console.log(JSON.stringify({verdict:'STRUCTURE_PASS',source:2038,scene_count:10,generated_qa_pending:20,not_generated:2018,playable:0,production_approved:0}));
