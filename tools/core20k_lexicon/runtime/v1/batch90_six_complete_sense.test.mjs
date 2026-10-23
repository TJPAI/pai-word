import fs from 'node:fs';import assert from 'node:assert/strict';
const rows=fs.readFileSync(new URL('./batch90_six_complete_source_checked_sense.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
assert.equal(rows.length,6);
assert.equal(new Set(rows.map(x=>x.ku_id)).size,6);
assert.equal(new Set(rows.map(x=>x.headword_id)).size,6);
for(const row of rows){
 assert.equal(row.headword_id,'core20k:rank:'+row.rank);
 assert.equal(row.ku_type,'Sense');
 for(const field of ['sense_id','gloss_en','gloss_zh','us_ipa','teaching_objective','prompt','correct_answer','example_en','example_zh'])
  assert(typeof row[field]==='string'&&row[field].trim(),row.ku_id+' '+field);
 assert.equal(row.content_certified,false);
 assert.equal(row.production_ready,false);
 assert(row.source_attribution?.some(x=>x.url.startsWith('https://dictionary.cambridge.org/')));
}
console.log('PASS 6/6 complete staging KU; immutable IDs, source URL present; zero early certification');
