// Candidate-only scene-discriminativeness filter; never delete lexicon identities.
// Does not rely on unverified frequency_rank, frequency_score or stopword_hint.
export function filterSceneSupportedTerms(extracted,associations,{dropNested=false}={}){
 if(!Array.isArray(extracted)||!Array.isArray(associations?.links))throw Error('SCENE500_INVALID_KEYWORD_FILTER_INPUT');
 const support=new Map();
 for(const link of associations.links){
  if(typeof link.term!=='string'||typeof link.scene_id!=='string')throw Error('SCENE500_INVALID_ASSOCIATION');
  if(!support.has(link.term))support.set(link.term,new Set());
  support.get(link.term).add(link.scene_id);
 }
 const unique=[...new Set(extracted)];
 if(unique.some(x=>typeof x!=='string'))throw Error('SCENE500_INVALID_TERM');
 const associated=unique.filter(x=>support.has(x));
 return dropNested?associated.filter(x=>!associated.some(y=>y!==x&&y.includes(x))):associated;
}
