// Safe consolidation and explicit-review promotion of Scene500 lexical candidates.
// Node: node scene500-recommendation/review-and-publish-associations.mjs lexicon.json catalog.json baseline.json reviews.json output.json
// Reviews require exact identity, independent assessor, supporting evidence, and explicit approval.
// No candidate-only workset can ever become production automatically.
import fs from 'node:fs';
import {validateChineseLexiconContract,validateAssociations} from './contract-adapter.mjs';
const [lexPath,catPath,basePath,reviewPath,outPath]=process.argv.slice(2);
if(!lexPath||!catPath||!basePath||!reviewPath||!outPath)throw Error('USAGE: review-and-publish-associations.mjs lexicon catalog baseline reviews output');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [lex,catalog,base,reviews]=[lexPath,catPath,basePath,reviewPath].map(read);
validateChineseLexiconContract(lex);validateAssociations({lexicon:lex,associations:base,catalog});
if(lex.data_version!=='0.10.1-evidence-compat'||lex.terms.length!==20000||
 !Array.isArray(reviews.decisions)||reviews.schema!=='scene500-human-review-v0.1')
 throw Error('INVALID_REVIEW_INPUT');
const termMap=new Map(lex.terms.map(x=>[x.term_id,x]));
const existing=new Set(base.links.map(x=>x.term_id+'\u0000'+x.scene_id));
const seen=new Set(),accepted=[],rejected=[],pending=[];
for(const r of reviews.decisions){
 const key=String(r.term_id)+'\u0000'+String(r.scene_id);
 if(seen.has(key)||!termMap.has(r.term_id)||!catalog.scenes[r.scene_id]||existing.has(key))
  throw Error('INVALID_OR_DUPLICATE_REVIEW '+key);
 seen.add(key);
 if(r.decision!=='approve'){(r.decision==='reject'?rejected:pending).push(key);continue;}
 if(r.term!==termMap.get(r.term_id).term||r.scene_name!==catalog.scenes[r.scene_id].name||
 typeof r.reviewer_id!=='string'||r.reviewer_id.length<3||
 typeof r.evidence_reference!=='string'||!r.evidence_reference.trim()||
 r.sense_alignment_verified!==true||r.independent_review_verified!==true||
 r.negative_examples_checked!==true||r.production_authorized!==true||
 !Number.isFinite(r.score)||r.score<=0||r.score>1||
 !Number.isFinite(r.confidence)||r.confidence<=0||r.confidence>1)
  throw Error('UNVERIFIED_APPROVAL '+key);
 accepted.push(r);
}
const counts=new Map();for(const a of base.links)counts.set(a.term_id,(counts.get(a.term_id)||0)+1);
const augmented=base.links.map(x=>({...x}));
for(const r of accepted.sort((a,b)=>a.term_id.localeCompare(b.term_id)||a.scene_id.localeCompare(b.scene_id))){
 const rank=(counts.get(r.term_id)||0)+1;
 if(rank>50)throw Error('SCENE500_MAX50 '+r.term_id);
 counts.set(r.term_id,rank);
 augmented.push({term_id:r.term_id,scene_id:r.scene_id,score:r.score,rank,
  confidence:r.confidence,evidence_type:'independently_reviewed_scene_relation',
  association_version:base.association_version,
  review_reference:r.evidence_reference,reviewer_id:r.reviewer_id});
}
const full={...base,links:augmented};
validateAssociations({lexicon:lex,associations:full,catalog});
const out={schema:'scene500-reviewed-association-release-v0.1',
 status:'REVIEWED_NOT_DEPLOYED',source_runtime:lex.data_version,
 existing_links:base.links.length,approved_added:accepted.length,
 rejected:rejected.length,pending:pending.length,
 associations:full,
 warning:'Output is a locally verified release candidate; production deploy and independent semantic QA remain separate'};
fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({status:out.status,baseline:out.existing_links,approvedAdded:out.approved_added,total:full.links.length}));
