// Independent adversarial source-integrity probe against actual CG-REC core.
// Does not alter authoritative ranked CSV or infer linguistic certification.
import fs from 'node:fs';
import path from 'node:path';
import {buildCatalog,csv} from '../../../candidate-current/scene500-recommendation/scene1341-search-core.mjs';
const [catalogPath,rankedDir,sourceCommit,manifestSha]=process.argv.slice(2);
if(![catalogPath,rankedDir,sourceCommit,manifestSha].every(Boolean))throw Error('PINNED_INPUT_REQUIRED');
const catalog=fs.readFileSync(catalogPath,'utf8');
const sources=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(rankedDir,'v'+(51+i)+'-ranked.csv'),'utf8'));
const meta={sourceCommit,manifestSha};
const original=buildCatalog(catalog,sources,meta);
if(original.sceneCount!==1341||original.expressionCount!==19371||original.release_allowed!==false)throw Error('CANONICAL_SOURCE_INVALID');
function encode(rows){
 const keys=Object.keys(rows[0]);
 const q=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 return [keys.map(q).join(','),...rows.map(row=>keys.map(k=>q(row[k])).join(','))].join('\n')+'\n';
}
let selected=null;
for(let f=0;f<sources.length&&!selected;f++){
 const rows=csv(sources[f]);
 const idx=new Map();
 for(let k=0;k<rows.length;k++){
  const r=rows[k];if(idx.has(r.scene_id)){selected={f,rows,first:idx.get(r.scene_id),second:k,scene:r.scene_id};break;}
  idx.set(r.scene_id,k);
 }
}
if(!selected)throw Error('NO_SAME_SCENE_PAIR');
const report=[];
const rank=selected.rows[selected.first].rank;
if(!/^[1-9]\d*$/.test(rank))throw Error('UNEXPECTED_SOURCE_RANK '+rank);
for(const [label,dupe] of [['leading_zero','0'+rank],['decimal_equivalent',rank+'.0'],['zero_padded','000'+rank]]){
 const rows=selected.rows.map(r=>({...r}));
 rows[selected.second].rank=dupe;
 const shards=sources.slice();shards[selected.f]=encode(rows);
 let caught=null;
 try{buildCatalog(catalog,shards,meta);}catch(e){caught=e.message;}
 if(!caught?.includes('DUPLICATE_OR_BAD_RANK'))throw Error('DUPLICATE_NUMERIC_RANK_NOT_BLOCKED '+label+' '+String(caught));
 report.push({label,duplicateText:dupe,rejectedAs:'DUPLICATE_OR_BAD_RANK'});
}
console.log(JSON.stringify({status:'PASS',sourceCommit,manifestSha,coreCommit:process.env.CG_REC_SHA||null,
 sourceUnchanged:true,sceneCount:1341,expressionCount:19371,scene:selected.scene,firstRank:rank,
 mutatedRecord:selected.second,mutations:report,certified:false,releaseAllowed:false},null,2));
