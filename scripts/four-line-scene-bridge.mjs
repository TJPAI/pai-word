// Staged S001-S500 search bridge for the existing PAI Word app.
// No click -> legacy csNNN transition unless a reviewed mapping exists.
import {createScene500Recommender} from '../scene500-recommendation/engine.mjs';
import {loadScene500WithChineseLexicon} from '../scene500-recommendation/chinese-lexicon-loader.mjs';
import {validateFourLineIntegration} from './four-line-integration-contract.mjs';
export function createFourLineSceneBridge({catalog,english,activeSceneMembership,zhRuntime=null,associations=null,teaching=null,sceneMappings=[],useHybrid=false}={}){
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
export async function createFourLineHybridBridge({catalog,english,activeSceneMembership,zhRuntime,associations,sceneMappings=[],teaching}={}){
 // The Hybrid reader requires actual asset URLs and the full association contract.
 // Do not silently claim "hybrid" based on an unverified V0.10.1 release string.
 const gate=validateFourLineIntegration({catalog,english,activeSceneMembership,zhRuntime,associations,sceneMappings,teaching});
 if(gate.errors.length||!gate.capabilities.recommendationHybrid)throw Error('FOUR_LINE_HYBRID_ASSETS_NOT_VALIDATED');
 const rule=createFourLineSceneBridge({catalog,english,activeSceneMembership,zhRuntime,associations,sceneMappings,teaching});
 return Object.freeze({...rule,mode:'hybrid_pending_runtime_e2e',gate});
}
