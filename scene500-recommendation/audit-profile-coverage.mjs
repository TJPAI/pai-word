// Scene500 semantic profile coverage audit. No production-quality inference.
// Run: node scene500-recommendation/audit-profile-coverage.mjs
import fs from 'node:fs';
const file=new URL('./catalog-v0.2.json',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(file,'utf8'));
if(catalog.scene_count!==500||Object.keys(catalog.scenes??{}).length!==500)throw Error('INVALID_SCENE_COUNT');
const fields=['aliases','actions','objects','example_queries','negative_terms'];
const byQuality={};
const coverage=Object.fromEntries(fields.map(x=>[x,{missing:0,values:0}]));
const seenNames=new Map();
const duplicateNames=[];
const missingByField=Object.fromEntries(fields.map(x=>[x,[]]));
for(const [sceneId,scene] of Object.entries(catalog.scenes)){
 byQuality[scene.quality??'unknown']=(byQuality[scene.quality??'unknown']||0)+1;
 const name=String(scene.name??'');
 if(!name)throw Error('SCENE_NAME_MISSING '+sceneId);
 if(seenNames.has(name))duplicateNames.push({name,ids:[seenNames.get(name),sceneId]});
 else seenNames.set(name,sceneId);
 for(const key of fields){
  if(scene[key]!==undefined&&!Array.isArray(scene[key]))throw Error('INVALID_PROFILE_FIELD '+sceneId+' '+key);
  const n=(scene[key]??[]).length;
  coverage[key].values+=n;
  if(!n){coverage[key].missing++;missingByField[key].push(sceneId);}
 }
}
const report={catalogSchema:catalog.schema,sceneCount:500,byQuality,coverage,duplicateNames,missingByField};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else {
 console.log('Scene500 profile audit',catalog.schema);
 console.log('Quality:',JSON.stringify(byQuality));
 console.log('Coverage:',JSON.stringify(coverage));
 console.log('Duplicate scene names (scene IDs remain authoritative):',JSON.stringify(duplicateNames));
 console.log('All counts describe catalog fields, not production recommendation accuracy.');
}
