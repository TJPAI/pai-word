import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const path=process.argv[2];
if(!path)throw Error('USAGE: node scripts/core20k-production-staging-gate.mjs <staging.json>');
const bytes=fs.readFileSync(path), pack=JSON.parse(bytes.toString('utf8'));
const old=pack.schema_version==='pai-core20k-production-intake-v1';
const newer=pack.schema_version==='pai-core20k-production-b161-staging-v1';
if(!old&&!newer)throw Error('UNSUPPORTED_STAGING_SCHEMA:'+pack.schema_version);
for(const k of ['test_only','release_eligible','srs_write_allowed'])assert.equal(pack[k],k==='test_only',`unsafe pack ${k}`);
if(newer)assert.equal(pack.semantic_verified,false);
assert(Array.isArray(pack.records)&&pack.records.length>0);
const ku=new Set(),senseOwner=new Map(),hwLemma=new Map(),risk=[];
for(const [i,r] of pack.records.entries()){
 for(const k of ['ku_id','sense_id','headword_id'])assert(typeof r[k]==='string'&&r[k].trim(),`missing ${k} at ${i}`);
 assert(!ku.has(r.ku_id),`duplicate ku_id ${r.ku_id}`);ku.add(r.ku_id);
 const owner=senseOwner.get(r.sense_id);if(owner!==undefined)assert.equal(owner,r.headword_id,`sense owner conflict ${r.sense_id}`);senseOwner.set(r.sense_id,r.headword_id);
 if(r.headword){const lemma=hwLemma.get(r.headword_id);if(lemma!==undefined)assert.equal(lemma,r.headword,`headword lemma conflict ${r.headword_id}`);hwLemma.set(r.headword_id,r.headword)}
 assert.equal(r.test_only,true,`record ${i} not test_only`);
 for(const k of ['release_eligible','srs_write_allowed','semantic_verified']){assert.equal(r.quality?.[k],false,`unsafe quality ${k} at ${i}`);if(k in r)assert.equal(r[k],false,`unsafe record ${k} at ${i}`)}
 if(old){assert.equal(r.quality?.stage,'PRODUCTION_INTAKE_QUARANTINE');assert.equal(r._intake?.production_review,'PENDING_INDEPENDENT_SEMANTIC_CERTIFICATION')}
 if(newer){assert.equal(r.staging_metadata?.independent_semantic_certification,'PENDING');assert(['cloze','inflected_cloze'].includes(r.render_kind),'unsupported render kind');assert.equal(r.prompt.replace('___',r.content?.answer),r.content?.example_en,`cloze mismatch ${r.ku_id}`)}
 if(r.staging_metadata?.review_flags?.length||r._intake?.risk_flags?.length)risk.push(r.ku_id);
}
console.log(JSON.stringify({status:'PASS_STAGING_ISOLATION_ONLY',schema:pack.schema_version,records:pack.records.length,unique_ku_ids:ku.size,risk_flagged:risk.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),production_release_eligible:0,runtime_identity_checked:false},null,2));
