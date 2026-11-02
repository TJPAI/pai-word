// Read-only staging audit. Usage: node audit-scene-expansion.mjs baseline.json candidate.json
// Does not certify taxonomy or produce production migration IDs.
import fs from 'node:fs';
import crypto from 'node:crypto';

// RFC4180-style CSV reader: preserve escaped quotes, commas and newlines.
// Explicit column names avoid guessing the Scene50 source schema.
function csvRows(content){
 const result=[];let record=[],field='',quoted=false;
 for(let i=0;i<content.length;i++){
  const c=content[i];
  if(c==='"'){
   if(quoted&&content[i+1]==='"'){field+='"';i++;}
   else if(!quoted&&field==='')quoted=true;
   else if(quoted)quoted=false;
   else throw Error('INVALID_CSV_QUOTE');
  }else if(c===','&&!quoted){record.push(field);field='';}
  else if((c==='\\n'||c==='\\r')&&!quoted){
   if(c==='\\r'&&content[i+1]==='\\n')i++;
   record.push(field);field='';
   if(record.some(x=>x!==''))result.push(record);
   record=[];
  }else field+=c;
 }
 if(quoted)throw Error('UNTERMINATED_CSV_QUOTE');
 if(field!==''||record.length){record.push(field);result.push(record);}
 return result;
}
function candidateSource(file){
 if(!/\\.csv$/i.test(file))return JSON.parse(fs.readFileSync(file,'utf8'));
 const idArg=options.find(x=>x.startsWith('--id-column='));
 const nameArg=options.find(x=>x.startsWith('--name-column='));
 if(!idArg||!nameArg)throw Error('CSV_REQUIRES_EXPLICIT_ID_AND_NAME_COLUMNS');
 const records=csvRows(fs.readFileSync(file,'utf8').replace(/^\\uFEFF/,''));
 const header=records.shift()??[];
 const idIndex=header.indexOf(idArg.split('=').slice(1).join('='));
 const nameIndex=header.indexOf(nameArg.split('=').slice(1).join('='));
 if(idIndex<0||nameIndex<0)throw Error('CSV_COLUMN_NOT_FOUND: '+header.join(','));
 const scenes=records.map(x=>({id:(x[idIndex]??'').trim(),name:(x[nameIndex]??'').trim()}));
 return {scenes};
}

const [baselineFile,candidateFile,...options]=process.argv.slice(2);
const independentNamespace=options.includes('--independent-namespace');
if(options.some(x=>x!=='--independent-namespace'&&!x.startsWith('--id-column=')&&!x.startsWith('--name-column=')))throw Error('UNKNOWN_OPTION');
if(!baselineFile)throw Error('USAGE: baseline.json [candidate.json]');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const base=JSON.parse(fs.readFileSync(baselineFile,'utf8'));
const normalize=d=>Array.isArray(d?.scenes)?d.scenes.map(x=>({id:x.id,name:x.nameZh??x.name??''})):
 Object.entries(d?.scenes??{}).map(([id,x])=>({id,name:x?.name??x?.nameZh??''}));
const old=normalize(base);
if(old.length!==500||new Set(old.map(x=>x.id)).size!==500)throw Error('INVALID_500_BASELINE');
const report={status:'SOURCE_AUDIT_ONLY_NOT_APPROVAL',baseline:{path:baselineFile,sha256:sha(baselineFile),count:old.length},candidate:null,errors:[],warnings:[],migration:[],namespaceMode:independentNamespace?'INDEPENDENT_REQUIRES_EXPLICIT_CROSSWALK':'LEGACY_ID_PRESERVATION'};
if(!candidateFile){report.errors.push('SCENE1341_CANONICAL_SOURCE_NOT_PROVIDED');}
else{
 const candidate=candidateSource(candidateFile);
 const rows=normalize(candidate);
 report.candidate={path:candidateFile,sha256:sha(candidateFile),count:rows.length};
 if(rows.length!==1341)report.errors.push('CANDIDATE_COUNT_NOT_1341');
 const seen=new Set(),oldMap=new Map(old.map(x=>[x.id,x.name]));
 for(const row of rows){
  if(!row.id||!row.name)report.errors.push('EMPTY_ID_OR_NAME');
  if(seen.has(row.id))report.errors.push('DUPLICATE_ID:'+row.id);
  seen.add(row.id);
  if(!independentNamespace&&oldMap.has(row.id))report.migration.push({oldId:row.id,newId:row.id,status:oldMap.get(row.id)===row.name?'ID_AND_NAME_PRESERVED':'ID_PRESERVED_NAME_CHANGED_REVIEW',oldName:oldMap.get(row.id),newName:row.name});
 }
 if(independentNamespace){
  const collisions=rows.filter(x=>oldMap.has(x.id));
  for(const x of collisions)report.errors.push('NAMESPACE_COLLISION:'+x.id);
  report.warnings.push('NO_AUTOMATIC_ID_MAPPING: all 500 legacy IDs require an independently reviewed crosswalk');
  report.unmappedLegacyCount=old.length;
 }else{
  const missing=old.filter(x=>!seen.has(x.id));
  for(const x of missing)report.errors.push('OLD_ID_MISSING:'+x.id);
 }
 const names=new Map();
 for(const row of rows){const k=String(row.name).normalize('NFKC').replace(/\s+/g,'').toLowerCase();if(!names.has(k))names.set(k,[]);names.get(k).push(row.id)}
 report.exactDuplicateNames=[...names.entries()].filter(([,ids])=>ids.length>1).map(([name,ids])=>({name,ids}));
 report.warnings.push('Semantic overlap, split/merge and Sense/KU learnability require independent review');
}
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=2;
