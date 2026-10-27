import fs from 'node:fs';
import {loadScene500WithChineseLexicon} from '../../scene500-recommendation/chinese-lexicon-loader.mjs';
import {createScene500Recommender} from '../../scene500-recommendation/engine.mjs';
const [cp,lp,ap]=process.argv.slice(2);
if(!cp||!lp||!ap)throw Error('USAGE: node tools/cg-rec-eval/diagnose-english.mjs CATALOG LEXICON ASSOCIATIONS');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [catalog,lexicon,assoc]=[cp,lp,ap].map(read);
const response=v=>({ok:true,json:async()=>v});
const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lex',associationUrl:'assoc',fetchImpl:async u=>response(u==='lex'?lexicon:assoc)});
if(engine.mode!=='hybrid')throw Error('FALLBACK_INVALID');
const rule=createScene500Recommender({catalog});
const cases=[
 {query:'Could you take me to the train station by taxi?',target:'S080'},
 {query:'Wait for the pedestrian light before crossing',target:'S090'},
 {query:'The application fails to launch after the update',target:'S275'},
 {query:'Our vehicle broke down and we need roadside assistance',target:'S100'},
 {query:'I need to declare these goods at customs',target:'S110'},
 {query:'What is in this dish?',target:'S036'},
 {query:'I want to practice English for this situation: What is in this dish?',target:'S036'}
];
const rows=cases.map(({query,target})=>{
 const hybrid=engine.search(query,{limit:10}).results;
 const legacyRule=rule.search(query,{limit:10}).results;
 return {query,target,hybrid:hybrid.map(({sceneId,score,reason,matchedTerms})=>({sceneId,score,reason,matchedTerms})),rule:legacyRule.map(({sceneId,score})=>({sceneId,score})),targetInTop5:hybrid.slice(0,5).some(x=>x.sceneId===target),unrelatedAICluster:hybrid.slice(0,5).filter(x=>['S276','S277','S278','S279','S280'].includes(x.sceneId)).map(x=>x.sceneId)};
});
console.log(JSON.stringify({status:'DIAGNOSTIC_ONLY_NOT_GOLD',engineMode:engine.mode,notes:['Hybrid internally applies observed corrections via mergeSubjectCandidates; reapplying is not a valid ablation.','Matched terms and reason are diagnostics, not causal proof.','Rule search is a separate original rule-only control, not equivalent to previous Hybrid baseline.'],rows},null,2));
