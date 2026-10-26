#!/usr/bin/env node
// Read-only adversarial regression checks for CG-ZH candidate segmenter.
import assert from 'node:assert/strict';
import {segmentCandidates} from '../tools/chinese-core20k/segmentation/short-query-candidates.mjs';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const paths=(q,d,opt={})=>segmentCandidates(q,new Set(d),opt).candidates.map(c=>c.tokens);
const both=paths('两个人',['两','个','人','两个']);
assert(both.some(t=>same(t,['两','个','人'])),'NUM_CLF_DECOMPOSITION_LOST');
assert(both.some(t=>same(t,['两个','人'])),'LEXICALIZED_QUANTITY_LOST');
const oov=paths('咖啡☕',['咖啡']);
assert(oov.every(t=>t.join('')==='咖啡☕'),'OOV_EMOJI_LOSS');
const punctuation=paths('不坐地铁，坐公交',['不','坐','地铁','公交']);
assert(punctuation.length>0 && punctuation.every(t=>t.join('')==='不坐地铁，坐公交'),'NEGATION_PUNCTUATION_LOSS');
const unknown=paths('未登录词',[]);
assert(same(unknown[0],['未','登','录','词']),'OOV_FALLBACK_MISSING');
const constrained=paths('两个人',['两','个','人','两个'],{maxCandidates:1});
assert.equal(constrained.length,1,'CANDIDATE_BOUND');
assert.equal(constrained[0].join(''),'两个人');
const a=paths('三本书',['三','本','书','三本']);
assert(same(a,paths('三本书',['三','本','书','三本'])),'NONDETERMINISTIC_OUTPUT');
assert.throws(()=>segmentCandidates('',new Set()),/QUERY_LENGTH/);
assert.throws(()=>segmentCandidates('甲'.repeat(21),new Set()),/QUERY_LENGTH/);
assert.throws(()=>segmentCandidates(3,new Set()),/INVALID_QUERY/);
const normalized=segmentCandidates('e\u0301',new Set(['é']));
assert.equal(normalized.candidates[0].tokens.join(''),'é','NFC_NORMALIZATION_LOSS');
for (const cap of [NaN, Infinity, 0, -1, 1.5, 21, '3']) {
 assert.throws(()=>segmentCandidates('两个人',new Set(['两','个','人']),{maxCandidates:cap}),/INVALID_MAX_CANDIDATES/);
}
assert.throws(()=>segmentCandidates('甲',null),/INVALID_LEXICON/);
assert.throws(()=>segmentCandidates('甲',{}),/INVALID_LEXICON/);
assert.equal(segmentCandidates('甲',new Set(),{maxCandidates:20}).candidates.length,1);
console.log(JSON.stringify({status:'PASS',checks:21,scope:'EDGE_CASES_ONLY',production_ready:false,scene500_tested:false}));
