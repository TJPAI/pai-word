// Asset-only integration gate; run with pinned catalog, V0.10.1 runtime, and associations.
// node scene500-recommendation/v0101-asset-gate.mjs catalog.json runtime.json associations.json
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const paths=process.argv.slice(2);assert.equal(paths.length,3,'Expected catalog runtime associations paths');
const expected=['35a680bee9ec2fe207c877c82da306b1bc1c77685457cfb489193732453bc4e8','18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093','d6de9818f5056330b6d57d6b7c728a1457e66a4d241aac173ba7eb1c5f770213'];
const buffers=paths.map(p=>fs.readFileSync(p));buffers.forEach((b,i)=>assert.equal(createHash('sha256').update(b).digest('hex'),expected[i],'SHA_MISMATCH_'+i));
const [catalog,lex,assoc]=buffers.map(b=>JSON.parse(b));assert.equal(catalog.scene_count,500);assert.equal(Object.keys(catalog.scenes).length,500);
for(let i=1;i<=500;i++)assert.ok(catalog.scenes['S'+String(i).padStart(3,'0')]);
assert.equal(lex.data_version,'0.10.1-evidence-compat');assert.equal(lex.contract_version,'1.1');assert.equal(lex.integration_ready,true);assert.equal(lex.production_ready,false);assert.equal(lex.terms.length,20000);
const terms=new Map();for(const t of lex.terms){assert.ok(t.term_id&&t.term&&t.normalized_term);assert.ok(!terms.has(t.term_id));terms.set(t.term_id,t.term)}
assert.equal(assoc.links.length,3553);const pairs=new Set();for(const a of assoc.links){assert.equal(terms.get(a.term_id),a.term);assert.ok(catalog.scenes[a.scene_id]);const k=a.term_id+'|'+a.scene_id;assert.ok(!pairs.has(k));pairs.add(k)}
console.log(JSON.stringify({status:'PASS_ASSET_CONTRACT',version:lex.data_version,terms:terms.size,scenes:500,links:pairs.size}));
