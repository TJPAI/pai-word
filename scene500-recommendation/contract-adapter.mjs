// Scene500 independent contract adapter v0.1; additive and does not change legacy engine.
import {createScene500Recommender} from './engine.mjs';
import {createSparseSceneRetriever} from './sparse-retriever.mjs';
export const RECOMMENDATION_CONTRACT_VERSION='scene500-recommendation-contract-v0.1';
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\s，。！？、；：,.!?;:]+/g,'');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function validateChineseLexiconContract(lexicon){
 if(!lexicon||typeof lexicon.source_version!=='string'||!lexicon.source_version.trim()||!Array.isArray(lexicon.terms))throw Error('SCENE500_INVALID_CHINESE_LEXICON');
 const ids=new Set(),keys=new Set();
 for(const t of lexicon.terms){
  if(!t||typeof t.term_id!=='string'||!t.term_id.trim()||typeof t.term!=='string'||!t.term.trim()||
  typeof t.normalized_term!=='string'||!t.normalized_term.trim()||
  (t.frequency_rank!=null&&(!Number.isInteger(t.frequency_rank)||t.frequency_rank<1))||
  (t.frequency_score!=null&&(!finite(t.frequency_score)||t.frequency_score<0))||
  !Array.isArray(t.aliases)||typeof t.source_version!=='string'||!t.source_version.trim()||
  (t.pos!=null&&typeof t.pos!=='string')||ids.has(t.term_id)||keys.has(t.normalized_term))
   throw Error('SCENE500_INVALID_CHINESE_TERM: '+String(t?.term_id));
  ids.add(t.term_id);keys.add(t.normalized_term);
 }
 return {count:ids.size,sourceVersion:lexicon.source_version};
}
export function validateAssociations({lexicon,associations,catalog}){
 const valid=new Set(lexicon.terms.map(t=>t.term_id)),counts=new Map(),seen=new Set();
 if(!associations||typeof associations.association_version!=='string'||!Array.isArray(associations.links))throw Error('SCENE500_INVALID_ASSOCIATIONS');
 for(const p of associations.links){
  const k=p.term_id+'\u0000'+p.scene_id;
  if(!valid.has(p.term_id)||!catalog.scenes?.[p.scene_id]||!finite(p.score)||p.score<0||p.score>1||
    !Number.isInteger(p.rank)||p.rank<1||p.rank>50||typeof p.evidence_type!=='string'||
    !p.evidence_type||!finite(p.confidence)||p.confidence<0||p.confidence>1||
    p.association_version!==associations.association_version||seen.has(k))throw Error('SCENE500_INVALID_ASSOCIATION: '+k);
  seen.add(k);counts.set(p.term_id,(counts.get(p.term_id)||0)+1);
  if(counts.get(p.term_id)>50)throw Error('SCENE500_TOO_MANY_ASSOCIATIONS: '+p.term_id);
 }
 return {links:seen.size,linkedTerms:counts.size};
}
export function createScene500ContractAdapter({catalog,lexicon,associations,minimumScore=3}){
 validateChineseLexiconContract(lexicon);
 validateAssociations({catalog,lexicon,associations});
 const base=createScene500Recommender({catalog,minimumScore});
 const linksByTerm=new Map();
 for(const link of associations.links){
  if(!linksByTerm.has(link.term_id))linksByTerm.set(link.term_id,[]);
  linksByTerm.get(link.term_id).push(link);
 }
 const registry={scene_count:500,terms:{}};
 for(const t of lexicon.terms){
  const key=norm(t.normalized_term);
  const links=(linksByTerm.get(t.term_id)||[]).sort((a,b)=>a.rank-b.rank);
  if(key.length>1&&links.length)registry.terms[key]=links.map(p=>({sceneId:p.scene_id,weight:p.score}));
 }
 const sparse=createSparseSceneRetriever({catalog,registry});
 return Object.freeze({
  version:RECOMMENDATION_CONTRACT_VERSION,
  lexiconVersion:lexicon.source_version,
  associationVersion:associations.association_version,
  search(query,{limit=20,eligibleSceneIds=null}={}){
   const baseRows=base.search(query,{limit:500,eligibleSceneIds}).results;
   const sparseRows=sparse.search(query,{limit:500,eligibleSceneIds,maxTerms:10});
   const map=new Map();
   for(const x of baseRows)map.set(x.sceneId,{sceneId:x.sceneId,name:x.name,score:x.score,matchedTerms:[],reason:['rule_match'],quality:x.quality});
   for(const x of sparseRows.results){
    const old=map.get(x.sceneId)||{sceneId:x.sceneId,name:x.name,score:0,matchedTerms:[],reason:[],quality:catalog.scenes[x.sceneId].quality};
    old.score+=x.score;
    old.matchedTerms=sparseRows.terms.filter(term=>registry.terms[term]?.some(p=>p.sceneId===x.sceneId));
    old.reason.push('term_scene_association');
    map.set(x.sceneId,old);
   }
   const rows=[...map.values()].sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId));
   rows.forEach((x,i)=>{x.rank=i+1;x.score=Math.round(x.score*1000)/1000;});
   const n=Number.isFinite(Number(limit))?Math.max(0,Math.min(500,Math.floor(Number(limit)))):20;
   return {query:String(query??''),total:rows.length,results:rows.slice(0,n)};
  },
  getPage(snapshot,pageIndex=0,pageSize=5){return base.getPage(snapshot,pageIndex,pageSize);}
 });
}
