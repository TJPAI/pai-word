// Isolated proposal-only Sense/term to scene interface. Does not activate recommendation runtime.
// Scene IDs are namespaced; English Sense IDs must be supplied by the frozen source.
export function validateAssociationRows(rows,{sceneIds,senseIds,termIds}={}){
  if(!Array.isArray(rows))throw Error('ASSOCIATIONS_MUST_BE_ARRAY');
  const scenes=new Set(sceneIds??[]),senses=new Set(senseIds??[]),terms=new Set(termIds??[]);
  const errors=[],seen=new Set(),accepted=[];
  for(let i=0;i<rows.length;i++){
    const x=rows[i]??{};
    const kind=x.source_kind;
    if(!['en_sense','zh_term','intent'].includes(kind)){errors.push({index:i,code:'INVALID_SOURCE_KIND'});continue;}
    const id=x.source_id,scene=x.scene_id,namespace=x.scene_namespace;
    if(typeof id!=='string'||!id||typeof scene!=='string'||!scene||!['scene500','scene50'].includes(namespace)){
      errors.push({index:i,code:'INVALID_ID_OR_NAMESPACE'});continue;
    }
    const key=[kind,id,namespace,scene].join('|');
    if(seen.has(key)){errors.push({index:i,code:'DUPLICATE_ASSOCIATION'});continue;}
    seen.add(key);
    if(!scenes.has(namespace+':'+scene)){errors.push({index:i,code:'UNKNOWN_NAMESPACED_SCENE'});continue;}
    if(kind==='en_sense'&&!senses.has(id)){errors.push({index:i,code:'UNKNOWN_SENSE'});continue;}
    if(kind==='zh_term'&&!terms.has(id)){errors.push({index:i,code:'UNKNOWN_TERM'});continue;}
    if(x.status!=='candidate'||x.release_eligible!==false){errors.push({index:i,code:'CANDIDATE_ONLY'});continue;}
    accepted.push({...x});
  }
  return {status:'ISOLATED_CANDIDATE_ONLY',accepted,errors};
}
