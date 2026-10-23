import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const path=process.argv[2];if(!path)throw Error('Usage: node batch66-top100-gate.mjs <frozen_top100_workset.jsonl>');
const bytes=fs.readFileSync(path),rows=bytes.toString().trim().split('\n').map(JSON.parse);
assert.equal(rows.length,430);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'301b47e0bf5e813a4882992a150c991a596bc12ef1544e09d587bae3557eb72d');
const heads=new Map(),ku=new Set(),count={};
for(const r of rows){assert(Number.isInteger(r.frozen_rank)&&r.frozen_rank>=1&&r.frozen_rank<=1000);assert.equal(r.headword_id,'core20k:rank:'+r.frozen_rank);if(heads.has(r.headword))assert.equal(heads.get(r.headword),r.frozen_rank);else heads.set(r.headword,r.frozen_rank);assert(!ku.has(r.legacy_ku_id));ku.add(r.legacy_ku_id);assert.equal(r.production_ready,false);assert(r.blockers.includes('PRODUCTION_CERTIFICATION_ABSENT'));count[r.ku_type]=(count[r.ku_type]||0)+1;}
assert.equal(heads.size,100);assert.deepEqual(count,{Grammar:124,Pronunciation:10,Collocation:34,Sense:245,Contrast:9,'Usage/Risk':8});console.log('PASS: 100 frozen Top1000 heads, 430 unique candidate KU, 185 non-Sense, 0 promoted');
