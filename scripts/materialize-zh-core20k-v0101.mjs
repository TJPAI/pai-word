#!/usr/bin/env node
// Reconstruct the canonical V0.10.1 Chinese Core20K Scene500 JSON without modifying source data.
// Run at repository root: node scripts/materialize-zh-core20k-v0101.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
const input = resolve('data/zh-core20k-v0101-scene500-runtime.json.gz.b64');
const output = resolve('scene500-recommendation/zh-core20k-v0101-scene500-runtime.json');
const EXPECTED_GZIP_SHA256 = '46a4ca25d890b7699cdab54fd12fd4dfef1b56b43bfbe3e6e3838503a3d32d28';
const EXPECTED_JSON_SHA256 = '18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093';
const EXPECTED_JSON_BYTES = 6454987;
const hex = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encoded = readFileSync(input, 'utf8').trim();
if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw Error('INVALID_BASE64_ALPHABET');
const zipped = Buffer.from(encoded, 'base64');
if (hex(zipped) !== EXPECTED_GZIP_SHA256) throw Error('ZH_RUNTIME_GZIP_SHA256_MISMATCH');
const json = gunzipSync(zipped);
if (json.length !== EXPECTED_JSON_BYTES || hex(json) !== EXPECTED_JSON_SHA256) {
  throw Error('ZH_RUNTIME_JSON_INTEGRITY_MISMATCH');
}
const parsed = JSON.parse(json.toString('utf8'));
if (parsed.contract_version !== '1.1' || parsed.data_version !== '0.10.1-evidence-compat' ||
    !Array.isArray(parsed.terms) || parsed.terms.length !== 20000 ||
    new Set(parsed.terms.map(t => t.term_id)).size !== 20000) {
  throw Error('ZH_RUNTIME_CONTRACT_INVARIANT_FAILED');
}
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, json);
console.log(JSON.stringify({status:'PASS', file:output, bytes:json.length,
  sha256:hex(json), terms:parsed.terms.length, contract_version:parsed.contract_version}));
