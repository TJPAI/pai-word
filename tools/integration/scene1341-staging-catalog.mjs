// Explicitly read-only Scene1341 candidate catalog adapter. No SRS remapping.
import fs from 'node:fs';
import crypto from 'node:crypto';

const EXPECTED={
  structural:{name:'PAI_Word_Scene50_V1.5_Structural_Catalog.csv',sha256:'5ae9ba95eeecfd012782c51396166a5f747a428917217e05221a769bb4e30d9c'},
  status:{name:'all_1341_scene_status.csv',sha256:'bbd7c8ff92bd4f3c5e51f3d563717d3a732673a40d015d89bd578704d594b36b'}
};
const parseCsv=(s)=>{
 const rows=[];let row=[],cell='',quote=false;
 for(let i=0;i<s.length;i++){const ch=s[i];
  if(quote){if(ch==='"'&&s[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quote=false;else cell+=ch;}
  else if(ch==='"')quote=true;else if(ch===','){row.push(cell);cell='';}
  else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
  else cell+=ch;
 }
 if(quote)throw Error('SCENE1341_CSV_UNCLOSED_QUOTE');
 if(cell.length||row.length){row.push(cell);rows.push(row);}
 const [headers,...body]=rows; if(!headers?.length)throw Error('SCENE1341_CSV_EMPTY');
 return body.filter(x=>x.some(y=>y!=='')).map(cols=>{if(cols.length!==headers.length)throw Error('SCENE1341_CSV_COLUMN_MISMATCH');return Object.fromEntries(headers.map((k,i)=>[k.replace(/^\uFEFF/,''),cols[i]]));});
};
export function createScene1341StagingCatalog({structuralBytes,statusBytes}){
 const verify=(bytes,spec)=>{
  if(!Buffer.isBuffer(bytes))throw Error('SCENE1341_BYTES_REQUIRED');
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==spec.sha256)throw Error('SCENE1341_SOURCE_DRIFT');
  return parseCsv(bytes.toString('utf8'));
 };
 const structure=verify(structuralBytes,EXPECTED.structural);
 const statuses=verify(statusBytes,EXPECTED.status);
 if(structure.length!==1341||statuses.length!==1341)throw Error('SCENE1341_COUNT_MISMATCH');
 const map=new Map(statuses.map(s=>[s.scene_id,s]));
 if(map.size!==1341)throw Error('SCENE1341_DUPLICATE_STATUS_ID');
 const seen=new Set(),scenes=[];
 for(const source of structure){
  if(!/^SC50-\d{4}$/.test(source.id)||seen.has(source.id))throw Error('SCENE1341_ID_INVALID');
  seen.add(source.id);
  const status=map.get(source.id);
  if(!status||status.scene_name!==source.revised_name||source.gate!=='NOT_CERTIFIED'||Number(source.certified_count)!==0)throw Error('SCENE1341_UNCERTIFIED_OR_MISMATCH');
  const refs=source.scene500?source.scene500.split(',').map(s=>s.trim()).filter(Boolean):[];
  if(refs.some(x=>!/^S(?:00[1-9]|0[1-9]\d|[1-4]\d\d|500)$/.test(x)))throw Error('SCENE1341_LEGACY_REFERENCE_INVALID');
  scenes.push(Object.freeze({sceneId:source.id,name:source.revised_name,category:source.category,legacyReferences:Object.freeze(refs),candidateCount:Number(source.candidate_count),playable:false,migrationApproved:false}));
 }
 return Object.freeze({version:'SCENE1341-LIBRARY-SOURCE-20261102',stagingOnly:true,productionEligible:false,scenes:Object.freeze(scenes),getScene:(id)=>scenes.find(s=>s.sceneId===id)||null});
}
export function loadScene1341StagingCatalog(dir){
 return createScene1341StagingCatalog({structuralBytes:fs.readFileSync(dir+'/'+EXPECTED.structural.name),statusBytes:fs.readFileSync(dir+'/'+EXPECTED.status.name)});
}
