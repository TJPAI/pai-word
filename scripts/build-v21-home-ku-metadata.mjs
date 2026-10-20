// Derive a compact, exact due-count index for the current Core20K + Scene500 runtime.
// Run: node scripts/build-v21-home-ku-metadata.mjs
// Source: the existing compressed Core20K payload and all 20 audited Top100 shards.
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
const root=process.cwd();
const input=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'data/core20k-runtime.json.gz'))));
if(input.schema!=='pai-core20k-runtime-v1'||input.headwords?.length!==20000)throw Error('HOME_KU_CORE_SCHEMA');
const playable=new Set();
for(const word of input.headwords)for(const [id,type,zh,en,eligible] of word[4]){
 if(type==='sense'&&eligible===true&&typeof zh==='string'&&zh.trim())playable.add(id);
}
const multiplicity=new Map([...playable].map(id=>[id,1])); // canonical 'daily' scene
let totalRows=0,accepted=0;
for(let group=1;group<=20;group++){
 const file=path.join(root,'data/scene500-top100-v40','group-'+String(group).padStart(2,'0')+'.json');
 const shard=JSON.parse(fs.readFileSync(file,'utf8'));
 if(shard.schema!=='pai-scene500-top100-v40-v1'||Object.keys(shard.scenes||{}).length!==25)throw Error('HOME_KU_SHARD:'+group);
 for(const rows of Object.values(shard.scenes)){
  if(rows.length!==100)throw Error('HOME_KU_ROW_COUNT');
  const sceneSeen=new Set();
  for(const row of rows){
   totalRows++;
   const id=row[3];
   if(!id)continue;
   if(!playable.has(id)||sceneSeen.has(id))throw Error('HOME_KU_INCONSISTENT:'+id);
   sceneSeen.add(id);accepted++;
   multiplicity.set(id,multiplicity.get(id)+1);
  }
 }
}
if(totalRows!==50000||accepted!==22227)throw Error('HOME_KU_COVERAGE:'+totalRows+':'+accepted);
const entries=[...multiplicity].sort((a,b)=>a[0].localeCompare(b[0]));
const payload={schema:'pai-word-v21-home-ku-metadata-v1',coreRelease:'Core20K-dev',sceneRelease:'SceneRank500-V4',playableKU:playable.size,top100Entries:accepted,entries};
const output=path.join(root,'rebuild-preview/data/home-ku-metadata-v1.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(payload)+'\n');
console.log('HOME_KU_METADATA_OK',{ku:entries.length,top100Entries:accepted,bytes:fs.statSync(output).size});
