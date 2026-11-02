// Candidate-only literal scene-name search; NOT a cross-language semantic recommender.
import {loadScene1341StagingCatalog} from './scene1341-staging-catalog.mjs';
const norm=x=>String(x??'').normalize('NFKC').toLocaleLowerCase().trim().replace(/\s+/g,' ');
export function createScene1341IsolatedQuery(catalog){
 if(!catalog?.stagingOnly||catalog.productionEligible!==false||catalog.scenes?.length!==1341)throw Error('SCENE1341_UNVERIFIED_CATALOG');
 const records=catalog.scenes.map(x=>({scene:x,key:norm(x.name)}));
 return Object.freeze({engine:'SCENE1341_LITERAL_CANDIDATE_ONLY',semanticCertified:false,playable:false,
  search(query,{limit=10}={}){
   const q=norm(query);
   if(!q)return Object.freeze({query:q,results:[],mode:'EMPTY_QUERY',playable:false});
   if(!Number.isInteger(limit)||limit<1||limit>20)throw Error('SCENE1341_INVALID_LIMIT');
   const rows=records.filter(x=>x.key===q||x.key.includes(q)||q.includes(x.key))
    .map(x=>({sceneId:x.scene.sceneId,name:x.scene.name,matchType:x.key===q?'exact_title':'title_substring',playable:false,migrationApproved:false}))
    .sort((a,b)=>(a.matchType==='exact_title'?0:1)-(b.matchType==='exact_title'?0:1)||a.sceneId.localeCompare(b.sceneId)).slice(0,limit);
   return Object.freeze({query:q,results:rows,mode:'TITLE_ONLY_NOT_SEMANTIC',playable:false});
  }
 });
}
export function openLocalScene1341Query(dir='tools/integration/scene1341-source'){
 return createScene1341IsolatedQuery(loadScene1341StagingCatalog(dir));
}
