#!/usr/bin/env node
// Read-only preflight of lexical identity and search_aliases; not a tokenizer or Hybrid Top5 test.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const path = resolve(process.argv[2] ?? 'scene500-recommendation/zh-core20k-v0101-scene500-runtime.json');
const raw = readFileSync(path);
const expectedSha = '18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093';
const sha = createHash('sha256').update(raw).digest('hex');
if (sha !== expectedSha) throw Error(`UNEXPECTED_RUNTIME_SHA256 ${sha}`);
const data = JSON.parse(raw.toString('utf8'));
if (data.contract_version !== '1.1' || !Array.isArray(data.terms) || data.terms.length !== 20000) throw Error('CONTRACT_ERROR');
const idByTerm = new Map();
const ids = new Set();
for (const t of data.terms) {
  if (!t.term || !t.term_id || ids.has(t.term_id) || idByTerm.has(t.term)) throw Error('LEXICAL_ID_DUPLICATE');
  const expectedId = 'zh_' + createHash('sha256').update(t.term, 'utf8').digest('hex').slice(0,20);
  if (expectedId !== t.term_id) throw Error(`TERM_ID_ERROR ${t.term}`);
  ids.add(t.term_id);
  idByTerm.set(t.term, t.term_id);
}
const aliases = Object.entries(data.search_aliases ?? {});
const collisions = [];
for (const [surface, canonical] of aliases) {
  if (!idByTerm.has(canonical)) throw Error(`ALIAS_TARGET_MISSING ${canonical}`);
  if (idByTerm.has(surface) && idByTerm.get(surface) !== idByTerm.get(canonical)) {
    collisions.push({surface, source_id:idByTerm.get(surface), target:canonical, target_id:idByTerm.get(canonical)});
  }
}
// Reference resolution policy: exact lexical identity always wins; alias may only expand recall.
function resolveSurface(s) {
  if (idByTerm.has(s)) return {type:'exact', id:idByTerm.get(s)};
  if (Object.hasOwn(data.search_aliases ?? {},s)) {
    const target=data.search_aliases[s];
    return {type:'alias_expansion',id:idByTerm.get(target)};
  }
  return {type:'unknown'};
}
for (const c of collisions) {
  if (resolveSurface(c.surface).id !== c.source_id || resolveSurface(c.surface).type !== 'exact') throw Error(`ALIAS_SHADOWED ${c.surface}`);
}
console.log(JSON.stringify({status:'PASS',source_sha256:sha,term_count:ids.size,alias_count:aliases.length,distinct_identity_collisions:collisions.length,collisions,policy:'EXACT_MEMBER_FIRST',scope:'STATIC_RUNTIME_REFERENCE_ONLY',hybrid_top5_tested:false},null,2));
