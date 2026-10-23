// Evaluate an independently labelled holdout against frozen recommendation output.
// Usage: node scene500-recommendation/evaluate-holdout.mjs gold.json predictions.json
// Gold: [{id, relevantSceneIds:["S001"], keywords:["洗衣服"]}] (keywords optional)
// Predictions: [{id, results:[{sceneId}], keywords:["洗衣服"]}] (keywords optional)
import fs from 'node:fs';
const [goldFile,predFile]=process.argv.slice(2);
if(!goldFile||!predFile)throw Error('USAGE: evaluate-holdout.mjs gold.json predictions.json');
const gold=JSON.parse(fs.readFileSync(goldFile,'utf8'));
const preds=JSON.parse(fs.readFileSync(predFile,'utf8'));
if(!Array.isArray(gold)||!Array.isArray(preds))throw Error('EXPECTED_ARRAYS');
const byId=new Map(preds.map(p=>[p.id,p]));
if(byId.size!==preds.length)throw Error('DUPLICATE_PREDICTION_ID');
const seen=new Set();
let hit=0,mrr=0,ndcg=0,kwTP=0,kwFP=0,kwFN=0,kwCases=0;
for(const item of gold){
 if(!item.id||seen.has(item.id))throw Error('DUPLICATE_OR_EMPTY_GOLD_ID');
 seen.add(item.id);
 const target=item.relevantSceneIds;
 if(!Array.isArray(target)||!target.length||new Set(target).size!==target.length)throw Error('INVALID_GOLD '+item.id);
 const p=byId.get(item.id);
 if(!p||!Array.isArray(p.results))throw Error('MISSING_PREDICTION '+item.id);
 const top=p.results.slice(0,5).map(x=>typeof x==='string'?x:x.sceneId);
 if(top.some(x=>typeof x!=='string')||new Set(top).size!==top.length)throw Error('INVALID_RANKING '+item.id);
 const rel=new Set(target);
 const hits=top.filter(x=>rel.has(x)).length;
 hit+=hits/rel.size; // graded multi-intent recall, macro-averaged
 const first=top.findIndex(x=>rel.has(x));if(first>=0)mrr+=1/(first+1);
 const dcg=top.reduce((v,id,i)=>v+(rel.has(id)?1/Math.log2(i+2):0),0);
 const ideal=Array.from({length:Math.min(rel.size,5)},(_,i)=>1/Math.log2(i+2)).reduce((a,b)=>a+b,0);
 ndcg+=dcg/ideal;
 if(item.keywords!==undefined){
  if(!Array.isArray(item.keywords)||!Array.isArray(p.keywords))throw Error('MISSING_KEYWORDS '+item.id);
  kwCases++;
  const a=new Set(item.keywords),b=new Set(p.keywords);
  if(a.size!==item.keywords.length||b.size!==p.keywords.length)throw Error('DUPLICATE_KEYWORDS '+item.id);
  for(const x of b){if(a.has(x))kwTP++;else kwFP++;}
  for(const x of a)if(!b.has(x))kwFN++;
 }
}
if(!gold.length)throw Error('EMPTY_HOLDOUT');
const div=(n,d)=>d?n/d:0;
const precision=div(kwTP,kwTP+kwFP),recall=div(kwTP,kwTP+kwFN);
console.log(JSON.stringify({
 sampleCount:gold.length,
 metricDefinitions:{recallAt5:'macro mean of relevant scene IDs retrieved in top 5',mrrAt5:'macro reciprocal rank of first relevant scene',ndcgAt5:'binary relevance; ideal DCG uses up to 5 relevant IDs'},
 recallAt5:div(hit,gold.length),mrrAt5:div(mrr,gold.length),ndcgAt5:div(ndcg,gold.length),
 keyword:kwCases?{cases:kwCases,tp:kwTP,fp:kwFP,fn:kwFN,precision,recall,f1:div(2*precision*recall,precision+recall)}:null,
 warning:'Holdout independence and labeling quality must be documented externally; scores do not imply production accuracy.'
},null,2));
