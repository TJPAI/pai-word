import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {inspectMasterBlobIndex} from './verify-scene1341-master-blob-index.mjs';

// Synthetic complete 1,341-scene fixture; never presented as real Master coverage.
const root=resolve('/tmp/cgmain-master-blob-test/tools/scene1341_master/production');
const scenes={},files=new Map();
const sha=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
for(let i=1;i<=1341;i++){
 const id='SC50-'+String(i).padStart(4,'0');
 const count=i===1?228949:1;
 const doc={schema_version:'scene1341-master-scene/v1',scene_id:id,
  record_count:count,release_allowed:false,srs_eligible:false,
  records:Array(count).fill(null)};
 const bytes=Buffer.from(JSON.stringify(doc),'utf8');
 const path='tools/scene1341_master/production/scenes/'+id+'.json';
 scenes[id]={path,records:count,git_blob_sha1:sha(bytes)};
 files.set(resolve(root,'../../..',path),bytes);
}
const index={schema_version:'scene1341-master-index/v1',
 scene_count:1341,source_associations:230289,release_allowed:false,srs_eligible:false,
 master_release:{version:'V270'},scenes};
files.set(resolve(root,'SCENE1341_LIVE_INDEX.json'),JSON.stringify(index));
const read=async (path,encoding)=>{const value=files.get(resolve(path));
 if(value===undefined){const e=Error('missing');e.code='ENOENT';throw e}
 return encoding==='utf8'?String(value):value};
const pass=await inspectMasterBlobIndex({rootDir:root,read});
assert.equal(pass.ok,true);assert.equal(pass.checked,1341);
assert.equal(pass.records,230289);assert.equal(pass.mismatch.length,0);
const badPath=resolve(root,'../../..',scenes['SC50-0027'].path);
files.set(badPath,Buffer.from('{"bad":"out-of-index"}'));
const fail=await inspectMasterBlobIndex({rootDir:root,read});
assert.equal(fail.ok,false);
assert.equal(fail.mismatch.length,1);
assert.equal(fail.mismatch[0].id,'SC50-0027');
assert.equal(fail.mismatch[0].expected,scenes['SC50-0027'].git_blob_sha1);
assert.notEqual(fail.mismatch[0].actual,fail.mismatch[0].expected);
console.log('PASS: full 1341 / 230289 synthetic index, detects SC0027 stale blob without bypass');
