#!/usr/bin/env node
// Run with actual V0.9.4 source, Scene500 catalog and candidate links.
// node scripts/evaluate-scene500-v094.mjs zh-core20k-v094.min.json catalog-v0.2.json associations.json holdout.json report.json
import fs from 'node:fs';
import {createScene500Recommender} from '../scene500-recommendation/engine.mjs';
import {createScene500ContractAdapter} from '../scene500-recommendation/contract-adapter.mjs';
const [,,lexPath,catPath,edgePath,casePath,reportPath]=process.argv;
if([lexPath,catPath,edgePath,casePath,reportPath].some(x=>!x))throw Error('Expected 5 input/output file paths');
const lex=JSON.parse(fs.readFileSync(lexPath,'utf8')),catalog=JSON.parse(fs.readFileSync(catPath,'utf8'));
const associations=JSON.parse(fs.readFileSync(edgePath,'utf8')),holdout=JSON.parse(fs.readFileSync(casePath,'utf8'));
if(lex.terms?.length!==20000||Object.keys(catalog.scenes||{}).length!==500)throw Error('Invalid asset dimensions');
const words={source_version:String(lex.version),terms:lex.terms.map(x=>({
 term_id:x.id,term:x.t,normalized_term:x.n,frequency_rank:null,frequency_score:null,pos:null,aliases:[],source_version:String(lex.version)
}))};
const base=createScene500Recommender({catalog});
const hybrid=createScene500ContractAdapter({catalog,lexicon:words,associations});
function evaluate(engine){
 let recall=0,mrr=0,dcg=0,denom=0,zero=0;
 const details=[];
 for(const c of holdout.cases){
  const ids=engine.search(c.query,{limit:10}).results.map(x=>x.sceneId);
  const expected=c.relevantSceneIds||[];
  if(!expected.length)continue;
  denom++;
  const at5=expected.filter(x=>ids.slice(0,5).includes(x)).length/expected.length;
  const first=ids.findIndex(x=>expected.includes(x));
  const ideal=expected.slice(0,5).reduce((a,_,i)=>a+1/Math.log2(i+2),0);
  const actual=ids.slice(0,5).reduce((a,id,i)=>a+(expected.includes(id)?1/Math.log2(i+2):0),0);
  recall+=at5;mrr+=first>=0?1/(first+1):0;dcg+=ideal?actual/ideal:0;
  if(!ids.length)zero++;
  details.push({query:c.query,expected,top5:ids.slice(0,5),recall_at5:at5,first_rank:first>=0?first+1:null});
 }
 return {labeled_queries:denom,recall_at5:recall/denom,mrr_at10:mrr/denom,ndcg_at5:dcg/denom,no_hit_queries:zero,details};
}
const b=evaluate(base),h=evaluate(hybrid);
const result={status:'diagnostic_unreviewed_not_blind',lexicon_version:lex.version,association_version:associations.association_version,
 association_edges:associations.links.length,baseline:b,hybrid:h,delta:{recall_at5:h.recall_at5-b.recall_at5,mrr_at10:h.mrr_at10-b.mrr_at10,ndcg_at5:h.ndcg_at5-b.ndcg_at5}};
fs.writeFileSync(reportPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({edges:result.association_edges,baseline:{recall_at5:b.recall_at5,mrr_at10:b.mrr_at10,ndcg_at5:b.ndcg_at5},hybrid:{recall_at5:h.recall_at5,mrr_at10:h.mrr_at10,ndcg_at5:h.ndcg_at5},delta:result.delta}));
