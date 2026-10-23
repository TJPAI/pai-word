// Run real Scene500 runtime smoke using three approved local assets, never deploys.
// node scene500-recommendation/verify-real-runtime.mjs <catalog.json> <zh-v094.min.json> <associations.json> [report.json]
import fs from 'node:fs';
import crypto from 'node:crypto';
import {loadScene500WithChineseLexicon} from './chinese-lexicon-loader.mjs';
const [catalogPath,lexPath,associationsPath,reportPath]=process.argv.slice(2);
if(!catalogPath||!lexPath||!associationsPath)throw Error('USAGE: verify-real-runtime.mjs catalog.json zh-v094.min.json associations.json [report.json]');
const bytes=p=>fs.readFileSync(p);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const [catalogBytes,lexBytes,assocBytes]=[catalogPath,lexPath,associationsPath].map(bytes);
const [catalog,lexicon,associations]=[catalogBytes,lexBytes,assocBytes].map(b=>JSON.parse(b.toString('utf8')));
const source=associations.source??{};
const isV0101=lexicon.data_version==='0.10.1-evidence-compat';
const validTermIds=new Set(lexicon.terms.map(t=>t.term_id??t.id));
const checks={
 exactLexiconSHA:isV0101?hash(lexBytes)==='18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093':hash(lexBytes)===source.lexicon_sha256,
 exactCatalogSHA:hash(catalogBytes)===source.catalog_sha256,
 lexiconVersion:isV0101?(lexicon.contract_version==='1.1'&&lexicon.integration_ready===true&&lexicon.production_ready===false):lexicon.version===source.lexicon_version,
 termCount:lexicon.terms?.length===20000,
 sceneCount:Object.keys(catalog.scenes??{}).length===500,
 associationCount:associations.links?.length===3553,
 validOldAssociationIds:associations.links.every(x=>validTermIds.has(x.term_id))
};
if(Object.values(checks).some(x=>!x))throw Error('REAL_ASSET_MISMATCH '+JSON.stringify(checks));
const response=data=>({ok:true,json:async()=>data});
const started=performance.now();
const engine=await loadScene500WithChineseLexicon({
 catalog,lexiconUrl:'local:lex',associationUrl:'local:assoc',timeoutMs:30000,
 fetchImpl:async uri=>response(uri==='local:lex'?lexicon:associations)
});
const loadMs=Math.round((performance.now()-started)*10)/10;
if(engine.mode!=='hybrid')throw Error('REAL_RUNTIME_FELL_BACK');
const termByValue=new Map(lexicon.terms.map(t=>[t.term??t.t,t.term_id??t.id]));
const counts=new Map();
for(const x of associations.links)counts.set(x.term_id,(counts.get(x.term_id)||0)+1);
const queries=['书','猫','会议','机器学习','的','他','我想开会','我想学习机器学习'];
const cases=queries.map(query=>{
 const snapshot=engine.search(query,{limit:20});
 const top=snapshot.results.slice(0,5).map(x=>({sceneId:x.sceneId,name:x.name,score:x.score,reason:x.reason}));
 const id=termByValue.get(query);
 const baselineLinks=id?(counts.get(id)??0):null;
 if(engine.getPage(snapshot,0,5).length!==Math.min(5,snapshot.results.length))throw Error('PAGING_MISMATCH');
 return {query,inCore20K:!!id,baselineLinks,total:snapshot.total,top};
});
const report={
 status:'REAL_RUNTIME_SMOKE_PASS_NOT_SEMANTIC_QA',
 provenance:{lexiconVersion:lexicon.version,associationVersion:associations.association_version,
 lexiconSha256:hash(lexBytes),catalogSha256:hash(catalogBytes),runtimeVersion:lexicon.data_version??lexicon.version},
 checks,loadMs,engineMode:engine.mode,caseCount:cases.length,cases,
 caveats:['Candidate/unverified lexical edges do not imply semantic accuracy','Not browser/Safari E2E']
};
const json=JSON.stringify(report,null,2)+'\n';
if(reportPath)fs.writeFileSync(reportPath,json);
console.log(json);
