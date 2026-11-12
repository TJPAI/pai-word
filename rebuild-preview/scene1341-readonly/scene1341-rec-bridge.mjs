/* Read-only Scene1341 recommendation bridge, using original CG-MAIN
 * home adapter and source-pinned CG-REC browser core.
 * Never creates a study queue or writes a KU/SRS record.
 */
let adapterPromise=null;
const defaultLoad=async()=>{
  if(!adapterPromise)adapterPromise=import('../scene1341-home-adapter.mjs')
    .then(async module=>{
      const adapter=module.createScene1341HomeCatalog();
      await adapter.initialize();
      return adapter;
    }).catch(error=>{adapterPromise=null;throw error});
  return adapterPromise;
};
export function createReadonlyRecommendation({load=defaultLoad}={}){
  let current=null;
  async function search(query){
    const q=String(query??'').trim();
    if(!q)return Object.freeze([]);
    const api=await load();
    if(api.releaseEligible!==false||api.canCreateStudyQueue!==false||api.canWriteSrs!==false)
      throw Error('READONLY_RECOMMENDATION_ADAPTER_GATE');
    const matches=await api.searchWithRecEngine(q,{limit:10});
    if(!Array.isArray(matches)||matches.length>10)throw Error('READONLY_RECOMMENDATION_BAD_RESULTS');
    const ids=new Set();
    const frozen=matches.map(scene=>{
      if(!/^SC50-\d{4}$/.test(scene.id)||ids.has(scene.id)||
         scene.production_release_allowed!==false||scene.canCreateStudyQueue!==false||
         scene.canWriteSrs!==false||scene.release_status!=='BLOCKED_PENDING_CG_QA_AND_MUSE'||
         scene.cg_qa!=='NOT_REVIEWED_FOR_THIS_INDEX')
        throw Error('READONLY_RECOMMENDATION_RELEASE_GATE');
      ids.add(scene.id);
      return Object.freeze({id:scene.id,name:scene.name,category:scene.category,
        sourceCount:scene.sourceCount,score:scene.score,searchEvidence:scene.searchEvidence,
        releaseAllowed:false,canCreateStudyQueue:false,canWriteSrs:false});
    });
    current=Object.freeze(frozen);
    return current;
  }
  return Object.freeze({search,get lastResults(){return current},
    releaseAllowed:false,canCreateStudyQueue:false,canWriteSrs:false});
}
export const readonlyScene1341Recommendation=createReadonlyRecommendation();
