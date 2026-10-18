// Core20K opt-in only. Reuse immutable SceneRank500 V4 rank 1–100; never infer scene sense approval.
import {parseScene500Taxonomy} from './scene500-v40-taxonomy.mjs';
export async function installScene500Top100({fetcher=fetch,base='data/scene500-top100-v40'}={}){
 const core=window.PAI_CORE;
 if(window.PAI_CORE_QA?.release!=='Core20K-dev'||core?.words?.length!==20000)throw Error('TOP100_CORE_REQUIRED');
 const taxonomy=await fetcher('data/scene500-taxonomy-20x25-v1.txt');
 if(!taxonomy.ok)throw Error('TOP100_TAXONOMY_HTTP');
 const specs=parseScene500Taxonomy(await taxonomy.text()).map(s=>({...s,desc:'Scene500 V4.0 Top100',tags:[s.name]}));
 const byId=new Map(specs.map(s=>[s.id,s]));
 let total=0,eligible=0;
 const previous=new Map(core.byScene);
 const pending=new Map();
 for(let group=1;group<=20;group++){
  const response=await fetcher(base+'/group-'+String(group).padStart(2,'0')+'.json');
  if(!response.ok)throw Error('TOP100_GROUP_HTTP:'+group);
  const data=await response.json();
  if(data.schema!=='pai-scene500-top100-v40-v1'||Object.keys(data.scenes||{}).length!==25)throw Error('TOP100_GROUP_SCHEMA:'+group);
  for(const [id,rows] of Object.entries(data.scenes)){
   if(!byId.has(id)||pending.has(id)||rows.length!==100)throw Error('TOP100_SCENE:'+id);
   const units=[],seen=new Set();
   for(let i=0;i<rows.length;i++){
    const [rank,lemma,coreRank,kuId]=rows[i],word=core.byRank.get(coreRank);
    if(rank!==i+1||!word||word.w.toLowerCase()!==lemma.toLowerCase()||seen.has(lemma))throw Error('TOP100_ROW:'+id+':'+rank);
    seen.add(lemma);total++;
    if(!kuId)continue;
    const u=core.byKU.get(kuId);
    const playable=Object.values(word.s||{}).filter(s=>s.kuType==='sense'&&s.playable===true);
    if(!u||u.w!==word||u.s.playable!==true||playable.length!==1||playable[0]!==u.s)throw Error('TOP100_KU_INVALID:'+id+':'+rank);
    units.push(u);eligible++;
   }
   pending.set(id,units);
  }
 }
 if(total!==50000||pending.size!==500||eligible!==22227)throw Error('TOP100_COVERAGE:'+total+':'+eligible);
 try{
  for(const s of specs)SCENES[s.id]=s.name;
  for(const [id,units] of pending)core.byScene.set(id,units);
  window.PAI_SCENE500={version:'Scene500 V4.0 Top100 Core20K preview',sceneIds:specs.map(s=>s.id),specs,qa:{total,eligible,blocked:total-eligible},membershipStatus:'single_general_sense_provisional',playableVocabulary:'V4 Top100 conservative general sense'};
  window.PAI_SCENE500_TOP100={scenes:500,candidates:total,eligible,blocked:total-eligible,source:'SceneRank500 V4.0',sceneSenseVerified:false};
  return window.PAI_SCENE500_TOP100;
 }catch(error){core.byScene=previous;throw error}
}
