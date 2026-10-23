// Candidate-only propagation from a known linked base term to a longer Chinese compound.
// Deliberately conservative: a substring does not certify lexical meaning.
// node scene500-recommendation/propose-compound-inheritance.mjs v0101.json links.json catalog.json out.json
import fs from 'node:fs';
const [lp,ap,cp,op]=process.argv.slice(2);
if(!lp||!ap||!cp||!op)throw Error('USAGE: propose-compound-inheritance.mjs lex.json links.json catalog.json out.json');
const [lex,assoc,catalog]=[lp,ap,cp].map(p=>JSON.parse(fs.readFileSync(p,'utf8')));
if(lex.data_version!=='0.10.1-evidence-compat'||lex.terms?.length!==20000||assoc.links?.length!==3553||catalog.scene_count!==500)throw Error('INVALID_BASELINE');
const byId=new Map(lex.terms.map(t=>[t.term_id,t])),byWord=new Map(lex.terms.map(t=>[t.term,t]));
const linked=new Map(),baseline=new Set();
for(const x of assoc.links){
 const t=byId.get(x.term_id);if(!t||!catalog.scenes[x.scene_id])throw Error('INVALID_BASELINE_LINK');
 if(!linked.has(t.term))linked.set(t.term,[]);
 linked.get(t.term).push(x);
 baseline.add(x.term_id+'\0'+x.scene_id);
}
const bad=new Set(['什么','怎么','第一','部分','没有','不到','动机','服务','他人','起来','中心','自动','支持','影响','规模','时间','小时','工作','关系','问题','东西','其他','一种','不少','自己','已经','进行','可以','应该']);
const candidates=[],seen=new Set(),risk=[];
for(const t of lex.terms){
 const word=t.term;
 if(t.stopword_hint===true||byWord.get(word)?.term_id!==t.term_id||linked.has(word)||!(/^[\u4e00-\u9fff]{3,7}$/u).test(word))continue;
 const anchors=[];
 for(const [base,edges] of linked){
  if(base.length<2||bad.has(base)||base.length/word.length<0.6||
    !(word.startsWith(base)||word.endsWith(base)))continue;
  anchors.push({base,edges});
 }
 anchors.sort((a,b)=>b.base.length-a.base.length||a.base.localeCompare(b.base));
 if(!anchors.length)continue;
 const best=anchors[0];
 for(const e of best.edges.slice(0,3)){
  const key=t.term_id+'\0'+e.scene_id;if(baseline.has(key)||seen.has(key))continue;
  seen.add(key);
  const x={term_id:t.term_id,term:word,scene_id:e.scene_id,scene_name:catalog.scenes[e.scene_id].name,
   inherited_from_term:best.base,inherited_from_term_id:byWord.get(best.base)?.term_id??null,
   evidence_type:'morphology_shared_base_unverified',status:'review_required_not_approved',
   release_eligible:false,confidence:null,semantic_risk:'compound_meaning_may_differ_from_base'};
  candidates.push(x);
 }
}
const result={schema:'scene500-compound-inheritance-proposals-v0.1',status:'REVIEW_ONLY_NOT_APPROVED',
 runtime_version:lex.data_version,baseline_links:assoc.links.length,
 proposed_links:candidates.length,proposed_terms:new Set(candidates.map(x=>x.term_id)).size,
 blocked_anchors:[...bad],candidates,
 notes:['Candidates inherit only pre-existing scene evidence','No automatic promotion','Lexical substrings can be misleading; sense review required']};
fs.writeFileSync(op,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({proposed_links:result.proposed_links,proposed_terms:result.proposed_terms,status:result.status}));
