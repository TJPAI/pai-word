// Offline A/B harness; requires pinned real runtime inputs, never promotes candidate.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadScene500WithChineseLexicon} from './chinese-lexicon-loader.mjs';
import {rerankNegationCandidate} from './negation-rerank-candidate.mjs';
const [catalogPath,lexiconPath,associationsPath,casesPath,outPath='scene500-negation-ab-report.json']=process.argv.slice(2);
if(!casesPath)throw Error('USAGE: node negation-ab-eval.mjs catalog.json lexicon.json associations.json cases.json [report.json]');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [catalog,lexicon,associations,suite]=[catalogPath,lexiconPath,associationsPath,casesPath].map(read);
assert.equal(catalog.scene_count,500);
assert.equal(lexicon.terms.length,20000);
assert.equal(associations.links.length,3553);
const response=obj=>({ok:true,json:async()=>obj});
const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lexicon',associationUrl:'associations',fetchImpl:async url=>response(url==='lexicon'?lexicon:associations)});
assert.equal(engine.mode,'hybrid','Must evaluate actual Hybrid, not fallback');
const rows=[];
for(const c of suite.cases){
 const base=engine.search(c.query,{limit:500});
 const candidate=rerankNegationCandidate(base,c.query,{catalog,limit:5});
 const top5Base=base.results.slice(0,5).map(r=>r.sceneId),top5Candidate=candidate.results.map(r=>r.sceneId);
 const expected=c.expectedTop5Any||[];
 rows.push({id:c.id,query:c.query,reviewStatus:c.reviewStatus||'UNREVIEWED',expectedTop5Any:expected,top5Base,top5Candidate,changed:JSON.stringify(top5Base)!==JSON.stringify(top5Candidate),baseHit:expected.some(id=>top5Base.includes(id)),candidateHit:expected.some(id=>top5Candidate.includes(id)),negatedSceneIds:c.negatedSceneIds||[]});
}
const sum=(field,items)=>items.filter(x=>x[field]).length;
const changed=rows.filter(x=>x.changed);
const report={status:'EXPERIMENTAL_AB_NOT_INDEPENDENT_SEMANTIC_CERTIFICATION',runtime:engine.runtimeDataVersion,total:rows.length,changed:changed.length,baseTop5Hit:sum('baseHit',rows),candidateTop5Hit:sum('candidateHit',rows),improved:rows.filter(x=>!x.baseHit&&x.candidateHit).length,regressed:rows.filter(x=>x.baseHit&&!x.candidateHit).length,warning:'Catalog-seeded expected labels are NOT independent; report only diagnostic recall. Manual adjudication required.',changedCases:changed,allCases:rows};
fs.writeFileSync(outPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,total:report.total,changed:report.changed,baseTop5Hit:report.baseTop5Hit,candidateTop5Hit:report.candidateTop5Hit,improved:report.improved,regressed:report.regressed,outPath}));
