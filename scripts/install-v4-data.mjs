import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const source=path.resolve(process.argv[2]||'pai-word-20000-v4');
const target=path.resolve(process.argv[3]||'data/learning-v3');
const expectedRelease='pai-word-20000-v4';
const fail=msg=>{throw new Error('[install-v4-data] '+msg)};
const read=p=>fs.readFileSync(p,'utf8');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');

if(!fs.existsSync(source)||!fs.statSync(source).isDirectory())fail('source directory not found: '+source);
const manifestPath=path.join(source,'manifest.json');
if(!fs.existsSync(manifestPath))fail('manifest.json missing');
const manifest=JSON.parse(read(manifestPath));
if(manifest.release!==expectedRelease)fail(`expected ${expectedRelease}, got ${manifest.release}`);
if(manifest.wordCount!==20000||manifest.kuCount!==35659)fail('unexpected word/KU count');
if(Object.keys(manifest.taxonomy?.majors||{}).length!==16)fail('taxonomy major count is not 16');
if(Object.keys(manifest.taxonomy?.minors||{}).length!==319)fail('taxonomy minor count is not 319');
if(!Array.isArray(manifest.chunks)||manifest.chunks.length!==404)fail('chunk count is not 404');

const assets=[manifest.catalog,...manifest.chunks];
for(const meta of assets){
  const file=path.join(source,meta.file);
  if(!fs.existsSync(file))fail('missing '+meta.file);
  const text=read(file);
  if(Buffer.byteLength(text)!==meta.bytes)fail(meta.file+' bytes mismatch');
  if(sha(text)!==meta.sha256)fail(meta.file+' sha256 mismatch');
  const raw=zlib.gunzipSync(Buffer.from(text,'base64'));
  if(raw.length!==meta.rawBytes)fail(meta.file+' rawBytes mismatch');
  JSON.parse(raw.toString('utf8'));
}
for(const name of ['taxonomy.json','words_master.jsonl'])if(!fs.existsSync(path.join(source,name)))fail('missing '+name);

const parent=path.dirname(target),base=path.basename(target),stamp=Date.now();
const staging=path.join(parent,`.${base}.v4-staging-${stamp}`);
const backup=path.join(parent,`.${base}.backup-${stamp}`);
fs.mkdirSync(parent,{recursive:true});
fs.mkdirSync(staging,{recursive:true});
const names=new Set(['manifest.json','taxonomy.json','words_master.jsonl',manifest.catalog.file,...manifest.chunks.map(x=>x.file)]);
for(const name of names)fs.copyFileSync(path.join(source,name),path.join(staging,name));

try{
  if(fs.existsSync(target))fs.renameSync(target,backup);
  fs.renameSync(staging,target);
  if(fs.existsSync(backup))fs.rmSync(backup,{recursive:true,force:true});
}catch(error){
  if(fs.existsSync(staging))fs.rmSync(staging,{recursive:true,force:true});
  if(!fs.existsSync(target)&&fs.existsSync(backup))fs.renameSync(backup,target);
  throw error;
}

console.log(JSON.stringify({status:'PASS',release:manifest.release,wordCount:manifest.wordCount,kuCount:manifest.kuCount,chunks:manifest.chunks.length,target},null,2));
