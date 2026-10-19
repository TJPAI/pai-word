// Read-only actual Scene500 projection Top100 audit against 80 verified rich-preview shards.
// node scripts/rebuild-v1/audit-scene500-projection.mjs <projection.json.gz> <shards-dir>
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const [source,dir]=process.argv.slice(2);assert(source&&dir,'Projection gzip and shard directory required');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const projection=JSON.parse(zlib.gunzipSync(fs.readFileSync(source)));
assert.equal(Object.keys(projection.scenes).length,500);
assert.equal(manifest.chunks.length,80);
const words=new Map();
for(const chunk of manifest.chunks){
 const raw=fs.readFileSync(path.join(dir,chunk.file));
 assert.equal(raw.length,chunk.bytes);
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),chunk.sha256);
 for(const w of JSON.parse(zlib.gunzipSync(raw)).rows){assert(!words.has(w.rank));words.set(w.rank,w)}
}
assert.equal(words.size,20000);
const stats={scenes:0,positions:0,playable:0,blocked:0,multiSenseBlocked:0,missingKu:0};
for(let n=1;n<=500;n++){
 const id='S'+String(n).padStart(3,'0'),rows=projection.scenes[id]?.rows;
 assert(rows?.length>=100,'scene missing top100 '+id);
 const seen=new Set();
 for(let i=0;i<100;i++){
  const [sceneRank,lemma,rank,kuId]=rows[i];
  assert.equal(sceneRank,i+1);assert(!seen.has(lemma.toLowerCase()));seen.add(lemma.toLowerCase());
  const word=words.get(rank);assert(word&&word.lemma.toLowerCase()===lemma.toLowerCase(),'rank/lemma mismatch '+id);
  const ku=word.units.find(k=>k[0]===kuId);
  if(!ku){stats.missingKu++;stats.blocked++;continue}
  if(ku[1]!=='sense'||ku[4]!==true||!String(ku[2]).trim()){stats.blocked++;continue}
  const playable=word.units.filter(k=>k[1]==='sense'&&k[4]===true&&String(k[2]).trim());
  if(playable.length!==1){stats.multiSenseBlocked++;stats.blocked++;continue}
  stats.playable++;
 }
 stats.scenes++;stats.positions+=100;
}
assert.equal(stats.playable+stats.blocked,50000);
console.log(JSON.stringify({status:'PASS_STRICT_TOP100_DATA',stats,note:'Projection audit, not final group shard or browser QA'},null,2));
