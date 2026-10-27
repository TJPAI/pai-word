import fs from 'node:fs';
import {createHash} from 'node:crypto';
// Audit the *actual* catalog for English supervisory surfaces. No fabricated translations.
const path=new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url),raw=fs.readFileSync(path),catalog=JSON.parse(raw);
const english=/[a-z]/i,han=/[\u3400-\u9fff]/u;
const rows=[],counts={scenes:0,englishScenes:0,chineseOnlyScenes:0,englishSurfaces:0,mixedSurfaces:0,zhSurfaces:0};
for(const [id,s] of Object.entries(catalog.scenes)){
 counts.scenes++;
 const source=[['name',s.name],['description',s.description_enriched],...(s.aliases||[]).map(x=>['alias',x]),...(s.example_queries||[]).map(x=>['example_query',x]),...(s.actions||[]).map(x=>['action',x]),...(s.objects||[]).map(x=>['object',x])];
 let enCount=0;
 for(const [field,value] of source){if(!value)continue;const en=english.test(value),zh=han.test(value);if(en&&zh)counts.mixedSurfaces++;else if(en){counts.englishSurfaces++;enCount++;}else if(zh)counts.zhSurfaces++;}
 if(enCount)counts.englishScenes++;else{counts.chineseOnlyScenes++;rows.push({scene_id:id,name:s.name,source_name:s.name,translation_status:'MISSING_HUMAN_OR_VERIFIED_TRANSLATION'});}
}
const report={status:'CATALOG_LANGUAGE_AUDIT_NO_GENERATED_PARALLEL_TEXT',catalogSha256:createHash('sha256').update(raw).digest('hex'),counts,translationBacklog:rows,policy:'English phrase must have evidence and semantic QA before being used as bilingual supervision; mixed scripts are not automatically parallel pairs.'};
console.log(JSON.stringify({status:report.status,catalogSha256:report.catalogSha256,counts,backlogExamples:rows.slice(0,5)},null,2));
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./bilingual-coverage-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
if(counts.scenes!==500)process.exitCode=1;
