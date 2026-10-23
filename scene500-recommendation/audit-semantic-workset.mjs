// Diagnose concentration and generic-scene overassignment in unapproved semantic proposals.
// Usage: node scene500-recommendation/audit-semantic-workset.mjs workset.json [report.json]
// This is a QA gate, not certification and never mutates production links.
import fs from 'node:fs';
const [path,out]=process.argv.slice(2);
if(!path)throw Error('USAGE: audit-semantic-workset.mjs workset.json [report.json]');
const x=JSON.parse(fs.readFileSync(path,'utf8'));
if(x.status!=='NOT_APPROVED'||!Array.isArray(x.candidates))throw Error('NOT_REVIEW_WORKSET');
const scenes=new Map(),terms=new Map(),pairs=new Set();
for(const row of x.candidates){
 if(row.release_eligible!==false||row.status!=='review_required_not_approved')throw Error('CANDIDATE_UNSAFE_STATUS');
 const key=row.term_id+'\u0000'+row.scene_id;
 if(pairs.has(key))throw Error('DUPLICATE_CANDIDATE');
 pairs.add(key);
 scenes.set(row.scene_id,(scenes.get(row.scene_id)||0)+1);
 if(!terms.has(row.term_id))terms.set(row.term_id,[]);
 terms.get(row.term_id).push(row);
}
const sorted=[...scenes].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
const generic=new Set(['S126','S132','S137','S153']);
const genericLinks=x.candidates.filter(r=>generic.has(r.scene_id)).length;
const topFour=sorted.slice(0,4).reduce((a,b)=>a+b[1],0);
const lowSpecificity=x.candidates.filter(r=>generic.has(r.scene_id)&&r.proposed_rank>=3);
const warnings=[];
if(topFour/pairs.size>.4)warnings.push('TOP4_SCENE_CONCENTRATION_OVER_40_PERCENT');
if(genericLinks/pairs.size>.4)warnings.push('GENERIC_ACADEMIC_CONTEXT_OVER_40_PERCENT');
if(lowSpecificity.length)warnings.push('GENERIC_CONTEXT_HAS_LOW_PRIORITY_EDGES');
const report={schema:'scene500-semantic-quality-audit-v0.1',
 status:'REVIEW_REQUIRED_NOT_RELEASE_ELIGIBLE',sourceVersion:x.runtime_version,
 counts:{links:pairs.size,terms:terms.size,distinctScenes:scenes.size,genericAcademicLinks:genericLinks,
 genericAcademicRate:Number((genericLinks/pairs.size).toFixed(4)),
 top4SceneRate:Number((topFour/pairs.size).toFixed(4)),
 lowSpecificityEdges:lowSpecificity.length},
 concentration:sorted.slice(0,15).map(([sceneId,count])=>({sceneId,count})),
 warnings,policy:'Generic learning or research scene may be useful context, not evidence of a specialized subject scene. All proposed edges require independent relevance review.'};
if(out)fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
