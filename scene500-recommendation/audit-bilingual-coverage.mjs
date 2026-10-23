// Coverage accounting for Chinese Core20K and English Core20K.
// Offline; output is an audit, NEVER an association pack or production approval.
// Usage: node audit-bilingual-coverage.mjs zh-runtime.json zh-links.json [en-headwords.json] [en-links.json]
import fs from 'node:fs';
const args=process.argv.slice(2);
if(args.length<2)throw Error('USAGE: audit-bilingual-coverage.mjs zh-runtime.json zh-links.json [en-headwords.json] [en-links.json]');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const zh=read(args[0]),links=read(args[1]);
if(zh.data_version!=='0.10.1-evidence-compat'||zh.terms?.length!==20000)throw Error('INVALID_ZH_BASELINE');
const byId=new Map(zh.terms.map(t=>[t.term_id,t]));
if(byId.size!==20000)throw Error('DUPLICATE_ZH_TERM_ID');
const perTerm=new Map(),perScene=new Map();
for(const x of links.links){
 if(!byId.has(x.term_id))throw Error('INVALID_ASSOCIATION_TERM '+x.term_id);
 perTerm.set(x.term_id,(perTerm.get(x.term_id)||0)+1);
 perScene.set(x.scene_id,(perScene.get(x.scene_id)||0)+1);
}
if(links.links.length!==3553)throw Error('UNEXPECTED_ASSOCIATION_BASELINE');
const exceptions={};
const missing=[];
for(const t of zh.terms){
 const count=perTerm.get(t.term_id)||0;
 // stopword_hint is a triage hint, not proof a term must have zero links.
 const disposition=t.stopword_hint===true?'exception_review':'target_coverage';
 exceptions[disposition]=(exceptions[disposition]||0)+1;
 if(!count)missing.push({term_id:t.term_id,term:t.term,disposition});
}
const zhStats={
 version:zh.data_version,headwords:zh.terms.length,
 linkedTerms:perTerm.size,unlinkedTerms:missing.length,links:links.links.length,
 coveragePct:Number((perTerm.size/zh.terms.length*100).toFixed(2)),
 byDisposition:exceptions,
 targetUnlinked:missing.filter(x=>x.disposition==='target_coverage').length,
 exceptionReviewUnlinked:missing.filter(x=>x.disposition==='exception_review').length,
 sceneDistribution:{coveredScenes:perScene.size,emptyScenes:500-perScene.size,
  min:Math.min(...Array.from({length:500},(_,i)=>perScene.get('S'+String(i+1).padStart(3,'0'))||0)),
  max:Math.max(...perScene.values())},
 examplesOfMissing:missing.filter(x=>x.disposition==='target_coverage').slice(0,30)
};
let enStats={status:'ENGLISH_RUNTIME_NOT_SUPPLIED',reason:'Do not infer 20k identities or association coverage from KU counts'};
if(args[2]){
 const en=read(args[2]);
 const rows=Array.isArray(en)?en:Array.isArray(en.headwords)?en.headwords:Array.isArray(en.words)?en.words:Array.isArray(en.entries)?en.entries:null;
 if(!rows||rows.length!==20000)throw Error('UNRECOGNIZED_ENGLISH_20K_SCHEMA');
 const ids=new Set(),words=new Set();
 for(const x of rows){
  const word=typeof x==='string'?x:(x.headword??x.word??x.lemma);
  if(typeof word!=='string'||!word.trim())throw Error('INVALID_ENGLISH_WORD');
  words.add(word.toLowerCase().trim());
  const id=typeof x==='string'?word:(x.word_id??x.id??x.headword_id??null);
  if(id!=null){if(ids.has(id))throw Error('DUPLICATE_ENGLISH_ID');ids.add(id);}
 }
 if(words.size!==20000)throw Error('DUPLICATE_ENGLISH_HEADWORD');
 enStats={status:'HEADWORD_MEMBERSHIP_VALIDATED_ONLY',headwords:words.size,
  sourceSchema:Array.isArray(en)?'array':Object.keys(en).filter(k=>Array.isArray(en[k])).join(',')};
 if(args[3]){
  const edge=read(args[3]),arr=Array.isArray(edge)?edge:edge.links;
  if(!Array.isArray(arr))throw Error('INVALID_ENGLISH_LINKS');
  const linked=new Set();
  for(const a of arr){
   const word=String(a.headword??a.word??'').toLowerCase();
   if(!words.has(word))throw Error('UNRESOLVED_ENGLISH_LINK');
   linked.add(word);
  }
  enStats={...enStats,status:'COVERAGE_AUDITED',links:arr.length,linkedTerms:linked.size,coveragePct:Number((linked.size/20000*100).toFixed(2))};
 }
}
const report={schema:'scene500-bilingual-coverage-audit-v0.1',
 qualityGate:'AUDIT_ONLY_NOT_RELEASE_APPROVAL',
 policy:{target:'Most content and learnable words should have 1-5 justified scene links (not a fixed 1,000 per scene)',
 exceptionCriteria:['high-frequency grammatical function words without distinct situation','ambiguous lexical items without sense-level disambiguation','unsafe/unverifiable topical inference'],
 exceptionPolicy:'Mark candidate exemption for review; stopword_hint never silently removes lexicon membership',
 englishPolicy:'Use approved English headword membership and sense/KU evidence where available; never equate a candidate with certified playability'},
 zh:zhStats,en:enStats};
console.log(JSON.stringify(report,null,2));
