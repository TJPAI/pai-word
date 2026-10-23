#!/usr/bin/env node
// Lexicon extraction diagnostic: lexical identity coverage is NOT scene-intent keyword quality.
import fs from 'node:fs';
import {createChineseV094Index} from '../scene500-recommendation/zh-v094-runtime-bridge.mjs';
const [lexPath,labelsPath,reportPath]=process.argv.slice(2);
if(!lexPath||!labelsPath||!reportPath)throw Error('Usage: node scripts/evaluate-scene500-keywords.mjs compact.json labels.json report.json');
const lex=JSON.parse(fs.readFileSync(lexPath,'utf8'));
const labels=JSON.parse(fs.readFileSync(labelsPath,'utf8'));
if(labels.schema!=='scene500-keyword-diagnostic-v0.1'||!Array.isArray(labels.cases)||labels.cases.length===0)
 throw Error('SCENE500_INVALID_KEYWORD_LABELS');
const index=createChineseV094Index(lex);
const vocabulary=new Set(lex.terms.map(t=>t.t));
let tp=0,fp=0,fn=0,oov=0;
const details=[];
for(const c of labels.cases){
 if(typeof c.query!=='string'||!Array.isArray(c.keywords)||new Set(c.keywords).size!==c.keywords.length||
    c.keywords.some(x=>typeof x!=='string'||!x||!c.query.includes(x)))throw Error('SCENE500_INVALID_GOLD_QUERY');
 const extracted=index.extract(c.query,{maxTerms:10}).map(x=>x.term);
 const predicted=[...new Set(extracted)];
 const gold=c.keywords.filter(x=>vocabulary.has(x));
 const missing=c.keywords.filter(x=>!vocabulary.has(x));
 const goldSet=new Set(gold),predSet=new Set(predicted);
 const matched=predicted.filter(x=>goldSet.has(x));
 tp+=matched.length;fp+=predicted.filter(x=>!goldSet.has(x)).length;fn+=gold.filter(x=>!predSet.has(x)).length;oov+=missing.length;
 details.push({query:c.query,category:c.category,gold:c.keywords,gold_in_lexicon:gold,gold_oov:missing,predicted,matched,missed:gold.filter(x=>!predSet.has(x)),extras:predicted.filter(x=>!goldSet.has(x))});
}
const precision=tp+fp?tp/(tp+fp):0,recall=tp+fn?tp/(tp+fn):0;
const report={schema:'scene500-keyword-extraction-diagnostic-v0.1',quality:'editorial_unreviewed_not_blind',
 distinction:'Exact gold lexical spans available in V094; does not measure semantic intent precision',
 lexicon_version:lex.version,queries:details.length,totals:{tp,fp,fn,oov_gold_spans:oov},
 metrics:{precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0},
 details};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({queries:report.queries,totals:report.totals,metrics:report.metrics}));
