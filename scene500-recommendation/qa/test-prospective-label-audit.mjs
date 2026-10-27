import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root='scene500-recommendation/';
const source=read(root+'qa/prospective-24-v1.json');
const audit=read(root+'qa/prospective-24-label-audit-v1.json');
const catalog=read(root+'catalog-v0.2.json');
assert.equal(source.cases.length,24);
assert.equal(audit.source,root+'qa/prospective-24-v1.json');
const cases=new Map(source.cases.map(c=>[c.query,c]));
assert.equal(cases.size,24);
assert.ok(audit.findings.length>=2);
for(const f of audit.findings){
 const c=cases.get(f.query);
 assert.ok(c,'unknown audit query '+f.query);
 assert.deepEqual(f.original,c.expected,'edited frozen expectation '+f.query);
 assert.ok(f.disposition==='PASS_EDITORIAL'||f.disposition.startsWith('HOLD_'));
 assert.ok(typeof f.rationale==='string'&&f.rationale.length>=12);
 for(const id of [...(f.original||[]),...(f.candidateAlternatives||[])])
  assert.ok(catalog.scenes[id], 'unknown scene '+id);
}
assert.ok(audit.findings.some(f=>f.query.includes('打车')&&f.disposition==='HOLD_UNDERSPECIFIED'));
assert.equal(catalog.scenes.S080.name,'乘出租车');
assert.equal(catalog.scenes.S081.name,'网约车');
console.log('PASS_PROSPECTIVE_LABEL_AUDIT_STRUCTURE: '+audit.findings.length+' findings; 24 frozen queries unchanged; no certification implied');
