// Generate 200 catalog-seeded QA prompts; these are NOT independent semantic ground truth.
// Usage: node scene500-recommendation/build-semantic-200.mjs <catalog.json> [output.json]
import fs from 'node:fs';
import assert from 'node:assert/strict';
const [catalogPath,outPath='scene500-semantic-200-catalog-seeded.json']=process.argv.slice(2);
if(!catalogPath)throw Error('Usage: node build-semantic-200.mjs <catalog.json> [output.json]');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
assert.equal(catalog.scene_count,500);
const scenes=Object.entries(catalog.scenes).sort(([a],[b])=>a.localeCompare(b));
assert.equal(scenes.length,500);
const cases=[],used=new Set();
for(const [sceneId,s] of scenes.filter(([id])=>{ const n=Number(id.slice(1)); return Number.isInteger(n)&&n>=1&&n<=500&&((n-1)%25)%2===0&&((n-1)%25)<20; })){
 const candidates=[...(s.example_queries||[]),...(s.aliases||[]),s.name].filter(x=>typeof x==='string'&&x.trim().length>=2);
 const query=candidates.find(x=>!used.has(x.trim()));
 if(!query)continue;
 used.add(query.trim());
 cases.push({id:'CAT'+String(cases.length+1).padStart(3,'0'),query,expectedTop5Any:[sceneId],sourceSceneId:sceneId,sourceField:(s.example_queries||[]).includes(query)?'example_queries':(s.aliases||[]).includes(query)?'aliases':'name',reviewStatus:'CATALOG_SEEDED_UNREVIEWED'});

}
assert.equal(cases.length,200,'Insufficient unique catalog queries');
assert.equal(new Set(cases.map(x=>x.sourceSceneId)).size,200);
const groups=Array.from({length:20},()=>0);
for(const row of cases)groups[Math.floor((Number(row.sourceSceneId.slice(1))-1)/25)]++;
assert.ok(groups.every(n=>n===10),'Expected 10 cases from each of 20 categories');
const report={schema:'scene500-semantic-catalog-seeded-200-v1',status:'NOT_INDEPENDENTLY_GRADED',warning:'Catalog-derived labels have train/evaluation leakage. Do not report these as independent accuracy.',catalogSchema:catalog.schema,cases};
fs.writeFileSync(outPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output:outPath,count:cases.length,distinctScenes:200,categories:20,casesPerCategory:10,status:report.status}));
