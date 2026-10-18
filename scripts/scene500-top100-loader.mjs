// Core20K opt-in only. Reuse immutable SceneRank500 V4 rank 1–100; never infer scene sense approval.
import {parseScene500Taxonomy} from './scene500-v40-taxonomy.mjs';
export async function installScene500Top100({fetcher=fetch,base='data/scene500-top100-v40'}={}){
 const core=window.PAI_CORE;
 if(window.PAI_CORE_QA?.release!=='Core20K-dev'||core?.words?.length!==20000)throw Error('TOP100_CORE_REQUIRED');
 const taxonomy=await fetcher('data/scene500-taxonomy-20x25-v1.txt');
 if(!taxonomy.ok)throw Error('TOP100_TAXONOMY_HTTP');
 const specs=parseScene500Taxonomy(await taxonomy.text()).map(s=>({...s,desc:'Scene500 V4.0 Top100',tags:[s.name]}));
 const byId=new Map(specs.map(s=>[s.id,s]));
 // Expose the canonical taxonomy immediately. Loading 20 shards must not block the homepage.
 for(const spec of specs)SCENES[spec.id]=spec.name;
 window.PAI_SCENE500={version:'Scene500 V4.0 Top100 Core20K preview',sceneIds:specs.map(s=>s.id),specs,qa:{total:50000,eligible:0,blocked:50000,loading:true},membershipStatus:'single_general_sense_provisional',playableVocabulary:'V4 Top100 conservative general sense'};
 window.PAI_SCENE500_TOP100={scenes:500,candidates:50000,eligible:0,blocked:50000,loading:true,source:'SceneRank500 V4.0',sceneSenseVerified:false};
 window.PAI_SCENE500_TOP100_READY=(async()=>{
  let total=0,eligible=0;
  const pending=new Map();
  const shards=await Promise.all(Array.from({length:20},(_,i)=>fetcher(base+'/group-'+String(i+1).padStart(2,'0')+'.json').then(async response=>{
   if(!response.ok)throw Error('TOP100_GROUP_HTTP:'+(i+1));
   return response.json();
  })));
  for(let group=0;group<shards.length;group++){
   const data=shards[group];
   if(data.schema!=='pai-scene500-top100-v40-v1'||Object.keys(data.scenes||{}).length!==25)throw Error('TOP100_GROUP_SCHEMA:'+(group+1));
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
  for(const [id,units] of pending)core.byScene.set(id,units);
  Object.assign(window.PAI_SCENE500.qa,{total,eligible,blocked:total-eligible,loading:false});
  Object.assign(window.PAI_SCENE500_TOP100,{eligible,blocked:total-eligible,loading:false});
  if(typeof window.render==='function'&&typeof state!=='undefined'&&state.view==='scenes')window.render();
  return window.PAI_SCENE500_TOP100;
 })();
 window.PAI_SCENE500_TOP100_READY.catch(error=>{
  window.PAI_SCENE500_TOP100.error=String(error?.message||error);
  window.PAI_SCENE500_TOP100.loading=false;
  console.error('Top100 data not ready',error);
 });
 return window.PAI_SCENE500_TOP100;
}
