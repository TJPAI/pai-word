// Batch65: validate frozen-headword rank crosswalk before candidate review.
// Run against a producer-generated JSONL whose ranks have been sourced from V2.0.6 frozen CSV.
import fs from 'node:fs';import assert from 'node:assert/strict';
const rows=fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map(x=>JSON.parse(x));
assert.equal(rows.length,407);
const ids=new Set(),heads=new Map();
for(const x of rows){
 assert(!ids.has(x.legacy_ku_id),'duplicate legacy KU');ids.add(x.legacy_ku_id);
 assert(Number.isInteger(x.frozen_rank)&&x.frozen_rank>=1&&x.frozen_rank<=20000,'invalid frozen rank');
 assert.equal(x.review_gate,'BLOCKED_PENDING_CERTIFICATION');
 assert.equal(x.production_ready,false);
 assert(x.blockers.includes('PRODUCTION_CERTIFICATION_ABSENT'));
 if(heads.has(x.headword))assert.equal(heads.get(x.headword),x.frozen_rank);
 else heads.set(x.headword,x.frozen_rank);
}
assert.equal(heads.size,100);
assert.equal([...heads.values()].filter(rank=>rank<=1000).length,95);
console.log('PASS 407 unique KU candidates; 100 frozen identities; 95 frozen top-1000; zero promoted');
