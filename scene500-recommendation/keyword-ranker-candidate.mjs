// Optional keyword ranking experiment. Never delete or conflate term_id; never use stopword_hint as hard stopword.
export function rankSceneKeywords(spans,associations,{maxTerms=10}={}){
 if(!Array.isArray(spans)||!Array.isArray(associations?.links))throw Error('SCENE500_INVALID_KEYWORD_INPUT');
 const sceneSets=new Map(),bestScore=new Map();
 for(const p of associations.links){
  if(typeof p.term!=='string'||typeof p.scene_id!=='string'||!Number.isFinite(p.score))
   throw Error('SCENE500_INVALID_ASSOCIATION');
  if(!sceneSets.has(p.term))sceneSets.set(p.term,new Set());
  sceneSets.get(p.term).add(p.scene_id);
  bestScore.set(p.term,Math.max(bestScore.get(p.term)||0,p.score));
 }
 const unique=new Map();
 for(const span of spans){
  const term=typeof span==='string'?span:span?.term;
  if(typeof term!=='string'||!term)throw Error('SCENE500_INVALID_EXTRACTED_TERM');
  const identity=typeof span==='object'&&span?.candidates?.[0]?.term_id?span.candidates[0].term_id:term;
  if(!unique.has(identity))unique.set(identity,{term,term_id:identity});
 }
 const rows=[...unique.values()].map(({term,term_id})=>{
  const df=sceneSets.get(term)?.size||0;
  const nested=[...unique.values()].some(x=>x.term!==term&&x.term.includes(term));
  const idf=df?Math.log(1+500/(1+df)):0;
  const weight=0.6+Math.min(2.5,idf*.4)+Math.min(.5,bestScore.get(term)||0)-(nested?.7:0);
  return {term,term_id,weight:Math.round(weight*1000)/1000,scene_df:df,nested,has_scene_support:df>0};
 }).sort((a,b)=>b.weight-a.weight||b.term.length-a.term.length||a.term.localeCompare(b.term));
 const n=Number.isFinite(maxTerms)?Math.max(0,Math.min(rows.length,Math.floor(maxTerms))):10;
 return {ranked:rows,selected:rows.slice(0,n)};
}
