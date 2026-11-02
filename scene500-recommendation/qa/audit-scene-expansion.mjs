// Read-only staging audit. Usage: node audit-scene-expansion.mjs baseline.json candidate.json
// Does not certify taxonomy or produce production migration IDs.
import fs from 'node:fs';
import crypto from 'node:crypto';
const [baselineFile,candidateFile]=process.argv.slice(2);
if(!baselineFile)throw Error('USAGE: baseline.json [candidate.json]');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const base=JSON.parse(fs.readFileSync(baselineFile,'utf8'));
const normalize=d=>Array.isArray(d?.scenes)?d.scenes.map(x=>({id:x.id,name:x.nameZh??x.name??''})):
 Object.entries(d?.scenes??{}).map(([id,x])=>({id,name:x?.name??x?.nameZh??''}));
const old=normalize(base);
if(old.length!==500||new Set(old.map(x=>x.id)).size!==500)throw Error('INVALID_500_BASELINE');
const report={status:'SOURCE_AUDIT_ONLY_NOT_APPROVAL',baseline:{path:baselineFile,sha256:sha(baselineFile),count:old.length},candidate:null,errors:[],warnings:[],migration:[]};
if(!candidateFile){report.errors.push('SCENE1341_CANONICAL_SOURCE_NOT_PROVIDED');}
else{
 const candidate=JSON.parse(fs.readFileSync(candidateFile,'utf8'));
 const rows=normalize(candidate);
 report.candidate={path:candidateFile,sha256:sha(candidateFile),count:rows.length};
 if(rows.length!==1341)report.errors.push('CANDIDATE_COUNT_NOT_1341');
 const seen=new Set(),oldMap=new Map(old.map(x=>[x.id,x.name]));
 for(const row of rows){
  if(!row.id||!row.name)report.errors.push('EMPTY_ID_OR_NAME');
  if(seen.has(row.id))report.errors.push('DUPLICATE_ID:'+row.id);
  seen.add(row.id);
  if(oldMap.has(row.id))report.migration.push({oldId:row.id,newId:row.id,status:oldMap.get(row.id)===row.name?'ID_AND_NAME_PRESERVED':'ID_PRESERVED_NAME_CHANGED_REVIEW',oldName:oldMap.get(row.id),newName:row.name});
 }
 const missing=old.filter(x=>!seen.has(x.id));
 for(const x of missing)report.errors.push('OLD_ID_MISSING:'+x.id);
 const names=new Map();
 for(const row of rows){const k=String(row.name).normalize('NFKC').replace(/\s+/g,'').toLowerCase();if(!names.has(k))names.set(k,[]);names.get(k).push(row.id)}
 report.exactDuplicateNames=[...names.entries()].filter(([,ids])=>ids.length>1).map(([name,ids])=>({name,ids}));
 report.warnings.push('Semantic overlap, split/merge and Sense/KU learnability require independent review');
}
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=2;
