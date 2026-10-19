// Verify full-master candidate preservation without publishing data.
// node scripts/check-v1-preservation.mjs <master.json> <preservation.json.gz> <preservation-report.json>
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const [masterPath,packedPath,reportPath]=process.argv.slice(2);
if(!masterPath||!packedPath||!reportPath)throw Error('Provide all 3 paths');
const sha=b=>createHash('sha256').update(b).digest('hex');
const source=fs.readFileSync(masterPath),packed=fs.readFileSync(packedPath);
const master=JSON.parse(source),body=JSON.parse(gunzipSync(packed)),audit=JSON.parse(fs.readFileSync(reportPath));
assert.equal(master.words.length,13000);
assert.equal(body.items.length,12990);
assert.equal(audit.quarantine.length,10);
assert.equal(body.source_sha256,sha(source));
assert.equal(audit.preservation_gzip_sha256,sha(packed));
const fields=['examples','collocations','grammar_patterns','usage_notes','synonym_contrasts','word_family','senses','knowledge_units','provenance','content_status'];
const original=new Map(master.words.map(w=>[w.id,w]));
const kept=new Set(),kuIDs=new Set(),counts=Object.fromEntries(fields.slice(0,6).map(f=>[f,0]));
for(const w of body.items){
 assert(!kept.has(w.id));kept.add(w.id);
 const o=original.get(w.id);assert(o,'missing source word '+w.id);
 for(const f of fields)assert.deepEqual(w[f],o[f],'asset changed '+w.id+':'+f);
 const senses=new Set((w.senses||[]).map(s=>s.id));
 for(const k of w.knowledge_units||[]){
  assert(!kuIDs.has(k.id),'duplicated KU '+k.id);kuIDs.add(k.id);
  if(k.sense_id)assert(senses.has(k.sense_id),'dangling sense '+k.id);
 }
 for(const f of fields.slice(0,6))counts[f]+=(Array.isArray(w[f])?w[f].length:(w[f]?1:0));
}
const isolated=new Set(audit.quarantine.map(w=>w.id));
assert.equal(kept.size+isolated.size,master.words.length);
for(const w of master.words)assert(kept.has(w.id)!==isolated.has(w.id));
assert.equal(kuIDs.size,16574);
assert.equal(counts.examples,38970);
assert.equal(counts.collocations,38958);
assert.equal(counts.usage_notes,6182);
console.log(JSON.stringify({status:'PASS_NON_PUBLISHABLE',records:kept.size,kuIds:kuIDs.size,fieldCounts:counts}));
