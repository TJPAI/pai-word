// Main-app integration adapter only. Recommendation algorithm and catalog are externally owned.
// The engine is imported on first search; neither Core20K nor SRS are touched.
let pending=null;
export function getScene500Recommender(){
 if(!pending)pending=import('../scene500-recommendation/engine.mjs')
  .then(({loadScene500Recommender})=>loadScene500Recommender({
    catalogUrl:new URL('../scene500-recommendation/catalog-v0.2.json',import.meta.url).href
  })).catch(error=>{pending=null;throw error});
 return pending;
}
export async function recommendScene500(query,difficulty,index,{limit=100}={}){
 const eligibleSceneIds=Object.entries(index.scenes).filter(([,scene])=>
   Number.isInteger(scene.counts?.[difficulty])&&scene.counts[difficulty]>0
 ).map(([id])=>id);
 const engine=await getScene500Recommender();
 const snapshot=engine.search(query,{limit,eligibleSceneIds});
 return {snapshot,engine};
}
