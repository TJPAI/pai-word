// Generate broad, explainable, experimental Scene500 compound extension.
// Not an approved association pack. Requires explicit opt-in at runtime.
// node scene500-recommendation/build-experimental-extension.mjs lex.json catalog.json baseline.json output.json
import fs from 'node:fs';
const [lp,cp,ap,op]=process.argv.slice(2);
if(!op)throw Error('USAGE: build-experimental-extension.mjs lex catalog associations output');
const [lex,cat,baseline]=[lp,cp,ap].map(p=>JSON.parse(fs.readFileSync(p,'utf8')));
if(lex.data_version!=='0.10.1-evidence-compat'||lex.terms?.length!==20000||cat.scene_count!==500||baseline.links?.length!==3553)throw Error('INVALID_BASELINE');
const terms=new Map(lex.terms.map(t=>[t.term_id,t]));
const postings=new Map(),linkedIds=new Set(),oldPairs=new Set();
for(const a of baseline.links){
 const t=terms.get(a.term_id);
 if(!t||!cat.scenes[a.scene_id])throw Error('INVALID_BASELINE_ASSOCIATION');
 if(!postings.has(t.term))postings.set(t.term,[]);
 postings.get(t.term).push(a);
 linkedIds.add(a.term_id);oldPairs.add(JSON.stringify([a.term_id,a.scene_id]));
}
const ignored=new Set(['动机','服务','工作','关系','问题','时间','事情','东西','中心','起来','可以','进行','自己','需要','影响','一种','规模','基本','部分','其他','自动','支持','怎么','什么','第一','没有','不到','大学','学校','学习','上学','家里','生活']);
const index=new Map();
for(const [base,rows] of postings){
 if(base.length<2||ignored.has(base))continue;
 const keys=new Set([base.slice(0,2),base.slice(-2)]);
 for(const key of keys){if(!index.has(key))index.set(key,new Set());index.get(key).add(base);}
}
const seen=new Set(),candidates=[];
for(const t of lex.terms){
 const word=t.term;
 if(linkedIds.has(t.term_id)||t.stopword_hint===true||word.length<3||word.length>8||!/^[\u4e00-\u9fff]+$/u.test(word))continue;
 const keys=[word.slice(0,2),word.slice(-2)];
 const anchors=[...new Set(keys.flatMap(key=>[...(index.get(key)||[])]))]
  .filter(base=>base.length<word.length&&base.length/word.length>=.5&&(word.startsWith(base)||word.endsWith(base)))
  .sort((a,b)=>b.length-a.length||a.localeCompare(b));
 if(!anchors.length)continue;
 const anchor=anchors[0];
 const edges=[...postings.get(anchor)].sort((a,b)=>a.rank-b.rank||a.scene_id.localeCompare(b.scene_id)).slice(0,3);
 for(const a of edges){
  const key=JSON.stringify([t.term_id,a.scene_id]);
  if(oldPairs.has(key)||seen.has(key))continue;
  seen.add(key);
  candidates.push({term_id:t.term_id,term:t.term,scene_id:a.scene_id,anchor_term:anchor,
   anchor_term_id:a.term_id,score:Math.min(.45,Math.max(.1,a.score*.5)),rank:a.rank,
   evidence_type:'experimental_compound_inheritance',confidence:0,
   status:'EXPERIMENTAL_UNVERIFIED',release_eligible:false});
 }
}
const out={schema:'scene500-experimental-compound-extension-v0.1',status:'EXPERIMENTAL_NOT_APPROVED',
 lexicon_version:lex.data_version,baseline_count:baseline.links.length,
 candidate_links:candidates.length,candidate_terms:new Set(candidates.map(c=>c.term_id)).size,
 requires_opt_in:true,production_ready:false,candidates};
fs.writeFileSync(op,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({status:out.status,links:out.candidate_links,terms:out.candidate_terms}));
