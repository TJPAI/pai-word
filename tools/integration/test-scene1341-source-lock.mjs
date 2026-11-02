import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const lock=JSON.parse(fs.readFileSync('tools/integration/scene1341-source-lock-20261102.json','utf8'));
assert.equal(lock.schema,'pai-scene1341-source-lock-v1');
assert.equal(lock.inputs.length,2);
assert.equal(lock.activation_allowed,false);
assert.equal(lock.scene_catalog_certified,false);
assert.equal(lock.crosswalk_state,'UNVERIFIED');
for(const input of lock.inputs){assert.equal(input.rows,1341);assert.match(input.sha256,/^[a-f0-9]{64}$/);}
const sourceDir=process.argv[2];
if(!sourceDir){
 console.log('PASS Scene1341 source-lock metadata; raw CSV not checked on this runner, release blocked');
 process.exit(0);
}
const verified=[];
for(const spec of lock.inputs){
 const bytes=fs.readFileSync(path.join(sourceDir,spec.filename));
 assert.equal(bytes.length,spec.size_bytes,'Scene1341 size mismatch');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),spec.sha256,'Scene1341 SHA256 mismatch');
 verified.push(spec.filename);
}
console.log(JSON.stringify({status:'PASS',verified,sourceBytesVerified:true,sceneCatalogCertified:false,activationAllowed:false}));
