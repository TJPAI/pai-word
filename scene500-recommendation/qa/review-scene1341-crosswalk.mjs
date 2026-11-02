// Read-only semantic-review evidence for the 71 priority Scene1341 crosswalk candidates.
// Usage: node review-scene1341-crosswalk.mjs scene50.csv scene500-catalog.json
// Never approves migrations or remaps learning records.
import fs from 'node:fs';
import crypto from 'node:crypto';
const [csvPath,catalogPath]=process.argv.slice(2);
if(!csvPath||!catalogPath)throw Error('USAGE: scene50.csv scene500-catalog.json');
const csv=fs.readFileSync(csvPath);
const sha=crypto.createHash('sha256').update(csv).digest('hex');
const EXPECTED='5ae9ba95eeecfd012782c51396166a5f747a428917217e05221a769bb4e30d9c';
if(sha!==EXPECTED)throw Error('SCENE1341_SOURCE_SHA_MISMATCH');
function parseCsv(s){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(c==='"'){
   if(quoted&&s[i+1]==='"'){cell+='"';i++;}
   else quoted=!quoted;
  }else if(c===','&&!quoted){row.push(cell);cell='';}
  else if((c==='\n'||c==='\r')&&!quoted){
   if(c==='\r'&&s[i+1]==='\n')i++;
   row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';
  }else cell+=c;
 }
 if(quoted)throw Error('INVALID_CSV_UNCLOSED_QUOTE');
 if(cell||row.length){row.push(cell);rows.push(row);}
 const headers=rows.shift();
 return rows.map((x,i)=>Object.fromEntries(headers.map((h,j)=>[h,x[j]??''])));
}
const data=parseCsv(csv.toString('utf8').replace(/^\uFEFF/,''));
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8')).scenes;
if(data.length!==1341||Object.keys(catalog??{}).length!==500)throw Error('INVALID_SOURCE_COUNTS');
const matches=[],review=[];
const fold=s=>String(s??'').normalize('NFKC').replace(/[\s，。、；:：]/g,'').toLowerCase();
for(const row of data){
 const old=row.scene500.split(',').map(x=>x.trim()).filter(Boolean);
 if(!old.length)continue;
 const high=old.length>1||row.name!==row.revised_name||row.decision!=='UNCHANGED'||row.structural_action!=='NONE';
 const source=old.map(id=>({id,name:catalog[id]?.name??null}));
 const normalizedNew=fold(row.revised_name);
 const exact=source.length===1&&fold(source[0].name)===normalizedNew;
 const item={scene_id:row.id,scene_name:row.revised_name,legacy:source,decision:row.decision,structural_action:row.structural_action,exact_name:exact,review_priority:high?'HIGH':'NORMAL',editorial_decision:'PENDING_HUMAN_SEMANTIC_REVIEW',migration_approved:false};
 matches.push(item);if(high)review.push(item);
}
if(matches.length!==410||review.length!==71)throw Error('REVIEW_QUEUE_DRIFT');
console.log(JSON.stringify({status:'UNAPPROVED_SEMANTIC_REVIEW_QUEUE',source_sha256:sha,total:1341,linked:matches.length,high_priority:review.length,high_priority_entries:review,srs_remap_allowed:false},null,2));
