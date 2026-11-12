// Isolated contract comparison: pinned fixed Node ranker vs browser-safe core.
// Both modules are upstream sources. No mock search engine and no certification.
import fs from 'node:fs';
import path from 'node:path';
import {loadInputs} from '../../../candidate-latest/scene500-recommendation/scene1341-isolated-search.mjs';
import {buildCatalog} from '../../../candidate-browser/scene500-recommendation/scene1341-search-core.mjs';
const [catalogPath,rankedDir,sourceCommit,manifestSha,casesPath,negPath]=process.argv.slice(2);
if(![catalogPath,rankedDir,sourceCommit,manifestSha,casesPath,negPath].every(Boolean))throw Error('MISSING_SOURCE');
const catalogCsv=fs.readFileSync(catalogPath,'utf8');
const rankedCsv=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(rankedDir,'v'+(i+51)+'-ranked.csv'),'utf8'));
const node=loadInputs(catalogPath,rankedDir,{sourceCommit,manifestSha});
const browser=buildCatalog(catalogCsv,rankedCsv,{sourceCommit,manifestSha});
if(node.sceneCount!==1341||browser.sceneCount!==1341||node.expressionCount!==19371||browser.expressionCount!==19371)throw Error('SCENE1341_SOURCE_MISMATCH');
const oldCases=JSON.parse(fs.readFileSync(casesPath,'utf8')).cases;
const negCases=JSON.parse(fs.readFileSync(negPath,'utf8')).rows;
if(oldCases?.length!==22||negCases?.length!==14)throw Error('EXPECTED_22_PLUS_14_CASES');
const queries=[...oldCases.map(x=>({id:x.id,query:x.query,kind:'original'})),...negCases.map(x=>({id:x.id,query:x.query,kind:'negation'}))];
const rows=queries.flatMap(q=>[false,true].map(optIn=>{
 const options={limit:10,experimentalIntentAliases:optIn};
 const a=node.search(q.query,options),b=browser.search(q.query,options);
 const aJson=JSON.stringify(a),bJson=JSON.stringify(b);
 return {id:q.id,kind:q.kind,experimentalIntentAliases:optIn,identical:aJson===bJson,
  nodeTop10:a.map(x=>x.scene_id),browserTop10:b.map(x=>x.scene_id),
  nodeFirstScore:a[0]?.score??null,browserFirstScore:b[0]?.score??null,
  nodeFirstEvidence:a[0]?.explanations??[],browserFirstEvidence:b[0]?.explanations??[]};
}));
const mismatches=rows.filter(x=>!x.identical);
const report={status:'PINNED_BROWSER_SAFE_REFACTOR_PARITY_DIAGNOSTIC',
 sourceCommit,manifestSha,
 fixedHead:'2d143b98953a3010e72ae51059ea7557eeef1aec',
 browserCoreHead:'111539d59691e4032da215580e533822fcbb6f41',
 queries:36,comparisons:72,identical:rows.length-mismatches.length,mismatched:mismatches.length,
 mismatches:mismatches.map(x=>({id:x.id,optIn:x.experimentalIntentAliases,nodeTop10:x.nodeTop10,browserTop10:x.browserTop10})),
 certified:false,releaseAllowed:false,rows};
if(rows.length!==72||mismatches.length)throw Error('BROWSER_CORE_RANKING_PARITY_REGRESSION '+JSON.stringify(report.mismatches.slice(0,3)));
console.log(JSON.stringify(report,null,2));
