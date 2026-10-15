import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const root=path.resolve(process.argv[2]||'data/learning-v3');
const readJson=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const manifest=readJson('manifest.json');
const fail=message=>{throw new Error(message)};
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');

function decode(meta){
 const file=path.join(root,meta.file);
 if(!fs.existsSync(file))fail(`missing: ${meta.file}`);
 const text=fs.readFileSync(file,'utf8').trim();
 if(text.length!==meta.bytes)fail(`${meta.file}: bytes ${text.length} != ${meta.bytes}`);
 if(sha(text)!==meta.sha256)fail(`${meta.file}: sha256 mismatch`);
 const raw=zlib.gunzipSync(Buffer.from(text,'base64'));
 if(raw.length!==meta.rawBytes)fail(`${meta.file}: rawBytes ${raw.length} != ${meta.rawBytes}`);
 return JSON.parse(raw.toString('utf8'));
}

if(!manifest.release||!Number.isInteger(manifest.wordCount)||!Number.isInteger(manifest.kuCount))fail('invalid manifest header');
if(!manifest.taxonomy?.majors||!manifest.taxonomy?.minors)fail('taxonomy missing');
if(!Array.isArray(manifest.chunks)||!manifest.catalog)fail('chunk/catalog index missing');

const catalog=decode(manifest.catalog);
if(catalog.length!==manifest.wordCount)fail(`catalog wordCount ${catalog.length} != ${manifest.wordCount}`);
const catalogKU=new Map(),ownerCounts=new Map();
for(let i=0;i<catalog.length;i++){
 const row=catalog[i];
 if(row[0]!==i+1)fail(`catalog rank discontinuity at ${i+1}`);
 if(!Array.isArray(row[3]))fail(`catalog senses missing at rank ${row[0]}`);
 for(const sense of row[3]){
  const [kuId,owner]=sense;
  if(catalogKU.has(kuId))fail(`duplicate catalog ku_id: ${kuId}`);
  catalogKU.set(kuId,{rank:row[0],word:row[1],owner});
  ownerCounts.set(owner,(ownerCounts.get(owner)||0)+1);
 }
}
if(catalogKU.size!==manifest.kuCount)fail(`catalog kuCount ${catalogKU.size} != ${manifest.kuCount}`);

const seen=new Set();let decodedKU=0;
for(const meta of manifest.chunks){
 const rows=decode(meta);let local=0;
 for(const full of rows){
  const ku=full?.ku,kuId=ku?.ku_id;if(!kuId)fail(`${meta.file}: ku_id missing`);
  if(seen.has(kuId))fail(`duplicate chunk ku_id: ${kuId}`);seen.add(kuId);local++;decodedKU++;
  const cat=catalogKU.get(kuId);if(!cat)fail(`${meta.file}: KU absent from catalog: ${kuId}`);
  if(cat.rank!==full.rank||cat.word!==full.w)fail(`${meta.file}: rank/word mismatch for ${kuId}`);
  const owner=ku.scene||ku.track;
  if(Boolean(ku.scene)===Boolean(ku.track))fail(`${meta.file}: scene/track exclusivity failed for ${kuId}`);
  if(owner!==cat.owner)fail(`${meta.file}: owner mismatch for ${kuId}: ${owner} != ${cat.owner}`);
 }
 if(local!==meta.kus)fail(`${meta.file}: kus ${local} != ${meta.kus}`);
}
if(decodedKU!==manifest.kuCount||seen.size!==manifest.kuCount)fail(`decoded KU ${decodedKU}/${seen.size} != ${manifest.kuCount}`);

for(const id of Object.keys(manifest.taxonomy.minors)){
 const actual=ownerCounts.get(id)||0,expected=Number(manifest.sceneKuCounts?.[id]||0);
 if(actual!==expected)fail(`sceneKuCounts mismatch ${id}: ${actual} != ${expected}`);
}
for(const id of Object.keys(manifest.trackKuCounts||{})){
 const actual=ownerCounts.get(id)||0,expected=Number(manifest.trackKuCounts[id]);
 if(actual!==expected)fail(`trackKuCounts mismatch ${id}: ${actual} != ${expected}`);
}

console.log(JSON.stringify({
 status:'PASS',release:manifest.release,words:catalog.length,kus:catalogKU.size,
 majors:Object.keys(manifest.taxonomy.majors).length,minors:Object.keys(manifest.taxonomy.minors).length,
 chunks:manifest.chunks.length,sceneKU:Object.values(manifest.sceneKuCounts||{}).reduce((a,b)=>a+Number(b),0),
 trackKU:Object.values(manifest.trackKuCounts||{}).reduce((a,b)=>a+Number(b),0)
},null,2));
