// Review queue: cap weak generic academic contexts per term without silently approving anything.
// node scene500-recommendation/prioritize-semantic-workset.mjs input.json output.json
import fs from 'node:fs';
const [src,dest]=process.argv.slice(2);
if(!src||!dest)throw Error('USAGE: prioritize-semantic-workset.mjs input.json output.json');
const input=JSON.parse(fs.readFileSync(src,'utf8'));
if(input.status!=='NOT_APPROVED'||input.schema!=='scene500-semantic-workset-v0.1')throw Error('INVALID_CANDIDATE_WORKSET');
const generic=new Set(['S126','S132','S137','S153']);
const grouped=new Map();
for(const c of input.candidates){
 if(c.release_eligible!==false||c.status!=='review_required_not_approved')throw Error('UNSAFE_CANDIDATE');
 const key=c.term_id;
 if(!grouped.has(key))grouped.set(key,[]);
 grouped.get(key).push(c);
}
const queue=[],deferred=[];
for(const [term_id,items] of grouped){
 let genericKept=0;
 for(const c of items.sort((a,b)=>a.proposed_rank-b.proposed_rank||a.scene_id.localeCompare(b.scene_id))){
  const isGeneric=generic.has(c.scene_id);
  if(isGeneric&&genericKept>=1){
   deferred.push({...c,review_priority:'deferred_generic_context',release_eligible:false});
  }else{
   if(isGeneric)genericKept++;
   queue.push({...c,review_priority:isGeneric?'review_generic_context':'review_scene_specificity',
    release_eligible:false});
  }
 }
}
const output={schema:'scene500-semantic-priority-queue-v0.1',
 status:'REVIEW_ONLY_NOT_APPROVED',
 sourceVersion:input.runtime_version,
 inputCandidates:input.candidates.length,
 activeCandidates:queue.length,deferredCandidates:deferred.length,
 activeGeneric:queue.filter(x=>generic.has(x.scene_id)).length,
 policy:'At most one generic study/research/discussion scene per term; all links remain unapproved',
 queue,deferred};
fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({status:output.status,inputCandidates:output.inputCandidates,
 activeCandidates:output.activeCandidates,deferredCandidates:output.deferredCandidates,activeGeneric:output.activeGeneric}));
