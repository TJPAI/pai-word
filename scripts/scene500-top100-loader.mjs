// Core20K Scene500 Top100: load one 25-scene shard on demand.
// All scene IDs and names are installed from the canonical taxonomy.
// The recommendation engine and SRS stores are not touched.
import {parseScene500Taxonomy} from './scene500-v40-taxonomy.mjs';
let installation=null;
export async function installScene500Top100({fetcher=fetch,base='data/scene500-top100-v40',sceneId=null}={}){
 const core=window.PAI_CORE;
 if(window.PAI_CORE_QA?.release!=='Core20K-dev'||core?.words?.length!==20000)throw Error('TOP100_CORE_REQUIRED');
 if(!installation){
  installation=(async()=>{
   const taxonomy=await fetcher('data/scene500-taxonomy-20x25-v1.txt');
   if(!taxonomy.ok)throw Error('TOP100_TAXONOMY_HTTP');
   const specs=parseScene500Taxonomy(await taxonomy.text()).map(s=>({...s,desc:'Scene500 V4.0 Top100',tags:[s.name]}));
   if(specs.length!==500)throw Error('TOP100_TAXONOMY_SIZE');
   const byId=new Map(specs.map(s=>[s.id,s]));
   for(const spec of specs)SCENES[spec.id]=spec.name;
   const qa={total:50000,eligible:0,blocked:50000,loading:true};
   window.PAI_SCENE500={version:'Scene500 V4.0 Top100 Core20K preview',sceneIds:specs.map(s=>s.id),specs,qa,membershipStatus:'single_general_sense_provisional',playableVocabulary:'V4 Top100 conservative general sense'};
   const status=window.PAI_SCENE500_TOP100={scenes:500,candidates:50000,eligible:0,blocked:50000,loading:true,source:'SceneRank500 V4.0',sceneSenseVerified:false,loadedGroups:0};
   const loaded=new Set(),pending=new Map();
   async function loadGroup(group){
    if(loaded.has(group))return;
    if(pending.has(group))return pending.get(group);
    const job=(async()=>{
     const response=await fetcher(base+'/group-'+String(group).padStart(2,'0')+'.json');
     if(!response.ok)throw Error('TOP100_GROUP_HTTP:'+group);
     const data=await response.json();
     if(data.schema!=='pai-scene500-top100-v40-v1'||Object.keys(data.scenes||{}).length!==25)throw Error('TOP100_GROUP_SCHEMA:'+group);
     const resolved=new Map();let eligible=0;
     for(const [id,rows] of Object.entries(data.scenes)){
      const n=Number(id.slice(1));
      if(!byId.has(id)||!Number.isInteger(n)||Math.floor((n-1)/25)+1!==group||rows.length!==100)throw Error('TOP100_SCENE:'+id);
      const units=[],seen=new Set();
      for(let i=0;i<rows.length;i++){
       const [rank,lemma,coreRank,kuId]=rows[i],word=core.byRank.get(coreRank);
       if(rank!==i+1||!word||word.w.toLowerCase()!==lemma.toLowerCase()||seen.has(lemma))throw Error('TOP100_ROW:'+id+':'+rank);
       seen.add(lemma);
       if(!kuId)continue;
       const u=core.byKU.get(kuId),playable=Object.values(word.s||{}).filter(s=>s.kuType==='sense'&&s.playable===true);
       if(!u||u.w!==word||u.s.playable!==true||playable.length!==1||playable[0]!==u.s)throw Error('TOP100_KU_INVALID:'+id+':'+rank);
       units.push(u);eligible++;
      }
      resolved.set(id,units);
     }
     if(resolved.size!==25)throw Error('TOP100_GROUP_COVERAGE:'+group);
     for(const [id,units] of resolved)core.byScene.set(id,units);
     loaded.add(group);
     qa.eligible+=eligible;qa.blocked=qa.total-qa.eligible;
     status.eligible=qa.eligible;status.blocked=qa.blocked;status.loadedGroups=loaded.size;
     if(loaded.size===20){
      if(qa.eligible!==22227)throw Error('TOP100_COVERAGE:'+qa.eligible);
      qa.loading=false;status.loading=false;
     }
    })().finally(()=>pending.delete(group));
    pending.set(group,job);
    return job;
   }
   async function ensureScene(id){
    if(!/^S(?:00[1-9]|0[1-9][0-9]|[1-4][0-9][0-9]|500)$/.test(id)||!byId.has(id))throw Error('TOP100_INVALID_SCENE:'+id);
    await loadGroup(Math.floor((Number(id.slice(1))-1)/25)+1);
    return core.byScene.get(id);
   }
   async function loadAll(){
    await Promise.all(Array.from({length:20},(_,i)=>loadGroup(i+1)));
    if(loaded.size!==20||qa.eligible!==22227)throw Error('TOP100_COVERAGE');
    return status;
   }
   window.PAI_ENSURE_SCENE500_TOP100=ensureScene;
   window.PAI_SCENE500_TOP100_LOAD_ALL=loadAll;
   return {ensureScene,loadAll,status};
  })().catch(error=>{installation=null;throw error});
 }
 const controller=await installation;
 // The first study intent only needs one 25-scene shard, not all 500 scenes.
 const ready=sceneId?controller.ensureScene(sceneId):controller.loadAll();
 window.PAI_SCENE500_TOP100_READY=ready;
 return ready;
}
