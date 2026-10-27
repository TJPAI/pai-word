// Independent teacher-to-student data contract validator.
// This tool deliberately never labels a dataset "distilled" until real teacher vectors exist.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const file=process.argv[2];
if(!file)throw Error('USAGE: node validate-teacher-data.mjs <teacher-export.json>');
const d=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(d.schema,'scene-microrec-teacher-v1');
assert.equal(d.teacher?.family,'multilingual-e5');
assert.ok(d.teacher.model_id && d.teacher.revision && d.teacher.license,'MISSING_TEACHER_PROVENANCE');
assert.ok(d.source_catalog_sha256,'MISSING_SOURCE_CATALOG_SHA');
assert.ok(Number.isInteger(d.dimension)&&d.dimension>=16&&d.dimension<=4096);
assert.ok(Array.isArray(d.examples)&&d.examples.length>0);
const seen=new Set();
for(const e of d.examples){
 assert.ok(typeof e.query==='string'&&e.query.trim());
 assert.match(e.scene_id,/^S\d{3,4}$/);
 assert.ok(['train','validation','test'].includes(e.split));
 assert.ok(Array.isArray(e.teacher_vector)&&e.teacher_vector.length===d.dimension);
 assert.ok(e.teacher_vector.every(x=>typeof x==='number'&&Number.isFinite(x)));
 const key=e.query+'\0'+e.scene_id;
 assert.ok(!seen.has(key),'DUPLICATE_QUERY_SCENE');
 seen.add(key);
}
const querySplits=new Map();
for(const e of d.examples){
 const q=e.query.normalize('NFKC').trim().toLowerCase();
 const prev=querySplits.get(q);
 assert.ok(!prev||prev===e.split,'QUERY_SPLIT_LEAKAGE');
 querySplits.set(q,e.split);
}
const counts=Object.fromEntries(['train','validation','test'].map(s=>[s,d.examples.filter(e=>e.split===s).length]));
assert.ok(counts.train>0 && counts.validation>0 && counts.test>0,'MISSING_SPLIT');
console.log(JSON.stringify({status:'VALID_TEACHER_DATA',teacher:d.teacher,examples:d.examples.length,splits:counts}));
