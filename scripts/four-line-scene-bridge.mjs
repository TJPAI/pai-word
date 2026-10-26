// Staged S001-S500 search bridge for the existing PAI Word app.
// No click -> legacy csNNN transition unless a reviewed mapping exists.
import {createScene500Recommender} from '../scene500-recommendation/engine.mjs';
import {validateFourLineIntegration} from './four-line-integration-contract.mjs';
export function createFourLineSceneBridge({catalog,english,activeSceneMembership,zhRuntime=null,associations=null,teaching=null,sceneMappings=[]}={}){
 const gate=validateFourLineIntegration({catalog,english,activeSceneMembership,zhRuntime,associations,teaching,sceneMappings});
 if(gate.errors.length)throw Error('FOUR_LINE_CONTRACT_BLOCKED:'+gate.errors.join(','));
 const rule=createScene500Recommender({catalog});
 const playable=new Map(gate.sceneMappings.map(m=>[m.scene_id,m.legacy_id]));
 return Object.freeze({
  gate,
  mode:'rule_fallback',
  search(query,{limit=5}={}){
   const n=Number.isInteger(limit)?Math.max(0,Math.min(10,limit)):5;
   const snapshot=rule.search(query,{limit:n});
   return Object.freeze({query:snapshot.query,mode:'rule_fallback',results:snapshot.results.map(r=>Object.freeze({
    scene_id:r.sceneId,name:r.name,score:r.score,playable:playable.has(r.sceneId),
    legacy_scene_id:playable.get(r.sceneId)??null,reason:playable.has(r.sceneId)?null:'UNVERIFIED_SCENE_MEMBERSHIP'
   }))});
  },
  resolvePlayable(sceneId){
   if(!playable.has(sceneId))return Object.freeze({allowed:false,reason:'UNVERIFIED_SCENE_MEMBERSHIP'});
   return Object.freeze({allowed:true,legacy_scene_id:playable.get(sceneId)});
  }
 });
}
