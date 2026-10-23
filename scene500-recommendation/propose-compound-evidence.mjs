// Auditable character-bigram multi-evidence proposals; no semantic truth claim.
// node scene500-recommendation/propose-compound-evidence.mjs runtime.json catalog.json associations.json out.json
import fs from 'node:fs';
const [lexPath,catPath,assocPath,outPath]=process.argv.slice(2);
if(!lexPath||!catPath||!assocPath||!outPath)throw Error('USAGE: propose-compound-evidence.mjs runtime.json catalog.json associations.json out.json');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [lex,catalog,assoc]=[lexPath,catPath,assocPath].map(read);
if(lex.data_version!=='0.10.1-evidence-compat'||lex.terms?.length!==20000||
 catalog.scene_count!==500||assoc.links?.length!==3553)throw Error('INCOMPATIBLE_BASELINE');
const grams=s=>{const out=new Set();for(let i=0;i<s.length-1;i++)if(/[\u4e00-\u9fff]/u.test(s[i])&&/[\u4e00-\u9fff]/u.test(s[i+1]))out.add(s.slice(i,i+2));return out;};
const profiles=new Map(),df=new Map();
for(const [sceneId,s] of Object.entries(catalog.scenes)){
 const terms=[s.name,...(s.aliases||[]),...(s.actions||[]),...(s.objects||[])];
 const set=new Set(terms.flatMap(x=>[...grams(x)]));
 profiles.set(sceneId,set);
 for(const g of set)df.set(g,(df.get(g)||0)+1);
}
const existing=new Set(assoc.links.map(x=>x.term_id+'\0'+x.scene_id));
const candidates=[],seenTerms=new Set();
for(const t of lex.terms){
 const word=t.term;
 if(t.stopword_hint===true||word.length<3||word.length>8||!(/^[\u4e00-\u9fff]+$/u).test(word))continue;
 const g=grams(word);
 if(g.size<2||[...g].some(x=>!df.has(x)))continue;
 const scored=[];
 for(const [sceneId,profile] of profiles){
  const matching=[...g].filter(x=>profile.has(x));
  if(matching.length<2||existing.has(t.term_id+'\0'+sceneId))continue;
  const score=matching.reduce((v,x)=>v+Math.log(501/(1+df.get(x))),0);
  if(score>=7)scored.push({sceneId,score,matching});
 }
 scored.sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId));
 for(const x of scored.slice(0,2)){
  seenTerms.add(t.term_id);
  candidates.push({term_id:t.term_id,term:word,scene_id:x.sceneId,scene_name:catalog.scenes[x.sceneId].name,
   raw_score:Number(x.score.toFixed(3)),matching_bigrams:x.matching,
   evidence_type:'profile_bigrams_nonsemantic',status:'review_required_not_approved',release_eligible:false});
 }
}
const result={schema:'scene500-compound-evidence-v0.1',status:'REVIEW_ONLY_NOT_APPROVED',
 source_version:lex.data_version,baseline_links:assoc.links.length,
 proposals:{links:candidates.length,terms:seenTerms.size},candidates,
 warning:'Orthographic evidence is not sense alignment. Do not auto-promote.'};
fs.writeFileSync(outPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.proposals));
