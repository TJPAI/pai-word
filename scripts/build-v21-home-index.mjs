// Build a versioned, standalone Scene500 home projection from the audited Top100 shards.
// Run: node scripts/build-v21-home-index.mjs
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const taxonomy=fs.readFileSync(path.join(root,'data/scene500-taxonomy-20x25-v1.txt'),'utf8');
const names=new Map([...taxonomy.matchAll(/^(S\d{3})\s+(.+?)\s*$/gm)].map(m=>[m[1],m[2]]));
if(names.size!==500)throw Error('HOME_TAXONOMY_COUNT');
const scenes={};
let eligible=0;
for(let group=1;group<=20;group++){
 const file=path.join(root,'data/scene500-top100-v40',`group-${String(group).padStart(2,'0')}.json`);
 const shard=JSON.parse(fs.readFileSync(file,'utf8'));
 if(shard.schema!=='pai-scene500-top100-v40-v1')throw Error('HOME_SHARD_SCHEMA:'+group);
 for(const [id,rows] of Object.entries(shard.scenes)){
  if(!names.has(id)||scenes[id]||rows.length!==100)throw Error('HOME_SCENE:'+id);
  const ranks=rows.filter(row=>row[3]!=null).map(row=>Number(row[2]));
  if(ranks.some(x=>!Number.isInteger(x)||x<1||x>20000))throw Error('HOME_RANK:'+id);
  eligible+=ranks.length;
  const name=names.get(id);
  scenes[id]={name,desc:'Scene500 V4.0 Top100',tags:[name],
   counts:{all:ranks.length,basic:ranks.filter(x=>x<=4000).length,
    common:ranks.filter(x=>x>4000&&x<=8000).length,
    advanced:ranks.filter(x=>x>8000&&x<=11000).length,
    high:ranks.filter(x=>x>11000).length}};
 }
}
if(Object.keys(scenes).length!==500||eligible!==22227)throw Error('HOME_COVERAGE:'+eligible);
const output=path.join(root,'rebuild-preview/data/home-scene-index-v1.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({schema:'pai-word-v21-home-index-v1',scenes})+'\n');
console.log('HOME_INDEX_OK',{scenes:500,eligible,bytes:fs.statSync(output).size});
