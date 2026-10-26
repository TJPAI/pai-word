#!/usr/bin/env node
// Read-only evaluation of the CG-ZH experimental tokenizer against canonical Chinese Core20K.
// Run AFTER: node scripts/materialize-zh-core20k-v0101.mjs
// Then: node scripts/evaluate-zh-short-query-core20k.mjs
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {segmentCandidates} from '../tools/chinese-core20k/segmentation/short-query-candidates.mjs';

const runtimePath=process.argv[2] ?? 'scene500-recommendation/zh-core20k-v0101-scene500-runtime.json';
const fixturePath=process.argv[3] ?? 'tools/chinese-core20k/qa/zh-short-query-segmentation-fixtures-20261026.json';
const raw=readFileSync(runtimePath);
const sha=createHash('sha256').update(raw).digest('hex');
const EXPECTED='18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093';
assert.equal(sha,EXPECTED,'RUNTIME_SHA_MISMATCH');
const runtime=JSON.parse(raw.toString('utf8'));
assert.equal(runtime.contract_version,'1.1');
assert.equal(runtime.terms.length,20000);
const ids=new Set(),dict=new Set();
for(const t of runtime.terms){
 assert.equal(typeof t.term,'string');
 assert.equal(typeof t.term_id,'string');
 assert(!ids.has(t.term_id),'DUPLICATE_TERM_ID '+t.term_id);
 ids.add(t.term_id);
 dict.add(t.term.normalize('NFC'));
}
const gold=JSON.parse(readFileSync(fixturePath,'utf8'));
assert.equal(gold.source_runtime_sha256,sha);
assert.equal(gold.schema,'pai-word-zh-short-query-segmentation-gold-fixtures-v1');
assert.equal(gold.production_ready,false);
const checks=[];
for(const f of gold.fixtures){
 const start=performance.now();
 const result=segmentCandidates(f.query,dict,{maxCandidates:20});
 const ms=+(performance.now()-start).toFixed(3);
 assert(result.candidates.length>0 && result.candidates.length<=20,'NO_CANDIDATE '+f.query);
 for(const c of result.candidates)assert.equal(c.tokens.join(''),f.query.normalize('NFC'),'LOSSY '+f.query);
 const goldFound=result.candidates.some(c=>JSON.stringify(c.tokens)===JSON.stringify(f.expected_tokens));
 const missingGoldTokens=[...new Set(f.expected_tokens.filter(t=>!dict.has(t.normalize('NFC'))))];
 const fallbackCompatible=missingGoldTokens.filter(t=>Array.from(t.normalize('NFC')).length===1);
 const missingMultiCharTokens=missingGoldTokens.filter(t=>Array.from(t.normalize('NFC')).length>1);
 const goldIsLossless=f.expected_tokens.join('')===result.normalizedQuery;
 assert(goldIsLossless,'GOLD_ANNOTATION_NOT_LOSSLESS '+f.query);
 const diagnosis=goldFound?'GOLD_IN_TOP20':
  missingMultiCharTokens.length?'GOLD_MULTICHAR_TOKENS_ABSENT_FROM_RUNTIME':
  'GOLD_VALID_BUT_PRUNED_OR_RANKED_OUT';
 checks.push({query:f.query,gold_found:goldFound,diagnosis,
  missing_gold_tokens:missingGoldTokens,missing_multichar_tokens:missingMultiCharTokens,
  fallback_compatible_single_chars:fallbackCompatible,candidates:result.candidates.length,elapsed_ms:ms,
  gold_tokens_all_in_runtime:missingGoldTokens.length===0,top_candidate:result.candidates[0].tokens});
}
const observed=checks.filter(x=>x.gold_found).length;
console.log(JSON.stringify({status:'MEASURED_NOT_CERTIFIED',source_runtime_sha256:sha,term_count:ids.size,
  fixture_count:checks.length,gold_paths_found:observed,gold_paths_missing:checks.length-observed,
  elapsed_ms_total:+checks.reduce((n,x)=>n+x.elapsed_ms,0).toFixed(3),
  checks,semantic_quality_verified:false,scene500_tested:false,production_ready:false},null,2));
// A missed gold path is a reported algorithmic regression, not disguised as a passing score.
// The experiment is non-production, so preserve a report rather than mutating Runtime.
