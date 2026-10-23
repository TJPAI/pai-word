import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=new URL('.',import.meta.url);
const bytes=readFileSync(new URL('batch93_nonrelease_teaching_pack.json',base));
const pack=JSON.parse(bytes),m=JSON.parse(readFileSync(new URL('batch93_nonrelease_manifest.json',base),'utf8'));
assert.equal(createHash('sha256').update(bytes).digest('hex'),m.pack_sha256);
assert.equal(pack.records.length,6);
assert.equal(m.record_count,6);
assert.equal(m.production_ready_ku_count,0);
assert.equal(m.release_eligible,false);
assert.equal(m.pack_version,pack.pack_version);
assert.equal(new Set(pack.records.map(r=>r.ku_id)).size,6);
for(const row of pack.records){
assert.equal(row.headword_id,'core20k:rank:'+row.rank);
assert.notEqual(row.quality_status,'PRODUCTION_READY');
assert.notEqual(row.evidence_status,'PRODUCTION_READY');
assert.equal(row.production_ready,false);
}
console.log('PASS: six preserved KUs; source SHA256; manifest match; nonrelease gate');
