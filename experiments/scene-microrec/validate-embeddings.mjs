// Validate actual teacher encoding export, distinct from split dataset.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const [jobsFile,encodedFile]=process.argv.slice(2);
if(!jobsFile||!encodedFile)throw Error('USAGE: node validate-embeddings.mjs jobs.json encoded.json');
const jobs=JSON.parse(fs.readFileSync(jobsFile,'utf8'));
const d=JSON.parse(fs.readFileSync(encodedFile,'utf8'));
assert.equal(jobs.schema,'scene-microrec-teacher-jobs-v1');
assert.equal(d.schema,'scene-microrec-embedding-export-v1');
assert.equal(d.source_catalog_sha256,jobs.catalog_sha256);
assert.equal(d.teacher?.family,'multilingual-e5');
assert.ok(d.teacher.model_id&&d.teacher.revision&&d.teacher.license);
assert.ok(Number.isInteger(d.dimension)&&d.dimension>=16&&d.dimension<=4096);
assert.equal(d.vectors.length,jobs.tasks.length);
for(let i=0;i<d.vectors.length;i++){
 const v=d.vectors[i],task=jobs.tasks[i];
 assert.equal(v.scene_id,task.scene_id);assert.equal(v.kind,task.kind);assert.equal(v.text,task.text);
 assert.equal(v.teacher_vector.length,d.dimension);
 assert.ok(v.teacher_vector.every(x=>typeof x==='number'&&Number.isFinite(x)));
 const norm=Math.hypot(...v.teacher_vector);
 assert.ok(Math.abs(norm-1)<0.05,'UNNORMALIZED_VECTOR at '+i);
}
console.log(JSON.stringify({status:'REAL_TEACHER_EXPORT_VALID',examples:d.vectors.length,dimension:d.dimension,model:d.teacher.model_id,revision:d.teacher.revision}));
