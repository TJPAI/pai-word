// Read-only runtime-diff audit. Run: node scripts/audit-core13k-core20k-content.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p);
const json=p=>JSON.parse(read(p).toString('utf8'));
const manifest=json('data/learning-v3/manifest.json');
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
function unpack(info){
 const encoded=read('data/learning-v3/'+info.file).toString('utf8').trim();
 assert.equal(encoded.length,info.bytes,info.file+' encoded byte length');
 assert.equal(digest(encoded),info.sha256,info.file+' SHA');
 const packed=Buffer.from(encoded,'base64');
 const raw=zlib.gunzipSync(packed);
 assert.equal(raw.length,info.rawBytes,info.file+' uncompressed length');
 return JSON.parse(raw.toString('utf8'));
}
const catalog=unpack(manifest.catalog);
const chunks=manifest.chunks.map(unpack);
const oldWords=new Map(),oldKU=new Map();
for(const row of catalog){const [rank,lemma,pos,senses]=row;oldWords.set(lemma.toLowerCase(),{rank,lemma,pos});for(const ku of senses){const [id,scene,type,title,sp,zh]=ku;assert(!oldKU.has(id),'duplicate old KU');oldKU.set(id,{id,lemma,scene,type,title,zh});}}
const rich=new Map();
for(const group of chunks)for(const w of group){
 const map=new Map();
 for(const [id,sense] of Object.entries(w.s||{}))map.set(id,{e:sense.e||[],c:sense.c||'',x:sense.x||'',definition:sense.definition||''});
 rich.set(w.w.toLowerCase(),{ipaUS:w.ipaUS||'',ipaUK:w.ipaUK||'',root:w.root||'',allSenses:w.allSenses||[],byKU:map});
}
const newer=JSON.parse(zlib.gunzipSync(read('data/core20k-runtime.json.gz')).toString('utf8'));
assert.equal(newer.headwords.length,20000);
const modernWords=new Map(),modernKU=new Map();
for(const [rank,lemma,pos,ipa,kus] of newer.headwords){modernWords.set(lemma.toLowerCase(),{rank,lemma,pos,ipa,kus});for(const [id,type,zh,en,eligible] of kus){assert(!modernKU.has(id),'duplicate new KU');modernKU.set(id,{id,lemma,type,zh,en,eligible});}}
const missingWords=[...oldWords.keys()].filter(k=>!modernWords.has(k));
const commonWords=[...oldWords.keys()].filter(k=>modernWords.has(k));
const retainedKU=[...oldKU.keys()].filter(k=>modernKU.has(k));
const removedKU=[...oldKU.keys()].filter(k=>!modernKU.has(k));
const changedMeaning=[],changedType=[],richAtRisk={exampleKU:0,collocationKU:0,usageKU:0,ipaUKWords:0,allSensesWords:0},missingRichRecords=[];
for(const [lemma,word] of rich){
 if(!modernWords.has(lemma)){missingRichRecords.push(lemma);continue;}
 if(word.ipaUK)richAtRisk.ipaUKWords++;
 if(word.allSenses.length)richAtRisk.allSensesWords++;
 for(const [id,k] of word.byKU){
  if(k.e?.length)richAtRisk.exampleKU++;
  if((Array.isArray(k.c)?k.c.length:String(k.c).trim().length))richAtRisk.collocationKU++;
  if(String(k.x).trim())richAtRisk.usageKU++;
 }
}
for(const id of retainedKU){const a=oldKU.get(id),b=modernKU.get(id);if(a.type!==b.type)changedType.push({id,old:a.type,new:b.type});if(a.zh?.trim()!==b.zh?.trim())changedMeaning.push({id,lemma:a.lemma,old:a.zh,new:b.zh});}
const report={schema:'pai-core13k-core20k-content-diff-v1',baseline:{words:oldWords.size,kus:oldKU.size,richWords:rich.size},new:{words:modernWords.size,kus:modernKU.size},identity:{commonWords:commonWords.length,missingWords:missingWords.length,missingWordExamples:missingWords.slice(0,25),retainedKU:retainedKU.length,missingKU:removedKU.length,missingKUExamples:removedKU.slice(0,25)},semantic:{changedMeaning:changedMeaning.length,changedMeaningExamples:changedMeaning.slice(0,25),changedType:changedType.length,changedTypeExamples:changedType.slice(0,25)},richFieldsAtRisk:richAtRisk,missingRichRecordCount:missingRichRecords.length,caveats:['Rich field counts are non-empty legacy instances; not all are evidence-verified','Current Core20K adapter explicitly initializes example/collocation/usage fields to empty','This does not claim same-KU semantic equivalence when definition wording changes'],pass:missingWords.length===0&&removedKU.length===0&&changedType.length===0&&changedMeaning.length===0&&Object.values(richAtRisk).every(n=>n===0)};
fs.mkdirSync('audit-output',{recursive:true});
fs.writeFileSync('audit-output/core13k-to-core20k-content-diff.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
