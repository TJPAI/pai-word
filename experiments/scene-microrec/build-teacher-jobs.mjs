import fs from 'node:fs';
import {createHash} from 'node:crypto';
const catalog=JSON.parse(fs.readFileSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url)));
const rows=Object.entries(catalog.scenes).sort(([a],[b])=>a.localeCompare(b));
const tasks=[];
for(const [id,scene] of rows){
 for(const [kind,text] of [['name',scene.name],...(scene.aliases||[]).map(x=>['alias',x]),...(scene.example_queries||[]).map(x=>['example',x])]){
  if(!text?.trim())continue;
  tasks.push({scene_id:id,kind,text:text.trim()});
 }
}
const catalogBytes=fs.readFileSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url));
const report={schema:'scene-microrec-teacher-jobs-v1',status:'UNENCODED_NO_TEACHER_USED',catalog_sha256:createHash('sha256').update(catalogBytes).digest('hex'),task_count:tasks.length,unique_scenes:rows.length,teacher_hint:{family:'multilingual-e5',query_prefix:'query: ',passage_prefix:'passage: '},tasks};
console.log(JSON.stringify({status:report.status,task_count:report.task_count,unique_scenes:report.unique_scenes,catalog_sha256:report.catalog_sha256}));
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./teacher-encoding-jobs.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
