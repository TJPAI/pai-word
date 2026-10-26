import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const m=read('rebuild-preview/batch93-overlay-release-candidate-manifest.json');
const p=read('rebuild-preview/b218-isolated/batch93_nonrelease_teaching_pack.json');
const h=read('tools/integration/batch93-dual-ai-handoff.v1.json');
const tests={
 semantic_double_approved:h.semantic_certified_ku_ids.length===6&&h.semantic_certified_ku_ids.every(id=>p.records.some(row=>row.ku_id===id)),
 ku_binding_registered:h.sense_binding_registered===true&&h.binding_kind==='KU_ANCHORED_SENSE',
 runtime_and_pack_pinned:m.runtime_sha256===h.evidence.runtime_sha256&&m.pack_sha256===h.evidence.source_pack_sha256,
 production_manifest:m.status==='PRODUCTION_READY'&&m.activation_allowed===true,
 registrar_signed:m.authority?.registrar_signed===true&&m.reviewed_crosswalk?.length===p.records.length,
 license_approved:m.authority?.license_approved===true,
 release_signed:m.authority?.release_signed===true,
 record_flags_ready:p.records.every(x=>x.content_certified===true&&x.production_ready===true),
};
assert.equal(new Set(m.ku_ids).size,m.ku_ids.length,'duplicate manifest KU');
assert.deepEqual(m.ku_ids,p.records.map(x=>x.ku_id),'pack/manifest membership mismatch');
const missing=Object.entries(tests).filter(([,ready])=>!ready).map(([name])=>name);
const result={batch:'Batch93',total:p.records.length,semantic_certified:tests.semantic_double_approved,identity_registered:tests.ku_binding_registered,production_activation_ready:missing.length===0,remaining_gates:missing};
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
else console.log('Batch93 readiness:',JSON.stringify(result));
assert.equal(result.production_activation_ready,false,'staging Batch93 must remain disabled');
assert.equal(tests.semantic_double_approved,true,'do not discard achieved semantic certification');
assert.equal(tests.ku_binding_registered,true,'do not discard registered identity');
console.log('PASS Batch93 release readiness check: verified semantic/binding achievements, still fail-closed');
