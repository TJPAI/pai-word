// Stage 1 of lightweight startup: prepare a complete, independently searchable
// Scene500 catalog. Does NOT initialize or mutate the learning engine.
import {loadHomeIndex,homeSceneSpecs} from './home-index.mjs';
let ready;
export function prepareLightweightHome({fetcher=fetch}={}){
 if(ready)return ready;
 ready=(async()=>{
  const index=await loadHomeIndex({fetcher});
  const specs=homeSceneSpecs(index);
  // Commit globals only after all validations succeed.
  window.PAI_LIGHT_HOME_INDEX=index;
  window.PAI_LIGHT_HOME_SPECS=specs;
  return {index,specs};
 })().catch(e=>{ready=null;throw e});
 return ready;
}
export function installLightweightSceneCatalog({index,specs}){
 if(index?.schema!=='pai-word-v21-home-index-v1'||specs?.length!==500)
  throw Error('HOME_NOT_PREPARED');
 if(typeof SCENES==='undefined')throw Error('HOME_SCENES_UNAVAILABLE');
 for(const spec of specs)SCENES[spec.id]=spec.name;
 window.PAI_SCENE500={version:'Scene500 lightweight home v1',specs,
  sceneIds:specs.map(s=>s.id),qa:{total:50000,eligible:22227,blocked:27773,loading:false},
  membershipStatus:'single_general_sense_provisional'};
 return window.PAI_SCENE500;
}
