// Opt-in bilingual evaluation wrapper; does not alter the default Scene500 contract.
// Pass an existing scene500 engine with search/getPage. No translations are inferred.
import {expandMixedQuery} from './bilingual-evidence.mjs';
export function createExperimentalBilingualAdapter(engine,{entries}={}){
 if(!engine||typeof engine.search!=='function'||typeof engine.getPage!=='function')throw Error('INVALID_SCENE500_ENGINE');
 return Object.freeze({
  version:'scene500-bilingual-experiment-v0.1',
  mode:'experimental_bilingual',
  search(query,options={}){
   const evidence=expandMixedQuery(query,entries?{entries}:undefined);
   const snapshot=engine.search(evidence.expandedQuery,options);
   return {...snapshot,query:String(query??''),bilingualEvidence:evidence.matches,
    experimental:true};
  },
  getPage(snapshot,pageIndex=0,pageSize=5){return engine.getPage(snapshot,pageIndex,pageSize);}
 });
}
