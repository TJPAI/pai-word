// Generate deterministic, auditable 500-scene bilingual editorial queue.
// Existing bilingual candidates are not automatically certified or used for training.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {bilingualSeeds} from './bilingual-seeds.mjs';
const path=new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url);
const raw=fs.readFileSync(path),cat=JSON.parse(raw);
const existing=new Map(bilingualSeeds.map(r=>[r.scene_id,r]));
const items=Object.entries(cat.scenes).sort(([a],[b])=>a.localeCompare(b)).map(([scene_id,s],i)=>{
 const candidate=existing.get(scene_id);
 return {scene_id,source_zh:s.name,description_zh:s.description_enriched||'',example_zh:(s.example_queries||[]).slice(0,2),candidate_en:candidate?.candidate_en||null,
  provenance:candidate?.provenance||null,review_status:'UNREVIEWED',use_for_training:false,batch_id:Math.floor(i/100)+1};
});
if(items.length!==500)throw Error('SCENE_COUNT_MISMATCH');
const sourceSha=createHash('sha256').update(raw).digest('hex');
const output={schema:'scene-microrec-bilingual-queue-v1',source_catalog_sha256:sourceSha,status:'EDITORIAL_QUEUE_ONLY_NO_TEACHER_USED',batch_size:100,total:items.length,seeded:items.filter(x=>x.candidate_en).length,unseeded:items.filter(x=>!x.candidate_en).length,items};
const outputPath=new URL('./bilingual-editorial-queue.json',import.meta.url);
if(process.argv.includes('--write'))fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({status:output.status,batches:5,total:output.total,seeded:output.seeded,unseeded:output.unseeded,catalog_sha256:sourceSha}));
