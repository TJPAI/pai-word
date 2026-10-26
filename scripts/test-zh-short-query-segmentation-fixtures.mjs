#!/usr/bin/env node
// CG-ZH: standalone, read-only QA of 20-character Chinese segmentation gold fixtures.
// This validates annotation integrity only; it does not assert Scene500 engine output.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const file = resolve(process.argv[2] ?? 'tools/chinese-core20k/qa/zh-short-query-segmentation-fixtures-20261026.json');
const d = JSON.parse(readFileSync(file, 'utf8'));
const check = (ok, reason) => {if (!ok) throw new Error(reason);};
check(d.schema === 'pai-word-zh-short-query-segmentation-gold-fixtures-v1', 'BAD_SCHEMA');
check(d.source_runtime_sha256 === '18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093', 'BAD_RUNTIME_SOURCE');
check(d.production_ready === false && d.changes_runtime === false, 'UNSAFE_FLAGS');
check(d.max_query_characters === 20 && Array.isArray(d.fixtures) && d.fixtures.length >= 10, 'BAD_SCOPE');
const seen = new Set();
for (const [i, f] of d.fixtures.entries()) {
  check(typeof f.query === 'string' && [...f.query].length >= 1 && [...f.query].length <= 20, 'QUERY_LENGTH_' + i);
  check(!seen.has(f.query), 'DUPLICATE_QUERY_' + i); seen.add(f.query);
  check(Array.isArray(f.expected_tokens) && f.expected_tokens.length > 0 && f.expected_tokens.every(x => typeof x === 'string' && x.length > 0), 'EMPTY_TOKEN_' + i);
  check(f.expected_tokens.join('') === f.query, 'NON_LOSSLESS_SEGMENTATION_' + i);
  check(typeof f.pattern === 'string' && f.pattern.length >= 3 && typeof f.why_zh === 'string' && f.why_zh.length >= 8, 'MISSING_LINGUISTIC_EVIDENCE_' + i);
}
console.log(JSON.stringify({status:'PASS',fixture_count:d.fixtures.length,source_runtime_sha256:d.source_runtime_sha256,sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),scope:'ANNOTATION_INTEGRITY_ONLY',engine_tested:false}));
