#!/usr/bin/env node
import {segmentCandidates} from '../tools/chinese-core20k/segmentation/short-query-candidates.mjs';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const d=JSON.parse(readFileSync(resolve(process.argv[2] ?? 'tools/chinese-core20k/qa/zh-short-query-segmentation-fixtures-20261026.json'),'utf8'));
let matched=0;
for(const f of d.fixtures){
 const lexicon=new Set([...f.expected_tokens, '两个','一种','十个','一次','三本']);
 const r=segmentCandidates(f.query,lexicon,{maxCandidates:20});
 assert(r.candidates.length>0 && r.candidates.length<=20);
 for(const c of r.candidates) assert.equal(c.tokens.join(''),f.query);
 if(r.candidates.some(c=>JSON.stringify(c.tokens)===JSON.stringify(f.expected_tokens))) matched++;
}
assert.equal(matched,d.fixtures.length,'GOLD_PATH_MISSING');
assert.throws(()=>segmentCandidates('',new Set()),/QUERY_LENGTH/);
assert.throws(()=>segmentCandidates('甲'.repeat(21),new Set()),/QUERY_LENGTH/);
assert.equal(segmentCandidates('甲乙',new Set()).candidates[0].tokens.join(''),'甲乙');
console.log(JSON.stringify({status:'PASS',gold_paths:matched,fixtures:d.fixtures.length,engine_tested:false,production_ready:false}));
